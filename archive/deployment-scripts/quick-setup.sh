#!/bin/bash
# ============================================================================
# MOBILE REPAIR SHOP DASHBOARD - QUICK SETUP SCRIPT
# ============================================================================
# Automated setup for local development
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# WELCOME
# ============================================================================
clear
print_header "🚀 Mobile Repair Shop Dashboard - Quick Setup"
echo "This script will set up your development environment automatically."
echo ""

# ============================================================================
# CHECK PREREQUISITES
# ============================================================================
print_header "📋 Step 1: Checking Prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js is not installed"
    print_info "Install from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION installed"
else
    print_error "npm is not installed"
    exit 1
fi

# Check PostgreSQL or Docker
HAS_POSTGRES=false
HAS_DOCKER=false

if command_exists psql; then
    POSTGRES_VERSION=$(psql --version | awk '{print $3}')
    print_success "PostgreSQL $POSTGRES_VERSION installed"
    HAS_POSTGRES=true
fi

if command_exists docker; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}')
    print_success "Docker $DOCKER_VERSION installed"
    HAS_DOCKER=true
fi

if [ "$HAS_POSTGRES" = false ] && [ "$HAS_DOCKER" = false ]; then
    print_error "Neither PostgreSQL nor Docker is installed"
    print_info "Install one of:"
    echo "  - PostgreSQL: https://www.postgresql.org/download/"
    echo "  - Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# ============================================================================
# CHOOSE IMPLEMENTATION
# ============================================================================
print_header "📦 Step 2: Choose Implementation"

echo "Available implementations:"
echo ""
echo "  1) repair-dashboard/  ⭐ RECOMMENDED"
echo "     Full-stack Next.js app with Prisma"
echo ""
echo "  2) app/"
echo "     Alternative Next.js implementation"
echo ""
echo "  3) backend/ + frontend/"
echo "     Separate Express.js API and Next.js frontend"
echo ""

read -p "Choose option (1, 2, or 3) [1]: " IMPL_CHOICE
IMPL_CHOICE=${IMPL_CHOICE:-1}

case $IMPL_CHOICE in
    1)
        PROJECT_DIR="repair-dashboard"
        print_success "Selected: repair-dashboard/ (Recommended)"
        ;;
    2)
        PROJECT_DIR="app"
        print_success "Selected: app/"
        ;;
    3)
        PROJECT_DIR="backend+frontend"
        print_success "Selected: backend/ + frontend/"
        ;;
    *)
        print_error "Invalid choice. Using default: repair-dashboard/"
        PROJECT_DIR="repair-dashboard"
        ;;
esac

# ============================================================================
# DATABASE SETUP
# ============================================================================
print_header "🗄️  Step 3: Database Setup"

DB_USER="repair_admin"
DB_PASS="repair123"
DB_NAME="repair_shop_db"
DB_HOST="localhost"
DB_PORT="5432"

echo "Choose database setup method:"
echo ""
echo "  1) Use existing PostgreSQL"
echo "  2) Start PostgreSQL with Docker"
echo "  3) I'll set up the database manually (skip)"
echo ""

read -p "Choose option (1, 2, or 3) [2]: " DB_CHOICE
DB_CHOICE=${DB_CHOICE:-2}

case $DB_CHOICE in
    1)
        if [ "$HAS_POSTGRES" = false ]; then
            print_error "PostgreSQL is not installed"
            exit 1
        fi
        
        print_info "Creating database..."
        
        # Try to create database
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
        
        print_success "Database setup complete"
        ;;
        
    2)
        if [ "$HAS_DOCKER" = false ]; then
            print_error "Docker is not installed"
            exit 1
        fi
        
        print_info "Starting PostgreSQL with Docker..."
        
        # Stop existing container if it exists
        docker stop repair-postgres 2>/dev/null || true
        docker rm repair-postgres 2>/dev/null || true
        
        # Start new container
        docker run --name repair-postgres \
            -e POSTGRES_PASSWORD=$DB_PASS \
            -e POSTGRES_USER=$DB_USER \
            -e POSTGRES_DB=$DB_NAME \
            -p $DB_PORT:5432 \
            -d postgres:15
        
        print_success "PostgreSQL container started"
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 5
        ;;
        
    3)
        print_warning "Skipping database setup"
        print_info "Make sure your database is ready before continuing"
        read -p "Enter database URL: " DB_URL
        ;;
