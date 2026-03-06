import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { fixScheduledDateNullable } from '../database/fix-scheduled-date-nullable';
import runComprehensiveMigration from '../database/comprehensive-migration';

const router = Router();

// ============================================
// COMPREHENSIVE MIGRATION - Run ALL migrations at once
// ============================================
router.post('/run-comprehensive', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can run migrations' });
  }

  try {
    console.log('🚀 Starting comprehensive database migration via API...');
    
    const result = await runComprehensiveMigration();
    
    console.log('✅ Comprehensive migration completed successfully');
    
    res.json({ 
      success: true, 
      message: 'Comprehensive migration completed successfully! All database tables and columns are now up to date.',
      details: result
    });
  } catch (error: any) {
    console.error('❌ Comprehensive migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Migration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check comprehensive migration status
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can check migration status' });
  }

  try {
    const checks = {
      user_columns: false,
      presentations_table: false,
      push_subscriptions_table: false,
      chief_resident_tables: false,
      surgical_logs_columns: false
    };

    // Check user columns
    try {
      await query('SELECT is_chief_resident, institution, specialty, profile_picture, is_suspended, has_management_access, is_senior FROM users LIMIT 1');
      checks.user_columns = true;
    } catch (e) {}

    // Check presentations table
    try {
      await query('SELECT 1 FROM presentations LIMIT 1');
      checks.presentations_table = true;
    } catch (e) {}

    // Check push_subscriptions table
    try {
      await query('SELECT 1 FROM push_subscriptions LIMIT 1');
      checks.push_subscriptions_table = true;
    } catch (e) {}

    // Check chief resident tables
    try {
      await query('SELECT 1 FROM rotation_categories LIMIT 1');
      await query('SELECT 1 FROM academic_years LIMIT 1');
      await query('SELECT 1 FROM yearly_rotations LIMIT 1');
      await query('SELECT 1 FROM duty_categories LIMIT 1');
      await query('SELECT 1 FROM monthly_duties LIMIT 1');
      await query('SELECT 1 FROM activity_categories LIMIT 1');
      await query('SELECT 1 FROM daily_activities LIMIT 1');
      await query('SELECT 1 FROM presentation_assignments LIMIT 1');
      checks.chief_resident_tables = true;
    } catch (e) {}

    // Check surgical_logs columns
    try {
      await query('SELECT procedure_category, remark FROM surgical_logs LIMIT 1');
      checks.surgical_logs_columns = true;
    } catch (e) {}

    const allComplete = Object.values(checks).every(v => v);

    res.json({
      status: allComplete ? 'complete' : 'incomplete',
      checks,
      message: allComplete 
        ? 'All migrations are complete' 
        : 'Some migrations are missing. Click "Run Comprehensive Migration" to update the database.',
      needsMigration: !allComplete
    });
  } catch (error: any) {
    console.error('Status check failed:', error);
    res.status(500).json({ 
      error: 'Failed to check migration status',
      details: error.message
    });
  }
});

