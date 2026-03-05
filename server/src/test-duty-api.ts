import pool from './database/db';

async function testDutyCategories() {
  try {
    console.log('Testing duty categories query...\n');
    
    const result = await pool.query(
      'SELECT * FROM duty_categories WHERE is_active = true ORDER BY display_order, name'
    );
    
    console.log(`Found ${result.rows.length} duty categories:`);
    result.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.color || 'NO COLOR'}`);
    });
    
    console.log('\n✅ Query successful!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    process.exit(1);
  }
}

testDutyCategories();
