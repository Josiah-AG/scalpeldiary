import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';
import bcrypt from 'bcryptjs';

const addSupervisors = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Check existing supervisors
    const existingResult = await client.query(
      `SELECT id, email, name FROM users WHERE role = 'SUPERVISOR'`
    );

    console.log(`Found ${existingResult.rows.length} existing supervisors:`);
    existingResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.email})`);
    });

    // Create supervisor accounts if they don't exist
    const supervisor1 = await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET role = 'SUPERVISOR'
       RETURNING id, email, name`,
      ['supervisor1@scalpeldiary.com', hashedPassword, 'Dr. John Smith', 'SUPERVISOR']
    );

    const supervisor2 = await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET role = 'SUPERVISOR'
       RETURNING id, email, name`,
      ['supervisor2@scalpeldiary.com', hashedPassword, 'Dr. Sarah Johnson', 'SUPERVISOR']
    );

    await client.query('COMMIT');
    
    console.log('\n✅ Supervisors added/updated successfully:');
    console.log(`  - ${supervisor1.rows[0].name} (${supervisor1.rows[0].email})`);
    console.log(`  - ${supervisor2.rows[0].name} (${supervisor2.rows[0].email})`);
    console.log('\nDefault password: password123');
    
    // Verify
    const verifyResult = await client.query(
      `SELECT id, email, name FROM users WHERE role = 'SUPERVISOR'`
    );
    console.log(`\nTotal supervisors in database: ${verifyResult.rows.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add supervisors:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addSupervisors();