// Run Chief Resident migration (Master only)
router.post('/run-chief-resident-migration', authenticate, async (req: AuthRequest, res) => {
  // Check if user is Master
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can run migrations' });
  }

  const results: string[] = [];
  const errors: string[] = [];

  try {
    console.log('Starting Chief Resident migration...');

    // Add is_chief_resident column
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_chief_resident BOOLEAN DEFAULT FALSE
      `);
      results.push('✓ Added is_chief_resident column');
      console.log('✓ Added is_chief_resident column');
    } catch (error: any) {
      const msg = `Error adding is_chief_resident column: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create rotation_categories table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS rotation_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push('✓ Created rotation_categories table');
      console.log('✓ Created rotation_categories table');
    } catch (error: any) {
      const msg = `Error creating rotation_categories table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create academic_years table
    try {
      await query(`
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
      results.push('✓ Created academic_years table');
      console.log('✓ Created academic_years table');
    } catch (error: any) {
      const msg = `Error creating academic_years table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create yearly_rotations table
    try {
      await query(`
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
      results.push('✓ Created yearly_rotations table');
      console.log('✓ Created yearly_rotations table');
    } catch (error: any) {
      const msg = `Error creating yearly_rotations table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create duty_categories table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS duty_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push('✓ Created duty_categories table');
      console.log('✓ Created duty_categories table');
    } catch (error: any) {
      const msg = `Error creating duty_categories table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create monthly_duties table
    try {
      await query(`
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
      results.push('✓ Created monthly_duties table');
      console.log('✓ Created monthly_duties table');
    } catch (error: any) {
      const msg = `Error creating monthly_duties table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create activity_categories table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS activity_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push('✓ Created activity_categories table');
      console.log('✓ Created activity_categories table');
    } catch (error: any) {
      const msg = `Error creating activity_categories table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create daily_activities table
    try {
      await query(`
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
      results.push('✓ Created daily_activities table');
      console.log('✓ Created daily_activities table');
    } catch (error: any) {
      const msg = `Error creating daily_activities table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    // Create presentation_assignments table
    try {
      await query(`
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
      results.push('✓ Created presentation_assignments table');
      console.log('✓ Created presentation_assignments table');
    } catch (error: any) {
      const msg = `Error creating presentation_assignments table: ${error.message}`;
      errors.push(msg);
      console.error(msg);
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
        await query(index.sql);
        results.push(`✓ Created ${index.name}`);
        console.log(`✓ Created ${index.name}`);
      } catch (error: any) {
        const msg = `Error creating ${index.name}: ${error.message}`;
        errors.push(msg);
        console.error(msg);
      }
    }

    // Insert default rotation categories
    const rotationCategories = [
      'GS @ Y12HMC', 'GS @ ALERT', 'OPD', 'Anesthesia', 'Plastic Surgery',
      'ICU', 'Orthopedics', 'Cardiothoracic', 'Neurosurgery', 'Oncology',
      'OBGYN', 'Radiology', 'Urology', 'Pediatric Surgery', 'Month Off'
    ];

    for (let i = 0; i < rotationCategories.length; i++) {
      try {
        await query(`
          INSERT INTO rotation_categories (name, display_order)
          VALUES ($1, $2)
          ON CONFLICT (name) DO NOTHING
        `, [rotationCategories[i], i + 1]);
      } catch (error: any) {
        console.error(`Error inserting rotation category ${rotationCategories[i]}:`, error.message);
      }
    }
    results.push('✓ Inserted rotation categories');
    console.log('✓ Inserted rotation categories');

    // Insert default duty categories
    const dutyCategories = ['EOPD', 'ICU', 'Ward', 'Senior Resident', 'Consultation'];
    
    for (let i = 0; i < dutyCategories.length; i++) {
      try {
        await query(`
          INSERT INTO duty_categories (name, display_order)
          VALUES ($1, $2)
          ON CONFLICT (name) DO NOTHING
        `, [dutyCategories[i], i + 1]);
      } catch (error: any) {
        console.error(`Error inserting duty category ${dutyCategories[i]}:`, error.message);
      }
    }
    results.push('✓ Inserted duty categories');
    console.log('✓ Inserted duty categories');

    // Insert default activity categories
    const activityCategories = ['OPD', 'OR', 'Round', 'Minor OR'];
    
    for (let i = 0; i < activityCategories.length; i++) {
      try {
        await query(`
          INSERT INTO activity_categories (name, display_order)
          VALUES ($1, $2)
          ON CONFLICT (name) DO NOTHING
        `, [activityCategories[i], i + 1]);
      } catch (error: any) {
        console.error(`Error inserting activity category ${activityCategories[i]}:`, error.message);
      }
    }
    results.push('✓ Inserted activity categories');
    console.log('✓ Inserted activity categories');

    // Create default academic year
    try {
      const currentYear = new Date().getFullYear();
      await query(`
        INSERT INTO academic_years (year_name, start_month, start_year, is_active)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE year_name = $1)
      `, [`${currentYear}-${currentYear + 1}`, 7, currentYear, true]);
      results.push('✓ Created default academic year');
      console.log('✓ Created default academic year');
    } catch (error: any) {
      const msg = `Error creating academic year: ${error.message}`;
      errors.push(msg);
      console.error(msg);
    }

    res.json({ 
      success: true, 
      message: 'Chief Resident migration completed!',
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Migration failed', 
      details: error.message,
      results,
      errors,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check migration status
router.get('/check-chief-resident-migration', authenticate, async (req: AuthRequest, res) => {
  // Check if user is Master
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can check migration status' });
  }

  try {
    const checks: any = {
      is_chief_resident_column: false,
      rotation_categories_table: false,
      academic_years_table: false,
      yearly_rotations_table: false,
      duty_categories_table: false,
      monthly_duties_table: false,
      activity_categories_table: false,
      daily_activities_table: false,
      presentation_assignments_table: false,
      rotation_categories_count: 0,
      duty_categories_count: 0,
      activity_categories_count: 0,
      academic_years_count: 0
    };

    // Check if is_chief_resident column exists
    try {
      await query(`SELECT is_chief_resident FROM users LIMIT 1`);
      checks.is_chief_resident_column = true;
    } catch (e) {
      // Column doesn't exist
    }

    // Check tables
    const tableChecks = [
      { name: 'rotation_categories', key: 'rotation_categories_table' },
      { name: 'academic_years', key: 'academic_years_table' },
      { name: 'yearly_rotations', key: 'yearly_rotations_table' },
      { name: 'duty_categories', key: 'duty_categories_table' },
      { name: 'monthly_duties', key: 'monthly_duties_table' },
      { name: 'activity_categories', key: 'activity_categories_table' },
      { name: 'daily_activities', key: 'daily_activities_table' },
      { name: 'presentation_assignments', key: 'presentation_assignments_table' }
    ];

    for (const check of tableChecks) {
      try {
        const result = await query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [check.name]
        );
        checks[check.key as keyof typeof checks] = result.rows[0].exists;
      } catch (e) {
        // Table doesn't exist
      }
    }

    // Count records
    if (checks.rotation_categories_table) {
      const result = await query('SELECT COUNT(*) FROM rotation_categories');
      checks.rotation_categories_count = parseInt(result.rows[0].count);
    }

    if (checks.duty_categories_table) {
      const result = await query('SELECT COUNT(*) FROM duty_categories');
      checks.duty_categories_count = parseInt(result.rows[0].count);
    }

    if (checks.activity_categories_table) {
      const result = await query('SELECT COUNT(*) FROM activity_categories');
      checks.activity_categories_count = parseInt(result.rows[0].count);
    }

    if (checks.academic_years_table) {
      const result = await query('SELECT COUNT(*) FROM academic_years');
      checks.academic_years_count = parseInt(result.rows[0].count);
    }

    const allTablesExist = 
      checks.is_chief_resident_column &&
      checks.rotation_categories_table &&
      checks.academic_years_table &&
      checks.yearly_rotations_table &&
      checks.duty_categories_table &&
      checks.monthly_duties_table &&
      checks.activity_categories_table &&
      checks.daily_activities_table &&
      checks.presentation_assignments_table;

    res.json({
      migration_complete: allTablesExist,
      checks
    });
  } catch (error: any) {
    console.error('Check failed:', error);
    res.status(500).json({ 
      error: 'Failed to check migration status', 
      details: error.message 
    });
  }
});

// Run presentation assignments migration
router.post('/run-presentation-assignments-migration', authenticate, async (req: AuthRequest, res) => {
  // Check if user is Master
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can run migrations' });
  }

  try {
    const { updatePresentationAssignments } = await import('../database/update-presentation-assignments');
    const result = await updatePresentationAssignments();
    res.json(result);
  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

// Fix scheduled_date to be nullable
router.post('/fix-scheduled-date-nullable', authenticate, async (req: AuthRequest, res) => {
  // Check if user is Master
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can run migrations' });
  }

  try {
    const result = await fixScheduledDateNullable();
    res.json(result);
  } catch (error: any) {
    console.error('Fix failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Fix failed', 
      details: error.message 
    });
  }
});

// Add notification_type column to notifications table
router.post('/add-notification-type', authenticate, async (req: AuthRequest, res) => {
  // Check if user is Master
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can run migrations' });
  }

  try {
    console.log('Adding notification_type column to notifications table...');

    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'notification_type'
    `);

    if (checkColumn.rows.length === 0) {
      // Add notification_type column
      await query(`
        ALTER TABLE notifications 
        ADD COLUMN notification_type VARCHAR(20)
      `);
      console.log('✅ Added notification_type column');
      
      res.json({ 
        success: true, 
        message: 'Successfully added notification_type column to notifications table',
        alreadyExists: false
      });
    } else {
      console.log('✅ notification_type column already exists');
      
      res.json({ 
        success: true, 
        message: 'notification_type column already exists',
        alreadyExists: true
      });
    }
  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

// Run chief resident setup (add color columns and ensure academic year)
router.post('/setup-chief-resident', authenticate, async (req: AuthRequest, res) => {
  // Check if user is Master
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Only Master accounts can run setup' });
  }

  try {
    console.log('Running chief resident setup...');
    
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
    
    // Add color columns
    await query(`
      ALTER TABLE rotation_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6'
    `);
    console.log('✅ Added color to rotation_categories');
    
    await query(`
      ALTER TABLE duty_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10B981'
    `);
    console.log('✅ Added color to duty_categories');
    
    await query(`
      ALTER TABLE activity_categories 
      ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#F59E0B'
    `);
    console.log('✅ Added color to activity_categories');
    
    // Update rotation categories with distinct colors
    const rotationCats = await query('SELECT id, name FROM rotation_categories ORDER BY id');
    for (let i = 0; i < rotationCats.rows.length; i++) {
      const color = distinctColors[i % distinctColors.length];
      await query('UPDATE rotation_categories SET color = $1 WHERE id = $2', [color, rotationCats.rows[i].id]);
    }
    console.log(`✅ Updated ${rotationCats.rows.length} rotation categories with colors`);
    
    // Update duty categories with distinct colors
    const dutyCats = await query('SELECT id, name FROM duty_categories ORDER BY id');
    for (let i = 0; i < dutyCats.rows.length; i++) {
      const color = distinctColors[i % distinctColors.length];
      await query('UPDATE duty_categories SET color = $1 WHERE id = $2', [color, dutyCats.rows[i].id]);
    }
    console.log(`✅ Updated ${dutyCats.rows.length} duty categories with colors`);
    
    // Update activity categories with distinct colors
    const activityCats = await query('SELECT id, name FROM activity_categories ORDER BY id');
    for (let i = 0; i < activityCats.rows.length; i++) {
      const color = distinctColors[i % distinctColors.length];
      await query('UPDATE activity_categories SET color = $1 WHERE id = $2', [color, activityCats.rows[i].id]);
    }
    console.log(`✅ Updated ${activityCats.rows.length} activity categories with colors`);
    
    // Ensure active academic year exists
    const yearResult = await query('SELECT * FROM academic_years WHERE is_active = true');
    
    if (yearResult.rows.length === 0) {
      const currentYear = new Date().getFullYear();
      const academicYearName = `${currentYear}-${currentYear + 1}`;
      
      await query(`
        INSERT INTO academic_years (year_name, start_month, start_year, is_active)
        VALUES ($1, $2, $3, true)
      `, [academicYearName, 7, currentYear]);
      
      console.log(`✅ Created academic year: ${academicYearName}`);
    } else {
      console.log('✅ Academic year already exists');
    }
    
    res.json({ 
      success: true, 
      message: 'Chief resident system setup completed successfully',
      details: {
        rotation_categories: rotationCats.rows.length,
        duty_categories: dutyCats.rows.length,
        activity_categories: activityCats.rows.length
      }
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
