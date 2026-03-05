import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get master credentials from environment variables
    const masterEmail = process.env.MASTER_EMAIL || 'master@scalpeldiary.com';
    const masterPassword = process.env.MASTER_PASSWORD || 'password123';
    const masterName = process.env.MASTER_NAME || 'Master Admin';

    console.log(`Creating master account with email: ${masterEmail}`);
    
    const hashedMasterPassword = await bcrypt.hash(masterPassword, 10);
    const hashedDefaultPassword = await bcrypt.hash('password123', 10);

    // Create master account with environment variables
    const masterResult = await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE 
       SET password = $2, name = $3
       RETURNING id`,
      [masterEmail, hashedMasterPassword, masterName, 'MASTER']
    );

    console.log('✅ Master account created/updated successfully');

    // Create supervisor accounts (optional, for testing)
    if (process.env.CREATE_TEST_ACCOUNTS === 'true') {
      await client.query(
        `INSERT INTO users (email, password, name, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO NOTHING`,
        ['supervisor1@scalpeldiary.com', hashedDefaultPassword, 'Dr. John Smith', 'SUPERVISOR']
      );

      await client.query(
        `INSERT INTO users (email, password, name, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO NOTHING`,
        ['supervisor2@scalpeldiary.com', hashedDefaultPassword, 'Dr. Sarah Johnson', 'SUPERVISOR']
      );

      // Create resident account
      const residentResult = await client.query(
        `INSERT INTO users (email, password, name, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        ['resident@scalpeldiary.com', hashedDefaultPassword, 'Dr. Alex Brown', 'RESIDENT']
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

      console.log('✅ Test accounts created');
      console.log('Supervisor: supervisor1@scalpeldiary.com / password123');
      console.log('Resident: resident@scalpeldiary.com / password123');
    }

    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully');
    console.log(`\nMaster Account:`);
    console.log(`Email: ${masterEmail}`);
    console.log(`Password: ${masterPassword === 'password123' ? 'password123 (default - CHANGE THIS!)' : '[set from environment]'}`);
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
