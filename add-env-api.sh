#!/bin/bash

# Add environment variables to Coolify via API
set -e

cd /home/avi/projects/coolify/coolify-mcp
source <(grep -v '^#' .env | grep -v '^$' | sed 's/^/export /')

APP_UUID="zccwogo8g4884gwcgwk4wwoc"

echo "🚀 Adding environment variables to mobile-repair-dashboard"
echo ""

# Function to add/update environment variable
add_env_var() {
    local key="$1"
    local value="$2"
    local is_preview="${3:-false}"
    
    echo "📝 Adding: $key"
    
    # Escape special characters in value for JSON
    value_escaped=$(echo "$value" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))" | sed 's/^"//; s/"$//')
    
    response=$(curl -s -w "\n%{http_code}" \
        -X PATCH \
        -H "Authorization: Bearer $COOLIFY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"key\": \"$key\", \"value\": \"$value_escaped\", \"is_preview\": $is_preview, \"is_build_time\": false, \"is_literal\": false}" \
        "$COOLIFY_BASE_URL/api/v1/applications/$APP_UUID/envs")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "   ✅ Success"
    else
        echo "   ⚠️  Status: $http_code"
        echo "   Response: $body"
    fi
    
    sleep 0.5  # Rate limiting
}

# Add all environment variables
echo "Adding core variables..."
add_env_var "DATABASE_URL" "postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public"
add_env_var "DIRECT_URL" "postgresql://postgres:rdqihD49wGAO78VpUY7QdG0EJewepwyk@31.97.222.218:54322/postgres?schema=public"
add_env_var "NEXTAUTH_SECRET" "a7d09394107e07093d1b5b9c40ad40927c31f3923e12ccbfb8a9bc3e161ca3524b8563fa8722939230a1a90dfedf3e218f67b6fcd4c22c858757692c5ab545a0"
add_env_var "NEXTAUTH_URL" "https://repair.theprofitplatform.com.au"
add_env_var "JWT_SECRET" "9476bbfcf491a9ddb87cd160df8617916d4a3dd43f3ae081af19bed9849e339b191467635a769275b7eab966c38fd790e2dda870eaa7213e71363b4943271ff7"
add_env_var "REFRESH_TOKEN_SECRET" "c8aac81b2b6f0cccccc657fc0cc0c965e48beb5da62201c2a5197d00b93fee21e325c4f9f05745a541d0a625b9e3035bf6005b75cd0e3f11100486a68d91ee49"
add_env_var "JWT_EXPIRES_IN" "24h"
add_env_var "REFRESH_TOKEN_EXPIRES_IN" "7d"
add_env_var "SESSION_SECRET" "IeefGC4flJDVJVdLXsHCCvOYIJnI4TvGbisH84KKuVY="
add_env_var "REDIS_URL" "redis://repair-redis:6379"
add_env_var "NODE_ENV" "production"
add_env_var "PORT" "3000"
add_env_var "HOSTNAME" "0.0.0.0"
add_env_var "NEXT_TELEMETRY_DISABLED" "1"

echo ""
echo "Adding optional integration variables..."
add_env_var "LIGHTSPEED_DOMAIN_PREFIX" "metrowireless"
add_env_var "LIGHTSPEED_PERSONAL_TOKEN" "tphAEzTnEqLMnBmpRNHG10dxYbU4iLz1EQ0B2PCA"
add_env_var "GEMINI_API_KEY" "AIzaSyCZ-48DwWrZEj3jcCUKsj4wW4vQHfDAP4M"
add_env_var "GEMINI_API_URL" "https://generativelanguage.googleapis.com/v1beta"
add_env_var "FROM_EMAIL" "noreply@theprofitplatform.com.au"

echo ""
echo "✅ Environment variables added!"
echo ""
echo "🔄 Next steps:"
echo "   1. Trigger redeployment (see below)"
echo "   2. Wait ~10 minutes for build"
echo "   3. Run migrations"
echo "   4. Test health endpoint"
