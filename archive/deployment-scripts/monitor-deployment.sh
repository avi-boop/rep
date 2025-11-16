#!/bin/bash

# Monitor mobile-repair-dashboard deployment status
set -e

cd /home/avi/projects/coolify/coolify-mcp
source <(grep -v '^#' .env | grep -v '^$' | sed 's/^/export /')

APP_UUID="zccwogo8g4884gwcgwk4wwoc"
DEPLOYMENT_UUID="wwo4s4wwo4ockgcokcggc48k"
APP_URL="http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io"

echo "🔍 Monitoring mobile-repair-dashboard deployment"
echo "==============================================="
echo ""
echo "App UUID: $APP_UUID"
echo "Deployment UUID: $DEPLOYMENT_UUID"
echo ""

# Function to check deployment status
check_status() {
    local response=$(curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
        "$COOLIFY_BASE_URL/api/v1/applications/$APP_UUID")
    
    local status=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))" 2>/dev/null || echo "unknown")
    
    echo "$status"
}

# Function to check if app is responding
check_health() {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || echo "000")
    echo "$http_code"
}

# Monitor deployment
echo "⏳ Monitoring deployment status..."
echo ""

for i in {1..120}; do  # Monitor for up to 20 minutes (120 * 10 seconds)
    STATUS=$(check_status)
    
    echo -ne "\r[$i/120] Status: $STATUS     "
    
    if [ "$STATUS" = "running" ] || [ "$STATUS" = "healthy" ]; then
        echo ""
        echo ""
        echo "✅ Deployment appears to be running!"
        echo ""
        
        # Check if health endpoint is responding
        echo "🏥 Checking health endpoint..."
        HEALTH_CODE=$(check_health)
        
        if [ "$HEALTH_CODE" = "200" ]; then
            echo "✅ Health check passed! (HTTP $HEALTH_CODE)"
            echo ""
            echo "🎉 Deployment successful!"
            echo ""
            echo "📋 Next Steps:"
            echo "   1. ✅ Environment variables: Configured"
            echo "   2. ✅ Deployment: Complete"
            echo "   3. ⏳ Run migrations:"
            echo "      docker exec -it <container-id> npx prisma migrate deploy"
            echo "   4. ✅ Test health: $APP_URL/api/health"
            echo ""
            echo "🌐 Application URL:"
            echo "   $APP_URL"
            echo ""
            exit 0
        else
            echo "⚠️  Health check returned HTTP $HEALTH_CODE"
            echo ""
            echo "💡 This might be normal during startup. Next steps:"
            echo "   1. Wait a few more minutes for the app to fully start"
            echo "   2. Run migrations: npx prisma migrate deploy"
            echo "   3. Check logs: docker logs <container-id>"
            echo ""
        fi
        
        break
    fi
    
    sleep 10
done

echo ""
echo ""
echo "📊 Deployment Status: $STATUS"
echo ""
echo "💡 Next Steps:"
echo "   1. Check deployment logs in Coolify UI"
echo "   2. URL: https://coolify.theprofitplatform.com.au"
echo "   3. Navigate to: Applications → mobile-repair-dashboard → Logs"
echo ""
echo "🔄 To continue monitoring, run this script again:"
echo "   /home/avi/projects/mobile/monitor-deployment.sh"
