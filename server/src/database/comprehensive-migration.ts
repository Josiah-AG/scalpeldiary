import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const runComprehensiveMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting comprehensive database migration...\n');
    
    await client.query('BEGIN');

    // ============================================
    // STEP 1: Add missing columns to users table
    // ============================================
    console.log('📋 Step 1: Adding missing columns to users table...');
    
    const userColumns = [
      { name: 'institution', type: 'VARCHAR(255)' },
      { name: 'specialty', type: 'VARCHAR(255)' },
      { name: 'profile_picture', type: 'TEXT' },
      { name: 'is_suspended', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'has_management_access', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_chief_resident', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_senior', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const col of userColumns) {
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        console.log(`  ✅ Added ${col.name} column`);
      } catch (error: any) {
        if (error.code !== '42701') {
          console.log(`  ⚠️  ${col.name}: ${error.message}`);
        } else {
          console.log(`  ℹ️  ${col.name} already exists`);
        }
      }
    }

    // ============================================
    // STEP 2: Add missing columns to surgical_logs
    // ============================================
    console.log('\n📋 Step 2: Adding missing columns to surgical_logs table...');
    
    const logColumns = [
      { name: 'procedure_category', type: 'VARCHAR(100) DEFAULT \'MINOR\'' },
      { name: 'remark', type: 'TEXT' }
    ];

    for (const col of logColumns) {
      try {
        await client.query(`ALTER TABLE surgical_logs ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        console.log(`  ✅ Added ${col.name} column`);
      } catch (error: any) {
        if (error.code !== '42701') {
          console.log(`  ⚠️  ${col.name}: ${error.message}`);
        }
      }
    }


    // ============================================
    // STEP 3: Create presentations table
    // ============================================
    console.log('\n📋 Step 3: Creating presentations table...');
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS presentations (
          id SERIAL PRIMARY KEY,
          resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
          year_id UUID REFERENCES resident_years(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          title VARCHAR(500) NOT NULL,
          venue VARCHAR(255) NOT NULL,
          presentation_type VARCHAR(50) NOT NULL,
          description TEXT,
          supervisor_id UUID REFERENCES users(id),
          status VARCHAR(50) DEFAULT 'PENDING',
          rating INTEGER,
          comment TEXT,
          rated_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('  ✅ Created presentations table');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_presentations_resident ON presentations(resident_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_presentations_year ON presentations(year_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_presentations_supervisor ON presentations(supervisor_id)');
      console.log('  ✅ Created presentations indexes');
    } catch (error: any) {
      console.log(`  ℹ️  presentations table: ${error.message}`);
    }

    // ============================================
    // STEP 4: Create push_subscriptions table
    // ============================================
    console.log('\n📋 Step 4: Creating push_subscriptions table...');
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('  ✅ Created push_subscriptions table');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id)');
      console.log('  ✅ Created push_subscriptions index');
    } catch (error: any) {
      console.log(`  ℹ️  push_subscriptions table: ${error.message}`);
    }

    // ============================================
    // STEP 5: Create Chief Resident tables
    // ============================================
    console.log('\n📋 Step 5: Creating Chief Resident tables...');
    
    // Rotation categories
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS rotation_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          color VARCHAR(50),
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('  ✅ Created rotation_categories table');
    } catch (error: any) {
      console.log(`  ℹ️  rotation_categories: ${error.message}`);
    }

    // Academic years
    try {
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
      console.log('  ✅ Created academic_years table');
    } catch (error: any) {
      console.log(`  ℹ️  academic_years: ${error.message}`);
    }

    // Yearly rotations
    try {
      await client.query(`
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
      console.log('  ✅ Created yearly_rotations table');
    } catch (error: any) {
      console.log(`  ℹ️  yearly_rotations: ${error.message}`);
    }

    // Duty categories
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS duty_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          color VARCHAR(50),
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('  ✅ Created duty_categories table');
    } catch (error: any) {
      console.log(`  ℹ️  duty_categories: ${error.message}`);
    }

    // Monthly duties
    try {
      await client.query(`
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
      console.log('  ✅ Created monthly_duties table');
    } catch (error: any) {
      console.log(`  ℹ️  monthly_duties: ${error.message}`);
    }

    // Activity categories
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          color VARCHAR(50),
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('  ✅ Created activity_categories table');
    } catch (error: any) {
      console.log(`  ℹ️  activity_categories: ${error.message}`);
    }

    // Daily activities
    try {
      await client.query(`
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
      console.log('  ✅ Created daily_activities table');
    } catch (error: any) {
      console.log(`  ℹ️  daily_activities: ${error.message}`);
    }

    // Presentation assignments
    try {
      await client.query(`
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
      console.log('  ✅ Created presentation_assignments table');
    } catch (error: any) {
      console.log(`  ℹ️  presentation_assignments: ${error.message}`);
    }


    // ============================================
    // STEP 6: Create all indexes
    // ============================================
    console.log('\n📋 Step 6: Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_yearly_rotations_resident ON yearly_rotations(resident_id, academic_year_id)',
      'CREATE INDEX IF NOT EXISTS idx_monthly_duties_date ON monthly_duties(duty_date)',
      'CREATE INDEX IF NOT EXISTS idx_monthly_duties_resident ON monthly_duties(resident_id, duty_date)',
      'CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON daily_activities(activity_date)',
      'CREATE INDEX IF NOT EXISTS idx_daily_activities_resident ON daily_activities(resident_id, activity_date)',
      'CREATE INDEX IF NOT EXISTS idx_presentation_assignments_presenter ON presentation_assignments(presenter_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_presentation_assignments_moderator ON presentation_assignments(moderator_id, status)'
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log(`  ✅ Created index`);
      } catch (error: any) {
        console.log(`  ℹ️  Index: ${error.message}`);
      }
    }

    // ============================================
    // STEP 7: Insert default data
    // ============================================
    console.log('\n📋 Step 7: Inserting default data...');
    
    // Rotation categories
    const rotationCategories = [
      { name: 'GS @ Y12HMC', color: '#3b82f6' },
      { name: 'GS @ ALERT', color: '#10b981' },
      { name: 'OPD', color: '#f59e0b' },
      { name: 'Anesthesia', color: '#8b5cf6' },
      { name: 'Plastic Surgery', color: '#ec4899' },
      { name: 'ICU', color: '#ef4444' },
      { name: 'Orthopedics', color: '#06b6d4' },
      { name: 'Cardiothoracic', color: '#f97316' },
      { name: 'Neurosurgery', color: '#6366f1' },
      { name: 'Oncology', color: '#84cc16' },
      { name: 'OBGYN', color: '#d946ef' },
      { name: 'Radiology', color: '#14b8a6' },
      { name: 'Urology', color: '#a855f7' },
      { name: 'Pediatric Surgery', color: '#22c55e' },
      { name: 'Month Off', color: '#64748b' }
    ];

    for (let i = 0; i < rotationCategories.length; i++) {
      try {
        await client.query(`
          INSERT INTO rotation_categories (name, color, display_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO UPDATE SET color = $2
        `, [rotationCategories[i].name, rotationCategories[i].color, i + 1]);
      } catch (error: any) {
        console.log(`  ℹ️  Rotation category ${rotationCategories[i].name}: ${error.message}`);
      }
    }
    console.log('  ✅ Inserted rotation categories');

    // Duty categories
    const dutyCategories = [
      { name: 'EOPD', color: '#3b82f6' },
      { name: 'ICU', color: '#ef4444' },
      { name: 'Ward', color: '#10b981' },
      { name: 'Senior Resident', color: '#f59e0b' },
      { name: 'Consultation', color: '#8b5cf6' }
    ];
    
    for (let i = 0; i < dutyCategories.length; i++) {
      try {
        await client.query(`
          INSERT INTO duty_categories (name, color, display_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO UPDATE SET color = $2
        `, [dutyCategories[i].name, dutyCategories[i].color, i + 1]);
      } catch (error: any) {
        console.log(`  ℹ️  Duty category ${dutyCategories[i].name}: ${error.message}`);
      }
    }
    console.log('  ✅ Inserted duty categories');

    // Activity categories
    const activityCategories = [
      { name: 'OPD', color: '#3b82f6' },
      { name: 'OR', color: '#10b981' },
      { name: 'Round', color: '#f59e0b' },
      { name: 'Minor OR', color: '#8b5cf6' }
    ];
    
    for (let i = 0; i < activityCategories.length; i++) {
      try {
        await client.query(`
          INSERT INTO activity_categories (name, color, display_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO UPDATE SET color = $2
        `, [activityCategories[i].name, activityCategories[i].color, i + 1]);
      } catch (error: any) {
        console.log(`  ℹ️  Activity category ${activityCategories[i].name}: ${error.message}`);
      }
    }
    console.log('  ✅ Inserted activity categories');

    // Create default academic year
    const currentYear = new Date().getFullYear();
    try {
      await client.query(`
        INSERT INTO academic_years (year_name, start_month, start_year, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [`${currentYear}-${currentYear + 1}`, 7, currentYear, true]);
      console.log('  ✅ Created default academic year');
    } catch (error: any) {
      console.log(`  ℹ️  Academic year: ${error.message}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ ✅ ✅ Comprehensive migration completed successfully! ✅ ✅ ✅\n');
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Only run if called directly
if (require.main === module) {
  runComprehensiveMigration()
    .then(() => {
      console.log('Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default runComprehensiveMigration;
