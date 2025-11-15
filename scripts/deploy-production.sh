#!/bin/bash
# Quick script to deploy dev to production

echo "🚀 Deploying to PRODUCTION"
echo ""
echo "⚠️  WARNING: This will deploy to your live production site!"
echo ""
read -p "Are you sure dev is tested and ready? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔄 Merging dev to main..."

# Switch to main and merge dev
git checkout main
git pull origin main
git merge dev --no-edit

# Show what's being deployed
echo ""
echo "📋 Changes being deployed:"
git log origin/main..main --oneline

echo ""
read -p "Push to production? (yes/no): " final_confirm

if [ "$final_confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    echo "💡 Run 'git reset --hard origin/main' to undo merge"
    exit 1
fi

# Push to trigger production deployment
echo "📤 Pushing to GitHub (triggers Coolify production deployment)..."
git push origin main

echo ""
echo "✅ Deployed to PRODUCTION!"
echo "🔗 Check your production URL in 2-5 minutes"
echo "📊 View deployment status in Coolify dashboard"
echo ""
echo "🎉 Great work!"
