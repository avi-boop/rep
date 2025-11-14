#!/bin/bash
# Quick Setup Script for Repair Dashboard
# Run: bash QUICK_SETUP.sh

set -e  # Exit on error

echo "🚀 Repair Dashboard - Quick Setup"
echo "=================================="
echo ""

# Check Node version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version is too old. Please upgrade to Node.js 18+."
    echo "   Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/5: Installing dependencies..."
echo "This may take 2-3 minutes..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Setup environment
echo "⚙️  Step 2/5: Setting up environment..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        # Use SQLite for quick setup
        sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL="file:./prisma/dev.db"|' .env
        echo "✅ Created .env file (using SQLite)"
    else
        echo "⚠️  .env.example not found. Creating basic .env..."
        echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
        echo "✅ Created basic .env file"
    fi
else
    echo "⚠️  .env already exists, skipping..."
fi
echo ""

# Step 3: Generate Prisma Client
echo "🔧 Step 3/5: Generating Prisma Client..."
npm run db:generate
echo "✅ Prisma Client generated"
echo ""

# Step 4: Create database
echo "🗄️  Step 4/5: Creating database..."
npm run db:push
echo "✅ Database created"
echo ""

# Step 5: Seed database
echo "🌱 Step 5/5: Seeding database with sample data..."
npm run db:seed
echo "✅ Database seeded"
echo ""

# Success message
echo "=================================="
echo "✅ Setup Complete! 🎉"
echo "=================================="
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📖 Then visit:"
echo "   http://localhost:3000"
echo ""
echo "🔍 To browse the database:"
echo "   npm run db:studio"
echo ""
echo "📚 For more information, see:"
echo "   - README.md"
echo "   - SETUP_GUIDE.md"
echo "   - DASHBOARD_STATUS_AND_UPGRADE_PLAN.md"
echo ""
echo "Happy coding! 💻"
