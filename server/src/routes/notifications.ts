import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get notifications for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const { notificationId } = req.params;
    await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [notificationId, req.user!.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1',
      [req.user!.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
