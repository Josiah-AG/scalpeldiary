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

const updatePresentationsTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add missing columns to presentations table
    await client.query(`
      ALTER TABLE presentations 
      ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS rating INTEGER,
      ADD COLUMN IF NOT EXISTS comment TEXT,
      ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP
    `);

    // Create index for supervisor_id
    await client.query('CREATE INDEX IF NOT EXISTS idx_presentations_supervisor ON presentations(supervisor_id)');

    await client.query('COMMIT');
    console.log('Presentations table updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update presentations table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

updatePresentationsTable();
