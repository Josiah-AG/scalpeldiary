import { query } from './db';

/**
 * Clear old notifications that were created before the name fix
 * This is a one-time cleanup script
 */
async function clearOldNotifications() {
  try {
    console.log('Clearing old notifications...');
    
    // Option 1: Mark all as read
    const result = await query(
      'UPDATE notifications SET read = true WHERE read = false'
    );
    
    console.log(`Marked ${result.rowCount} notifications as read`);
    
    // Option 2: Delete old notifications (uncomment if you want to delete instead)
    // const result = await query('DELETE FROM notifications WHERE created_at < NOW()');
    // console.log(`Deleted ${result.rowCount} old notifications`);
    
    console.log('✓ Old notifications cleared successfully');
  } catch (error) {
    console.error('Failed to clear old notifications:', error);
    throw error;
  }
}

clearOldNotifications()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
