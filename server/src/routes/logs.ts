import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/notifications';

// Helper to get user name (fallback to DB if not in JWT)
async function getUserName(user: any): Promise<string> {
  if (user.name) return user.name;
  const result = await query('SELECT name FROM users WHERE id = $1', [user.id]);
  return result.rows[0]?.name || 'Unknown';
}

// Surgical logs routes
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
      paramCount++;
      params.push(yearId);
      queryText += ' AND sl.year_id = $' + paramCount;
    }
    if (startDate) {
      paramCount++;
      params.push(startDate);
      queryText += ' AND sl.date >= $' + paramCount;
    }
    if (endDate) {
      paramCount++;
      params.push(endDate);
      queryText += ' AND sl.date <= $' + paramCount;
    }
    if (procedureCategory) {
      paramCount++;
      params.push(procedureCategory);
      queryText += ' AND sl.procedure_category = $' + paramCount;
    }
    if (placeOfPractice) {
      paramCount++;
      params.push(placeOfPractice);
      queryText += ' AND sl.place_of_practice = $' + paramCount;
    }
    if (supervisorId) {
      paramCount++;
      params.push(supervisorId);
      queryText += ' AND sl.supervisor_id = $' + paramCount;
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

    // Prevent self-assignment as supervisor
    if (supervisorId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot assign yourself as supervisor' });
    }

    const result = await query(
      `INSERT INTO surgical_logs (
        resident_id, year_id, date, mrn, age, sex, diagnosis, procedure,
        procedure_type, procedure_category, place_of_practice, surgery_role, supervisor_id, remark
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [req.user!.id, yearId, date, mrn, age, sex, diagnosis, procedure,
       procedureType, procedureCategory || 'MINOR', placeOfPractice, surgeryRole, supervisorId, remark || null]
    );

    await sendNotification(
      supervisorId,
      `New surgical log assigned to you by ${await getUserName(req.user!)}`,
      result.rows[0].id,
      'procedure'
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

    // Check if trying to rate own procedure
    const selfCheck = await query(
      'SELECT resident_id FROM surgical_logs WHERE id = $1',
      [logId]
    );
    if (selfCheck.rows.length > 0 && selfCheck.rows[0].resident_id === req.user!.id) {
      return res.status(403).json({ error: 'You cannot rate your own procedure' });
    }

    const status = rating ? 'RATED' : 'NOT_WITNESSED';
    
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

    const log = result.rows[0];
    const supervisorName = await getUserName(req.user!);
    const notificationMessage = rating 
      ? `Your surgical log has been rated: ${rating}/100 by ${supervisorName}`
      : `Your surgical log was marked as not witnessed by ${supervisorName}`;
    
    await sendNotification(
      log.resident_id,
      notificationMessage,
      logId,
      'rated'
    );

    // Auto-dismiss the original "new log assigned" notification for this supervisor
    await query(
      "UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE AND (log_id = $2 OR (notification_type = 'procedure' AND log_id = $3))",
      [req.user!.id, logId, logId.toString()]
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
       WHERE sl.supervisor_id = $1 AND sl.status IN ('RATED', 'COMMENTED', 'NOT_WITNESSED')
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
    const userRole = req.user!.role;
    
    if (userRole === 'MASTER' || userRole === 'MANAGEMENT') {
      // Allowed
    } else if (userRole === 'SUPERVISOR') {
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

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supervisor rated procedures:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor rated procedures' });
  }
});

// Add post-op follow-up comment (supervisor only, after rating)
router.post('/:logId/postop-followup', authenticate, async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const checkResult = await query(
      `SELECT sl.*, res.name as resident_name 
       FROM surgical_logs sl
       JOIN users res ON sl.resident_id = res.id
       WHERE sl.id = $1 AND sl.supervisor_id = $2 AND sl.status IN ('RATED', 'COMMENTED', 'NOT_WITNESSED')`,
      [logId, req.user!.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rated log not found or unauthorized' });
    }

    const result = await query(
      `UPDATE surgical_logs 
       SET postop_followup_comment = $1, postop_followup_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [comment.trim(), logId]
    );

    const log = checkResult.rows[0];
    const supervisorName = await getUserName(req.user!);
    await sendNotification(
      log.resident_id,
      `${supervisorName} added a post-op follow-up comment on your procedure: ${log.procedure}`,
      logId,
      'rated'
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add post-op follow-up:', error);
    res.status(500).json({ error: 'Failed to add post-op follow-up comment' });
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

    const checkResult = await query(
      'SELECT rating, status, resident_id FROM surgical_logs WHERE id = $1',
      [logId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (checkResult.rows[0].resident_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (checkResult.rows[0].status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot edit a rated or confirmed procedure' });
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

    const checkResult = await query(
      'SELECT status, resident_id FROM surgical_logs WHERE id = $1',
      [logId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (checkResult.rows[0].resident_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (checkResult.rows[0].status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot delete a rated or confirmed procedure' });
    }

    await query('DELETE FROM surgical_logs WHERE id = $1', [logId]);

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// Master delete procedure (can delete any procedure including rated ones)
router.delete('/master/:logId', authenticate, authorize('MASTER'), async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    
    // Delete associated notifications first
    await query("DELETE FROM notifications WHERE log_id = $1", [logId]);
    
    const result = await query('DELETE FROM surgical_logs WHERE id = $1 RETURNING id, procedure', [logId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }
    
    res.json({ message: 'Procedure deleted by master: ' + result.rows[0].procedure });
  } catch (error) {
    console.error('Master delete procedure error:', error);
    res.status(500).json({ error: 'Failed to delete procedure' });
  }
});

export default router;
