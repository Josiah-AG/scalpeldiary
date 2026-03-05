import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'scalpeldiary',
  user: 'josiah-ag',
});

const addPresentationsTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Presentations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS presentations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
        year_id UUID REFERENCES resident_years(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        title VARCHAR(500) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        presentation_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index
    await client.query('CREATE INDEX IF NOT EXISTS idx_presentations_resident ON presentations(resident_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_presentations_year ON presentations(year_id)');

    await client.query('COMMIT');
    console.log('Presentations table created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create presentations table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addPresentationsTable();
