import { query } from './db';

export async function fixScheduledDateNullable() {
  console.log('🔄 Fixing scheduled_date column to be nullable...');

  try {
    // Make scheduled_date nullable
    await query(`
      ALTER TABLE presentation_assignments 
      ALTER COLUMN scheduled_date DROP NOT NULL;
    `);
    
    console.log('✅ scheduled_date is now nullable');
    return { success: true, message: 'scheduled_date fixed successfully' };
    
  } catch (error: any) {
    // If column doesn't exist or already nullable, that's fine
    if (error.message.includes('does not exist') || error.message.includes('column "scheduled_date" of relation "presentation_assignments" does not exist')) {
      console.log('✅ Column already in correct state');
      return { success: true, message: 'Column already correct' };
    }
    console.error('❌ Fix failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixScheduledDateNullable()
    .then(() => {
      console.log('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}
