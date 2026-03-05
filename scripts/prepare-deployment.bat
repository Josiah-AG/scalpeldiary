@echo off
REM ScalpelDiary Deployment Preparation Script (Windows)

echo.
echo ================================
echo ScalpelDiary Deployment Preparation
echo ================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo [ERROR] Git repository not initialized
    echo Run: git init
    exit /b 1
)

echo [OK] Git repository found

REM Check for .env files
echo.
echo Checking environment files...

if not exist ".env" (
    echo [WARNING] .env file not found (backend)
    echo Copy from: copy server\.env.example .env
)

if not exist "client\.env.production" (
    echo [WARNING] client\.env.production not found
    echo Copy from: copy client\.env.example client\.env.production
    echo Then update VITE_API_URL with your Railway URL
)

REM Check Node.js version
echo.
echo Checking Node.js version...
node -v
if errorlevel 1 (
    echo [ERROR] Node.js not found
    exit /b 1
)

REM Check dependencies
echo.
echo Checking dependencies...

if not exist "server\node_modules" (
    echo [WARNING] Backend dependencies not installed
    echo Run: cd server ^&^& npm install
) else (
    echo [OK] Backend dependencies installed
)

if not exist "client\node_modules" (
    echo [WARNING] Frontend dependencies not installed
    echo Run: cd client ^&^& npm install
) else (
    echo [OK] Frontend dependencies installed
)

REM Summary
echo.
echo ================================
echo Next Steps:
echo ================================
echo.
echo 1. Review DEPLOYMENT_GUIDE.md
echo 2. Set up AWS S3 bucket
echo 3. Deploy backend to Railway
echo 4. Update client\.env.production with Railway URL
echo 5. Deploy frontend to Cloudflare Pages
echo 6. Run database migrations
echo 7. Test the application
echo.
echo For detailed instructions, see: DEPLOYMENT_GUIDE.md
echo.

pause
