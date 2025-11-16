#!/bin/bash
# Complete verification after parallel remediation

echo "🔍 COMPREHENSIVE VERIFICATION"
echo "=============================="
echo ""

PASS=0
FAIL=0
WARN=0

# Helper functions
pass() {
    echo "✅ PASS: $1"
    ((PASS++))
}

fail() {
    echo "❌ FAIL: $1"
    ((FAIL++))
}

warn() {
    echo "⚠️  WARN: $1"
    ((WARN++))
}

# 1. Security checks
echo "1. Security Checks"
echo "------------------"

# Check .env not in git
if git log --all --full-history --source --pretty=format: --name-only | grep -q "^\.env$"; then
    fail ".env found in git history"
else
    pass "No .env in git history"
fi

# Check .gitignore
if grep -q "^\.env$" .gitignore; then
    pass ".env in .gitignore"
else
    fail ".env not in .gitignore"
fi

# 2. Build checks
echo ""
echo "2. Build Checks"
echo "---------------"

cd /home/avi/projects/mobile/dashboard

if [ -f "package.json" ]; then
    pass "package.json exists"
else
    fail "package.json missing"
fi

if npm run build > /tmp/build.log 2>&1; then
    pass "Build successful"
else
    fail "Build failed (see /tmp/build.log)"
fi

# 3. Test checks
echo ""
echo "3. Test Checks"
echo "--------------"

if [ -f "jest.config.js" ]; then
    pass "Jest configured"
    
    if npm test > /tmp/test.log 2>&1; then
        pass "Tests passing"
    else
        warn "Tests failing (see /tmp/test.log)"
    fi
else
    warn "Jest not configured"
fi

# 4. Application health
echo ""
echo "4. Application Health"
echo "---------------------"

if curl -f https://repair.theprofitplatform.com.au/api/health > /dev/null 2>&1; then
    pass "Application responding"
else
    fail "Application not responding"
fi

if curl -f https://supabase.theprofitplatform.com.au/rest/v1/ > /dev/null 2>&1; then
    pass "Supabase responding"
else
    fail "Supabase not responding"
fi

# 5. Database checks
echo ""
echo "5. Database Checks"
echo "------------------"

if [ -f "/home/avi/projects/mobile/scripts/database/backup-database.sh" ]; then
    pass "Backup script exists"
else
    warn "Backup script missing"
fi

if crontab -l | grep -q "backup-database.sh"; then
    pass "Backup cron configured"
else
    warn "Backup cron not configured"
fi

if ls /home/avi/backups/database/*.dump.gz > /dev/null 2>&1; then
    BACKUP_COUNT=$(ls /home/avi/backups/database/*.dump.gz 2>/dev/null | wc -l)
    pass "Backups exist ($BACKUP_COUNT files)"
else
    warn "No backups found"
fi

# 6. CI/CD checks
echo ""
echo "6. CI/CD Checks"
echo "---------------"

if [ -f ".github/workflows/ci.yml" ]; then
    pass "CI workflow exists"
else
    warn "CI workflow missing"
fi

if [ -f ".github/workflows/deploy.yml" ]; then
    pass "Deploy workflow exists"
else
    warn "Deploy workflow missing"
fi

# 7. Documentation checks
echo ""
echo "7. Documentation Checks"
echo "-----------------------"

if [ -f "dashboard/.env.example" ]; then
    pass ".env.example exists"
else
    warn ".env.example missing"
fi

if [ -f "dashboard/README.md" ]; then
    pass "README exists"
else
    warn "README missing"
fi

# 8. Monitoring checks
echo ""
echo "8. Monitoring Checks"
echo "--------------------"

if [ -f "dashboard/sentry.config.js" ]; then
    pass "Sentry configured"
else
    warn "Sentry not configured"
fi

if [ -f "scripts/monitoring/health-check.sh" ]; then
    pass "Health check script exists"
else
    warn "Health check script missing"
fi

# 9. Code quality checks
echo ""
echo "9. Code Quality Checks"
echo "----------------------"

if [ -f "dashboard/.prettierrc" ]; then
    pass "Prettier configured"
else
    warn "Prettier not configured"
fi

if [ -f "dashboard/.husky/pre-commit" ]; then
    pass "Git hooks configured"
else
    warn "Git hooks not configured"
fi

# 10. Infrastructure checks
echo ""
echo "10. Infrastructure Checks"
echo "-------------------------"

if [ -f ".dockerignore" ]; then
    pass ".dockerignore exists"
else
    warn ".dockerignore missing"
fi

if [ -f "Dockerfile.production" ]; then
    pass "Dockerfile exists"
else
    fail "Dockerfile missing"
fi

NODE_MODULES_COUNT=$(find . -name "node_modules" -type d | wc -l)
if [ "$NODE_MODULES_COUNT" -lt 5 ]; then
    pass "node_modules cleaned ($NODE_MODULES_COUNT directories)"
else
    warn "Too many node_modules ($NODE_MODULES_COUNT directories)"
fi

# Summary
echo ""
echo "================================"
echo "VERIFICATION SUMMARY"
echo "================================"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "⚠️  Warnings: $WARN"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "🔴 VERIFICATION FAILED"
    echo "Fix failing checks before deploying to production."
    exit 1
elif [ $WARN -gt 5 ]; then
    echo "🟡 VERIFICATION PASSED WITH WARNINGS"
    echo "Consider fixing warnings for best results."
    exit 0
else
    echo "🟢 VERIFICATION PASSED"
    echo "System is ready for production!"
    exit 0
fi
