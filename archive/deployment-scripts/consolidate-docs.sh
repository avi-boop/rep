#!/bin/bash
# Documentation Consolidation Script
# Organizes 151 documentation files into proper structure

cd /home/avi/projects/mobile

echo "📚 Starting documentation consolidation..."

# Move deployment-related docs
echo "Moving deployment docs..."
mv COOLIFY*.md COOLIFY*.txt docs/deployment/ 2>/dev/null
mv DEPLOY*.md docs/deployment/ 2>/dev/null
mv DEPLOYMENT*.md DEPLOYMENT*.txt docs/deployment/ 2>/dev/null
mv DOCKER*.md docs/deployment/ 2>/dev/null
mv Dockerfile.production docs/deployment/ 2>/dev/null
mv CLAUDE-CODE-COOLIFY-SETUP.md docs/deployment/ 2>/dev/null
mv COOLIFY-CLAUDE-INTEGRATION.md docs/deployment/ 2>/dev/null
mv DROID-COOLIFY-MCP-SETUP.md docs/deployment/ 2>/dev/null
mv PUSH-DOCKERFILE.md docs/deployment/ 2>/dev/null

# Move architecture docs
echo "Moving architecture docs..."
mv ARCHITECTURE*.md docs/architecture/ 2>/dev/null
mv API*.md docs/architecture/ 2>/dev/null
mv BACKEND*.md docs/architecture/ 2>/dev/null
mv FRONTEND*.md docs/architecture/ 2>/dev/null
mv TECH_STACK.md docs/architecture/ 2>/dev/null
mv SYSTEM*.md docs/architecture/ 2>/dev/null
mv FILE_STRUCTURE.md docs/architecture/ 2>/dev/null
mv WORKFLOW*.md docs/architecture/ 2>/dev/null
mv UI_WIREFRAMES.md docs/architecture/ 2>/dev/null

# Move status/report docs
echo "Moving status docs..."
mv STATUS*.md STATUS*.txt docs/status/ 2>/dev/null
mv CURRENT*.md CURRENT*.txt docs/status/ 2>/dev/null
mv CONSOLIDATION*.md docs/status/ 2>/dev/null
mv COMPLETE*.md docs/status/ 2>/dev/null
mv FINAL*.md FINAL*.txt docs/status/ 2>/dev/null
mv PROJECT*.md docs/status/ 2>/dev/null
mv WORK*.md docs/status/ 2>/dev/null
mv RESTORATION*.md docs/status/ 2>/dev/null
mv FIXES*.md docs/status/ 2>/dev/null
mv MVP*.md docs/status/ 2>/dev/null
mv RECOVERY*.md docs/status/ 2>/dev/null
mv LOGIN_ISSUE*.md LOGIN_FIX*.md docs/status/ 2>/dev/null

# Move dashboard docs
echo "Moving dashboard docs..."
mv DASHBOARD*.md docs/status/ 2>/dev/null
mv MOBILE_REPAIR*.md docs/status/ 2>/dev/null

# Move guide docs
echo "Moving guide docs..."
mv SETUP*.md SETUP*.txt docs/guides/ 2>/dev/null
mv GUIDE*.md docs/guides/ 2>/dev/null
mv START_HERE*.md START_HERE*.txt docs/guides/ 2>/dev/null
mv QUICK*.md QUICK*.txt docs/guides/ 2>/dev/null
mv GETTING*.md docs/guides/ 2>/dev/null
mv USAGE*.md docs/guides/ 2>/dev/null
mv TESTING*.md docs/guides/ 2>/dev/null
mv IMPLEMENTATION_GUIDE.md docs/guides/ 2>/dev/null
mv README_IMPLEMENTATION.md docs/guides/ 2>/dev/null
mv EASY_SETUP*.md docs/guides/ 2>/dev/null
mv LOCAL*.md docs/guides/ 2>/dev/null
mv READY_TO_RUN.md docs/guides/ 2>/dev/null
mv RUN_ME_FIRST.md docs/guides/ 2>/dev/null
mv WORKFLOW_GUIDE.md docs/guides/ 2>/dev/null

# Move database docs
echo "Moving database docs..."
mv DATABASE*.md DATABASE*.sql docs/database/ 2>/dev/null
mv RUN_IN_SUPABASE.sql docs/database/ 2>/dev/null
mv SETUP_DATABASE*.sql docs/database/ 2>/dev/null
mv migrate-to-coolify-db.sh docs/database/ 2>/dev/null
mv start-and-deploy-supabase.sh docs/database/ 2>/dev/null

# Move security docs
echo "Moving security docs..."
mv SECURITY*.md docs/security/ 2>/dev/null
mv CREDENTIALS*.txt docs/security/ 2>/dev/null
mv NEW_ADMIN_CREDENTIALS.txt docs/security/ 2>/dev/null

# Move archived/temporary docs
echo "Moving archived docs..."
mv COPY_PASTE*.txt docs/archive/ 2>/dev/null
mv DO_THIS*.md DO_THIS*.txt docs/archive/ 2>/dev/null
mv WAIT*.md docs/archive/ 2>/dev/null
mv TELL-ME*.md docs/archive/ 2>/dev/null
mv ACTUAL-BLOCKER.md docs/archive/ 2>/dev/null
mv CODE_SNIPPETS*.md docs/archive/ 2>/dev/null
mv COMMANDS_TO_COPY.md docs/archive/ 2>/dev/null
mv COMPLETE_FIX_PLAN.md docs/archive/ 2>/dev/null
mv COMPLETE_SYSTEM_TICKET.md docs/archive/ 2>/dev/null
mv USE_VPS*.md docs/archive/ 2>/dev/null
mv DEPLOY_CHECKLIST*.md docs/archive/ 2>/dev/null
mv PRODUCTION_ENV_UPDATE.txt docs/archive/ 2>/dev/null
mv DOMAIN-SETUP-COMPLETE.md docs/archive/ 2>/dev/null
mv CLAUDE-DESKTOP-CONFIG.md docs/archive/ 2>/dev/null

# Move any remaining .md/.txt files (except README.md)
echo "Moving remaining docs..."
mv DOCUMENTATION_INDEX.md docs/ 2>/dev/null
mv IMPLEMENTATION_STATUS.md IMPLEMENTATION_SUMMARY.md docs/status/ 2>/dev/null

echo "✅ Documentation consolidation complete!"
echo ""
echo "📊 Summary:"
echo "  - docs/deployment/     - All deployment & infrastructure docs"
echo "  - docs/architecture/   - System architecture & design docs"
echo "  - docs/status/         - Status reports & completion docs"
echo "  - docs/guides/         - Setup & user guides"
echo "  - docs/database/       - Database schemas & migrations"
echo "  - docs/security/       - Security & credentials"
echo "  - docs/archive/        - Temporary & obsolete docs"
echo ""
echo "Root directory cleaned - only essential files remain!"
