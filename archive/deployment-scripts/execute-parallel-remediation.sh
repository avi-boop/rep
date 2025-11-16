#!/bin/bash
# PARALLEL EXECUTION AUTOMATION
# WARNING: This is AGGRESSIVE - use with caution!

set -e  # Exit on error

echo "⚡ PARALLEL REMEDIATION EXECUTION"
echo "================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "  - Rewrite git history"
echo "  - Rotate ALL credentials"
echo "  - Make significant changes"
echo "  - Require 3-5 developers"
echo ""
read -p "Are you SURE? (type 'YES'): " confirm

if [ "$confirm" != "YES" ]; then
    echo "Cancelled."
    exit 1
fi

PROJECT_DIR="/home/avi/projects/mobile"
cd "$PROJECT_DIR"

# Backup
echo "📦 Creating backup..."
BACKUP_FILE=~/backup-parallel-$(date +%Y%m%d-%H%M%S).tar.gz
tar -czf "$BACKUP_FILE" .
echo "✅ Backup created: $BACKUP_FILE"

# ========================================
# WAVE 1: SEQUENTIAL (Lead Developer Only)
# ========================================

echo ""
echo "🚨 WAVE 1: EMERGENCY FIXES (Sequential)"
echo "========================================"
echo "This must complete before Wave 2 starts!"
echo ""

# Check if Wave 1 already done
if git log --all -- .env 2>/dev/null | grep -q ".env"; then
    echo "🔴 Wave 1 NOT complete - .env still in git"
    echo ""
    echo "LEAD DEVELOPER: Execute Wave 1 manually:"
    echo "  1. Remove .env from git history"
    echo "  2. Rotate all credentials"
    echo "  3. Update Coolify"
    echo "  4. Fix PostgREST"
    echo "  5. Push changes"
    echo ""
    echo "See: docs/REMEDIATION_PLAN.md Phase 1"
    echo ""
    read -p "Press Enter after Wave 1 is complete..."
else
    echo "✅ Wave 1 appears complete - .env not in git"
fi

# Verify application is working
echo ""
echo "🔍 Verifying application..."
if curl -f https://repair.theprofitplatform.com.au/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "❌ Application not responding!"
    echo "Fix this before continuing."
    exit 1
fi

# ========================================
# WAVE 2: PARALLEL EXECUTION
# ========================================

echo ""
echo "🔥 WAVE 2: PARALLEL EXECUTION"
echo "=============================="
echo ""
echo "Now 3-5 developers should work in parallel:"
echo ""
echo "TRACK A (Dev 1): Infrastructure cleanup"
echo "  Branch: fix/infrastructure-cleanup"
echo "  Time: 6-8 hours"
echo ""
echo "TRACK B (Dev 2): Code quality"
echo "  Branch: fix/code-quality"  
echo "  Time: 6-8 hours"
echo ""
echo "TRACK C (Dev 3): Testing & CI/CD"
echo "  Branch: fix/testing-ci"
echo "  Time: 6-8 hours"
echo ""
echo "TRACK D (Dev 4): Documentation"
echo "  Branch: fix/documentation"
echo "  Time: 4-6 hours"
echo ""
echo "TRACK E (Dev 5): Monitoring"
echo "  Branch: fix/monitoring"
echo "  Time: 4-6 hours"
echo ""
echo "Each developer should:"
echo "  1. git checkout main"
echo "  2. git pull"
echo "  3. git checkout -b <branch-name>"
echo "  4. Execute their track from PARALLEL_EXECUTION_PLAN.md"
echo "  5. Create PR when done"
echo ""
echo "COORDINATOR: Wait for all PRs, then merge in order."
echo ""
echo "See: PARALLEL_EXECUTION_PLAN.md for detailed instructions"
echo ""

# Create branch status tracker
cat > PARALLEL_STATUS.md <<EOF
# Parallel Execution Status

Started: $(date)

## Wave 1: Emergency ⚠️
- [x] Remove .env from git
- [x] Rotate credentials  
- [x] Fix PostgREST
- [x] Push changes

## Wave 2: Parallel Tracks

### Track A: Infrastructure [  ]
- Branch: fix/infrastructure-cleanup
- Assignee: Dev 1
- Status: Not Started
- PR: 

### Track B: Code Quality [  ]
- Branch: fix/code-quality
- Assignee: Dev 2
- Status: Not Started
- PR:

### Track C: Testing & CI [  ]
- Branch: fix/testing-ci
- Assignee: Dev 3
- Status: Not Started
- PR:

### Track D: Documentation [  ]
- Branch: fix/documentation
- Assignee: Dev 4
- Status: Not Started
- PR:

### Track E: Monitoring [  ]
- Branch: fix/monitoring
- Assignee: Dev 5
- Status: Not Started
- PR:

## Notes
- Add notes here as work progresses
EOF

echo "✅ Created PARALLEL_STATUS.md for tracking"
echo ""
echo "👥 Notify your team to start their tracks!"
echo ""
echo "When all PRs are ready, run: ./merge-parallel-prs.sh"
