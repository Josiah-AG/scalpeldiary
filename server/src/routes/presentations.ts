import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/notifications';

const router = Router();

// Get presentations for resident
router.get('/my-presentations', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId, startDate, endDate, presentationType, venue } = req.query;
    
    let queryText = `
      SELECT p.*, u.name as supervisor_name
      FROM presentations p
      LEFT JOIN users u ON p.supervisor_id = u.id
      WHERE p.resident_id = $1
    `;
    const params: any[] = [req.user!.id];
    let paramCount = 1;

    if (yearId) {
      params.push(yearId);
      queryText += ` AND p.year_id = $${++paramCount}`;
    }
    if (startDate) {
      params.push(startDate);
      queryText += ` AND p.date >= $${++paramCount}`;
    }
    if (endDate) {
      params.push(endDate);
      queryText += ` AND p.date <= $${++paramCount}`;
    }
    if (presentationType) {
      params.push(presentationType);
      queryText += ` AND p.presentation_type = $${++paramCount}`;
    }
    if (venue) {
      params.push(venue);
      queryText += ` AND p.venue = $${++paramCount}`;
    }

    queryText += ' ORDER BY p.date DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch presentations:', error);
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
});

// Create presentation
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId, date, title, venue, presentationType, description, supervisorId } = req.body;

    const result = await query(
      `INSERT INTO presentations (
        resident_id, year_id, date, title, venue, presentation_type, description, supervisor_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user!.id, yearId, date, title, venue, presentationType, description, supervisorId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create presentation:', error);
    res.status(500).json({ error: 'Failed to create presentation' });
  }
});

// Update presentation
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { date, title, venue, presentationType, description } = req.body;

    const result = await query(
      `UPDATE presentations 
       SET date = $1, title = $2, venue = $3, presentation_type = $4, description = $5, updated_at = NOW()
       WHERE id = $6 AND resident_id = $7
       RETURNING *`,
      [date, title, venue, presentationType, description, id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update presentation:', error);
    res.status(500).json({ error: 'Failed to update presentation' });
  }
});

// Delete presentation
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM presentations WHERE id = $1 AND resident_id = $2 RETURNING id',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    res.json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error('Failed to delete presentation:', error);
    res.status(500).json({ error: 'Failed to delete presentation' });
  }
});

// Get presentation statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId, residentId } = req.query;
    const targetResidentId = residentId || req.user!.id;

    // Total presentations
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM presentations WHERE resident_id = $1 AND year_id = $2',
      [targetResidentId, yearId]
    );

    // Type distribution
    const typeResult = await query(
      'SELECT presentation_type, COUNT(*) as count FROM presentations WHERE resident_id = $1 AND year_id = $2 GROUP BY presentation_type',
      [targetResidentId, yearId]
    );

    // Average rating
    const ratingResult = await query(
      'SELECT AVG(rating) as avg_rating FROM presentations WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL',
      [targetResidentId, yearId]
    );

    res.json({
      totalPresentations: parseInt(totalResult.rows[0].count),
      avgRating: parseFloat(ratingResult.rows[0].avg_rating) || 0,
      typeDistribution: typeResult.rows.reduce((acc, row) => {
        acc[row.presentation_type] = parseInt(row.count);
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Failed to fetch presentation stats:', error);
    res.status(500).json({ error: 'Failed to fetch presentation stats' });
  }
});

// Get presentations for a specific resident (for supervisors)
router.get('/resident/:residentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { residentId } = req.params;
    const { year } = req.query;

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
      `SELECT p.*, u.name as supervisor_name
       FROM presentations p
       LEFT JOIN users u ON p.supervisor_id = u.id
       WHERE p.resident_id = $1 AND p.year_id = $2
       ORDER BY p.date DESC`,
      [residentId, yearId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch resident presentations' });
  }
});

// Get rated presentations (with resident info for supervisors)
router.get('/rated', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              u.name as supervisor_name,
              res.name as resident_name,
              ry.year as resident_year
       FROM presentations p
       LEFT JOIN users u ON p.supervisor_id = u.id
       LEFT JOIN users res ON p.resident_id = res.id
       LEFT JOIN resident_years ry ON p.year_id = ry.id
       WHERE p.supervisor_id = $1 AND p.rating IS NOT NULL
       ORDER BY p.date DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rated presentations' });
  }
});

// Get presentations to rate (for supervisors)
router.get('/to-rate', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.name as resident_name, ry.year as resident_year
       FROM presentations p
       JOIN users u ON p.resident_id = u.id
       JOIN resident_years ry ON p.year_id = ry.id
       WHERE p.supervisor_id = $1 AND p.status = 'PENDING'
       ORDER BY p.date DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch presentations to rate:', error);
    res.status(500).json({ error: 'Failed to fetch presentations to rate' });
  }
});

// Rate presentation
router.post('/:presentationId/rate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { presentationId } = req.params;
    const { rating, comment } = req.body;

    const status = rating ? 'RATED' : 'COMMENTED';
    
    const result = await query(
      `UPDATE presentations 
       SET rating = $1, comment = $2, status = $3, rated_at = NOW(), updated_at = NOW()
       WHERE id = $4 AND supervisor_id = $5
       RETURNING *`,
      [rating, comment, status, presentationId, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found or unauthorized' });
    }

    // Send notification to the resident
    const presentation = result.rows[0];
    await sendNotification(
      presentation.resident_id,
      `Your presentation "${presentation.title}" has been ${rating ? 'rated' : 'commented on'}`,
      presentationId
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to rate presentation:', error);
    res.status(500).json({ error: 'Failed to rate presentation' });
  }
});

// Get supervisor's rated presentations (Master and Management with access)
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

    const result = await query(
      `SELECT p.*,
              res.name as resident_name,
              res.profile_picture as resident_profile_picture,
              ry.year as resident_year
       FROM presentations p
       JOIN users res ON p.resident_id = res.id
       JOIN resident_years ry ON p.year_id = ry.id
       WHERE p.supervisor_id = $1 AND p.rating IS NOT NULL
       ORDER BY p.date DESC`,
      [supervisorId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching supervisor rated presentations:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor rated presentations' });
  }
});

export default router;
