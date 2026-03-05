#!/bin/bash

# ScalpelDiary Deployment Preparation Script

echo "🚀 ScalpelDiary Deployment Preparation"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

echo "✅ Git repository found"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes"
    echo "Commit them before deployment:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo ""
fi

# Check if .env files exist
echo ""
echo "📝 Checking environment files..."

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found (backend)"
    echo "Copy from: cp server/.env.example .env"
fi

if [ ! -f "client/.env.production" ]; then
    echo "⚠️  client/.env.production not found"
    echo "Copy from: cp client/.env.example client/.env.production"
    echo "Then update VITE_API_URL with your Railway URL"
fi

# Check Node.js version
echo ""
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version should be 18 or higher"
    echo "Current version: $(node -v)"
else
    echo "✅ Node.js version: $(node -v)"
fi

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."

if [ ! -d "server/node_modules" ]; then
    echo "⚠️  Backend dependencies not installed"
    echo "Run: cd server && npm install"
else
    echo "✅ Backend dependencies installed"
fi

if [ ! -d "client/node_modules" ]; then
    echo "⚠️  Frontend dependencies not installed"
    echo "Run: cd client && npm install"
else
    echo "✅ Frontend dependencies installed"
fi

# Test builds
echo ""
echo "🔨 Testing builds..."

echo "Building backend..."
cd server
if npm run build > /dev/null 2>&1; then
    echo "✅ Backend builds successfully"
else
    echo "❌ Backend build failed"
    echo "Run: cd server && npm run build"
fi
cd ..

echo "Building frontend..."
cd client
if npm run build > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed"
    echo "Run: cd client && npm run build"
fi
cd ..

# Summary
echo ""
echo "======================================"
echo "📋 Next Steps:"
echo "======================================"
echo ""
echo "1. Review DEPLOYMENT_GUIDE.md"
echo "2. Set up AWS S3 bucket"
echo "3. Deploy backend to Railway"
echo "4. Update client/.env.production with Railway URL"
echo "5. Deploy frontend to Cloudflare Pages"
echo "6. Run database migrations"
echo "7. Test the application"
echo ""
echo "For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
