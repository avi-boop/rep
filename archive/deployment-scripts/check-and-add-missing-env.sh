#!/bin/bash

# Check which environment variables are missing and add them
set -e

cd /home/avi/projects/coolify/coolify-mcp
source <(grep -v '^#' .env | grep -v '^$' | sed 's/^/export /')

APP_UUID="zccwogo8g4884gwcgwk4wwoc"

echo "🔍 Checking current environment variables..."
echo ""

# Get current env vars
CURRENT_VARS=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
    "$COOLIFY_BASE_URL/api/v1/applications/$APP_UUID/envs" | \
    python3 -c "import sys, json; envs = json.load(sys.stdin); print('\n'.join([e['key'] for e in envs]))")

echo "📋 Current variables in Coolify:"
echo "$CURRENT_VARS" | sort
echo ""

# Required variables
declare -a REQUIRED_VARS=(
    "DATABASE_URL"
    "DIRECT_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "JWT_SECRET"
    "REFRESH_TOKEN_SECRET"
    "JWT_EXPIRES_IN"
    "REFRESH_TOKEN_EXPIRES_IN"
    "SESSION_SECRET"
    "REDIS_URL"
    "NODE_ENV"
    "PORT"
    "HOSTNAME"
    "NEXT_TELEMETRY_DISABLED"
)

# Check which are missing
echo "🔍 Checking for missing variables..."
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! echo "$CURRENT_VARS" | grep -q "^${var}$"; then
        MISSING_VARS+=("$var")
        echo "   ❌ Missing: $var"
    else
        echo "   ✅ Present: $var"
    fi
done

echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "🎉 All required variables are present!"
    echo ""
    echo "✅ Environment is configured correctly"
    echo ""
    echo "🔄 Next steps:"
    echo "   1. Redeploy the application"
    echo "   2. Wait ~10 minutes for build"
    echo "   3. Run migrations"
    echo "   4. Test health endpoint"
else
    echo "⚠️  Found ${#MISSING_VARS[@]} missing variable(s)"
    echo ""
    echo "Missing variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 You can add them manually via Coolify UI or run:"
    echo "   /home/avi/projects/mobile/add-env-api.sh"
fi

echo ""
echo "🌐 Application URL:"
echo "   https://coolify.theprofitplatform.com.au"
echo "   → Applications → mobile-repair-dashboard"
