#!/bin/bash
# Quick script to start a new feature branch

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a feature name"
    echo "Usage: ./scripts/new-feature.sh feature-name"
    echo "Example: ./scripts/new-feature.sh add-sms-notifications"
    exit 1
fi

FEATURE_NAME=$1

echo "🚀 Creating new feature branch: feature/$FEATURE_NAME"
echo ""

# Make sure we're on dev and it's up to date
echo "📥 Updating dev branch..."
git checkout dev
git pull origin dev

# Create new feature branch
echo "🌿 Creating feature branch..."
git checkout -b "feature/$FEATURE_NAME"

echo ""
echo "✅ Ready to code!"
echo "📝 Your branch: feature/$FEATURE_NAME"
echo ""
echo "Next steps:"
echo "  1. Make your changes"
echo "  2. git add ."
echo "  3. git commit -m 'feat: description'"
echo "  4. ./scripts/deploy-dev.sh to test on preview"
