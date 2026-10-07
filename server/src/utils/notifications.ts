import { query } from '../database/db';
export const sendNotification = async (userId: string, message: string, logId?: string | null, notificationType?: 'procedure' | 'presentation' | 'rated') => {
  await query('INSERT INTO notifications (user_id,message,log_id,notification_type) VALUES ($1,$2,$3,$4)',[userId,message,logId || null,notificationType || null]);
  await queuePush(userId, 'ScalpelDiary', message, '/');
};
export async function queuePush(userId: string,title: string,body: string,url='/') {
  await query('INSERT INTO notification_outbox(user_id,title,body,url) VALUES($1,$2,$3,$4)',[userId,title,body,url]);
}
