import pool from './db';

async function addColorColumns() {
  try {
    console.log('Adding color columns to category tables...');
    
    // Add color to rotation_categories
    await pool.query(`
      ALTER TABLE rotation_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6'
    `);
    console.log('✅ Added color to rotation_categories');
    
    // Add color to duty_categories
    await pool.query(`
      ALTER TABLE duty_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10B981'
    `);
    console.log('✅ Added color to duty_categories');
    
    // Add color to activity_categories
    await pool.query(`
      ALTER TABLE activity_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#F59E0B'
    `);
    console.log('✅ Added color to activity_categories');
    
    console.log('✅ All color columns added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding color columns:', error);
    process.exit(1);
  }
}

addColorColumns();
