import { query } from './db';

async function addNotificationTypeColumn() {
  try {
    console.log('Adding notification_type column to notifications table...');

    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'notification_type'
    `);

    if (checkColumn.rows.length === 0) {
      // Add notification_type column
      await query(`
        ALTER TABLE notifications 
        ADD COLUMN notification_type VARCHAR(20)
      `);
      console.log('✅ Added notification_type column');
    } else {
      console.log('✅ notification_type column already exists');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addNotificationTypeColumn()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default addNotificationTypeColumn;
