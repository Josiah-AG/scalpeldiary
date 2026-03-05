#!/bin/bash

# Script to fix production database by adding missing columns
# Run this on Railway or locally with production DATABASE_URL

echo "🔧 Fixing production database..."
echo "⚠️  Make sure DATABASE_URL is set to production database"
echo ""

# Compile TypeScript
echo "📦 Compiling TypeScript..."
npm run build

# Run migration
echo "🚀 Running migration to add missing columns..."
node dist/database/add-missing-columns.js

echo ""
echo "✅ Migration complete!"
echo "🔄 Please restart your Railway service for changes to take effect"
