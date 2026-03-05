import pool from './db';

async function addColorColumn() {
  try {
    console.log('Adding color column to rotation_categories table...');
    
    // Add color column with default value
    await pool.query(`
      ALTER TABLE rotation_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6'
    `);
    
    console.log('✅ Color column added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding color column:', error);
    process.exit(1);
  }
}

addColorColumn();
