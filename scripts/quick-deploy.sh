#!/bin/bash
# Quick deployment script - runs all the commands you need

echo "🚀 Mobile Repair Dashboard - Quick Deploy"
echo "════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "dashboard" ]; then
    echo "❌ Error: Please run this from the project root (/home/avi/projects/mobile)"
    exit 1
fi

echo "📋 What do you want to do?"
echo ""
echo "1) Generate secrets for Coolify"
echo "2) Test preview deployment (push to dev)"
echo "3) Deploy to production (merge dev to main)"
echo "4) Check status"
echo "5) View deployment logs"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔐 Generating secrets..."
        ./scripts/generate-secrets.sh
        echo ""
        echo "💡 Copy these to your Coolify apps' environment variables"
        ;;
    2)
        echo ""
        echo "🧪 Testing preview deployment..."
        git checkout dev
        git pull origin dev
        
        read -p "Make a test commit? (y/n): " commit
        if [ "$commit" = "y" ]; then
            echo "# Test deployment - $(date)" >> .deployment-test
            git add .deployment-test
            git commit -m "test: verify preview deployment workflow"
        fi
        
        echo "📤 Pushing to dev branch..."
        git push origin dev
        
        echo ""
        echo "✅ Pushed to dev!"
        echo "🔗 Check deployment:"
        echo "   - GitHub Actions: https://github.com/avi-boop/rep/actions"
        echo "   - Coolify dashboard → mobile-repair-preview"
        echo "   - Wait 3-5 minutes, then check your preview URL"
        ;;
    3)
        echo ""
        echo "🚀 Deploying to PRODUCTION"
        echo ""
        echo "⚠️  WARNING: This deploys to your live site!"
        echo ""
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "❌ Cancelled"
            exit 0
        fi
        
        echo ""
        echo "🔄 Merging dev to main..."
        git checkout main
        git pull origin main
        git merge dev --no-edit
        
        echo ""
        echo "📋 Changes being deployed:"
        git log origin/main..main --oneline | head -5
        
        echo ""
        read -p "Push to production? (yes/no): " final
        
        if [ "$final" != "yes" ]; then
            echo "❌ Cancelled"
            echo "💡 Run 'git reset --hard origin/main' to undo merge"
            exit 0
        fi
        
        echo "📤 Pushing to main..."
        git push origin main
        
        echo ""
        echo "✅ Deployed to PRODUCTION!"
        echo "🔗 Check deployment:"
        echo "   - GitHub Actions: https://github.com/avi-boop/rep/actions"
        echo "   - Coolify dashboard → mobile-repair-production"
        echo "   - Wait 3-5 minutes, then check your production URL"
        ;;
    4)
        echo ""
        ./scripts/status.sh
        ;;
    5)
        echo ""
        echo "📊 Deployment Logs"
        echo "════════════════════════════════════════════"
        echo ""
        echo "View logs at:"
        echo "  - GitHub Actions: https://github.com/avi-boop/rep/actions"
        echo "  - Coolify Preview: Check mobile-repair-preview app logs"
        echo "  - Coolify Production: Check mobile-repair-production app logs"
        echo ""
        echo "Recent commits:"
        git log --oneline -10
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