esac

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# ============================================================================
# PROJECT SETUP
# ============================================================================
print_header "⚙️  Step 4: Project Setup"

if [ "$PROJECT_DIR" = "backend+frontend" ]; then
    # Setup backend
    print_info "Setting up backend..."
    cd backend
    
    print_info "Installing backend dependencies..."
    npm install
    
    print_info "Creating backend .env file..."
    cat > .env << EOF
DATABASE_URL="$DATABASE_URL"
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV=development
EOF
    
    print_info "Setting up database..."
    npm run prisma:generate
    npm run prisma:migrate
    npm run db:seed
    
    print_success "Backend setup complete"
    
    cd ..
    
    # Setup frontend
    print_info "Setting up frontend..."
    cd frontend
    
    print_info "Installing frontend dependencies..."
    npm install
    
    print_info "Creating frontend .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    
    print_success "Frontend setup complete"
    cd ..
    
else
    # Setup single app
    print_info "Setting up $PROJECT_DIR..."
    cd $PROJECT_DIR
    
    print_info "Installing dependencies (this may take a few minutes)..."
    npm install
    
    print_info "Creating .env file..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        touch .env
    fi
    
    # Generate secret
    NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    cat > .env << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# App
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"

# SMS (optional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Email (optional)
SENDGRID_API_KEY=""
FROM_EMAIL=""

# Lightspeed (optional)
LIGHTSPEED_API_KEY=""
LIGHTSPEED_ACCOUNT_ID=""
LIGHTSPEED_API_URL="https://api.lightspeedapp.com"
EOF
    
    print_success ".env file created"
    
    print_info "Setting up database schema..."
    if [ -f "package.json" ] && grep -q "db:generate" package.json; then
        npm run db:generate
    else
        npx prisma generate
    fi
    
    if [ -f "package.json" ] && grep -q "db:push" package.json; then
        npm run db:push
    else
        npx prisma db push
    fi
    
    print_info "Seeding database with sample data..."
    if [ -f "package.json" ] && grep -q "db:seed" package.json; then
        npm run db:seed
    fi
    
    print_success "Project setup complete"
    cd ..
fi

# ============================================================================
# COMPLETION
# ============================================================================
print_header "🎉 Setup Complete!"

echo "Your Mobile Repair Shop Dashboard is ready to run!"
echo ""

if [ "$PROJECT_DIR" = "backend+frontend" ]; then
    print_info "To start the application, open TWO terminals:"
    echo ""
    echo "  Terminal 1 - Backend:"
    echo "  ${BLUE}cd $(pwd)/backend && npm run dev${NC}"
    echo ""
    echo "  Terminal 2 - Frontend:"
    echo "  ${BLUE}cd $(pwd)/frontend && npm run dev${NC}"
    echo ""
    echo "Then open: ${GREEN}http://localhost:3000${NC}"
else
    print_info "To start the application, run:"
    echo ""
    echo "  ${BLUE}cd $(pwd)/$PROJECT_DIR && npm run dev${NC}"
    echo ""
    echo "Then open: ${GREEN}http://localhost:3000${NC}"
fi

echo ""
print_info "Additional commands:"
echo "  ${BLUE}npm run db:studio${NC}   - Open Prisma Studio (database GUI)"
echo "  ${BLUE}npm run build${NC}       - Build for production"
echo "  ${BLUE}npm run lint${NC}        - Check code quality"
echo ""

print_warning "Next steps:"
echo "  1. Start the development server (see commands above)"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Explore the dashboard"
echo "  4. Customize for your repair shop"
echo ""

print_info "Documentation:"
echo "  - LOCAL_SETUP_GUIDE.md  - Detailed setup instructions"
echo "  - README.md             - Project overview"
echo "  - QUICK_START_GUIDE.md  - Quick reference"
echo ""

print_success "Happy coding! 🔧📱✨"
echo ""
