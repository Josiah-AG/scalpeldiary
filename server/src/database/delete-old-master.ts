import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import pool from './db';

const deleteOldMaster = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Deleting old master account...');
    
    const oldMasterEmail = 'master@scalpeldiary.com';
    const newMasterEmail = process.env.MASTER_EMAIL;

    // Only delete if the new master email is different
    if (newMasterEmail && newMasterEmail !== oldMasterEmail) {
      const result = await client.query(
        'DELETE FROM users WHERE email = $1 AND role = $2 RETURNING email',
        [oldMasterEmail, 'MASTER']
      );

      if (result.rows.length > 0) {
        console.log(`✅ Deleted old master account: ${oldMasterEmail}`);
      } else {
        console.log(`ℹ️  Old master account not found or already deleted`);
      }
    } else {
      console.log('ℹ️  New master email is the same as old one, nothing to delete');
    }

    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

deleteOldMaster();
