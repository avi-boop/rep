#!/bin/bash
# Merge all parallel PRs in correct order

set -e

echo "🔄 MERGING PARALLEL WORK"
echo "========================"
echo ""

cd /home/avi/projects/mobile

# Check all branches exist
BRANCHES=(
    "fix/documentation"
    "fix/monitoring"
    "fix/testing-ci"
    "fix/code-quality"
    "fix/infrastructure-cleanup"
)

echo "Checking branches..."
for branch in "${BRANCHES[@]}"; do
    if git rev-parse --verify "$branch" > /dev/null 2>&1; then
        echo "✅ $branch exists"
    else
        echo "❌ $branch not found!"
        exit 1
    fi
done

echo ""
echo "All branches found. Starting merge..."
echo ""

# Update main
git checkout main
git pull origin main

# Merge in order (least to most likely conflicts)
echo "1. Merging documentation..."
git merge --no-ff fix/documentation -m "Merge: Documentation & API specs"

echo "2. Merging monitoring..."
git merge --no-ff fix/monitoring -m "Merge: Monitoring & observability"

echo "3. Merging testing..."
git merge --no-ff fix/testing-ci -m "Merge: Testing & CI/CD"

echo "4. Merging code quality..."
git merge --no-ff fix/code-quality -m "Merge: Code quality improvements"

echo "5. Merging infrastructure..."
git merge --no-ff fix/infrastructure-cleanup -m "Merge: Infrastructure cleanup"

echo ""
echo "✅ All branches merged!"
echo ""

# Verify build
echo "🔨 Building application..."
cd dashboard
npm ci
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    echo "Fix issues before deploying."
    exit 1
fi

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Merge complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git log --oneline -20"
echo "  2. Push to main: git push origin main"
echo "  3. Monitor deployment"
echo "  4. Run verification: ./scripts/verify-all.sh"
