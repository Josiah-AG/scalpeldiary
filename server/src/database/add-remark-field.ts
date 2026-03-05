import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const addRemarkField = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Adding remark field to surgical_logs table...');

    // Add remark column
    await client.query(`
      ALTER TABLE surgical_logs 
      ADD COLUMN IF NOT EXISTS remark TEXT
    `);

    await client.query('COMMIT');
    
    console.log('✅ Successfully added remark field');
    console.log('\nNew field:');
    console.log('  - remark (TEXT) - Optional notes/remarks for the procedure');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add field:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addRemarkField();
