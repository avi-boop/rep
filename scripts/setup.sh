#!/bin/bash
# setup.sh
# Initial setup script for Mobile Repair Shop Dashboard

set -e  # Exit on error

echo "🚀 Mobile Repair Shop Dashboard - Setup Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ==========================================
# 1. Check Prerequisites
# ==========================================
echo "Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed"
    print_info "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION is installed"
else
    print_error "npm is not installed"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    POSTGRES_VERSION=$(psql --version)
    print_success "PostgreSQL is installed: $POSTGRES_VERSION"
else
    print_warning "PostgreSQL is not installed or not in PATH"
    print_info "You can install it or use Docker Compose"
fi

# Check Docker (optional)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
    HAS_DOCKER=true
else
    print_warning "Docker is not installed (optional)"
    HAS_DOCKER=false
fi

# Check Docker Compose (optional)
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_success "Docker Compose is installed"
    HAS_DOCKER_COMPOSE=true
else
    print_warning "Docker Compose is not installed (optional)"
    HAS_DOCKER_COMPOSE=false
fi

echo ""

# ==========================================
# 2. Choose Setup Method
# ==========================================
echo "Step 2: Choose setup method"
echo ""

if [ "$HAS_DOCKER" = true ] && [ "$HAS_DOCKER_COMPOSE" = true ]; then
    echo "You have Docker and Docker Compose installed."
    echo ""
    echo "Setup options:"
    echo "  1) Docker Compose (Recommended for quick start)"
    echo "  2) Local Development (Node.js + PostgreSQL)"
    echo ""
    read -p "Choose option (1 or 2): " SETUP_METHOD
else
    echo "Docker not available, proceeding with local setup..."
    SETUP_METHOD=2
fi

echo ""

# ==========================================
# 3. Environment Configuration
# ==========================================
echo "Step 3: Environment configuration"
echo ""

if [ ! -f .env ]; then
    print_info "Creating .env file from .env.example..."
    cp .env.example .env
    print_success ".env file created"
    
    # Generate JWT secret
    print_info "Generating JWT secret..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    else
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    fi
    
    print_success "JWT secret generated"
    
    print_warning "Please edit .env file and add your API keys:"
    print_info "  - Twilio credentials (for SMS)"
    print_info "  - SendGrid API key (for email)"
    print_info "  - Lightspeed credentials (optional)"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
else
    print_success ".env file already exists"
fi

echo ""

# ==========================================
# 4. Setup Based on Method
# ==========================================
if [ "$SETUP_METHOD" = "1" ]; then
    # ==========================================
    # Docker Compose Setup
    # ==========================================
    echo "Step 4: Docker Compose setup"
    echo ""
    
    print_info "Building Docker images..."
    docker-compose build
    print_success "Docker images built"
    
    print_info "Starting services..."
    docker-compose up -d postgres redis
    print_success "Database services started"
    
    print_info "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    print_info "Running database migrations..."
    docker-compose run --rm backend npm run migrate
    print_success "Database migrations completed"
    
    print_info "Seeding database..."
    docker-compose run --rm backend npm run seed
    print_success "Database seeded"
    
    print_info "Starting all services..."
    docker-compose up -d
    print_success "All services started"
    
    echo ""
    print_success "🎉 Setup complete!"
    echo ""
    echo "Services:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000"
    echo "  - pgAdmin: http://localhost:5050 (Development only)"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Stop services:"
    echo "  docker-compose down"
    
else
    # ==========================================
    # Local Development Setup
    # ==========================================
    echo "Step 4: Local development setup"
    echo ""
    
    # Database setup
    print_info "Setting up database..."
    echo ""
    echo "Please ensure PostgreSQL is running and create a database:"
    echo "  createdb repair_shop_db"
    echo ""
    read -p "Press Enter after creating the database..."
    
    # Backend setup
    print_info "Installing backend dependencies..."
    cd server
    npm install
    print_success "Backend dependencies installed"
    
    print_info "Running database migrations..."
    npm run migrate
    print_success "Database migrations completed"
    
    print_info "Seeding database..."
    npm run seed
    print_success "Database seeded"
    
    cd ..
    
    # Frontend setup
    print_info "Installing frontend dependencies..."
    cd client
    npm install
    print_success "Frontend dependencies installed"
    
    cd ..
    
    echo ""
    print_success "🎉 Setup complete!"
    echo ""
    echo "To start development:"
    echo ""
    echo "Terminal 1 - Backend:"
    echo "  cd server"
    echo "  npm run dev"
    echo ""
    echo "Terminal 2 - Frontend:"
    echo "  cd client"
    echo "  npm start"
    echo ""
    echo "Services will be available at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000"
fi

echo ""
print_info "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
print_warning "⚠️  IMPORTANT: Change the default admin password immediately!"
echo ""

# ==========================================
# 5. Post-setup checks
# ==========================================
echo "Step 5: Running post-setup checks..."
echo ""

if [ "$SETUP_METHOD" = "1" ]; then
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker services are running"
    else
        print_error "Some Docker services failed to start"
    fi
else
    # Check if database connection works
    if psql -h localhost -U admin -d repair_shop_db -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_warning "Could not verify database connection"
    fi
fi

echo ""
print_success "Setup script completed!"
echo ""
print_info "Next steps:"
echo "  1. Change default admin password"
echo "  2. Configure notification settings in .env"
echo "  3. Set up Lightspeed integration (optional)"
echo "  4. Review and customize pricing"
echo "  5. Add your devices and repair types"
echo ""
print_info "Documentation:"
echo "  - Main Plan: MOBILE_REPAIR_SHOP_DASHBOARD_PLAN.md"
echo "  - Implementation Guide: IMPLEMENTATION_GUIDE.md"
echo "  - API Documentation: api_endpoints.md"
echo ""
print_success "Happy repairing! 🔧📱"
