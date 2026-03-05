import pool from './db';

// Predefined distinct colors
const distinctColors = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#A855F7', // Violet
];

async function runSetup() {
  try {
    console.log('Running Chief Resident setup manually...\n');
    
    // Add color to duty_categories
    try {
      await pool.query(`
        ALTER TABLE duty_categories 
        ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10B981'
      `);
      console.log('✅ Added color column to duty_categories');
    } catch (e: any) {
      console.log('⚠️  duty_categories color column:', e.message);
    }
    
    // Add color to activity_categories
    try {
      await pool.query(`
        ALTER TABLE activity_categories 
        ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#F59E0B'
      `);
      console.log('✅ Added color column to activity_categories');
    } catch (e: any) {
      console.log('⚠️  activity_categories color column:', e.message);
    }
    
    // Update duty categories with distinct colors
    const dutyCats = await pool.query('SELECT id, name FROM duty_categories ORDER BY id');
    for (let i = 0; i < dutyCats.rows.length; i++) {
      const color = distinctColors[i % distinctColors.length];
      await pool.query('UPDATE duty_categories SET color = $1 WHERE id = $2', [color, dutyCats.rows[i].id]);
    }
    console.log(`✅ Updated ${dutyCats.rows.length} duty categories with colors`);
    
    // Update activity categories with distinct colors
    const activityCats = await pool.query('SELECT id, name FROM activity_categories ORDER BY id');
    for (let i = 0; i < activityCats.rows.length; i++) {
      const color = distinctColors[i % distinctColors.length];
      await pool.query('UPDATE activity_categories SET color = $1 WHERE id = $2', [color, activityCats.rows[i].id]);
    }
    console.log(`✅ Updated ${activityCats.rows.length} activity categories with colors`);
    
    // Ensure active academic year exists
    const yearResult = await pool.query('SELECT * FROM academic_years WHERE is_active = true');
    
    if (yearResult.rows.length === 0) {
      const currentYear = new Date().getFullYear();
      const academicYearName = `${currentYear}-${currentYear + 1}`;
      
      await pool.query(`
        INSERT INTO academic_years (year_name, start_month, start_year, is_active)
        VALUES ($1, $2, $3, true)
      `, [academicYearName, 7, currentYear]);
      
      console.log(`✅ Created academic year: ${academicYearName}`);
    } else {
      console.log('✅ Academic year already exists');
    }
    
    console.log('\n✅ Setup complete! All systems ready.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

runSetup();
