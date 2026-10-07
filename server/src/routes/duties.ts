import { transactional } from '../database/transaction';
import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================
// DUTY CATEGORIES
// ============================================

// Get all duty categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM duty_categories WHERE is_active = true ORDER BY display_order, name',
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: duties.ts:20');
    res.status(500).json({ error: 'Failed to fetch duty categories' });
  }
});

// Create duty category (Chief Resident or Master only)
router.post('/categories', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can manage categories' });
    }

    const { name, display_order, color } = req.body;

    if (color != null && !/^#[0-9a-f]{6}$/i.test(color)) return res.status(400).json({error:'Invalid color'});
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await query(
      `INSERT INTO duty_categories (name, display_order, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, display_order || 0, color || '#3b82f6']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Operation failed: duties.ts:58');
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create duty category' });
  }
}));

// Update duty category
router.put('/categories/:id', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can manage categories' });
    }

    const { id } = req.params;
    const { name, display_order, is_active, color } = req.body;
    if (color != null && !/^#[0-9a-f]{6}$/i.test(color)) return res.status(400).json({error:'Invalid color'});

    const result = await query(
      `UPDATE duty_categories
       SET name = COALESCE($1, name),
           display_order = COALESCE($2, display_order),
           is_active = COALESCE($3, is_active),
           color = COALESCE($5, color),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, display_order, is_active, id, color]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Operation failed: duties.ts:104');
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update duty category' });
  }
}));

// Delete duty category (soft delete)
router.delete('/categories/:id', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can manage categories' });
    }

    const { id } = req.params;

    const result = await query(
      `UPDATE duty_categories
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Operation failed: duties.ts:145');
    res.status(500).json({ error: 'Failed to delete duty category' });
  }
}));

// ============================================
// MONTHLY DUTIES
// ============================================

// Get monthly duty schedule
router.get('/monthly/:year/:month', authenticate, async (req: AuthRequest, res) => {
  try {
    const { year, month } = req.params;

    const result = await query(
      `SELECT md.id,
              md.resident_id,
              md.duty_category_id,
              md.notes,
              TO_CHAR(md.duty_date, 'YYYY-MM-DD') as duty_date,
              dc.name as duty_category_name,
              dc.color as duty_color,
              u.name as resident_name
       FROM monthly_duties md
       LEFT JOIN duty_categories dc ON md.duty_category_id = dc.id
       LEFT JOIN users u ON md.resident_id = u.id
       WHERE EXTRACT(YEAR FROM md.duty_date) = $1
         AND EXTRACT(MONTH FROM md.duty_date) = $2
       ORDER BY md.duty_date, u.name`,
      [year, month]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: duties.ts:179');
    res.status(500).json({ error: 'Failed to fetch monthly duties' });
  }
});

// Get today's duty for current user or specific resident
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    // Use EAT timezone (UTC+3) for today's date
    const now = new Date();
    const eatOffset = 3 * 60 * 60 * 1000;
    const eatDate = new Date(now.getTime() + eatOffset);
    const today = eatDate.toISOString().split('T')[0];
    const residentId = req.query.residentId as string || req.user!.id;

    const result = await query(
      `SELECT md.id,
              md.resident_id,
              md.duty_category_id,
              md.notes,
              TO_CHAR(md.duty_date, 'YYYY-MM-DD') as duty_date,
              dc.name as category_name,
              dc.color
       FROM monthly_duties md
       LEFT JOIN duty_categories dc ON md.duty_category_id = dc.id
       WHERE md.resident_id = $1 AND TO_CHAR(md.duty_date, 'YYYY-MM-DD') = $2`,
      [residentId, today]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: duties.ts:210');
    res.status(500).json({ error: 'Failed to fetch today\'s duty' });
  }
});

// Assign duty (Chief Resident or Master only)
router.post('/assign', authenticate, transactional(async (req: AuthRequest, res) => {
  try {






    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {

      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];


    if (user.role !== 'MASTER' && !user.is_chief_resident) {

      return res.status(403).json({ error: 'Only Chief Residents and Masters can assign duties' });
    }

    const { resident_id, duty_date, duty_category_id, notes } = req.body;

    if (!resident_id || !duty_date) {

      return res.status(400).json({ error: 'Resident and duty date are required' });
    }



    const result = await query(
      `INSERT INTO monthly_duties (resident_id, duty_date, duty_category_id, notes)
       VALUES ($1, $2::date, $3, $4)
       ON CONFLICT (resident_id, duty_date)
       DO UPDATE SET duty_category_id = $3, notes = $4, updated_at = NOW()
       RETURNING *`,
      [resident_id, duty_date, duty_category_id, notes]
    );


    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Operation failed: duties.ts:263');
    console.error('Operation failed: duties.ts:264');
    res.status(500).json({ error: 'Failed to assign duty', details: error.message });
  }
}));

router.put('/day/:date', authenticate, transactional(async (req: AuthRequest, res) => {
  const user = await query('SELECT role,is_chief_resident FROM users WHERE id=$1',[req.user!.id]);
  if (user.rows[0]?.role !== 'MASTER' && !user.rows[0]?.is_chief_resident) return res.status(403).json({error:'Forbidden'});
  const { assignments } = req.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date) || !Array.isArray(assignments) || assignments.length > 200) return res.status(400).json({error:'Invalid day assignments'});
  await query('SELECT pg_advisory_xact_lock(hashtext($1))',['duties:'+req.params.date]);
  await query('DELETE FROM monthly_duties WHERE duty_date=$1',[req.params.date]);
  for (const row of assignments) {
    const resident = await query("SELECT id FROM users WHERE id=$1 AND role='RESIDENT' AND NOT is_suspended",[row.resident_id]);
    if (!resident.rowCount) return res.status(400).json({error:'Invalid resident'});
    await query('INSERT INTO monthly_duties(resident_id,duty_date,duty_category_id) VALUES($1,$2,$3)',[row.resident_id,req.params.date,row.category_id]);
  }
  res.json({success:true});
}));

// Update duty
router.put('/:id', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can update duties' });
    }

    const { id } = req.params;
    const { duty_category_id, notes } = req.body;

    const result = await query(
      `UPDATE monthly_duties
       SET duty_category_id = COALESCE($1, duty_category_id),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [duty_category_id, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Duty not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Operation failed: duties.ts:320');
    res.status(500).json({ error: 'Failed to update duty' });
  }
}));

// Delete duty
router.delete('/:id', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can delete duties' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM monthly_duties WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Duty not found' });
    }

    res.json({ message: 'Duty deleted successfully' });
  } catch (error) {
    console.error('Operation failed: duties.ts:355');
    res.status(500).json({ error: 'Failed to delete duty' });
  }
}));

export default router;
