import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create master account
    const masterResult = await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['master@scalpeldiary.com', hashedPassword, 'Master Admin', 'MASTER']
    );

    // Create supervisor accounts
    await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['supervisor1@scalpeldiary.com', hashedPassword, 'Dr. John Smith', 'SUPERVISOR']
    );

    await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['supervisor2@scalpeldiary.com', hashedPassword, 'Dr. Sarah Johnson', 'SUPERVISOR']
    );

    // Create resident account
    const residentResult = await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['resident@scalpeldiary.com', hashedPassword, 'Dr. Alex Brown', 'RESIDENT']
    );

    // Create year accounts for resident
    if (residentResult.rows.length > 0) {
      const residentId = residentResult.rows[0].id;
      await client.query(
        `INSERT INTO resident_years (resident_id, year) 
         VALUES ($1, $2) 
         ON CONFLICT (resident_id, year) DO NOTHING`,
        [residentId, 1]
      );
      await client.query(
        `INSERT INTO resident_years (resident_id, year) 
         VALUES ($1, $2) 
         ON CONFLICT (resident_id, year) DO NOTHING`,
        [residentId, 2]
      );
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully');
    console.log('Default accounts:');
    console.log('Master: master@scalpeldiary.com / password123');
    console.log('Supervisor: supervisor1@scalpeldiary.com / password123');
    console.log('Resident: resident@scalpeldiary.com / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase();
