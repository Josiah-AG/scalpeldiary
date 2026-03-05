import pool from './db';

async function checkColorColumns() {
  try {
    console.log('Checking color columns in category tables...\n');
    
    // Check rotation_categories
    try {
      const rotResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'rotation_categories' AND column_name = 'color'
      `);
      console.log('rotation_categories.color:', rotResult.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');
      if (rotResult.rows.length > 0) {
        const countResult = await pool.query('SELECT COUNT(*) FROM rotation_categories WHERE color IS NOT NULL');
        console.log(`  - ${countResult.rows[0].count} categories have colors`);
      }
    } catch (e: any) {
      console.log('rotation_categories.color: ❌ ERROR -', e.message);
    }
    
    // Check duty_categories
    try {
      const dutyResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'duty_categories' AND column_name = 'color'
      `);
      console.log('duty_categories.color:', dutyResult.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');
      if (dutyResult.rows.length > 0) {
        const countResult = await pool.query('SELECT COUNT(*) FROM duty_categories WHERE color IS NOT NULL');
        console.log(`  - ${countResult.rows[0].count} categories have colors`);
      }
    } catch (e: any) {
      console.log('duty_categories.color: ❌ ERROR -', e.message);
    }
    
    // Check activity_categories
    try {
      const actResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'activity_categories' AND column_name = 'color'
      `);
      console.log('activity_categories.color:', actResult.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');
      if (actResult.rows.length > 0) {
        const countResult = await pool.query('SELECT COUNT(*) FROM activity_categories WHERE color IS NOT NULL');
        console.log(`  - ${countResult.rows[0].count} categories have colors`);
      }
    } catch (e: any) {
      console.log('activity_categories.color: ❌ ERROR -', e.message);
    }
    
    console.log('\n✅ Check complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking columns:', error);
    process.exit(1);
  }
}

checkColorColumns();
