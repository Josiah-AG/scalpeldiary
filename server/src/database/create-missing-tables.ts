import pool from './db';

async function createMissingTables() {
  try {
    console.log('Creating missing Chief Resident tables...\n');
    
    // Create yearly_rotations table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS yearly_rotations (
          id SERIAL PRIMARY KEY,
          academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
          resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
          month_number INTEGER NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
          rotation_category_id INTEGER REFERENCES rotation_categories(id) ON DELETE SET NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(academic_year_id, resident_id, month_number)
        )
      `);
      console.log('✅ Created yearly_rotations table');
    } catch (e: any) {
      console.log('⚠️  yearly_rotations:', e.message);
    }
    
    // Create monthly_duties table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS monthly_duties (
          id SERIAL PRIMARY KEY,
          resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
          duty_date DATE NOT NULL,
          duty_category_id INTEGER REFERENCES duty_categories(id) ON DELETE SET NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(resident_id, duty_date)
        )
      `);
      console.log('✅ Created monthly_duties table');
    } catch (e: any) {
      console.log('⚠️  monthly_duties:', e.message);
    }
    
    // Create daily_activities table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_activities (
          id SERIAL PRIMARY KEY,
          resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
          activity_date DATE NOT NULL,
          activity_category_id INTEGER REFERENCES activity_categories(id) ON DELETE SET NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created daily_activities table');
    } catch (e: any) {
      console.log('⚠️  daily_activities:', e.message);
    }
    
    // Create presentation_assignments table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS presentation_assignments (
          id SERIAL PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          presentation_type VARCHAR(100) NOT NULL,
          presenter_id UUID REFERENCES users(id) ON DELETE CASCADE,
          moderator_id UUID REFERENCES users(id) ON DELETE CASCADE,
          assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
          scheduled_date DATE,
          venue VARCHAR(255),
          description TEXT,
          status VARCHAR(50) DEFAULT 'PENDING',
          presentation_id INTEGER REFERENCES presentations(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created presentation_assignments table');
    } catch (e: any) {
      console.log('⚠️  presentation_assignments:', e.message);
    }
    
    // Create indexes
    const indexes = [
      { name: 'idx_yearly_rotations_resident', sql: 'CREATE INDEX IF NOT EXISTS idx_yearly_rotations_resident ON yearly_rotations(resident_id, academic_year_id)' },
      { name: 'idx_monthly_duties_date', sql: 'CREATE INDEX IF NOT EXISTS idx_monthly_duties_date ON monthly_duties(duty_date)' },
      { name: 'idx_monthly_duties_resident', sql: 'CREATE INDEX IF NOT EXISTS idx_monthly_duties_resident ON monthly_duties(resident_id, duty_date)' },
      { name: 'idx_daily_activities_date', sql: 'CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON daily_activities(activity_date)' },
      { name: 'idx_daily_activities_resident', sql: 'CREATE INDEX IF NOT EXISTS idx_daily_activities_resident ON daily_activities(resident_id, activity_date)' },
      { name: 'idx_presentation_assignments_presenter', sql: 'CREATE INDEX IF NOT EXISTS idx_presentation_assignments_presenter ON presentation_assignments(presenter_id, status)' },
      { name: 'idx_presentation_assignments_moderator', sql: 'CREATE INDEX IF NOT EXISTS idx_presentation_assignments_moderator ON presentation_assignments(moderator_id, status)' }
    ];

    for (const index of indexes) {
      try {
        await pool.query(index.sql);
        console.log(`✅ Created ${index.name}`);
      } catch (e: any) {
        console.log(`⚠️  ${index.name}:`, e.message);
      }
    }
    
    console.log('\n✅ All missing tables created!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createMissingTables();
