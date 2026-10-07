import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pool from './db';
async function main() {
 const client = await pool.connect();
 try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(872135)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory = path.resolve(process.cwd(), 'src/database/migrations');
  for (const name of fs.readdirSync(directory).filter(x => x.endsWith('.sql')).sort()) {
   const sql = fs.readFileSync(path.join(directory,name),'utf8');
   const checksum = crypto.createHash('sha256').update(sql).digest('hex');
   const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1',[name]);
   if (existing.rowCount) { if (existing.rows[0].checksum !== checksum) throw new Error('Applied migration checksum changed: '+name); continue; }
   await client.query(sql);
   await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[name,checksum]);
   console.log('Applied migration:', name);
  }
  await client.query('COMMIT');
 } catch (error) { await client.query('ROLLBACK'); throw error; }
 finally { client.release(); await pool.end(); }
}
main().catch(() => {console.error('Migration failed and rolled back'); process.exitCode=1;});
