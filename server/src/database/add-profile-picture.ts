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

const addProfilePicture = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add profile_picture column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture TEXT
    `);

    await client.query('COMMIT');
    console.log('Profile picture column added successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to add profile picture column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addProfilePicture();
