import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/notifications';

const router = Router();

// Get general comments for a resident (supervisor/master view)
router.get('/resident/:residentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { residentId } = req.params;
    const result = await query(
      `SELECT gc.*, u.name as supervisor_name
       FROM general_comments gc
       JOIN users u ON gc.supervisor_id = u.id
       WHERE gc.resident_id = $1
       ORDER BY gc.created_at DESC`,
      [residentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add general comment
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { residentId, comment, isAnonymous } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const result = await query(
      `INSERT INTO general_comments (supervisor_id, resident_id, comment, is_anonymous)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user!.id, residentId, comment.trim(), isAnonymous || false]
    );

    // Only notify if not anonymous
    if (!isAnonymous) {
      const supName = await query('SELECT name FROM users WHERE id = $1', [req.user!.id]);
      await sendNotification(
        residentId,
        `${supName.rows[0]?.name || 'A supervisor'} left a general comment on your profile`,
        null,
        'rated'
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get residents grouped by year (for the comments page)
router.get('/residents-by-year', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.profile_picture,
              (SELECT MAX(year) FROM resident_years WHERE resident_id = u.id) as year
       FROM users u
       WHERE u.role = 'RESIDENT'
       ORDER BY (SELECT MAX(year) FROM resident_years WHERE resident_id = u.id) DESC, u.name`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

export default router;
