import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================
// ROTATION CATEGORIES
// ============================================

// Get all rotation categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM rotation_categories WHERE is_active = true ORDER BY display_order, name',
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rotation categories:', error);
    res.status(500).json({ error: 'Failed to fetch rotation categories' });
  }
});

// Create rotation category (Chief Resident or Master only)
router.post('/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Master
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
      `INSERT INTO rotation_categories (name, display_order)
       VALUES ($1, $2)
       RETURNING *`,
      [name, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating rotation category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create rotation category' });
  }
});

// Update rotation category
router.put('/categories/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Master
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
      `UPDATE rotation_categories
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
    console.error('Error updating rotation category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update rotation category' });
  }
});

// Delete rotation category (soft delete)
router.delete('/categories/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Master
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
      `UPDATE rotation_categories
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
    console.error('Error deleting rotation category:', error);
    res.status(500).json({ error: 'Failed to delete rotation category' });
  }
});

// ============================================
// ACADEMIC YEARS
// ============================================

// Get all academic years
router.get('/academic-years', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM academic_years ORDER BY start_year DESC, start_month DESC',
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
});

// Get active academic year
router.get('/academic-years/active', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM academic_years WHERE is_active = true LIMIT 1',
      []
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active academic year found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    res.status(500).json({ error: 'Failed to fetch active academic year' });
  }
});

