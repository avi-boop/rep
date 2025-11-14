#!/bin/bash

# =============================================================================
# Deployment Verification Script
# Run this after deploying to Coolify to verify everything works
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_URL="${1:-http://localhost:3000}"
echo "Testing deployment at: $APP_URL"
echo "======================================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check Endpoint${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    exit 1
fi
echo ""

# Test 2: Pricing API (should return paginated data or empty array)
echo -e "${YELLOW}Test 2: Pricing API${NC}"
PRICING_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/api/pricing?page=1&pageSize=10")
HTTP_CODE=$(echo "$PRICING_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Pricing API accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Pricing API failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: Login Endpoint (should return 400/401, not 500)
echo -e "${YELLOW}Test 3: Authentication Endpoint${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$APP_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ Auth endpoint working (HTTP $HTTP_CODE)${NC}"
    echo "Note: 400/401 is expected for invalid credentials"
elif [ "$HTTP_CODE" -eq 500 ]; then
    echo -e "${RED}✗ Auth endpoint error (HTTP $HTTP_CODE)${NC}"
    echo "This might indicate a database connection issue"
else
    echo -e "${YELLOW}⚠ Unexpected status (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 4: Rate Limiting
echo -e "${YELLOW}Test 4: Rate Limiting${NC}"
echo "Making 6 rapid login attempts..."
RATE_LIMITED=false
for i in {1..6}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$APP_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 429 ]; then
        echo -e "${GREEN}✓ Rate limiting working (attempt $i blocked)${NC}"
        RATE_LIMITED=true
        break
    fi
    sleep 0.5
done

if [ "$RATE_LIMITED" = false ]; then
    echo -e "${YELLOW}⚠ Rate limiting may not be working${NC}"
    echo "Expected 429 status after 5 attempts"
fi
echo ""

# Test 5: Static Pages
echo -e "${YELLOW}Test 5: Dashboard UI${NC}"
DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/dashboard")
HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Dashboard accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Dashboard failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 6: Check Headers (Security)
echo -e "${YELLOW}Test 6: Security Headers${NC}"
HEADERS=$(curl -s -I "$APP_URL/api/health")

if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✓ X-Frame-Options header present${NC}"
else
    echo -e "${YELLOW}⚠ X-Frame-Options header missing${NC}"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✓ X-Content-Type-Options header present${NC}"
else
    echo -e "${YELLOW}⚠ X-Content-Type-Options header missing${NC}"
fi
echo ""

# Summary
echo "======================================="
echo -e "${GREEN}Deployment Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check Coolify logs for any errors"
echo "2. Run Prisma migrations if not done yet:"
echo "   npx prisma migrate deploy"
echo "3. Create first user in database"
echo "4. Test full authentication flow"
echo ""
echo "Access your dashboard at:"
echo "$APP_URL/dashboard"
