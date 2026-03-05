import pool from './db';

async function ensureActiveAcademicYear() {
  try {
    console.log('Checking for active academic year...');
    
    // Check if there's an active academic year
    const result = await pool.query('SELECT * FROM academic_years WHERE is_active = true');
    
    if (result.rows.length > 0) {
      console.log(`✅ Active academic year found: ${result.rows[0].year_name}`);
      process.exit(0);
      return;
    }
    
    console.log('No active academic year found. Creating one...');
    
    // Get current year
    const currentYear = new Date().getFullYear();
    const academicYearName = `${currentYear}-${currentYear + 1}`;
    const startDate = `${currentYear}-07-01`; // July 1st
    const endDate = `${currentYear + 1}-06-30`; // June 30th next year
    
    // Create an active academic year
    await pool.query(`
      INSERT INTO academic_years (year_name, start_month, start_year, is_active)
      VALUES ($1, $2, $3, true)
    `, [academicYearName, 7, currentYear]); // July (month 7) of current year
    
    console.log(`✅ Created active academic year: ${academicYearName}`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

ensureActiveAcademicYear();
