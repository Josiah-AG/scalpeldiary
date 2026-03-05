import { query } from './db';

async function addSuspendedColumn() {
  try {
    console.log('Adding is_suspended column to users table...');
    
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE
    `);
    
    console.log('✅ is_suspended column added successfully');
  } catch (error) {
    console.error('❌ Error adding is_suspended column:', error);
    throw error;
  }
}

addSuspendedColumn()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
