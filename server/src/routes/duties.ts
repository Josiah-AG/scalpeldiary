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
    console.error('Error fetching duty categories:', error);
    res.status(500).json({ error: 'Failed to fetch duty categories' });
  }
});

// Create duty category (Chief Resident or Master only)
router.post('/categories', authenticate, async (req: AuthRequest, res) => {
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

    const { name, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await query(
      `INSERT INTO duty_categories (name, display_order)
       VALUES ($1, $2)
       RETURNING *`,
      [name, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating duty category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create duty category' });
  }
});

// Update duty category
router.put('/categories/:id', authenticate, async (req: AuthRequest, res) => {
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
    const { name, display_order, is_active } = req.body;

    const result = await query(
      `UPDATE duty_categories
       SET name = COALESCE($1, name),
           display_order = COALESCE($2, display_order),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating duty category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update duty category' });
  }
});

// Delete duty category (soft delete)
router.delete('/categories/:id', authenticate, async (req: AuthRequest, res) => {
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
    console.error('Error deleting duty category:', error);
    res.status(500).json({ error: 'Failed to delete duty category' });
  }
});

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
    console.error('Error fetching monthly duties:', error);
    res.status(500).json({ error: 'Failed to fetch monthly duties' });
  }
});

// Get today's duty for current user or specific resident
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
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
    console.error('Error fetching today\'s duty:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s duty' });
  }
});

// Assign duty (Chief Resident or Master only)
router.post('/assign', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('=== Duty Assignment Request ===');
    console.log('User ID:', req.user!.id);
    console.log('Request body:', req.body);
    console.log('duty_date received:', req.body.duty_date);
    console.log('duty_date type:', typeof req.body.duty_date);
    
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    console.log('User role:', user.role, 'Is Chief:', user.is_chief_resident);
    
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      console.log('❌ User not authorized');
      return res.status(403).json({ error: 'Only Chief Residents and Masters can assign duties' });
    }

    const { resident_id, duty_date, duty_category_id, notes } = req.body;

    if (!resident_id || !duty_date) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Resident and duty date are required' });
    }

    console.log('Inserting duty with date:', duty_date);
    
    const result = await query(
      `INSERT INTO monthly_duties (resident_id, duty_date, duty_category_id, notes)
       VALUES ($1, $2::date, $3, $4)
       ON CONFLICT (resident_id, duty_date)
       DO UPDATE SET duty_category_id = $3, notes = $4, updated_at = NOW()
       RETURNING *`,
      [resident_id, duty_date, duty_category_id, notes]
    );

    console.log('✅ Duty assigned successfully, returned date:', result.rows[0].duty_date);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ Error assigning duty:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to assign duty', details: error.message });
  }
});

// Update duty
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
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
    console.error('Error updating duty:', error);
    res.status(500).json({ error: 'Failed to update duty' });
  }
});

// Delete duty
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
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
    console.error('Error deleting duty:', error);
    res.status(500).json({ error: 'Failed to delete duty' });
  }
});

export default router;
