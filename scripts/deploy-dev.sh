#!/bin/bash
# Quick script to deploy current branch to dev environment

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: ./scripts/deploy-dev.sh 'your commit message'"
    echo "Example: ./scripts/deploy-dev.sh 'feat: add customer search'"
    exit 1
fi

COMMIT_MSG=$1
CURRENT_BRANCH=$(git branch --show-current)

echo "🚀 Deploying to dev environment"
echo "📝 Current branch: $CURRENT_BRANCH"
echo ""

# Save current work
echo "💾 Saving your changes..."
git add .
git commit -m "$COMMIT_MSG" || echo "Nothing new to commit"

# Switch to dev and merge
echo "🔄 Merging to dev branch..."
git checkout dev
git pull origin dev
git merge "$CURRENT_BRANCH" --no-edit

# Push to trigger deployment
echo "📤 Pushing to GitHub (triggers Coolify deployment)..."
git push origin dev

# Go back to feature branch
git checkout "$CURRENT_BRANCH"

echo ""
echo "✅ Deployed to dev!"
echo "🔗 Check your preview URL in 2-5 minutes"
echo "📊 View deployment status in Coolify dashboard"
echo ""
echo "💡 When ready for production: ./scripts/deploy-production.sh"
