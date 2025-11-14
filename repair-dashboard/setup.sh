#!/bin/bash
set -e

echo "🚀 Repair Dashboard Setup Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"
echo ""

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"
echo ""

# Create .env file if it doesn't exist
echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="file:./prisma/dev.db"

# Authentication (Change in production!)
NEXTAUTH_SECRET="development-secret-please-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Twilio SMS (Optional - Add your credentials)
# TWILIO_ACCOUNT_SID="your_twilio_sid"
# TWILIO_AUTH_TOKEN="your_twilio_token"
# TWILIO_PHONE_NUMBER="+1234567890"

# SendGrid Email (Optional - Add your credentials)
# SENDGRID_API_KEY="your_sendgrid_key"
# FROM_EMAIL="noreply@yourshop.com"

# Lightspeed POS (Optional - Add your credentials)
# LIGHTSPEED_API_KEY="your_lightspeed_key"
# LIGHTSPEED_ACCOUNT_ID="your_account_id"
# LIGHTSPEED_API_URL="https://api.lightspeedapp.com"
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies (this may take a few minutes)..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Setup Prisma
echo "🔧 Generating Prisma client..."
npm run db:generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Push database schema
echo "💾 Setting up database schema..."
npm run db:push
echo -e "${GREEN}✅ Database schema created${NC}"
echo ""

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Optional: Build the project
echo "🏗️  Building project..."
npm run build
echo -e "${GREEN}✅ Project built successfully${NC}"
echo ""

# Success message
echo ""
echo "============================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "============================================"
echo ""
echo "🎉 Your repair dashboard is ready!"
echo ""
echo "📋 Next steps:"
echo "  1. Start the development server:"
echo -e "     ${YELLOW}npm run dev${NC}"
echo ""
echo "  2. Open your browser and visit:"
echo -e "     ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "  3. Explore the dashboard features:"
echo "     • Main Dashboard"
echo "     • Repairs Management"
echo "     • Customer Management"
echo "     • Pricing Matrix"
echo "     • Analytics"
echo ""
echo "📚 Additional commands:"
echo -e "  ${YELLOW}npm run db:studio${NC}  - Open Prisma Studio (database GUI)"
echo -e "  ${YELLOW}npm run lint${NC}       - Check code quality"
echo -e "  ${YELLOW}npm run build${NC}      - Build for production"
echo ""
echo "📖 Documentation:"
echo "  • README.md - Project overview"
echo "  • SETUP_GUIDE.md - Detailed setup guide"
echo "  • PROJECT_STATUS.md - Current status"
echo ""
echo "⚠️  Important Notes:"
echo "  • Using SQLite for development (file-based database)"
echo "  • For production, use PostgreSQL"
echo "  • Change NEXTAUTH_SECRET in production"
echo "  • Add SMS/Email credentials for notifications"
echo ""
echo "🆘 Need help?"
echo "  • Check README.md for troubleshooting"
echo "  • Review logs if you encounter errors"
echo "  • Open Prisma Studio to inspect database"
echo ""
echo "Happy coding! 🚀"
echo ""
