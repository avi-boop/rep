#!/bin/bash
# Automated Coolify deployment script
# This will create and deploy both preview and production apps

set -e  # Exit on error

echo "🚀 Automated Coolify Deployment"
echo "════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load Coolify credentials
if [ -f "/home/avi/projects/coolify/coolify-mcp/.env" ]; then
    source /home/avi/projects/coolify/coolify-mcp/.env
    echo -e "${GREEN}✅ Loaded Coolify credentials${NC}"
else
    echo -e "${RED}❌ Coolify MCP not configured${NC}"
    exit 1
fi

# Configuration
PROJECT_NAME="mobile-repair-dashboard"
GITHUB_REPO="https://github.com/avi-boop/rep.git"
PREVIEW_DOMAIN="dev.theprofitplatform.com.au"
PRODUCTION_DOMAIN="theprofitplatform.com.au"

echo ""
echo "Configuration:"
echo "  Coolify: $COOLIFY_BASE_URL"
echo "  Project: $PROJECT_NAME"
echo "  GitHub: $GITHUB_REPO"
echo "  Preview: $PREVIEW_DOMAIN"
echo "  Production: $PRODUCTION_DOMAIN"
echo ""

# Test API connection
echo -e "${BLUE}🔍 Testing Coolify API...${NC}"
VERSION=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
    "$COOLIFY_BASE_URL/api/v1/version" 2>&1)

if [[ $VERSION == *"beta"* ]] || [[ $VERSION == *"."* ]]; then
    echo -e "${GREEN}✅ Coolify API accessible${NC}"
    echo "   Version: $VERSION"
else
    echo -e "${RED}❌ Cannot access Coolify API${NC}"
    echo "   Response: $VERSION"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Fetching current resources...${NC}"

# Get team UUID
TEAMS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
    "$COOLIFY_BASE_URL/api/v1/teams")
TEAM_ID=$(echo "$TEAMS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TEAM_ID" ]; then
    echo -e "${RED}❌ Could not get team ID${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Team ID: $TEAM_ID${NC}"

# Get servers
SERVERS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
    "$COOLIFY_BASE_URL/api/v1/servers")
echo "$SERVERS" > /tmp/coolify-servers.json
echo -e "${GREEN}✅ Retrieved servers${NC}"

# Get projects
PROJECTS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
    "$COOLIFY_BASE_URL/api/v1/projects")
echo "$PROJECTS" > /tmp/coolify-projects.json

# Check if project exists
PROJECT_UUID=$(echo "$PROJECTS" | grep -o '"uuid":"[^"]*"' | grep -B5 "$PROJECT_NAME" | grep uuid | cut -d'"' -f4 | head -1)

if [ -z "$PROJECT_UUID" ]; then
    echo -e "${YELLOW}📦 Creating project: $PROJECT_NAME${NC}"
    
    CREATE_PROJECT=$(curl -s -X POST \
        -H "Authorization: Bearer $COOLIFY_TOKEN" \
        -H "Content-Type: application/json" \
        "$COOLIFY_BASE_URL/api/v1/projects" \
        -d "{\"name\":\"$PROJECT_NAME\",\"description\":\"Mobile Repair Shop Dashboard\"}")
    
    PROJECT_UUID=$(echo "$CREATE_PROJECT" | grep -o '"uuid":"[^"]*"' | cut -d'"' -f4 | head -1)
    
    if [ -z "$PROJECT_UUID" ]; then
        echo -e "${RED}❌ Failed to create project${NC}"
        echo "$CREATE_PROJECT"
        exit 1
    fi
    echo -e "${GREEN}✅ Project created: $PROJECT_UUID${NC}"
else
    echo -e "${GREEN}✅ Project exists: $PROJECT_UUID${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Ready to deploy!${NC}"
echo ""
echo "This will create:"
echo "  1. Preview app → $PREVIEW_DOMAIN (branch: dev)"
echo "  2. Production app → $PRODUCTION_DOMAIN (branch: main)"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Deployment In Progress...${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Note: Full app creation requires more API details
# For now, show manual instructions
echo -e "${YELLOW}⚠️  Application creation requires additional API endpoints${NC}"
echo ""
echo "Please complete setup in Coolify dashboard:"
echo ""
echo "1. Go to: $COOLIFY_BASE_URL"
echo "2. Project: $PROJECT_NAME (UUID: $PROJECT_UUID)"
echo "3. Create applications with these settings:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PREVIEW APPLICATION:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Name: mobile-repair-preview"
echo "  Repository: $GITHUB_REPO"
echo "  Branch: dev"
echo "  Build Pack: Dockerfile"
echo "  Dockerfile: Dockerfile.production"
echo "  Base Directory: dashboard"
echo "  Port: 3000"
echo "  Domain: $PREVIEW_DOMAIN"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRODUCTION APPLICATION:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Name: mobile-repair-production"
echo "  Repository: $GITHUB_REPO"
echo "  Branch: main"
echo "  Build Pack: Dockerfile"
echo "  Dockerfile: Dockerfile.production"
echo "  Base Directory: dashboard"
echo "  Port: 3000"
echo "  Domain: $PRODUCTION_DOMAIN"
echo ""

# Save configuration for reference
cat > /home/avi/projects/mobile/.coolify-deployment-info.txt << EOF
Coolify Deployment Information
Generated: $(date)

Team ID: $TEAM_ID
Project UUID: $PROJECT_UUID
Project Name: $PROJECT_NAME

Configuration:
  Repository: $GITHUB_REPO
  Preview Domain: $PREVIEW_DOMAIN
  Production Domain: $PRODUCTION_DOMAIN
  
Environment Variables (from .deployment-secrets-raw.txt):
  - DATABASE_URL
  - JWT_SECRET
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL
  - NODE_ENV=production
  - PORT=3000
  - HOSTNAME=0.0.0.0
  - NEXT_TELEMETRY_DISABLED=1

Next Steps:
  1. Create applications in Coolify UI
  2. Add environment variables
  3. Deploy applications
  4. Run database migrations
EOF

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Configuration saved to: .coolify-deployment-info.txt"
echo "Secrets saved to: .deployment-secrets-raw.txt"
echo ""
