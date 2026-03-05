import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/notifications';

const router = Router();

// Get logs for resident
router.get('/my-logs', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId, startDate, endDate, procedureCategory, placeOfPractice, supervisorId } = req.query;
    
    let queryText = `
      SELECT sl.*, u.name as supervisor_name 
      FROM surgical_logs sl
      LEFT JOIN users u ON sl.supervisor_id = u.id
      WHERE sl.resident_id = $1
    `;
    const params: any[] = [req.user!.id];
    let paramCount = 1;

    // Only filter by yearId if it's provided (not "all")
    if (yearId && yearId !== 'all') {
      params.push(yearId);
      queryText += ` AND sl.year_id = $${++paramCount}`;
    }
    if (startDate) {
      params.push(startDate);
      queryText += ` AND sl.date >= $${++paramCount}`;
    }
    if (endDate) {
      params.push(endDate);
      queryText += ` AND sl.date <= $${++paramCount}`;
    }
    if (procedureCategory) {
      params.push(procedureCategory);
      queryText += ` AND sl.procedure_category = $${++paramCount}`;
    }
    if (placeOfPractice) {
      params.push(placeOfPractice);
      queryText += ` AND sl.place_of_practice = $${++paramCount}`;
    }

    if (supervisorId) {
      params.push(supervisorId);
      queryText += ` AND sl.supervisor_id = $${++paramCount}`;
    }
    queryText += ' ORDER BY sl.date DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create log
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      yearId, date, mrn, age, sex, diagnosis, procedure,
      procedureType, procedureCategory, placeOfPractice, surgeryRole, supervisorId, remark
    } = req.body;

    const result = await query(
      `INSERT INTO surgical_logs (
        resident_id, year_id, date, mrn, age, sex, diagnosis, procedure,
        procedure_type, procedure_category, place_of_practice, surgery_role, supervisor_id, remark
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [req.user!.id, yearId, date, mrn, age, sex, diagnosis, procedure,
       procedureType, procedureCategory || 'MINOR', placeOfPractice, surgeryRole, supervisorId, remark || null]
    );

    // Send notification to supervisor
    await sendNotification(
      supervisorId,
      `New surgical log assigned to you by ${req.user!.email}`,
      result.rows[0].id
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// Get logs to rate (for supervisors)
router.get('/to-rate', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT sl.*, u.name as resident_name, ry.year as resident_year
       FROM surgical_logs sl
       JOIN users u ON sl.resident_id = u.id
       JOIN resident_years ry ON sl.year_id = ry.id
       WHERE sl.supervisor_id = $1 AND sl.status = 'PENDING'
       ORDER BY sl.date DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs to rate' });
  }
});

// Get count of logs to rate (for badge)
router.get('/to-rate/count', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE supervisor_id = $1 AND status = $2',
      [req.user!.id, 'PENDING']
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// Rate log
router.post('/:logId/rate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    const { rating, comment } = req.body;

    const status = rating ? 'RATED' : 'COMMENTED';
    
    const result = await query(
      `UPDATE surgical_logs 
       SET rating = $1, comment = $2, status = $3, rated_at = NOW(), updated_at = NOW()
       WHERE id = $4 AND supervisor_id = $5
       RETURNING *`,
      [rating, comment, status, logId, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found or unauthorized' });
    }

    // Notify resident
    const log = result.rows[0];
    await sendNotification(
      log.resident_id,
      `Your surgical log has been ${rating ? 'rated' : 'commented on'}`,
      logId
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to rate log' });
  }
});

// Get rated logs (with resident info for supervisors)
router.get('/rated', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT sl.*, 
              u.name as supervisor_name,
              res.name as resident_name,
              ry.year as resident_year
       FROM surgical_logs sl
       LEFT JOIN users u ON sl.supervisor_id = u.id
       LEFT JOIN users res ON sl.resident_id = res.id
       LEFT JOIN resident_years ry ON sl.year_id = ry.id
       WHERE sl.supervisor_id = $1 AND sl.status IN ('RATED', 'COMMENTED')
       ORDER BY sl.rated_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rated logs' });
  }
});

// Get auto-suggestions
router.get('/suggestions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { field } = req.query;
    
    if (field === 'diagnosis') {
      const result = await query(
        'SELECT DISTINCT diagnosis FROM surgical_logs WHERE resident_id = $1 ORDER BY diagnosis',
        [req.user!.id]
      );
      res.json(result.rows.map(r => r.diagnosis));
    } else if (field === 'procedure') {
      const result = await query(
        'SELECT DISTINCT procedure FROM surgical_logs WHERE resident_id = $1 ORDER BY procedure',
        [req.user!.id]
      );
      res.json(result.rows.map(r => r.procedure));
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Get logs for a specific resident (for supervisors)
router.get('/resident/:residentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { residentId } = req.params;
    const { year } = req.query;

    // If no year specified, return all logs
    if (!year) {
      const result = await query(
        `SELECT sl.*, u.name as supervisor_name 
         FROM surgical_logs sl
         LEFT JOIN users u ON sl.supervisor_id = u.id
         WHERE sl.resident_id = $1
         ORDER BY sl.date DESC`,
        [residentId]
      );
      return res.json(result.rows);
    }

    // Get year_id
    const yearResult = await query(
      'SELECT id FROM resident_years WHERE resident_id = $1 AND year = $2',
      [residentId, year]
    );

    if (yearResult.rows.length === 0) {
      return res.json([]);
    }

    const yearId = yearResult.rows[0].id;

    const result = await query(
      `SELECT sl.*, u.name as supervisor_name 
       FROM surgical_logs sl
       LEFT JOIN users u ON sl.supervisor_id = u.id
       WHERE sl.resident_id = $1 AND sl.year_id = $2
       ORDER BY sl.date DESC`,
      [residentId, yearId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch resident logs' });
  }
});

// Get supervisor's rated procedures (Master and Management with access)
router.get('/supervisor/:supervisorId/rated', authenticate, async (req: AuthRequest, res) => {
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
    
    const { supervisorId } = req.params;
    console.log('Fetching rated procedures for supervisor:', supervisorId);
    console.log('User making request:', req.user);

    const result = await query(
      `SELECT sl.*, 
              res.name as resident_name,
              res.profile_picture as resident_profile_picture,
              ry.year as resident_year
       FROM surgical_logs sl
       JOIN users res ON sl.resident_id = res.id
       JOIN resident_years ry ON sl.year_id = ry.id
       WHERE sl.supervisor_id = $1 AND sl.status IN ('RATED', 'COMMENTED')
       ORDER BY sl.rated_at DESC`,
      [supervisorId]
    );

    console.log('Found procedures:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supervisor rated procedures:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor rated procedures' });
  }
});

// Update log (only if not rated)
router.put('/:logId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    const {
      date, mrn, age, sex, diagnosis, procedure,
      procedureType, procedureCategory, placeOfPractice, surgeryRole, supervisorId, remark
    } = req.body;

    // Check if log exists and belongs to user
    const checkResult = await query(
      'SELECT rating, resident_id FROM surgical_logs WHERE id = $1',
      [logId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (checkResult.rows[0].resident_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (checkResult.rows[0].rating) {
      return res.status(400).json({ error: 'Cannot edit a rated procedure' });
    }

    const result = await query(
      `UPDATE surgical_logs 
       SET date = $1, mrn = $2, age = $3, sex = $4, diagnosis = $5, procedure = $6,
           procedure_type = $7, procedure_category = $8, place_of_practice = $9, 
           surgery_role = $10, supervisor_id = $11, remark = $12, updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [date, mrn, age, sex, diagnosis, procedure, procedureType, procedureCategory,
       placeOfPractice, surgeryRole, supervisorId, remark || null, logId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// Delete log (only if not rated)
router.delete('/:logId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;

    // Check if log exists and belongs to user
    const checkResult = await query(
      'SELECT rating, resident_id FROM surgical_logs WHERE id = $1',
      [logId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (checkResult.rows[0].resident_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (checkResult.rows[0].rating) {
      return res.status(400).json({ error: 'Cannot delete a rated procedure' });
    }

    await query('DELETE FROM surgical_logs WHERE id = $1', [logId]);

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

export default router;
