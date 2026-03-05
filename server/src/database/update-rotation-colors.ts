import pool from './db';

// Predefined distinct colors
const distinctColors = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#A855F7', // Violet
];

async function updateColors() {
  try {
    console.log('Updating rotation category colors...');
    
    // Get all rotation categories
    const result = await pool.query('SELECT id, name FROM rotation_categories ORDER BY id');
    const categories = result.rows;
    
    console.log(`Found ${categories.length} categories`);
    
    // Update each category with a distinct color
    for (let index = 0; index < categories.length; index++) {
      const category = categories[index];
      const colorIndex = index % distinctColors.length;
      const color = distinctColors[colorIndex];
      
      await pool.query('UPDATE rotation_categories SET color = $1 WHERE id = $2', [color, category.id]);
      console.log(`Updated "${category.name}" to color ${color}`);
    }
    
    console.log('✅ All rotation category colors updated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating colors:', error);
    process.exit(1);
  }
}

updateColors();
