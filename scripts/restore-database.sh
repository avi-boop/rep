#!/bin/bash
# restore-database.sh
# Database restoration script for Mobile Repair Dashboard

set -euo pipefail

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

# Load environment variables
if [ -f "dashboard/.env" ]; then
    export $(cat dashboard/.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    print_error "No .env file found"
    exit 1
fi

echo ""
print_info "Mobile Repair Dashboard - Database Restore"
echo "=========================================="
echo ""

# Check if backup file provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "  No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_info "Backup file: $BACKUP_FILE"
print_info "File size: $(du -h $BACKUP_FILE | cut -f1)"
echo ""

# Parse DATABASE_URL
DB_URL=$DATABASE_URL
DB_HOST=$(echo $DB_URL | sed -E 's/.*@([^:]+).*/\1/')
DB_PORT=$(echo $DB_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_NAME=$(echo $DB_URL | sed -E 's/.*\/([^?]+).*/\1/')
DB_USER=$(echo $DB_URL | sed -E 's/.*:\/\/([^:]+).*/\1/')
DB_PASS=$(echo $DB_URL | sed -E 's/.*:\/\/[^:]+:([^@]+).*/\1/')

print_warning "⚠️  WARNING: This will OVERWRITE the current database!"
print_info "Database: $DB_NAME"
print_info "Host: $DB_HOST:$DB_PORT"
echo ""

read -p "Are you sure you want to continue? (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    print_info "Restore cancelled"
    exit 0
fi

echo ""
print_info "Starting restore..."

# Decompress if needed
SQL_FILE=$BACKUP_FILE
if [[ $BACKUP_FILE == *.gz ]]; then
    print_info "Decompressing backup..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    SQL_FILE="${BACKUP_FILE%.gz}"
    print_success "Decompressed"
fi

# Perform restore
print_info "Restoring database..."

if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$SQL_FILE" 2>&1

    if [ $? -eq 0 ]; then
        print_success "Database restored successfully"
    else
        print_error "Restore failed"
        exit 1
    fi
else
    print_warning "psql not found, trying docker..."

    if docker ps --format '{{.Names}}' | grep -q postgres; then
        CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep postgres | head -1)
        docker exec -i $CONTAINER_NAME psql -U $DB_USER $DB_NAME < "$SQL_FILE"

        if [ $? -eq 0 ]; then
            print_success "Database restored via Docker"
        else
            print_error "Docker restore failed"
            exit 1
        fi
    else
        print_error "Neither psql nor postgres container found"
        exit 1
    fi
fi

# Cleanup decompressed file if we created it
if [[ $BACKUP_FILE == *.gz ]] && [ -f "$SQL_FILE" ]; then
    rm "$SQL_FILE"
fi

echo ""
print_success "🎉 Database restored successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify data: npm run db:studio"
echo "  2. Restart application"
echo "  3. Test functionality"
echo ""

exit 0
