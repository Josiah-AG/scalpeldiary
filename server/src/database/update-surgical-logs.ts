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

const updateSurgicalLogsTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add missing columns to surgical_logs table
    await client.query(`
      ALTER TABLE surgical_logs 
      ADD COLUMN IF NOT EXISTS procedure_category VARCHAR(100) DEFAULT 'MINOR',
      ADD COLUMN IF NOT EXISTS remark TEXT
    `);

    // Add profile_picture column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture TEXT,
      ADD COLUMN IF NOT EXISTS institution VARCHAR(255),
      ADD COLUMN IF NOT EXISTS specialty VARCHAR(255)
    `);

    await client.query('COMMIT');
    console.log('Database tables updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

updateSurgicalLogsTable();
