import { query } from '../database/db';
import { sendPushNotification } from '../routes/notifications';

export const sendNotification = async (
  userId: string,
  message: string,
  logId?: string,
  notificationType?: 'procedure' | 'presentation' | 'rated'
) => {
  try {
    console.log('=== SENDING NOTIFICATION ===');
    console.log('userId:', userId);
    console.log('message:', message);
    console.log('logId:', logId);
    console.log('notificationType:', notificationType);
    
    // Save notification to database
    const result = await query(
      'INSERT INTO notifications (user_id, message, log_id, notification_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, message, logId || null, notificationType || null]
    );
    
    console.log('✅ Notification saved to database with ID:', result.rows[0].id);

    // Send push notification
    try {
      await sendPushNotification(
        userId,
        'ScalpelDiary',
        message,
        logId ? `/logs/${logId}` : '/'
      );
      console.log('✅ Push notification sent');
    } catch (pushError) {
      console.error('⚠️  Push notification failed (non-critical):', pushError);
    }
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    throw error; // Re-throw to let caller handle
  }
};
