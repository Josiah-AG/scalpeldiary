import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current user's resident years (must be before /:residentId route)
router.get('/resident-years/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM resident_years WHERE resident_id = $1 ORDER BY year',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resident years' });
  }
});

// Get resident years
router.get('/resident-years/:residentId', authenticate, async (req, res) => {
  try {
    const { residentId } = req.params;
    const result = await query(
      'SELECT * FROM resident_years WHERE resident_id = $1 ORDER BY year',
      [residentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resident years' });
  }
});

// Get management stats (Management, Supervisors with management access, and Master)
router.get('/management/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user has management access
    const userRole = req.user!.role;
    
    // Allow MASTER, MANAGEMENT, or SUPERVISOR with management access
    if (userRole === 'MASTER' || userRole === 'MANAGEMENT') {
      // Allowed
    } else if (userRole === 'SUPERVISOR') {
      // Check if supervisor has management access
      const userCheck = await query(
        'SELECT has_management_access FROM users WHERE id = $1',
        [req.user!.id]
      );
      if (!userCheck.rows[0]?.has_management_access) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await query(
      'SELECT id, email, name, role, institution, specialty FROM users WHERE role IN ($1, $2) ORDER BY created_at DESC',
      ['RESIDENT', 'SUPERVISOR']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching management stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users (Master only, or Chief Resident for residents list, or Supervisor for residents list)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role } = req.query;
    
    // Check authorization
    const userCheck = await query(
      'SELECT role, is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    const currentUser = userCheck.rows[0];
    const isMaster = currentUser.role === 'MASTER';
    const isChiefResident = currentUser.is_chief_resident;
    const isSupervisor = currentUser.role === 'SUPERVISOR';
    
    // Master can see all users
    // Chief Resident can only see residents
    // Supervisor can only see residents
    if (!isMaster && !(isChiefResident && role === 'RESIDENT') && !(isSupervisor && role === 'RESIDENT')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Build query based on role filter
    let queryStr = 'SELECT id, email, name, role, institution, specialty, created_at, COALESCE(is_suspended, false) as is_suspended, COALESCE(has_management_access, false) as has_management_access, COALESCE(is_chief_resident, false) as is_chief_resident FROM users';
    const params: any[] = [];
    
    if (role) {
      queryStr += ' WHERE role = $1';
      params.push(role);
    }
    
    queryStr += ' ORDER BY created_at DESC';
    
    // Try with is_suspended column, fallback if it doesn't exist
    let result;
    try {
      result = await query(queryStr, params);
    } catch (columnError) {
      // Column doesn't exist yet, fetch without it
      let fallbackQuery = 'SELECT id, email, name, role, institution, specialty, created_at, false as is_suspended, false as has_management_access, false as is_chief_resident FROM users';
      if (role) {
        fallbackQuery += ' WHERE role = $1';
      }
      fallbackQuery += ' ORDER BY created_at DESC';
      result = await query(fallbackQuery, params);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (Master only)
router.post('/', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { email, name, role, year, institution, specialty, password } = req.body;
    
    // Use provided password or default
    const passwordToHash = password || 'password123';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const result = await query(
      'INSERT INTO users (email, password, name, role, institution, specialty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role, institution, specialty',
      [email, hashedPassword, name, role, institution || null, specialty || null]
    );

    const user = result.rows[0];

    // If resident, create year account
    if (role === 'RESIDENT' && year) {
      await query(
        'INSERT INTO resident_years (resident_id, year) VALUES ($1, $2)',
        [user.id, year]
      );
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Create resident year (Master only)
router.post('/resident-years', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { residentId, year } = req.body;
    const result = await query(
      'INSERT INTO resident_years (resident_id, year) VALUES ($1, $2) RETURNING *',
      [residentId, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resident year' });
  }
});

// Reset password (Master only)
router.post('/reset-password/:userId', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const defaultPassword = await bcrypt.hash('password123', 10);
    
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [defaultPassword, userId]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get supervisors with statistics (Master and Management with access)
router.get('/supervisors/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user has management access
    const userRole = req.user!.role;
    
    // Allow MASTER, MANAGEMENT, or SUPERVISOR with management access
    if (userRole === 'MASTER' || userRole === 'MANAGEMENT') {
      // Allowed
    } else if (userRole === 'SUPERVISOR') {
      // Check if supervisor has management access
      const userCheck = await query(
        'SELECT has_management_access FROM users WHERE id = $1',
        [req.user!.id]
      );
      if (!userCheck.rows[0]?.has_management_access) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.profile_picture,
        u.institution,
        u.specialty,
        COALESCE(u.is_senior, false) as is_senior,
        COUNT(DISTINCT sl.id) as total_procedures_rated,
        COUNT(DISTINCT p.id) as total_presentations_rated,
        COALESCE(AVG(sl.rating), 0) as avg_procedure_rating,
        COALESCE(AVG(p.rating), 0) as avg_presentation_rating
       FROM users u
       LEFT JOIN surgical_logs sl ON sl.supervisor_id = u.id AND sl.rating IS NOT NULL
       LEFT JOIN presentations p ON p.supervisor_id = u.id AND p.rating IS NOT NULL
       WHERE u.role = 'SUPERVISOR'
       GROUP BY u.id, u.name, u.email, u.profile_picture, u.institution, u.specialty, u.is_senior
       ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor statistics' });
  }
});

// Get only supervisors (for presentations)
router.get('/supervisors/only', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.institution, u.specialty, COALESCE(u.is_senior, false) as is_senior 
       FROM users u
       WHERE u.role = 'SUPERVISOR'
       ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// Get supervisors (for dropdown) - with filtering based on procedure type and resident year
router.get('/supervisors', authenticate, async (req: AuthRequest, res) => {
  try {
    const { procedureCategory, residentId } = req.query;
    
    // If no procedure category specified, return only supervisors (for presentations)
    if (!procedureCategory) {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.institution, u.specialty, COALESCE(u.is_senior, false) as is_senior 
         FROM users u
         WHERE u.role = 'SUPERVISOR'
         ORDER BY u.name`
      );
      return res.json(result.rows);
    }
    
    // Get current resident year if residentId provided
    let minResidentYear = 2; // Default for MINOR procedures
    
    if (procedureCategory !== 'MINOR_SURGERY') {
      minResidentYear = 3; // For non-minor procedures, need Year 3+
    }
    
    const result = await query(
      `SELECT u.id, u.name, u.email, u.institution, u.specialty, COALESCE(u.is_senior, false) as is_senior 
       FROM users u
       WHERE u.role = 'SUPERVISOR' 
       OR (u.role = 'RESIDENT' AND EXISTS (
         SELECT 1 FROM resident_years ry 
         WHERE ry.resident_id = u.id 
         AND ry.year >= $1
         AND u.id != $2
       ))
       ORDER BY u.role DESC, u.name`,
      [minResidentYear, residentId || null]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// Toggle senior supervisor status (Master only)
router.post('/toggle-senior/:userId', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      'UPDATE users SET is_senior = NOT COALESCE(is_senior, FALSE) WHERE id = $1 RETURNING is_senior',
      [userId]
    );
    res.json({ is_senior: result.rows[0].is_senior });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle senior status' });
  }
});

// Update profile picture
router.post('/profile-picture', authenticate, async (req: AuthRequest, res) => {
  try {
    const { profilePicture } = req.body;
    const result = await query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture',
      [profilePicture, req.user!.id]
    );
    res.json({ profile_picture: result.rows[0].profile_picture });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, profile_picture, institution, specialty, COALESCE(has_management_access, false) as has_management_access, COALESCE(is_chief_resident, false) as is_chief_resident FROM users WHERE id = $1',
      [req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update specialty
router.put('/specialty', authenticate, async (req: AuthRequest, res) => {
  try {
    const { specialty } = req.body;
    const result = await query(
      'UPDATE users SET specialty = $1, updated_at = NOW() WHERE id = $2 RETURNING specialty',
      [specialty, req.user!.id]
    );
    res.json({ specialty: result.rows[0].specialty });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update specialty' });
  }
});

// Change password
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const userResult = await query('SELECT password FROM users WHERE id = $1', [req.user!.id]);
    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user!.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update user (Master only) - Name, institution, and specialty can be updated
router.put('/:userId', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, institution, specialty } = req.body;
    
    const result = await query(
      'UPDATE users SET name = $1, institution = $2, specialty = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, name, role, institution, specialty',
      [name, institution || null, specialty || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update resident year (Master only)
router.put('/:userId/year', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { newYear } = req.body;
    
    // Check if user is a resident
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userResult.rows[0].role !== 'RESIDENT') {
      return res.status(400).json({ error: 'Only residents have years' });
    }
    
    // Check if year already exists
    const existingYear = await query(
      'SELECT id FROM resident_years WHERE resident_id = $1 AND year = $2',
      [userId, newYear]
    );
    
    if (existingYear.rows.length > 0) {
      return res.json({ message: 'Year already exists' });
    }
    
    // Add new year (previous years are preserved)
    await query(
      'INSERT INTO resident_years (resident_id, year) VALUES ($1, $2)',
      [userId, newYear]
    );
    
    res.json({ message: `Promoted to Year ${newYear} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update year' });
  }
});

// Delete user (Master only)
router.delete('/:userId', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete related data first (cascade should handle this, but being explicit)
    await query('DELETE FROM surgical_logs WHERE resident_id = $1 OR supervisor_id = $1', [userId]);
    await query('DELETE FROM presentations WHERE resident_id = $1 OR supervisor_id = $1', [userId]);
    await query('DELETE FROM resident_years WHERE resident_id = $1', [userId]);
    await query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Suspend user (Master only)
router.put('/:userId/suspend', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    try {
      const result = await query(
        'UPDATE users SET is_suspended = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User suspended successfully' });
    } catch (columnError) {
      // Column doesn't exist, return error message
      res.status(400).json({ error: 'Suspension feature requires database migration. Please run: npx ts-node server/src/database/add-suspended-column.ts' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Toggle management access (Master only)
router.put('/:userId/management-access', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { hasAccess } = req.body;
    
    const result = await query(
      'UPDATE users SET has_management_access = $1, updated_at = NOW() WHERE id = $2 AND role = $3 RETURNING id',
      [hasAccess, userId, 'SUPERVISOR']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    res.json({ message: hasAccess ? 'Management access granted' : 'Management access revoked' });
  } catch (error) {
    console.error('Error toggling management access:', error);
    res.status(500).json({ error: 'Failed to update management access' });
  }
});

// Toggle supervisor access for management users (Master only)
router.put('/:userId/supervisor-access', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { hasAccess, institution, specialty } = req.body;
    
    if (hasAccess && (!institution || !specialty)) {
      return res.status(400).json({ error: 'Institution and specialty are required for supervisor access' });
    }
    
    // If granting access, update institution and specialty
    // If revoking, clear them
    const result = await query(
      'UPDATE users SET institution = $1, specialty = $2, updated_at = NOW() WHERE id = $3 AND role = $4 RETURNING id',
      [hasAccess ? institution : null, hasAccess ? specialty : null, userId, 'MANAGEMENT']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Management user not found' });
    }

    res.json({ message: hasAccess ? 'Supervisor access granted' : 'Supervisor access revoked' });
  } catch (error) {
    console.error('Error toggling supervisor access:', error);
    res.status(500).json({ error: 'Failed to update supervisor access' });
  }
});

// Activate user (Master only)
router.put('/:userId/activate', authenticate, authorize('MASTER'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    try {
      const result = await query(
        'UPDATE users SET is_suspended = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User activated successfully' });
    } catch (columnError) {
      // Column doesn't exist, return error message
      res.status(400).json({ error: 'Suspension feature requires database migration. Please run: npx ts-node server/src/database/add-suspended-column.ts' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

// Get user by ID (for supervisors viewing residents)
router.get('/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const result = await query(
      'SELECT id, email, name, role, profile_picture FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Toggle Chief Resident status (Master only)
router.put('/:userId/toggle-chief-resident', authenticate, authorize('MASTER'), async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { is_chief_resident } = req.body;

    // Verify user is a resident
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].role !== 'RESIDENT') {
      return res.status(400).json({ error: 'Only residents can be assigned as Chief Resident' });
    }

    const result = await query(
      'UPDATE users SET is_chief_resident = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role, is_chief_resident',
      [is_chief_resident, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling chief resident status:', error);
    res.status(500).json({ error: 'Failed to update chief resident status' });
  }
});

export default router;
