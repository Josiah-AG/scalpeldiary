#!/bin/bash

echo "🏥 ScalpelDiary Setup Script"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v14 or higher."
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
echo "✅ Dependencies installed"
echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
    echo ""
fi

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Create PostgreSQL database: createdb scalpeldiary"
echo "3. Run migrations: npm run db:migrate"
echo "4. Seed database: npm run db:seed"
echo "5. Start backend: npm run dev:server"
echo "6. Start frontend: npm run dev:client"
echo ""
echo "For detailed instructions, see INSTALLATION.md"
