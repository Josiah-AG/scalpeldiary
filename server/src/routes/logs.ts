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
      procedureType, procedureCategory, placeOfPractice, surgeryRole, supervisorId, remark,
      isDetachment, detachmentType, externalSupervisorName
    } = req.body;

    // Prevent self-assignment as supervisor
    if (supervisorId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot assign yourself as supervisor' });
    }

    // If supervisor is a resident, enforce seniority (must be strictly senior)
    // Skip for detachment logs with external supervisor (no supervisorId)
    if (supervisorId) {
      const supervisorCheck = await query('SELECT role FROM users WHERE id = $1', [supervisorId]);
      if (supervisorCheck.rows.length > 0 && supervisorCheck.rows[0].role === 'RESIDENT') {
        const [myYearRes, supYearRes] = await Promise.all([
          query('SELECT MAX(year) as y FROM resident_years WHERE resident_id = $1', [req.user!.id]),
          query('SELECT MAX(year) as y FROM resident_years WHERE resident_id = $1', [supervisorId])
        ]);
        const myYear = myYearRes.rows[0]?.y || 0;
        const supYear = supYearRes.rows[0]?.y || 0;
        if (supYear <= myYear) {
          return res.status(400).json({ error: 'You can only be supervised by a senior resident (higher year) or a supervisor' });
        }
      }
    }

    const result = await query(
      `INSERT INTO surgical_logs (
        resident_id, year_id, date, mrn, age, sex, diagnosis, procedure,
        procedure_type, procedure_category, place_of_practice, surgery_role, supervisor_id, remark,
        is_detachment, detachment_type, external_supervisor_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [req.user!.id, yearId, date, mrn, age, sex, diagnosis, procedure,
       procedureType, procedureCategory || 'MINOR', placeOfPractice, surgeryRole, 
       isDetachment && !supervisorId ? null : supervisorId, 
       remark || null,
       isDetachment || false, detachmentType || null, externalSupervisorName || null]
    );

    // Send notification to supervisor if one is assigned (not external detachment)
    if (supervisorId && !isDetachment) {
      await sendNotification(
        supervisorId,
        `New surgical log assigned to you by ${await getUserName(req.user!)}`,
        result.rows[0].id,
        'procedure'
      );
    } else if (supervisorId && isDetachment) {
      // Detachment with a resident supervisor — still notify them
      await sendNotification(
        supervisorId,
        `New detachment surgical log assigned to you by ${await getUserName(req.user!)}`,
        result.rows[0].id,
        'procedure'
      );
    }

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

    // If rater is a resident, enforce seniority
    if (req.user!.role === 'RESIDENT' && selfCheck.rows.length > 0) {
      const [myYearRes, resYearRes] = await Promise.all([
        query('SELECT MAX(year) as y FROM resident_years WHERE resident_id = $1', [req.user!.id]),
        query('SELECT MAX(year) as y FROM resident_years WHERE resident_id = $1', [selfCheck.rows[0].resident_id])
      ]);
      const myYear = myYearRes.rows[0]?.y || 0;
      const resYear = resYearRes.rows[0]?.y || 0;
      if (myYear <= resYear) {
        return res.status(403).json({ error: 'You can only rate junior residents (lower year than yours)' });
      }
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
    
    // Convert rating to label for notification
    let ratingLabel = '';
    if (rating) {
      if (rating >= 90) ratingLabel = 'Excellent';
      else if (rating >= 71) ratingLabel = 'Good';
      else if (rating >= 50) ratingLabel = 'Satisfactory';
      else ratingLabel = 'Poor';
    }
    
    const notificationMessage = rating 
      ? `Your surgical log has been rated as ${ratingLabel} by ${supervisorName}`
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

// Get detachment logs summary (for management/master) - includes procedures and presentations, grouped by month
router.get('/detachment-summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    if (userRole === 'MASTER' || userRole === 'MANAGEMENT') {
      // allowed
    } else if (userRole === 'SUPERVISOR') {
      const check = await query('SELECT has_management_access FROM users WHERE id = $1', [req.user!.id]);
      if (!check.rows[0]?.has_management_access) return res.status(403).json({ error: 'Forbidden' });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Procedures grouped by resident + detachment_type + month
    const procResult = await query(
      `SELECT 
        u.id as resident_id, u.name as resident_name,
        (SELECT MAX(year) FROM resident_years WHERE resident_id = u.id) as year,
        sl.detachment_type,
        TO_CHAR(sl.date, 'YYYY-MM') as detachment_month,
        COUNT(*) as procedure_count,
        BOOL_OR(sl.detachment_verified) as batch_verified,
        COUNT(CASE WHEN sl.detachment_verified = false THEN 1 END) as unverified_count,
        MAX(sl.detachment_rating) as detachment_rating,
        MAX(sl.detachment_comment) as detachment_comment
       FROM surgical_logs sl
       JOIN users u ON sl.resident_id = u.id
       WHERE sl.is_detachment = true
       GROUP BY u.id, u.name, sl.detachment_type, TO_CHAR(sl.date, 'YYYY-MM')`
    );

    // Presentations grouped by resident + detachment_type + month
    const presResult = await query(
      `SELECT 
        u.id as resident_id, u.name as resident_name,
        (SELECT MAX(year) FROM resident_years WHERE resident_id = u.id) as year,
        p.detachment_type,
        TO_CHAR(p.date, 'YYYY-MM') as detachment_month,
        COUNT(*) as presentation_count,
        BOOL_OR(p.detachment_verified) as batch_verified,
        COUNT(CASE WHEN p.detachment_verified = false THEN 1 END) as pres_unverified_count,
        MAX(p.detachment_rating) as detachment_rating,
        MAX(p.detachment_comment) as detachment_comment
       FROM presentations p
       JOIN users u ON p.resident_id = u.id
       WHERE p.is_detachment = true
       GROUP BY u.id, u.name, p.detachment_type, TO_CHAR(p.date, 'YYYY-MM')`
    );

    const merged = new Map<string, any>();
    for (const row of procResult.rows) {
      const key = `${row.resident_id}-${row.detachment_type}-${row.detachment_month}`;
      merged.set(key, { ...row, procedure_count: parseInt(row.procedure_count), presentation_count: 0, 
        unverified_count: parseInt(row.unverified_count || 0) });
    }
    for (const row of presResult.rows) {
      const key = `${row.resident_id}-${row.detachment_type}-${row.detachment_month}`;
      if (merged.has(key)) {
        const existing = merged.get(key);
        existing.presentation_count = parseInt(row.presentation_count);
        existing.unverified_count += parseInt(row.pres_unverified_count || 0);
        if (row.batch_verified) existing.batch_verified = true;
        if (row.detachment_rating && (!existing.detachment_rating || row.detachment_rating > existing.detachment_rating)) {
          existing.detachment_rating = row.detachment_rating;
          existing.detachment_comment = row.detachment_comment;
        }
      } else {
        merged.set(key, { ...row, procedure_count: 0, presentation_count: parseInt(row.presentation_count),
          unverified_count: parseInt(row.pres_unverified_count || 0) });
      }
    }

    const result = Array.from(merged.values()).sort((a, b) => {
      const nameComp = a.resident_name.localeCompare(b.resident_name);
      if (nameComp !== 0) return nameComp;
      return b.detachment_month.localeCompare(a.detachment_month); // newest first
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching detachment summary:', error);
    res.status(500).json({ error: 'Failed to fetch detachment summary' });
  }
});

// Get detachment logs for a specific resident + detachment type + optional month
router.get('/detachment/:residentId/:detachmentType', authenticate, async (req: AuthRequest, res) => {
  try {
    const { residentId, detachmentType } = req.params;
    const { month } = req.query;

    const params: any[] = [residentId, detachmentType];
    let monthFilter = '';
    if (month) {
      params.push(month);
      monthFilter = ` AND TO_CHAR(sl.date, 'YYYY-MM') = $3`;
    }

    const procResult = await query(
      `SELECT sl.*, u.name as supervisor_name, 'procedure' as item_type
       FROM surgical_logs sl
       LEFT JOIN users u ON sl.supervisor_id = u.id
       WHERE sl.resident_id = $1 AND sl.is_detachment = true AND sl.detachment_type = $2${monthFilter}
       ORDER BY sl.date DESC`,
      params
    );

    const presParams: any[] = [residentId, detachmentType];
    let presMonthFilter = '';
    if (month) {
      presParams.push(month);
      presMonthFilter = ` AND TO_CHAR(p.date, 'YYYY-MM') = $3`;
    }

    const presResult = await query(
      `SELECT p.*, u.name as supervisor_name, 'presentation' as item_type
       FROM presentations p
       LEFT JOIN users u ON p.supervisor_id = u.id
       WHERE p.resident_id = $1 AND p.is_detachment = true AND p.detachment_type = $2${presMonthFilter}
       ORDER BY p.date DESC`,
      presParams
    );

    const combined = [...procResult.rows, ...presResult.rows].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json(combined);
  } catch (error) {
    console.error('Error fetching detachment logs:', error);
    res.status(500).json({ error: 'Failed to fetch detachment logs' });
  }
});

// Verify detachment logs batch (management/master)
router.post('/detachment-verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    if (userRole === 'MASTER' || userRole === 'MANAGEMENT') {
      // allowed
    } else if (userRole === 'SUPERVISOR') {
      const check = await query('SELECT has_management_access FROM users WHERE id = $1', [req.user!.id]);
      if (!check.rows[0]?.has_management_access) return res.status(403).json({ error: 'Forbidden' });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { residentId, detachmentType, rating, comment, month } = req.body;

    // Build month filter
    const monthFilterProc = month ? ` AND TO_CHAR(date, 'YYYY-MM') = '${month}'` : '';
    const monthFilterPres = month ? ` AND TO_CHAR(date, 'YYYY-MM') = '${month}'` : '';

    // Update all unverified detachment logs for this resident + type + month (procedures)
    const procResult = await query(
      `UPDATE surgical_logs 
       SET detachment_verified = true, 
           detachment_rating = $1, 
           detachment_comment = $2,
           detachment_verified_by = $3,
           detachment_verified_at = NOW(),
           status = CASE WHEN status = 'PENDING' THEN 'RATED' ELSE status END,
           updated_at = NOW()
       WHERE resident_id = $4 
         AND is_detachment = true 
         AND detachment_type = $5
         AND detachment_verified = false${monthFilterProc}
       RETURNING id`,
      [rating, comment, req.user!.id, residentId, detachmentType]
    );

    // Update all unverified detachment presentations for this resident + type + month
    const presResult = await query(
      `UPDATE presentations 
       SET detachment_verified = true, 
           detachment_rating = $1, 
           detachment_comment = $2,
           detachment_verified_by = $3,
           detachment_verified_at = NOW(),
           status = CASE WHEN status = 'PENDING' THEN 'RATED' ELSE status END,
           updated_at = NOW()
       WHERE resident_id = $4 
         AND is_detachment = true 
         AND detachment_type = $5
         AND detachment_verified = false${monthFilterPres}
       RETURNING id`,
      [rating, comment, req.user!.id, residentId, detachmentType]
    );

    const totalVerified = (procResult.rowCount || 0) + (presResult.rowCount || 0);

    // Send notification to resident
    const residentResult = await query('SELECT name FROM users WHERE id = $1', [residentId]);
    const verifierName = await getUserName(req.user!);
    
    await sendNotification(
      residentId,
      `Your ${detachmentType.replace(/_/g, ' ')} detachment logs have been verified by ${verifierName}`,
      null,
      'rated'
    );

    res.json({ 
      success: true, 
      message: `Verified ${totalVerified} detachment items`,
      count: totalVerified
    });
  } catch (error) {
    console.error('Error verifying detachment logs:', error);
    res.status(500).json({ error: 'Failed to verify detachment logs' });
  }
});

export default router;
