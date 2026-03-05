import db from './db';

async function addProcedureCategoryColumn() {
  try {
    console.log('Adding procedure_category column to surgical_logs table...');
    
    await db.query(`
      ALTER TABLE surgical_logs 
      ADD COLUMN IF NOT EXISTS procedure_category VARCHAR(100);
    `);
    
    console.log('✅ Successfully added procedure_category column');
    
    // Optional: Update existing records with a default category if needed
    // You can uncomment this if you want to set a default for existing records
    /*
    await db.query(`
      UPDATE surgical_logs 
      SET procedure_category = 'GI Surgery' 
      WHERE procedure_category IS NULL;
    `);
    console.log('✅ Updated existing records with default category');
    */
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding procedure_category column:', error);
    process.exit(1);
  }
}

addProcedureCategoryColumn();