// Create academic year (Master only)
router.post('/academic-years', authenticate, authorize('MASTER'), async (req: AuthRequest, res) => {
  try {
    const { year_name, start_month, start_year, is_active } = req.body;

    if (!year_name || !start_month || !start_year) {
      return res.status(400).json({ error: 'Year name, start month, and start year are required' });
    }

    if (start_month < 1 || start_month > 12) {
      return res.status(400).json({ error: 'Start month must be between 1 and 12' });
    }

    // If setting as active, deactivate other years
    if (is_active) {
      await query('UPDATE academic_years SET is_active = false', []);
    }

    const result = await query(
      `INSERT INTO academic_years (year_name, start_month, start_year, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [year_name, start_month, start_year, is_active || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating academic year:', error);
    res.status(500).json({ error: 'Failed to create academic year' });
  }
});

// Update academic year (Master only)
router.put('/academic-years/:id', authenticate, authorize('MASTER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { year_name, start_month, start_year, is_active } = req.body;

    if (start_month && (start_month < 1 || start_month > 12)) {
      return res.status(400).json({ error: 'Start month must be between 1 and 12' });
    }

    // If setting as active, deactivate other years
    if (is_active) {
      await query('UPDATE academic_years SET is_active = false WHERE id != $1', [id]);
    }

    const result = await query(
      `UPDATE academic_years
       SET year_name = COALESCE($1, year_name),
           start_month = COALESCE($2, start_month),
           start_year = COALESCE($3, start_year),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [year_name, start_month, start_year, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating academic year:', error);
    res.status(500).json({ error: 'Failed to update academic year' });
  }
});

// ============================================
// YEARLY ROTATIONS
// ============================================

// Get yearly rotation schedule
router.get('/yearly/:yearId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId } = req.params;

    const result = await query(
      `SELECT yr.*, 
              rc.name as rotation_category_name,
              u.name as resident_name
       FROM yearly_rotations yr
       LEFT JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
       LEFT JOIN users u ON yr.resident_id = u.id
       WHERE yr.academic_year_id = $1
       ORDER BY u.name, yr.month_number`,
      [yearId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching yearly rotations:', error);
    res.status(500).json({ error: 'Failed to fetch yearly rotations' });
  }
});

// Get current rotation for a resident
router.get('/current/:residentId', authenticate, async (req: AuthRequest, res) => {
  try {
    let { residentId } = req.params;
    
    // Support 'me' as residentId
    if (residentId === 'me') {
      residentId = req.user!.id.toString();
    }

    console.log('=== Fetching Current Rotation ===');
    console.log('Resident ID:', residentId);

    // Get active academic year
    const yearResult = await query(
      'SELECT * FROM academic_years WHERE is_active = true LIMIT 1',
      []
    );

    if (yearResult.rows.length === 0) {
      console.log('❌ No active academic year found');
      return res.json(null);
    }

    const academicYear = yearResult.rows[0];
    console.log('Active academic year:', academicYear);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    console.log('Current date:', { currentYear, currentMonth });

    // Calculate which month of the academic year we're in
    let monthNumber;
    if (currentMonth >= academicYear.start_month) {
      monthNumber = currentMonth - academicYear.start_month + 1;
    } else {
      monthNumber = 12 - academicYear.start_month + currentMonth + 1;
    }

    console.log('Calculated month number:', monthNumber);

    const result = await query(
      `SELECT yr.*, rc.name as category_name, rc.color, ay.year_name as academic_year
       FROM yearly_rotations yr
       LEFT JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
       LEFT JOIN academic_years ay ON yr.academic_year_id = ay.id
       WHERE yr.academic_year_id = $1 
         AND yr.resident_id = $2 
         AND yr.month_number = $3`,
      [academicYear.id, residentId, monthNumber]
    );

    console.log('Query result rows:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('✅ Found rotation:', result.rows[0]);
    } else {
      console.log('❌ No rotation found for:', { academicYearId: academicYear.id, residentId, monthNumber });
    }

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current rotation:', error);
    res.status(500).json({ error: 'Failed to fetch current rotation' });
  }
});

// Get all rotations for current user or specific resident (for the year)
router.get('/my-rotations', authenticate, async (req: AuthRequest, res) => {
  try {
    const residentId = req.query.residentId as string || req.user!.id;

    // Get active academic year
    const yearResult = await query(
      'SELECT * FROM academic_years WHERE is_active = true LIMIT 1',
      []
    );

    if (yearResult.rows.length === 0) {
      return res.json([]);
    }

    const academicYear = yearResult.rows[0];

    const result = await query(
      `SELECT yr.month_number as month, rc.name as category_name, rc.color
       FROM yearly_rotations yr
       LEFT JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
       WHERE yr.academic_year_id = $1 
         AND yr.resident_id = $2
       ORDER BY yr.month_number`,
      [academicYear.id, residentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching my rotations:', error);
    res.status(500).json({ error: 'Failed to fetch rotations' });
  }
});

// Get all rotations for all residents (Supervisor, Master, Chief Resident)
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
      return res.status(403).json({ error: 'Only Supervisors, Masters, and Chief Residents can view all rotations' });
    }

    // Get active academic year
    const yearResult = await query(
      'SELECT * FROM academic_years WHERE is_active = true LIMIT 1',
      []
    );

    if (yearResult.rows.length === 0) {
      return res.json([]);
    }

    const academicYear = yearResult.rows[0];

    const result = await query(
      `SELECT yr.month_number as month, 
              yr.resident_id,
              u.name as resident_name,
              rc.name as category_name, 
              rc.color
       FROM yearly_rotations yr
       LEFT JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
       LEFT JOIN users u ON yr.resident_id = u.id
       WHERE yr.academic_year_id = $1
       ORDER BY u.name, yr.month_number`,
      [academicYear.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all rotations:', error);
    res.status(500).json({ error: 'Failed to fetch rotations' });
  }
});

// Assign rotation (Chief Resident or Master only)
router.post('/assign', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Master
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can assign rotations' });
    }

    const { academic_year_id, resident_id, month_number, rotation_category_id, notes } = req.body;

    if (!academic_year_id || !resident_id || !month_number) {
      return res.status(400).json({ error: 'Academic year, resident, and month are required' });
    }

    const result = await query(
      `INSERT INTO yearly_rotations (academic_year_id, resident_id, month_number, rotation_category_id, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (academic_year_id, resident_id, month_number)
       DO UPDATE SET rotation_category_id = $4, notes = $5, updated_at = NOW()
       RETURNING *`,
      [academic_year_id, resident_id, month_number, rotation_category_id, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning rotation:', error);
    res.status(500).json({ error: 'Failed to assign rotation' });
  }
});

// Update rotation
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Master
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can update rotations' });
    }

    const { id } = req.params;
    const { rotation_category_id, notes } = req.body;

    const result = await query(
      `UPDATE yearly_rotations
       SET rotation_category_id = COALESCE($1, rotation_category_id),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [rotation_category_id, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rotation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating rotation:', error);
    res.status(500).json({ error: 'Failed to update rotation' });
  }
});

// Delete rotation
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Master
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = userCheck.rows[0];
    if (user.role !== 'MASTER' && !user.is_chief_resident) {
      return res.status(403).json({ error: 'Only Chief Residents and Masters can delete rotations' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM yearly_rotations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rotation not found' });
    }

    res.json({ message: 'Rotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting rotation:', error);
    res.status(500).json({ error: 'Failed to delete rotation' });
  }
});

export default router;
