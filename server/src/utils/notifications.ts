import { query } from '../database/db';
import { sendPushNotification } from '../routes/notifications';

export const sendNotification = async (
  userId: string,
  message: string,
  logId?: string,
  notificationType?: 'procedure' | 'presentation' | 'rated'
) => {
  try {
    console.log('sendNotification called:', { userId, message, logId, notificationType });
    
    // Save notification to database
    await query(
      'INSERT INTO notifications (user_id, message, log_id, notification_type) VALUES ($1, $2, $3, $4)',
      [userId, message, logId || null, notificationType || null]
    );
    
    console.log('Notification saved to database');

    // Send push notification
    await sendPushNotification(
      userId,
      'ScalpelDiary',
      message,
      logId ? `/logs/${logId}` : '/'
    );
    
    console.log('Push notification sent');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
