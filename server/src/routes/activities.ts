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
    console.error('Error fetching activity categories:', error);
    res.status(500).json({ error: 'Failed to fetch activity categories' });
  }
});

// Create activity category (Chief Resident or Master only)
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
      `INSERT INTO activity_categories (name, display_order)
       VALUES ($1, $2)
       RETURNING *`,
      [name, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating activity category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create activity category' });
  }
});

// Update activity category
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
      `UPDATE activity_categories
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
    console.error('Error updating activity category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update activity category' });
  }
});

// Delete activity category (soft delete)
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
    console.error('Error deleting activity category:', error);
    res.status(500).json({ error: 'Failed to delete activity category' });
  }
});

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
    console.error('Error fetching monthly activities:', error);
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
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get today's activities for current user or specific resident
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
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
    console.error('Error fetching today\'s activities:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s activities' });
  }
});

// Assign activity (Chief Resident or Master only)
router.post('/assign', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('=== Activity Assignment Request ===');
    console.log('User ID:', req.user!.id);
    console.log('Request body:', req.body);
    
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
      return res.status(403).json({ error: 'Only Chief Residents and Masters can assign activities' });
    }

    const { resident_id, activity_date, activity_category_id, notes } = req.body;

    if (!resident_id || !activity_date || !activity_category_id) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Resident, activity date, and category are required' });
    }

    console.log('Inserting activity:', { resident_id, activity_date, activity_category_id, notes });
    
    const result = await query(
      `INSERT INTO daily_activities (resident_id, activity_date, activity_category_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [resident_id, activity_date, activity_category_id, notes]
    );

    console.log('✅ Activity assigned successfully');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ Error assigning activity:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to assign activity', details: error.message });
  }
});

// Update activity
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
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete activity
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
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

export default router;
