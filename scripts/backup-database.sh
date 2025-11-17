#!/bin/bash
# backup-database.sh
# Automated database backup script for Mobile Repair Dashboard

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

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/repair_shop_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=${RETENTION_DAYS:-30}

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
print_info "Mobile Repair Dashboard - Database Backup"
echo "=========================================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"
print_success "Backup directory ready: $BACKUP_DIR"

# Extract database connection info from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [ -z "${DATABASE_URL:-}" ]; then
    print_error "DATABASE_URL not found in environment"
    exit 1
fi

# Parse DATABASE_URL
DB_URL=$DATABASE_URL
DB_HOST=$(echo $DB_URL | sed -E 's/.*@([^:]+).*/\1/')
DB_PORT=$(echo $DB_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_NAME=$(echo $DB_URL | sed -E 's/.*\/([^?]+).*/\1/')
DB_USER=$(echo $DB_URL | sed -E 's/.*:\/\/([^:]+).*/\1/')
DB_PASS=$(echo $DB_URL | sed -E 's/.*:\/\/[^:]+:([^@]+).*/\1/')

print_info "Database: $DB_NAME"
print_info "Host: $DB_HOST:$DB_PORT"
echo ""

# Perform backup
print_info "Starting backup..."

# Using pg_dump (for local PostgreSQL)
if command -v pg_dump &> /dev/null; then
    PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        --no-owner --no-acl --clean --if-exists > "$BACKUP_FILE" 2>&1

    if [ $? -eq 0 ]; then
        print_success "Backup completed: $BACKUP_FILE"

        # Get file size
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_info "Backup size: $FILE_SIZE"
    else
        print_error "Backup failed"
        exit 1
    fi
else
    print_warning "pg_dump not found, trying docker..."

    # Try docker if pg_dump not available
    if docker ps --format '{{.Names}}' | grep -q postgres; then
        CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep postgres | head -1)
        docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

        if [ $? -eq 0 ]; then
            print_success "Backup completed via Docker: $BACKUP_FILE"
        else
            print_error "Docker backup failed"
            exit 1
        fi
    else
        print_error "Neither pg_dump nor postgres container found"
        exit 1
    fi
fi

# Compress backup
print_info "Compressing backup..."
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
print_success "Compressed: $COMPRESSED_FILE"

# Get compressed file size
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
print_info "Compressed size: $COMPRESSED_SIZE"

echo ""

# Clean old backups
print_info "Cleaning old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "repair_shop_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "repair_shop_backup_*.sql.gz" | wc -l)
print_success "Cleanup complete. $REMAINING backup(s) remaining"

echo ""

# Backup summary
print_success "🎉 Backup completed successfully!"
echo ""
echo "Backup Information:"
echo "  File: $COMPRESSED_FILE"
echo "  Size: $COMPRESSED_SIZE"
echo "  Date: $(date)"
echo ""
echo "To restore this backup:"
echo "  gunzip $COMPRESSED_FILE"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < ${BACKUP_FILE}"
echo ""

# Optional: Upload to S3 or other cloud storage
if [ -n "${AWS_S3_BUCKET:-}" ]; then
    print_info "Uploading to S3..."
    aws s3 cp "$COMPRESSED_FILE" "s3://${AWS_S3_BUCKET}/backups/" 2>&1
    if [ $? -eq 0 ]; then
        print_success "Uploaded to S3: s3://${AWS_S3_BUCKET}/backups/"
    else
        print_warning "S3 upload failed (continuing...)"
    fi
fi

exit 0
