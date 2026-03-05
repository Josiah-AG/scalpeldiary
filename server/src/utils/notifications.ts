import { query } from '../database/db';

export const sendNotification = async (
  userId: string,
  message: string,
  logId?: string
) => {
  try {
    await query(
      'INSERT INTO notifications (user_id, message, log_id) VALUES ($1, $2, $3)',
      [userId, message, logId || null]
    );
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
