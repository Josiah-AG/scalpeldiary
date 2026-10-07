import { transactional } from '../database/transaction';
import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================
// ACTIVITY CATEGORIES
// ============================================

// Get all activity categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM activity_categories WHERE is_active = true ORDER BY display_order, name',
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: activities.ts:20');
    res.status(500).json({ error: 'Failed to fetch activity categories' });
  }
});

// Create activity category (Chief Resident or Master only)
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
      `INSERT INTO activity_categories (name, display_order, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, display_order || 0, color || '#3b82f6']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Operation failed: activities.ts:58');
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create activity category' });
  }
}));

// Update activity category
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
      `UPDATE activity_categories
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
    console.error('Operation failed: activities.ts:104');
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update activity category' });
  }
}));

// Delete activity category (soft delete)
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
      `UPDATE activity_categories
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
    console.error('Operation failed: activities.ts:145');
    res.status(500).json({ error: 'Failed to delete activity category' });
  }
}));

// ============================================
// DAILY ACTIVITIES
// ============================================

// Get monthly activity schedule
router.get('/monthly/:year/:month', authenticate, async (req: AuthRequest, res) => {
  try {
    const { year, month } = req.params;

    const result = await query(
      `SELECT da.id,
              da.resident_id,
              da.activity_category_id,
              da.notes,
              TO_CHAR(da.activity_date, 'YYYY-MM-DD') as activity_date,
              ac.name as activity_category_name,
              ac.name as activity_name,
              ac.color,
              u.name as resident_name
       FROM daily_activities da
       LEFT JOIN activity_categories ac ON da.activity_category_id = ac.id
       LEFT JOIN users u ON da.resident_id = u.id
       WHERE EXTRACT(YEAR FROM da.activity_date) = $1
         AND EXTRACT(MONTH FROM da.activity_date) = $2
       ORDER BY da.activity_date, u.name`,
      [year, month]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: activities.ts:180');
    res.status(500).json({ error: 'Failed to fetch monthly activities' });
  }
});

// Get activities with query parameters (for Supervisor, Master, Chief Resident)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Supervisor, Master, or Chief Resident
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    const isAuthorized = user.role === 'MASTER' || user.role === 'SUPERVISOR' || user.is_chief_resident;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Only Supervisors, Masters, and Chief Residents can view all activities' });
    }

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const result = await query(
      `SELECT da.id,
              da.resident_id,
              da.activity_category_id,
              da.notes,
              TO_CHAR(da.activity_date, 'YYYY-MM-DD') as activity_date,
              ac.name as activity_category_name,
              ac.name as activity_name,
              ac.color,
              u.name as resident_name
       FROM daily_activities da
       LEFT JOIN activity_categories ac ON da.activity_category_id = ac.id
       LEFT JOIN users u ON da.resident_id = u.id
       WHERE EXTRACT(YEAR FROM da.activity_date) = $1
         AND EXTRACT(MONTH FROM da.activity_date) = $2
       ORDER BY da.activity_date, u.name`,
      [year, month]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: activities.ts:232');
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get today's activities for current user or specific resident
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    // Use EAT timezone (UTC+3) for today's date
    const now = new Date();
    const eatOffset = 3 * 60 * 60 * 1000;
    const eatDate = new Date(now.getTime() + eatOffset);
    const today = eatDate.toISOString().split('T')[0];
    const residentId = req.query.residentId as string || req.user!.id;

    const result = await query(
      `SELECT da.id,
              da.resident_id,
              da.activity_category_id,
              da.notes,
              TO_CHAR(da.activity_date, 'YYYY-MM-DD') as activity_date,
              ac.name as category_name,
              ac.color
       FROM daily_activities da
       LEFT JOIN activity_categories ac ON da.activity_category_id = ac.id
       WHERE da.resident_id = $1 AND TO_CHAR(da.activity_date, 'YYYY-MM-DD') = $2`,
      [residentId, today]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: activities.ts:263');
    res.status(500).json({ error: 'Failed to fetch today\'s activities' });
  }
});

// Assign activity (Chief Resident or Master only)
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

      return res.status(403).json({ error: 'Only Chief Residents and Masters can assign activities' });
    }

    const { resident_id, activity_date, activity_category_id, notes } = req.body;

    if (!resident_id || !activity_date || !activity_category_id) {

      return res.status(400).json({ error: 'Resident, activity date, and category are required' });
    }



    const result = await query(
      `INSERT INTO daily_activities (resident_id, activity_date, activity_category_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [resident_id, activity_date, activity_category_id, notes]
    );


    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Operation failed: activities.ts:312');
    console.error('Operation failed: activities.ts:313');
    res.status(500).json({ error: 'Failed to assign activity', details: error.message });
  }
}));

router.put('/day/:date', authenticate, transactional(async (req: AuthRequest, res) => {
  const user = await query('SELECT role,is_chief_resident FROM users WHERE id=$1',[req.user!.id]);
  if (user.rows[0]?.role !== 'MASTER' && !user.rows[0]?.is_chief_resident) return res.status(403).json({error:'Forbidden'});
  const { assignments } = req.body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date) || !Array.isArray(assignments) || assignments.length > 200) return res.status(400).json({error:'Invalid day assignments'});
  await query('SELECT pg_advisory_xact_lock(hashtext($1))',['activities:'+req.params.date]);
  await query('DELETE FROM daily_activities WHERE activity_date=$1',[req.params.date]);
  for (const row of assignments) {
    const resident = await query("SELECT id FROM users WHERE id=$1 AND role='RESIDENT' AND NOT is_suspended",[row.resident_id]);
    if (!resident.rowCount) return res.status(400).json({error:'Invalid resident'});
    await query('INSERT INTO daily_activities(resident_id,activity_date,activity_category_id) VALUES($1,$2,$3)',[row.resident_id,req.params.date,row.category_id]);
  }
  res.json({success:true});
}));

// Update activity
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
      return res.status(403).json({ error: 'Only Chief Residents and Masters can update activities' });
    }

    const { id } = req.params;
    const { activity_category_id, notes } = req.body;

    const result = await query(
      `UPDATE daily_activities
       SET activity_category_id = COALESCE($1, activity_category_id),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [activity_category_id, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Operation failed: activities.ts:369');
    res.status(500).json({ error: 'Failed to update activity' });
  }
}));

// Delete activity
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
      return res.status(403).json({ error: 'Only Chief Residents and Masters can delete activities' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM daily_activities WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Operation failed: activities.ts:404');
    res.status(500).json({ error: 'Failed to delete activity' });
  }
}));

export default router;
