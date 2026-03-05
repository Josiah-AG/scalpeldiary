import { query } from '../database/db';
import { sendPushNotification } from '../routes/notifications';

// Function to send daily schedule notifications
export async function sendDailyScheduleNotifications() {
  try {
    console.log('Running daily schedule notifications...');
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all residents with their duties and activities for today
    const residents = await query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'RESIDENT'
    `);

    for (const resident of residents.rows) {
      const notifications: string[] = [];
      
      // Check for duties today
      const duties = await query(`
        SELECT md.*, dc.name as duty_name, dc.color
        FROM monthly_duties md
        JOIN duty_categories dc ON md.duty_category_id = dc.id
        WHERE md.resident_id = $1 AND md.duty_date = $2
      `, [resident.id, todayStr]);

      if (duties.rows.length > 0) {
        const dutyNames = duties.rows.map(d => d.duty_name).join(', ');
        notifications.push(`📋 Duty Today: ${dutyNames}`);
      }

      // Check for activities today
      const activities = await query(`
        SELECT da.*, ac.name as activity_name, ac.color
        FROM daily_activities da
        JOIN activity_categories ac ON da.activity_category_id = ac.id
        WHERE da.resident_id = $1 AND da.activity_date = $2
      `, [resident.id, todayStr]);

      if (activities.rows.length > 0) {
        const activityNames = activities.rows.map(a => a.activity_name).join(', ');
        notifications.push(`🏥 Activities: ${activityNames}`);
      }

      // Get current rotation
      const currentMonth = today.getMonth() + 1; // 1-12
      const rotation = await query(`
        SELECT yr.*, rc.name as rotation_name, rc.color, ay.year_name
        FROM yearly_rotations yr
        JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
        JOIN academic_years ay ON yr.academic_year_id = ay.id
        WHERE yr.resident_id = $1 AND yr.month_number = $2 AND ay.is_active = true
      `, [resident.id, currentMonth]);

      if (rotation.rows.length > 0) {
        notifications.push(`🔄 Current Rotation: ${rotation.rows[0].rotation_name}`);
      }

      // Send notification if there's anything scheduled
      if (notifications.length > 0) {
        const message = notifications.join('\n');
        await sendPushNotification(
          resident.id,
          '🌅 Good Morning! Your Schedule for Today',
          message,
          '/'
        );
        console.log(`Sent daily notification to ${resident.email}`);
      }
    }

    console.log('Daily schedule notifications completed');
  } catch (error) {
    console.error('Error sending daily notifications:', error);
  }
}

// Function to send end-of-month rotation reminders
export async function sendMonthlyRotationReminders() {
  try {
    console.log('Running monthly rotation reminders...');
    
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Check if today is the last day of the month
    if (today.getDate() !== lastDayOfMonth.getDate()) {
      console.log('Not the last day of the month, skipping...');
      return;
    }

    const nextMonth = today.getMonth() + 2; // Next month (1-12)
    const adjustedMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;
    
    // Get all residents with their next month's rotation
    const residents = await query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'RESIDENT'
    `);

    for (const resident of residents.rows) {
      const rotation = await query(`
        SELECT yr.*, rc.name as rotation_name, rc.color, ay.year_name
        FROM yearly_rotations yr
        JOIN rotation_categories rc ON yr.rotation_category_id = rc.id
        JOIN academic_years ay ON yr.academic_year_id = ay.id
        WHERE yr.resident_id = $1 AND yr.month_number = $2 AND ay.is_active = true
      `, [resident.id, adjustedMonth]);

      if (rotation.rows.length > 0) {
        const rotationName = rotation.rows[0].rotation_name;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const nextMonthName = monthNames[adjustedMonth - 1];
        
        await sendPushNotification(
          resident.id,
          '📅 Upcoming Rotation Reminder',
          `Your rotation for ${nextMonthName} is: ${rotationName}. Get ready!`,
          '/'
        );
        console.log(`Sent rotation reminder to ${resident.email}`);
      }
    }

    console.log('Monthly rotation reminders completed');
  } catch (error) {
    console.error('Error sending monthly reminders:', error);
  }
}

// Main scheduler function
export function startNotificationScheduler() {
  console.log('Starting notification scheduler...');
  
  // Run every hour
  setInterval(async () => {
    const now = new Date();
    const hour = now.getUTCHours(); // Use UTC hours
    
    // Send daily notifications at 4:00 AM UTC (7:00 AM EAT - East Africa Time)
    if (hour === 4) {
      await sendDailyScheduleNotifications();
    }
    
    // Send monthly reminders at 8:00 PM UTC (11:00 PM EAT)
    if (hour === 20) {
      await sendMonthlyRotationReminders();
    }
  }, 60 * 60 * 1000); // Every hour

  // Also run once on startup (for testing)
  console.log('Running initial notification check...');
  setTimeout(async () => {
    const now = new Date();
    const hour = now.getUTCHours();
    console.log(`Current UTC hour: ${hour}`);
    
    // Only send if it's actually 4 AM UTC
    if (hour === 4) {
      await sendDailyScheduleNotifications();
    }
  }, 5000); // 5 seconds after startup
}
