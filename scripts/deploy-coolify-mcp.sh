#!/bin/bash
# Deploy Mobile Repair Dashboard to Coolify using MCP Server

echo "🚀 Mobile Repair Dashboard - Coolify MCP Deployment"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MCP config exists
if [ ! -f ".coolify-mcp.env" ]; then
    echo -e "${YELLOW}⚠️  MCP configuration not found${NC}"
    echo ""
    echo "Creating .coolify-mcp.env template..."
    cat > .coolify-mcp.env << 'EOF'
# Coolify MCP Configuration
COOLIFY_BASE_URL=https://coolify.theprofitplatform.com.au
COOLIFY_TOKEN=your-api-token-here

# Project Configuration
PROJECT_NAME=mobile-repair-dashboard
GITHUB_REPO=https://github.com/avi-boop/rep.git
GITHUB_BRANCH_DEV=dev
GITHUB_BRANCH_PROD=main

# Domain Configuration
PREVIEW_DOMAIN=dev.theprofitplatform.com.au
PRODUCTION_DOMAIN=theprofitplatform.com.au

# Database Configuration  
DATABASE_URL_DEV=postgresql://user:password@host:5432/mobile_repair_dev
DATABASE_URL_PROD=postgresql://user:password@host:5432/mobile_repair_prod
EOF
    
    echo ""
    echo -e "${YELLOW}📝 Please edit .coolify-mcp.env with your settings:${NC}"
    echo "   1. Add your Coolify API token"
    echo "   2. Configure database URLs"
    echo "   3. Verify domain settings"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

# Load configuration
source .coolify-mcp.env

# Check if token is set
if [ "$COOLIFY_TOKEN" = "your-api-token-here" ]; then
    echo -e "${RED}❌ Error: COOLIFY_TOKEN not configured${NC}"
    echo ""
    echo "Get your API token:"
    echo "  1. Open: $COOLIFY_BASE_URL"
    echo "  2. Settings → Security → API Tokens"
    echo "  3. Create token with read/write/deploy permissions"
    echo "  4. Edit .coolify-mcp.env and add your token"
    exit 1
fi

echo -e "${GREEN}✅ Configuration loaded${NC}"
echo ""
echo "Settings:"
echo "  Coolify URL: $COOLIFY_BASE_URL"
echo "  Project: $PROJECT_NAME"
echo "  GitHub: $GITHUB_REPO"
echo "  Preview Domain: $PREVIEW_DOMAIN"
echo "  Production Domain: $PRODUCTION_DOMAIN"
echo ""

# Main menu
echo "What would you like to do?"
echo ""
echo "1) Deploy Preview (dev branch)"
echo "2) Deploy Production (main branch)"
echo "3) Deploy Both (preview + production)"
echo "4) Test MCP Connection"
echo "5) View Deployment Instructions"
echo "6) Exit"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📦 Deploying Preview Environment...${NC}"
        echo ""
        echo "This will:"
        echo "  ✓ Create/update mobile-repair-preview application"
        echo "  ✓ Branch: $GITHUB_BRANCH_DEV"
        echo "  ✓ Domain: $PREVIEW_DOMAIN"
        echo ""
        echo -e "${YELLOW}⚠️  MCP deployment requires Claude Desktop with MCP configured${NC}"
        echo ""
        echo "In Claude Desktop, say:"
        echo ""
        echo "\"Create or update Coolify application 'mobile-repair-preview' with:"
        echo "  - Repository: $GITHUB_REPO"
        echo "  - Branch: $GITHUB_BRANCH_DEV"
        echo "  - Dockerfile: Dockerfile.production"
        echo "  - Base Directory: dashboard"
        echo "  - Port: 3000"
        echo "  - Domain: $PREVIEW_DOMAIN"
        echo "Then deploy it.\""
        echo ""
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}🚀 Deploying Production Environment...${NC}"
        echo ""
        echo "This will:"
        echo "  ✓ Create/update mobile-repair-production application"
        echo "  ✓ Branch: $GITHUB_BRANCH_PROD"
        echo "  ✓ Domain: $PRODUCTION_DOMAIN"
        echo ""
        echo -e "${YELLOW}⚠️  WARNING: This deploys to PRODUCTION!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "Cancelled."
            exit 0
        fi
        
        echo ""
        echo "In Claude Desktop, say:"
        echo ""
        echo "\"Create or update Coolify application 'mobile-repair-production' with:"
        echo "  - Repository: $GITHUB_REPO"
        echo "  - Branch: $GITHUB_BRANCH_PROD"
        echo "  - Dockerfile: Dockerfile.production"
        echo "  - Base Directory: dashboard"
        echo "  - Port: 3000"
        echo "  - Domain: $PRODUCTION_DOMAIN"
        echo "Then deploy it.\""
        echo ""
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}🎯 Deploying Both Environments...${NC}"
        echo ""
        echo "This will deploy:"
        echo "  1. Preview: $PREVIEW_DOMAIN (branch: $GITHUB_BRANCH_DEV)"
        echo "  2. Production: $PRODUCTION_DOMAIN (branch: $GITHUB_BRANCH_PROD)"
        echo ""
        read -p "Continue? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "Cancelled."
            exit 0
        fi
        
        echo ""
        echo "In Claude Desktop, use this complete deployment command:"
        echo ""
        echo "───────────────────────────────────────────────────────────"
        cat << 'DEPLOY_CMD'
