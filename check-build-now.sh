#!/bin/bash

cd /home/avi/projects/coolify/coolify-mcp
source <(grep -v '^#' .env | grep -v '^$' | sed 's/^/export /')

echo "🔍 Quick Build Status Check"
echo "============================"
echo ""

echo "📊 App Status:"
curl -s -H "Authorization: Bearer $COOLIFY_TOKEN" \
    "$COOLIFY_BASE_URL/api/v1/applications/zccwogo8g4884gwcgwk4wwoc" | \
    python3 -c "import sys, json; app = json.load(sys.stdin); print('  Status:', app.get('status')); print('  Updated:', app.get('updated_at'))"

echo ""
echo "🐳 Docker Status:"
CONTAINER=$(docker ps -a | grep zccwogo8g4884gwcgwk4wwoc | wc -l)
IMAGE=$(docker images | grep zccwogo8g4884gwcgwk4wwoc | wc -l)
echo "  Containers: $CONTAINER"
echo "  Images: $IMAGE"

echo ""
echo "🏥 Health Check:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://zccwogo8g4884gwcgwk4wwoc.31.97.222.218.sslip.io/api/health 2>/dev/null)
echo "  HTTP Status: $HTTP_CODE"

echo ""
if [ "$CONTAINER" -gt 0 ]; then
    echo "✅ Container exists! Checking logs..."
    docker logs $(docker ps -a | grep zccwogo8g4884gwcgwk4wwoc | awk '{print $1}' | head -1) 2>&1 | tail -20
elif [ "$IMAGE" -gt 0 ]; then
    echo "📦 Image built! Waiting for container to start..."
else
    echo "⏳ Build in progress... (no container or image yet)"
fi
