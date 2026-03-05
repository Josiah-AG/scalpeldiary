import { query } from './db';

async function addManagementRole() {
  try {
    console.log('Adding management role support...');

    // Add has_management_access column to users table
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS has_management_access BOOLEAN DEFAULT FALSE
    `);

    console.log('✓ Added has_management_access column');
    console.log('✅ Management role migration completed successfully!');
    console.log('Note: MANAGEMENT role can now be used in the role column (text field)');
  } catch (error) {
    console.error('❌ Error adding management role:', error);
    throw error;
  }
}

addManagementRole()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
