import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'scalpeldiary',
  user: 'josiah-ag',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
