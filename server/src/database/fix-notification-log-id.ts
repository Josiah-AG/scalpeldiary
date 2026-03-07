import { query } from './db';

export async function fixNotificationLogId() {
  try {
    console.log('Changing notifications.log_id column from UUID to TEXT...');
    
    // Change log_id column type from UUID to TEXT to support both procedure UUIDs and presentation integers
    await query(`
      ALTER TABLE notifications 
      ALTER COLUMN log_id TYPE TEXT USING log_id::TEXT
    `);
    
    console.log('✅ Successfully changed log_id column to TEXT');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to change log_id column:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  fixNotificationLogId()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
