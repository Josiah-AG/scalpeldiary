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

const updateSchema = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add procedure_category to surgical_logs
    await client.query(`
      ALTER TABLE surgical_logs 
      ADD COLUMN IF NOT EXISTS procedure_category VARCHAR(50) DEFAULT 'MINOR'
    `);

    // Add is_senior to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_senior BOOLEAN DEFAULT FALSE
    `);

    // Update presentations table to add rating
    await client.query(`
      ALTER TABLE presentations 
      ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS rating INTEGER,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP
    `);

    // Update presentation_type enum values
    await client.query(`
      ALTER TABLE presentations 
      ALTER COLUMN presentation_type TYPE VARCHAR(100)
    `);

    await client.query('COMMIT');
    console.log('Schema updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schema update failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

updateSchema();
