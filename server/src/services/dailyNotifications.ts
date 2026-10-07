import pool, { query } from '../database/db';
import { queuePush as sendPushNotification } from '../utils/notifications';
import { transactionContext } from '../database/transaction';

// Function to send next day duty notifications (8 PM EAT / 5 PM UTC)
export async function sendNextDayDutyNotifications() {
  try {


    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get all residents with their duties for tomorrow
    const residents = await query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'RESIDENT' AND COALESCE(u.is_suspended,false)=false
    `);

    for (const resident of residents.rows) {
      // Check for duties tomorrow
      const duties = await query(`
        SELECT md.*, dc.name as duty_name, dc.color
        FROM monthly_duties md
        JOIN duty_categories dc ON md.duty_category_id = dc.id
        WHERE md.resident_id = $1 AND md.duty_date = $2
      `, [resident.id, tomorrowStr]);

      if (duties.rows.length > 0) {
        const dutyRoles = duties.rows.map(d => d.duty_name).join(', ');

        await sendPushNotification(
          resident.id,
          '📋 Duty Alert: Tomorrow',
          `You are on duty tomorrow: ${dutyRoles}`,
          '/'
        );

      }
    }


  } catch (error) {
    throw error;
  }
}

// Function to send morning activity notifications (7 AM EAT / 4 AM UTC)
export async function sendMorningActivityNotifications() {
  try {


    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get all residents with their activities for today
    const residents = await query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'RESIDENT' AND COALESCE(u.is_suspended,false)=false
    `);

    for (const resident of residents.rows) {
      // Check for activities today
      const activities = await query(`
        SELECT da.*, ac.name as activity_name, ac.color
        FROM daily_activities da
        JOIN activity_categories ac ON da.activity_category_id = ac.id
        WHERE da.resident_id = $1 AND da.activity_date = $2
      `, [resident.id, todayStr]);

      if (activities.rows.length > 0) {
        const activityNames = activities.rows.map(a => a.activity_name).join(', ');

        await sendPushNotification(
          resident.id,
          '🌅 Good Morning! Today\'s Activities',
          `🏥 Activities Today: ${activityNames}`,
          '/'
        );

      }
    }


  } catch (error) {
    throw error;
  }
}

// Function to send end-of-month rotation reminders (8 PM EAT / 5 PM UTC)
export async function sendMonthlyRotationReminders() {
  try {


    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Check if today is the last day of the month
    if (today.getDate() !== lastDayOfMonth.getDate()) {

      return;
    }

    const nextMonth = today.getMonth() + 2; // Next month (1-12)
    const adjustedMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;

    // Get all residents with their next month's rotation
    const residents = await query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'RESIDENT' AND COALESCE(u.is_suspended,false)=false
    `);

    for (const resident of residents.rows) {
      const rotation = await query(`
        SELECT yr.*, rc.name as rotation_name, rc.color, ay.year_name
        FROM yearly_rotations yr
        JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
        JOIN academic_years ay ON yr.academic_year_id = ay.id
        WHERE yr.resident_id = $1 AND yr.month_number = (($2 - ay.start_month + 12) % 12) + 1 AND ay.is_active = true
      `, [resident.id, adjustedMonth]);

      if (rotation.rows.length > 0) {
        const rotationName = rotation.rows[0].rotation_name;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const nextMonthName = monthNames[adjustedMonth - 1];

        await sendPushNotification(
          resident.id,
          '📅 Next Month\'s Rotation',
          `Your rotation for ${nextMonthName}: ${rotationName}`,
          '/'
        );

      }
    }


  } catch (error) {
    throw error;
  }
}

// Persist event claims and notification outbox rows in the same transaction.
export function startNotificationScheduler() {
 let running=false;
 const tick = async () => {
  if(running) return; running=true;
  let client: import('pg').PoolClient | undefined;
  try {
   client=await pool.connect();
   await client.query('BEGIN');
   await transactionContext.run(client, async () => {
    const now=new Date(); const hour=now.getUTCHours(); const date=now.toISOString().slice(0,10);
    const jobs: Array<[string,number,()=>Promise<void>]> = [
     ['morning',4,sendMorningActivityNotifications],['duty',17,sendNextDayDutyNotifications],['rotation',17,sendMonthlyRotationReminders]
    ];
    for(const [name,start,run] of jobs) {
     if(hour < start) continue;
     const claimed=await query('INSERT INTO scheduled_deliveries(event_key) VALUES($1) ON CONFLICT DO NOTHING RETURNING event_key',[date+':'+name]);
     if(claimed.rowCount) await run();
    }
   });
   await client.query('COMMIT');
  } catch {if(client) await client.query('ROLLBACK').catch(() => {});console.error('Operation failed: dailyNotifications.ts:168');}
  finally {client?.release();running=false;}
 };
 const timer=setInterval(() => {void tick();},60_000);timer.unref();void tick();
}
