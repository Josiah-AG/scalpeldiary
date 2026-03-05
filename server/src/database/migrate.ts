import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Resident years table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resident_years (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(resident_id, year)
      )
    `);

    // Surgical logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS surgical_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
        year_id UUID REFERENCES resident_years(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        mrn VARCHAR(100) NOT NULL,
        age INTEGER NOT NULL,
        sex VARCHAR(10) NOT NULL,
        diagnosis TEXT NOT NULL,
        procedure TEXT NOT NULL,
        procedure_type VARCHAR(50) NOT NULL,
        place_of_practice VARCHAR(50) NOT NULL,
        surgery_role VARCHAR(50) NOT NULL,
        supervisor_id UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'PENDING',
        rating INTEGER,
        comment TEXT,
        rated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        log_id UUID REFERENCES surgical_logs(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_logs_resident ON surgical_logs(resident_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_logs_supervisor ON surgical_logs(supervisor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_logs_year ON surgical_logs(year_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');

    await client.query('COMMIT');
    console.log('Database migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables();
