@echo off
REM Quick Setup Script for Repair Dashboard (Windows)
REM Run: QUICK_SETUP_WINDOWS.bat

echo.
echo ================================
echo Repair Dashboard - Quick Setup
echo ================================
echo.

REM Check Node version
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo Node.js detected
node -v
echo npm detected
npm -v
echo.

REM Step 1: Install dependencies
echo Step 1/5: Installing dependencies...
echo This may take 2-3 minutes...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed
echo.

REM Step 2: Setup environment
echo Step 2/5: Setting up environment...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo Created .env file from .env.example
        echo Please edit .env and update DATABASE_URL if needed
    ) else (
        echo DATABASE_URL="file:./prisma/dev.db" > .env
        echo Created basic .env file
    )
) else (
    echo .env already exists, skipping...
)
echo.

REM Step 3: Generate Prisma Client
echo Step 3/5: Generating Prisma Client...
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo Prisma Client generated
echo.

REM Step 4: Create database
echo Step 4/5: Creating database...
call npm run db:push
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)
echo Database created
echo.

REM Step 5: Seed database
echo Step 5/5: Seeding database with sample data...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to seed database
    echo You may need to run: npm run db:seed manually
)
echo Database seeded
echo.

REM Success message
echo ================================
echo Setup Complete!
echo ================================
echo.
echo To start the development server:
echo    npm run dev
echo.
echo Then visit:
echo    http://localhost:3000
echo.
echo To browse the database:
echo    npm run db:studio
echo.
echo For more information, see:
echo    - README.md
echo    - SETUP_GUIDE.md
echo    - DASHBOARD_STATUS_AND_UPGRADE_PLAN.md
echo.
echo Happy coding!
echo.
pause
