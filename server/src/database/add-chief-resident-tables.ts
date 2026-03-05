import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const addChiefResidentTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Adding is_chief_resident column to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_chief_resident BOOLEAN DEFAULT FALSE
    `);

    console.log('Creating rotation_categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rotation_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Creating academic_years table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id SERIAL PRIMARY KEY,
        year_name VARCHAR(100) NOT NULL,
        start_month INTEGER NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
        start_year INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Creating yearly_rotations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS yearly_rotations (
        id SERIAL PRIMARY KEY,
        academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
        resident_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        month_number INTEGER NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
        rotation_category_id INTEGER REFERENCES rotation_categories(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(academic_year_id, resident_id, month_number)
      )
    `);

    console.log('Creating duty_categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS duty_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Creating monthly_duties table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_duties (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        duty_date DATE NOT NULL,
        duty_category_id INTEGER REFERENCES duty_categories(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(resident_id, duty_date)
      )
    `);

    console.log('Creating activity_categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Creating daily_activities table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_activities (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_date DATE NOT NULL,
        activity_category_id INTEGER REFERENCES activity_categories(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Creating presentation_assignments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS presentation_assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        presentation_type VARCHAR(100) NOT NULL,
        presenter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        moderator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        scheduled_date DATE,
        venue VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        presentation_id INTEGER REFERENCES presentations(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_yearly_rotations_resident 
      ON yearly_rotations(resident_id, academic_year_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monthly_duties_date 
      ON monthly_duties(duty_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monthly_duties_resident 
      ON monthly_duties(resident_id, duty_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_activities_date 
      ON daily_activities(activity_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_activities_resident 
      ON daily_activities(resident_id, activity_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_presentation_assignments_presenter 
      ON presentation_assignments(presenter_id, status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_presentation_assignments_moderator 
      ON presentation_assignments(moderator_id, status)
    `);

    console.log('Inserting default rotation categories...');
    const rotationCategories = [
      'GS @ Y12HMC',
      'GS @ ALERT',
      'OPD',
      'Anesthesia',
      'Plastic Surgery',
      'ICU',
      'Orthopedics',
      'Cardiothoracic',
      'Neurosurgery',
      'Oncology',
      'OBGYN',
      'Radiology',
      'Urology',
      'Pediatric Surgery',
      'Month Off'
    ];

    for (let i = 0; i < rotationCategories.length; i++) {
      await client.query(`
        INSERT INTO rotation_categories (name, display_order)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [rotationCategories[i], i + 1]);
    }

    console.log('Inserting default duty categories...');
    const dutyCategories = ['EOPD', 'ICU', 'Ward', 'Senior Resident', 'Consultation'];
    
    for (let i = 0; i < dutyCategories.length; i++) {
      await client.query(`
        INSERT INTO duty_categories (name, display_order)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [dutyCategories[i], i + 1]);
    }

    console.log('Inserting default activity categories...');
    const activityCategories = ['OPD', 'OR', 'Round', 'Minor OR'];
    
    for (let i = 0; i < activityCategories.length; i++) {
      await client.query(`
        INSERT INTO activity_categories (name, display_order)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [activityCategories[i], i + 1]);
    }

    console.log('Creating default academic year...');
    const currentYear = new Date().getFullYear();
    await client.query(`
      INSERT INTO academic_years (year_name, start_month, start_year, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [`${currentYear}-${currentYear + 1}`, 7, currentYear, true]);

    await client.query('COMMIT');
    console.log('✅ Chief Resident tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addChiefResidentTables();
