#!/bin/bash

# Migrate to Supabase using Docker network
# This script runs Prisma commands from inside the Docker network

cd /home/avi/projects/mobile/dashboard

# Create a temporary .env for Docker
cat > .env.docker << EOF
DATABASE_URL="postgresql://supabase_admin:rdqihD49wGAO78VpUY7QdG0EJewepwyk@supabase-db-w84occs4w0wks4cc4kc8o484:5432/repair_dashboard?schema=public"
DIRECT_URL="postgresql://supabase_admin:rdqihD49wGAO78VpUY7QdG0EJewepwyk@supabase-db-w84occs4w0wks4cc4kc8o484:5432/repair_dashboard?schema=public"
EOF

# Run Prisma push using Docker
docker run --rm \
  --network w84occs4w0wks4cc4kc8o484 \
  -v "$(pwd):/app" \
  -w /app \
  --env-file .env.docker \
  node:20-alpine \
  sh -c "npm install -g prisma@latest && prisma db push --skip-generate"

# Clean up
rm .env.docker

echo "Migration complete!"
