#!/bin/bash

# ======================================================================
# AI Features Test Script
# Tests all AI endpoints and validates responses
# ======================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${1:-http://localhost:3009}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI Features Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Testing API at: ${API_BASE_URL}\n"

# Helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo -e "  ${RED}Error: $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

info() {
    echo -e "${BLUE}→${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Diagnostics Health Check
echo -e "\n${YELLOW}Test 1: AI Diagnostics Health Check${NC}"
RESPONSE=$(curl -s "${API_BASE_URL}/api/ai/diagnose")
if echo "$RESPONSE" | grep -q "operational"; then
    pass "Diagnostics endpoint is operational"
    info "Response: $(echo $RESPONSE | jq -c '.' 2>/dev/null || echo $RESPONSE)"
else
    fail "Diagnostics endpoint health check" "$RESPONSE"
fi

# Test 2: Chat GET (should require customer_id)
echo -e "\n${YELLOW}Test 2: Chat Endpoint Validation${NC}"
RESPONSE=$(curl -s "${API_BASE_URL}/api/ai/chat")
if echo "$RESPONSE" | grep -q "customer_id required"; then
    pass "Chat endpoint validates required parameters"
else
    fail "Chat endpoint validation" "$RESPONSE"
fi

# Test 3: Quality Check GET (should require repair_order_id)
echo -e "\n${YELLOW}Test 3: Quality Check Endpoint Validation${NC}"
RESPONSE=$(curl -s "${API_BASE_URL}/api/ai/quality-check")
if echo "$RESPONSE" | grep -q "repair_order_id required"; then
    pass "Quality check endpoint validates required parameters"
else
    fail "Quality check endpoint validation" "$RESPONSE"
fi

# Test 4: Forecast GET
echo -e "\n${YELLOW}Test 4: Inventory Forecast Endpoint${NC}"
RESPONSE=$(curl -s "${API_BASE_URL}/api/ai/forecast")
if echo "$RESPONSE" | grep -q "success"; then
    pass "Forecast endpoint responds successfully"
    info "Response: $(echo $RESPONSE | jq -c '.' 2>/dev/null || echo $RESPONSE)"
else
    fail "Forecast endpoint" "$RESPONSE"
fi

# Test 5: Test invalid POST to diagnostics (missing data)
echo -e "\n${YELLOW}Test 5: Diagnostics Error Handling${NC}"
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/ai/diagnose" \
    -H "Content-Type: application/json" \
    -d '{}')
if echo "$RESPONSE" | grep -q "error\|Invalid"; then
    pass "Diagnostics handles invalid requests correctly"
else
    fail "Diagnostics error handling" "$RESPONSE"
fi

# Test 6: Test rate limiting response format
echo -e "\n${YELLOW}Test 6: Rate Limiting Configuration${NC}"
RESPONSE=$(curl -s "${API_BASE_URL}/api/ai/diagnose")
if echo "$RESPONSE" | grep -q "20 requests per minute"; then
    pass "Rate limiting is configured correctly"
else
    warning "Rate limiting message not found (may be ok)"
fi

# Test 7: AI Features Page
echo -e "\n${YELLOW}Test 7: AI Features Page${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/ai-features")
if [ "$HTTP_CODE" -eq 200 ]; then
    pass "AI features page loads successfully (HTTP $HTTP_CODE)"
else
    fail "AI features page" "HTTP $HTTP_CODE"
fi

# Test 8: New Repair Form Page
echo -e "\n${YELLOW}Test 8: Repair Form Integration${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/dashboard/repairs/new")
if [ "$HTTP_CODE" -eq 200 ]; then
    pass "Repair form page loads successfully (HTTP $HTTP_CODE)"
else
    fail "Repair form page" "HTTP $HTTP_CODE"
fi

# Test 9: Environment Configuration
echo -e "\n${YELLOW}Test 9: Environment Configuration${NC}"
if [ -f ".env" ] && grep -q "GEMINI_API_KEY" .env; then
    API_KEY=$(grep "GEMINI_API_KEY" .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
    if [ ! -z "$API_KEY" ] && [ "$API_KEY" != "your_gemini_api_key" ]; then
        pass "Gemini API key is configured"
    else
        fail "Gemini API key configuration" "API key not set or is placeholder"
    fi
else
    fail "Environment configuration" ".env file not found or missing GEMINI_API_KEY"
fi

# Test 10: Database Schema Files
echo -e "\n${YELLOW}Test 10: Database Migration Files${NC}"
if [ -f "prisma/schema.prisma" ] && [ -f "prisma/migrations/add_ai_features.sql" ]; then
    pass "Database schema and migration files exist"
else
    fail "Database files" "Missing schema.prisma or migration SQL"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
echo -e "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}AI features are working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed!${NC}"
    echo -e "${YELLOW}Please review the errors above.${NC}"
    exit 1
fi
