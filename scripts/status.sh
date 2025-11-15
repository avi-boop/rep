#!/bin/bash
# Quick script to check project status

echo "📊 Mobile Repair Dashboard - Status"
echo "════════════════════════════════════════"
echo ""

# Current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current Branch: $CURRENT_BRANCH"
echo ""

# Uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 Uncommitted Changes:"
    git status -s
    echo ""
else
    echo "✅ No uncommitted changes"
    echo ""
fi

# Recent commits
echo "📜 Recent Commits (last 5):"
git log --oneline -5
echo ""

# Branch comparison
echo "🔄 Branch Status:"
echo "  main: $(git rev-parse --short main)"
echo "  dev:  $(git rev-parse --short dev)"
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "  $CURRENT_BRANCH: $(git rev-parse --short $CURRENT_BRANCH)"
fi
echo ""

# Check if branches are in sync
MAIN_BEHIND=$(git rev-list --count main..dev 2>/dev/null || echo "0")
DEV_BEHIND=$(git rev-list --count dev..main 2>/dev/null || echo "0")

if [ "$MAIN_BEHIND" -gt 0 ]; then
    echo "⚠️  main is $MAIN_BEHIND commit(s) behind dev"
fi
if [ "$DEV_BEHIND" -gt 0 ]; then
    echo "⚠️  dev is $DEV_BEHIND commit(s) behind main"
fi

if [ "$MAIN_BEHIND" -eq 0 ] && [ "$DEV_BEHIND" -eq 0 ]; then
    echo "✅ main and dev are in sync"
fi

echo ""
echo "💡 Quick Commands:"
echo "  Start new feature:      ./scripts/new-feature.sh feature-name"
echo "  Deploy to preview:      ./scripts/deploy-dev.sh 'message'"
echo "  Deploy to production:   ./scripts/deploy-production.sh"
