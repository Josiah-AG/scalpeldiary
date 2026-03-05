import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { query } from './database/db';

async function testConnection() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('Testing database connection...');
    
    const result = await query('SELECT COUNT(*) FROM users');
    console.log('✅ Database connected successfully!');
    console.log('Users count:', result.rows[0].count);
    
    const users = await query('SELECT email, role FROM users');
    console.log('\nUsers in database:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
