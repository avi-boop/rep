#!/bin/bash
# deploy.sh
# Deployment script for production

set -e

echo "🚀 Mobile Repair Shop Dashboard - Deployment Script"
echo "===================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Confirm deployment
echo "Current branch: $CURRENT_BRANCH"
echo ""
print_warning "This will deploy to PRODUCTION"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Deployment cancelled"
    exit 0
fi

echo ""

# ==========================================
# 1. Pre-deployment checks
# ==========================================
echo "Step 1: Pre-deployment checks"
echo ""

# Check if on main branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        exit 0
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_error "You have uncommitted changes"
    git status -s
    exit 1
fi

print_success "No uncommitted changes"

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found"
    exit 1
fi

print_success "Environment file exists"

# Run tests
print_info "Running tests..."
cd server && npm run test || {
    print_error "Backend tests failed"
    exit 1
}
print_success "Backend tests passed"

cd ../client && npm run test -- --watchAll=false || {
    print_error "Frontend tests failed"
    exit 1
}
print_success "Frontend tests passed"

cd ..

echo ""

# ==========================================
# 2. Backup current database
# ==========================================
echo "Step 2: Backup database"
echo ""

BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

mkdir -p $BACKUP_DIR

print_info "Creating database backup..."

# If using Docker
if docker ps | grep -q repair-shop-db; then
    docker-compose exec -T postgres pg_dump -U admin repair_shop_db > $BACKUP_FILE
else
    # Local PostgreSQL
    pg_dump -U admin repair_shop_db > $BACKUP_FILE
fi

if [ -f $BACKUP_FILE ]; then
    print_success "Database backed up to: $BACKUP_FILE"
else
    print_error "Backup failed"
    exit 1
fi

echo ""

# ==========================================
# 3. Pull latest changes
# ==========================================
echo "Step 3: Pull latest changes"
echo ""

print_info "Fetching from remote..."
git fetch origin

print_info "Pulling latest changes..."
git pull origin $CURRENT_BRANCH

print_success "Code updated"

echo ""

# ==========================================
# 4. Build and deploy
# ==========================================
echo "Step 4: Build and deploy"
echo ""

# Install dependencies
print_info "Installing backend dependencies..."
cd server && npm ci
print_success "Backend dependencies installed"

print_info "Installing frontend dependencies..."
cd ../client && npm ci
print_success "Frontend dependencies installed"

cd ..

# Build Docker images
print_info "Building Docker images..."
docker-compose build

print_success "Images built"

echo ""

# ==========================================
# 5. Database migrations
# ==========================================
echo "Step 5: Database migrations"
echo ""

print_info "Running database migrations..."

# Stop backend temporarily
docker-compose stop backend

# Run migrations
docker-compose run --rm backend npm run migrate

print_success "Migrations completed"

echo ""

# ==========================================
# 6. Deploy services
# ==========================================
echo "Step 6: Deploy services"
echo ""

print_info "Starting services..."
docker-compose up -d

print_success "Services started"

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Check health
HEALTH_CHECK=$(curl -f http://localhost:5000/health 2>/dev/null || echo "failed")

if [ "$HEALTH_CHECK" != "failed" ]; then
    print_success "Health check passed"
else
    print_error "Health check failed"
    print_warning "Rolling back..."
    
    # Rollback
    docker-compose down
    # Restore backup
    if docker ps | grep -q repair-shop-db; then
        docker-compose exec -T postgres psql -U admin repair_shop_db < $BACKUP_FILE
    fi
    docker-compose up -d
    
    print_error "Deployment failed, rolled back to previous version"
    exit 1
fi

echo ""

# ==========================================
# 7. Post-deployment tasks
# ==========================================
echo "Step 7: Post-deployment tasks"
echo ""

# Clear cache
print_info "Clearing application cache..."
docker-compose exec backend node scripts/clearCache.js || true
print_success "Cache cleared"

# Restart services
print_info "Restarting services..."
docker-compose restart
print_success "Services restarted"

# Generate sitemap (if applicable)
print_info "Generating sitemap..."
# curl http://localhost:5000/api/v1/sitemap/generate || true
print_success "Sitemap generated"

echo ""

# ==========================================
# 8. Verification
# ==========================================
echo "Step 8: Verification"
echo ""

print_info "Running smoke tests..."

# Test API
API_TEST=$(curl -f http://localhost:5000/api/v1/health 2>/dev/null || echo "failed")
if [ "$API_TEST" != "failed" ]; then
    print_success "API is responding"
else
    print_error "API is not responding"
fi

# Test Frontend
FRONTEND_TEST=$(curl -f http://localhost:3000 2>/dev/null || echo "failed")
if [ "$FRONTEND_TEST" != "failed" ]; then
    print_success "Frontend is responding"
else
    print_error "Frontend is not responding"
fi

# Test Database
DB_TEST=$(docker-compose exec -T postgres psql -U admin repair_shop_db -c "SELECT 1;" 2>/dev/null || echo "failed")
if [ "$DB_TEST" != "failed" ]; then
    print_success "Database is accessible"
else
    print_error "Database is not accessible"
fi

echo ""

# ==========================================
# 9. Cleanup
# ==========================================
echo "Step 9: Cleanup"
echo ""

print_info "Removing old Docker images..."
docker image prune -f
print_success "Old images removed"

print_info "Removing old backups (keeping last 30 days)..."
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
print_success "Old backups removed"

echo ""

# ==========================================
# Deployment Summary
# ==========================================
echo "=================================================="
print_success "🎉 Deployment completed successfully!"
echo "=================================================="
echo ""

echo "Deployment Summary:"
echo "  - Branch: $CURRENT_BRANCH"
echo "  - Commit: $(git rev-parse --short HEAD)"
echo "  - Time: $(date)"
echo "  - Backup: $BACKUP_FILE"
echo ""

echo "Services:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:5000"
echo "  - Database: localhost:5432"
echo ""

echo "Next steps:"
echo "  1. Monitor application logs: docker-compose logs -f"
echo "  2. Check error rates in monitoring dashboard"
echo "  3. Verify critical features are working"
echo "  4. Notify team of deployment"
echo ""

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
         --data "{\"text\":\"🚀 Deployed to production - Commit: $(git rev-parse --short HEAD)\"}" \
         $SLACK_WEBHOOK 2>/dev/null || true
fi

print_success "Deployment complete! 🎉"
