import pool from '../database/db';
import { sendPushNotification } from '../routes/notifications';
let running = false;
export async function deliverOutbox() {
  if (running) return;
  running = true;
  let client: import('pg').PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM notification_outbox WHERE sent_at IS NULL AND next_attempt_at <= now() AND attempts < 8 ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 20');
    for (const item of result.rows) {
      try {
        await sendPushNotification(item.user_id,item.title,item.body,item.url);
        await client.query('UPDATE notification_outbox SET sent_at=now(),attempts=attempts+1 WHERE id=$1',[item.id]);
      } catch {
        await client.query("UPDATE notification_outbox SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes' WHERE id=$1",[item.id]);
      }
    }
    await client.query('COMMIT');
  } catch { if(client) await client.query('ROLLBACK').catch(() => {}); console.error('Operation failed: outbox.ts:20'); }
  finally {client?.release();running=false;}
}
export function startOutbox() { const timer=setInterval(() => {void deliverOutbox();},30_000); timer.unref(); void deliverOutbox(); }