"Using Coolify MCP, create these two applications:

1. PREVIEW APPLICATION:
   Name: mobile-repair-preview
   Repository: $GITHUB_REPO
   Branch: dev
   Build Pack: Dockerfile
   Dockerfile: Dockerfile.production
   Base Directory: dashboard
   Port: 3000
   Domain: $PREVIEW_DOMAIN
   
2. PRODUCTION APPLICATION:
   Name: mobile-repair-production
   Repository: $GITHUB_REPO
   Branch: main
   Build Pack: Dockerfile
   Dockerfile: Dockerfile.production
   Base Directory: dashboard
   Port: 3000
   Domain: $PRODUCTION_DOMAIN

Deploy both applications and report status."
DEPLOY_CMD
        echo "───────────────────────────────────────────────────────────"
        echo ""
        ;;
        
    4)
        echo ""
        echo -e "${BLUE}🧪 Testing MCP Connection...${NC}"
        echo ""
        
        # Test curl to Coolify API
        echo "Testing Coolify API..."
        response=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
                   "$COOLIFY_BASE_URL/api/v1/version" 2>&1)
        
        if [[ $response == *"version"* ]]; then
            echo -e "${GREEN}✅ Coolify API is accessible${NC}"
            echo "Response: $response"
        else
            echo -e "${RED}❌ Cannot reach Coolify API${NC}"
            echo "Response: $response"
            echo ""
            echo "Troubleshooting:"
            echo "  - Check COOLIFY_BASE_URL is correct"
            echo "  - Verify API token has proper permissions"
            echo "  - Ensure Coolify is running"
        fi
        
        echo ""
        echo "To test MCP tools, in Claude Desktop say:"
        echo "  \"Use get_version to check my Coolify version\""
        echo ""
        ;;
        
    5)
        echo ""
        echo -e "${BLUE}📖 Complete Deployment Guide${NC}"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        cat << 'GUIDE'

STEP-BY-STEP DEPLOYMENT:

1. SETUP CLAUDE DESKTOP (One-time):
   
   On your LOCAL machine:
   
   a) Edit Claude Desktop config:
      ~/.config/Claude/claude_desktop_config.json
   
   b) Add MCP server configuration:
      {
        "mcpServers": {
          "coolify": {
            "command": "ssh",
            "args": [
              "avi@31.97.222.218",
              "cd /home/avi/projects/coolify/coolify-mcp && node build/index.js"
            ],
            "env": {}
          }
        }
      }
   
   c) Setup SSH key (if not done):
      ssh-copy-id avi@31.97.222.218
   
   d) Restart Claude Desktop

2. GENERATE DEPLOYMENT SECRETS:
   
   ./scripts/generate-secrets.sh > .deployment-secrets.txt
   
   Keep these for setting environment variables!

3. DEPLOY VIA CLAUDE DESKTOP:
   
   Open Claude Desktop and say:
   
   "Create two Coolify applications for my mobile repair dashboard:
   
   Preview App:
   - Name: mobile-repair-preview
   - Repo: https://github.com/avi-boop/rep.git
   - Branch: dev
   - Dockerfile: Dockerfile.production
   - Base: dashboard
   - Port: 3000
   - Domain: dev.theprofitplatform.com.au
   
   Production App:
   - Name: mobile-repair-production
   - Repo: https://github.com/avi-boop/rep.git
   - Branch: main
   - Dockerfile: Dockerfile.production
   - Base: dashboard
   - Port: 3000
   - Domain: theprofitplatform.com.au
   
   Deploy both applications."

4. ADD ENVIRONMENT VARIABLES:
   
   For each app, add these in Coolify (or ask Claude to do it):
   - DATABASE_URL
   - JWT_SECRET (from .deployment-secrets.txt)
   - NEXTAUTH_SECRET (from .deployment-secrets.txt)
   - NEXTAUTH_URL
   - NODE_ENV=production
   - PORT=3000
   - HOSTNAME=0.0.0.0
   - NEXT_TELEMETRY_DISABLED=1

5. RUN DATABASE MIGRATIONS:
   
   After deployment, in Claude Desktop:
   
   "Run these commands in mobile-repair-production:
     cd /app/dashboard
     npx prisma migrate deploy
     npx prisma db seed"

6. VERIFY DEPLOYMENT:
   
   Open in browser:
   - Preview: https://dev.theprofitplatform.com.au
   - Production: https://theprofitplatform.com.au
   
   Login with: admin / admin123

GUIDE
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        
        echo "Full documentation:"
        echo "  - COOLIFY_MCP_DEPLOY.md (this directory)"
        echo "  - QUICK-REFERENCE.md (MCP commands)"
        echo "  - USAGE-GUIDE.md (complete MCP guide)"
        echo ""
        ;;
        
    6)
        echo "Bye!"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "📚 Documentation:"
echo "  - COOLIFY_MCP_DEPLOY.md - Complete MCP deployment guide"
echo "  - QUICK-REFERENCE.md - MCP command reference"
echo "  - USAGE-GUIDE.md - Full usage documentation"
echo ""
echo "💡 Pro Tip: Use Claude Desktop with MCP for fastest deployment!"
echo ""
