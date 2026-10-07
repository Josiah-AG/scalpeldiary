import { transactional } from '../database/transaction';
import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import webpush from 'web-push';

const router = Router();

// Configure web-push with VAPID keys (optional)
let pushNotificationsEnabled = false;

try {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@scalpeldiary.com';

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    pushNotificationsEnabled = true;

  } else {

  }
} catch (error) {
  console.error('Operation failed: notifications.ts:24');

}

// Get notifications for user (exclude notifications older than 48 hours)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Auto-mark notifications older than 48 hours as read
    await query(
      "UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE AND created_at < NOW() - INTERVAL '48 hours'",
      [req.user!.id]
    );

    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 50",
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Operation failed: notifications.ts:43');
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/public-key', authenticate, (_req, res) => res.json({publicKey:process.env.VAPID_PUBLIC_KEY || null}));
router.post('/unsubscribe', authenticate, transactional(async (req: AuthRequest,res) => {
 await query('DELETE FROM push_subscriptions WHERE user_id=$1 AND endpoint=$2',[req.user!.id,req.body.endpoint]);
 res.json({success:true});
}));

// Subscribe to push notifications
router.post('/subscribe', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    if (!pushNotificationsEnabled) {
      return res.status(503).json({
        error: 'Push notifications are not configured on the server',
        message: 'Contact administrator to enable push notifications'
      });
    }

    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    let endpoint: URL;
    try { endpoint = new URL(subscription.endpoint); } catch { return res.status(400).json({error:'Invalid push endpoint'}); }
    if (endpoint.protocol !== 'https:' || !['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns.windows.com'].some(host => endpoint.hostname === host || endpoint.hostname.endsWith('.'+host))) return res.status(400).json({error:'Unsupported push provider'});
    // Store subscription in database
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = $1, p256dh = $3, auth = $4, updated_at = NOW()`,
      [
        req.user!.id,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]
    );

    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Operation failed: notifications.ts:89');
    res.status(500).json({ error: 'Failed to save subscription' });
  }
}));

// Send push notification to user (internal use)
export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  if (!pushNotificationsEnabled) throw new Error('Push service unavailable');

  try {
    // Get all subscriptions for the user
    const result = await query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    const subscriptions = result.rows;

    if (subscriptions.length === 0) {

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
          payload, {timeout:10_000}
        );
      } catch (error: any) {
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        }
        else { throw error; }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    throw error;
  }
}

// Mark notification as read
router.put('/:notificationId/read', authenticate, transactional(async (req: AuthRequest, res) => {
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
}));

// Mark all notifications as read
router.put('/read-all', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1',
      [req.user!.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
}));

export default router;
