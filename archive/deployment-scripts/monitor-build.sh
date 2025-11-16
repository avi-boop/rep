#!/bin/bash

# Monitor the Coolify build in real-time

set -e

cd /home/avi/projects/coolify/coolify-mcp
source <(grep -v '^#' .env | grep -v '^$' | sed 's/^/export /')

APP_UUID="zccwogo8g4884gwcgwk4wwoc"
APP_URL="http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io"

echo "🔍 Monitoring mobile-repair-dashboard Build"
echo "==========================================="
echo ""

# Function to check build status
check_status() {
    curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
        "$COOLIFY_BASE_URL/api/v1/applications/$APP_UUID" | \
        python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))" 2>/dev/null || echo "unknown"
}

# Function to check if container is running
check_container() {
    if docker ps | grep -q "$APP_UUID"; then
        echo "running"
    elif docker ps -a | grep -q "$APP_UUID"; then
        echo "exited"
    else
        echo "not_found"
    fi
}

# Function to check health endpoint
check_health() {
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || echo "000")
    echo "$code"
}

echo "📊 Initial Status:"
STATUS=$(check_status)
CONTAINER=$(check_container)
echo "  App Status: $STATUS"
echo "  Container: $CONTAINER"
echo ""

echo "⏳ Monitoring build progress..."
echo "   Press Ctrl+C to stop monitoring"
echo ""

# Monitor for 15 minutes (90 iterations * 10 seconds)
for i in {1..90}; do
    STATUS=$(check_status)
    CONTAINER=$(check_container)
    
    echo -ne "\r[$i/90] Status: $STATUS | Container: $CONTAINER     "
    
    # Check if build succeeded
    if [ "$STATUS" = "running" ] || [ "$STATUS" = "healthy" ]; then
        echo ""
        echo ""
        echo "✅ Build completed successfully!"
        echo ""
        
        # Check health endpoint
        echo "🏥 Testing health endpoint..."
        HEALTH=$(check_health)
        
        if [ "$HEALTH" = "200" ]; then
            echo "✅ Health check passed! (HTTP $HEALTH)"
            echo ""
            echo "🎉 Application is running!"
            echo ""
            echo "📋 Next Steps:"
            echo "   1. ✅ Build: Complete"
            echo "   2. ⏳ Migrations: Run manually"
            echo "      docker exec -it \$(docker ps | grep $APP_UUID | awk '{print \$1}') npx prisma migrate deploy"
            echo "   3. ✅ Test: $APP_URL/api/health"
            echo ""
            exit 0
        else
            echo "⚠️  Health check: HTTP $HEALTH"
            echo ""
            echo "💡 Next steps:"
            echo "   1. Check if app needs migrations"
            echo "   2. Run: docker exec -it \$(docker ps | grep $APP_UUID | awk '{print \$1}') npx prisma migrate deploy"
            echo "   3. Check logs: docker logs \$(docker ps | grep $APP_UUID | awk '{print \$1}')"
            echo ""
        fi
        break
    fi
    
    # Check if build failed
    if [ "$STATUS" = "exited:unhealthy" ] && [ "$CONTAINER" != "running" ]; then
        if [ $i -gt 10 ]; then  # Give it at least 100 seconds
            echo ""
            echo ""
            echo "❌ Build appears to have failed"
            echo ""
            echo "🔍 Debugging steps:"
            echo "   1. Check logs in Coolify UI:"
            echo "      https://coolify.theprofitplatform.com.au/project/woc8ocogwoks4oc8oscswggw/application/$APP_UUID"
            echo ""
            echo "   2. Check Docker images:"
            echo "      docker images | grep $APP_UUID"
            echo ""
            echo "   3. Check container logs if it exists:"
            echo "      docker logs \$(docker ps -a | grep $APP_UUID | awk '{print \$1}' | head -1)"
            echo ""
            exit 1
        fi
    fi
    
    sleep 10
done

echo ""
echo ""
echo "⏱️  Build is taking longer than expected (15 minutes)"
echo ""
echo "📊 Current Status:"
echo "  App: $STATUS"
echo "  Container: $CONTAINER"
echo ""
echo "💡 Continue monitoring in Coolify UI:"
echo "   https://coolify.theprofitplatform.com.au/project/woc8ocogwoks4oc8oscswggw/application/$APP_UUID"
