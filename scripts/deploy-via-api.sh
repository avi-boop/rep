#!/bin/bash
# Deploy to Coolify via API automatically

set -e

echo "🚀 Deploying to Coolify via API"
echo "════════════════════════════════════════"
echo ""

# Load environment
source /home/avi/projects/coolify/coolify-mcp/.env

# Configuration
SERVER_UUID="acwcck0c0wg8owgsko880cg0"
PROJECT_UUID="qkwwsw040c004wwkskk0woc4"
GITHUB_REPO="https://github.com/avi-boop/rep"

# Read secrets
JWT_SECRET_DEV=$(sed -n '1p' /home/avi/projects/mobile/.deployment-secrets-raw.txt | cut -d'=' -f2)
NEXTAUTH_SECRET_DEV=$(sed -n '2p' /home/avi/projects/mobile/.deployment-secrets-raw.txt | cut -d'=' -f2)
JWT_SECRET_PROD=$(sed -n '3p' /home/avi/projects/mobile/.deployment-secrets-raw.txt | cut -d'=' -f2)
NEXTAUTH_SECRET_PROD=$(sed -n '4p' /home/avi/projects/mobile/.deployment-secrets-raw.txt | cut -d'=' -f2)

echo "Configuration:"
echo "  Server: $SERVER_UUID"
echo "  Project: $PROJECT_UUID"
echo "  Repo: $GITHUB_REPO"
echo ""

# Create preview application
echo "📦 Creating PREVIEW application..."

PREVIEW_PAYLOAD=$(cat <<EOF
{
  "server_uuid": "$SERVER_UUID",
  "project_uuid": "$PROJECT_UUID",
  "environment_name": "production",
  "git_repository": "$GITHUB_REPO",
  "git_branch": "dev",
  "build_pack": "dockerfile",
  "dockerfile_location": "./Dockerfile.production",
  "ports_exposes": "3000",
  "name": "mobile-repair-preview",
  "description": "Mobile Repair Dashboard - Preview Environment",
  "is_static": false
}
EOF
)

PREVIEW_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  "$COOLIFY_BASE_URL/api/v1/applications" \
  -d "$PREVIEW_PAYLOAD")

echo "Preview app response:"
echo "$PREVIEW_RESPONSE" | jq '.' 2>/dev/null || echo "$PREVIEW_RESPONSE"
echo ""

# Extract UUID if successful
PREVIEW_UUID=$(echo "$PREVIEW_RESPONSE" | jq -r '.uuid // .data.uuid // empty' 2>/dev/null)

if [ -n "$PREVIEW_UUID" ]; then
    echo "✅ Preview app created: $PREVIEW_UUID"
    
    # Add environment variables
    echo "📝 Adding environment variables to preview app..."
    
    # Note: Coolify API for env vars varies by version
    # This is a placeholder - actual implementation depends on Coolify API version
    
else
    echo "⚠️  Could not extract preview app UUID"
    echo "Response: $PREVIEW_RESPONSE"
fi

echo ""
echo "Note: Full automation via API requires Coolify API endpoints that may"
echo "not be available in your version. Please complete setup in UI:"
echo ""
echo "  https://coolify.theprofitplatform.com.au"
echo ""
echo "Configuration ready:"
echo "  - Server selected: VPS (31.97.222.218)"
echo "  - Project: mobile-repair-dashboard"
echo "  - Secrets generated and saved"
echo ""
