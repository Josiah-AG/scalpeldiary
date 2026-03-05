import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const addMissingColumns = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Starting to add missing columns to users table...');
    
    await client.query('BEGIN');

    // Add institution column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS institution VARCHAR(255)
      `);
      console.log('✅ Added institution column');
    } catch (error: any) {
      if (error.code !== '42701') throw error; // Ignore if column exists
      console.log('ℹ️  institution column already exists');
    }

    // Add specialty column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS specialty VARCHAR(255)
      `);
      console.log('✅ Added specialty column');
    } catch (error: any) {
      if (error.code !== '42701') throw error;
      console.log('ℹ️  specialty column already exists');
    }

    // Add profile_picture column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS profile_picture TEXT
      `);
      console.log('✅ Added profile_picture column');
    } catch (error: any) {
      if (error.code !== '42701') throw error;
      console.log('ℹ️  profile_picture column already exists');
    }


    // Add is_suspended column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_suspended column');
    } catch (error: any) {
      if (error.code !== '42701') throw error;
      console.log('ℹ️  is_suspended column already exists');
    }

    // Add has_management_access column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS has_management_access BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added has_management_access column');
    } catch (error: any) {
      if (error.code !== '42701') throw error;
      console.log('ℹ️  has_management_access column already exists');
    }

    // Add is_chief_resident column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_chief_resident BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_chief_resident column');
    } catch (error: any) {
      if (error.code !== '42701') throw error;
      console.log('ℹ️  is_chief_resident column already exists');
    }

    // Add is_senior column
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_senior BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_senior column');
    } catch (error: any) {
      if (error.code !== '42701') throw error;
      console.log('ℹ️  is_senior column already exists');
    }

    await client.query('COMMIT');
    console.log('✅ All missing columns added successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addMissingColumns();
