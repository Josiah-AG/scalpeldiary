import { query } from './db';

export async function updatePresentationAssignments() {
  console.log('🔄 Starting presentation assignments migration...');

  try {
    // Check if presentation_assignments table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'presentation_assignments'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating presentation_assignments table...');
      
      await query(`
        CREATE TABLE presentation_assignments (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          presenter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          scheduled_date DATE,
          description TEXT,
          status VARCHAR(50) DEFAULT 'assigned',
          presented_date DATE,
          presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ presentation_assignments table created');
    } else {
      console.log('✅ presentation_assignments table already exists');
      
      // Check and add missing columns if needed
      const columns = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'presentation_assignments';
      `);
      
      const columnNames = columns.rows.map(row => row.column_name);
      
      // Add status column if missing
      if (!columnNames.includes('status')) {
        console.log('Adding status column...');
        await query(`
          ALTER TABLE presentation_assignments 
          ADD COLUMN status VARCHAR(50) DEFAULT 'assigned';
        `);
        console.log('✅ status column added');
      }
      
      // Add presented_date column if missing
      if (!columnNames.includes('presented_date')) {
        console.log('Adding presented_date column...');
        await query(`
          ALTER TABLE presentation_assignments 
          ADD COLUMN presented_date DATE;
        `);
        console.log('✅ presented_date column added');
      }
      
      // Add presentation_id column if missing
      if (!columnNames.includes('presentation_id')) {
        console.log('Adding presentation_id column...');
        await query(`
          ALTER TABLE presentation_assignments 
          ADD COLUMN presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL;
        `);
        console.log('✅ presentation_id column added');
      }
      
      // Add created_by column if missing
      if (!columnNames.includes('created_by')) {
        console.log('Adding created_by column...');
        await query(`
          ALTER TABLE presentation_assignments 
          ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE CASCADE;
        `);
        console.log('✅ created_by column added');
      }
    }

    // Create indexes for better performance
    console.log('Creating indexes...');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_presentation_assignments_presenter 
      ON presentation_assignments(presenter_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_presentation_assignments_moderator 
      ON presentation_assignments(moderator_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_presentation_assignments_status 
      ON presentation_assignments(status);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_presentation_assignments_date 
      ON presentation_assignments(scheduled_date);
    `);
    
    console.log('✅ Indexes created');

    console.log('✅ Presentation assignments migration completed successfully!');
    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updatePresentationAssignments()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
