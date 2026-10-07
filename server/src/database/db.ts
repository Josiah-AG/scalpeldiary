import { Pool, types } from 'pg';
types.setTypeParser(1082, value => value);
import dotenv from 'dotenv';
import { transactionContext } from './transaction';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const query = (text: string, params?: any[]) => (transactionContext.getStore() || pool).query(text, params);

export default pool;
