import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import webpush from 'web-push';

const router = Router();

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrpcPBblQjBITjdmeaWdndBAGqhXWM6EmgBkXnOmHGhGlXe-QZs',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxE4puxxJykA5Lh6-Qg-Yz-Iq-Iq-Iq-Iq-Iq-Iq-Iq'
};

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@scalpeldiary.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

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

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription in database
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) 
       DO UPDATE SET p256dh = $3, auth = $4, updated_at = NOW()`,
      [
        req.user!.id,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]
    );

    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Send push notification to user (internal use)
export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  try {
    // Get all subscriptions for the user
    const result = await query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    const subscriptions = result.rows;

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: 'scalpeldiary-notification'
    });

    // Send to all user's subscriptions
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
      } catch (error: any) {
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        }
        console.error('Error sending push notification:', error);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}

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
