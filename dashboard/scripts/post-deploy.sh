#!/bin/bash

# =============================================================================
# Post-Deployment Setup Script
# Run this in Coolify console after deployment
# =============================================================================

set -e

echo "======================================="
echo "Post-Deployment Setup"
echo "======================================="
echo ""

# Step 1: Generate Prisma Client
echo "Step 1: Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma client generated"
echo ""

# Step 2: Run Migrations
echo "Step 2: Running database migrations..."
npx prisma migrate deploy
echo "✓ Migrations complete"
echo ""

# Step 3: Check Database Connection
echo "Step 3: Testing database connection..."
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
echo "✓ Database connection working"
echo ""

# Step 4: Seed Database (Optional)
read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Step 4: Seeding database..."
    npx prisma db seed
    echo "✓ Database seeded"
else
    echo "⊘ Skipped database seeding"
fi
echo ""

# Step 5: Verify Setup
echo "Step 5: Verifying setup..."
echo "Checking tables..."
npx prisma db execute --stdin <<EOF
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
ORDER BY 
    table_name;
EOF
echo ""

echo "======================================="
echo "Setup Complete!"
echo "======================================="
echo ""
echo "Your application is ready to use."
echo ""
echo "Next steps:"
echo "1. Create your first admin user"
echo "2. Test the login at /api/auth/login"
echo "3. Access the dashboard at /dashboard"
echo ""
