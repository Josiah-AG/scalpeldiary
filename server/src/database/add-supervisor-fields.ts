import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const addSupervisorFields = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Adding institution and specialty fields to users table...');

    // Add institution column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS institution VARCHAR(255)
    `);

    // Add specialty column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS specialty VARCHAR(255)
    `);

    await client.query('COMMIT');
    
    console.log('✅ Successfully added institution and specialty fields');
    console.log('\nNew fields:');
    console.log('  - institution (VARCHAR 255)');
    console.log('  - specialty (VARCHAR 255)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add fields:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addSupervisorFields();
