# 🚀 Development Workflow Guide

## Your Setup: Feature Branch + Coolify

```
┌─────────────┐
│   GitHub    │
│             │
│  main       │ ← Production (auto-deploys to Coolify Production)
│    ↑        │
│  dev        │ ← Development (auto-deploys to Coolify Preview)
│    ↑        │
│  feature/*  │ ← Your work branches
└─────────────┘
```

---

## 📋 Branch Structure

| Branch | Purpose | Auto-Deploy | URL |
|--------|---------|-------------|-----|
| `main` | Production | ✅ Yes | Your production domain |
| `dev` | Development/Staging | ✅ Yes | Your dev/preview domain |
| `feature/*` | Work in progress | ❌ No | Local only |

---

## 🔄 Daily Workflow

### 1️⃣ Starting a New Feature

```bash
# Make sure you're on dev and it's up to date
git checkout dev
git pull origin dev

# Create a new feature branch
git checkout -b feature/your-feature-name

# Examples:
# git checkout -b feature/add-sms-notifications
# git checkout -b feature/improve-pricing-ui
# git checkout -b fix/login-bug
```

### 2️⃣ Working on Your Feature

```bash
# Make your changes in your code editor
# ...

# Check what changed
git status
git diff

# Stage your changes
git add .

# Commit with a clear message
git commit -m "feat: add SMS notification system"

# Commit message prefixes:
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation only
# style:    Formatting, missing semicolons, etc.
# refactor: Code change that neither fixes a bug nor adds a feature
# test:     Adding tests
# chore:    Updating build tasks, package manager configs, etc.
```

### 3️⃣ Testing Locally

```bash
# Run the development server
cd dashboard
npm run dev

# Open http://localhost:3000
# Test your changes thoroughly
```

### 4️⃣ Pushing to Dev for Preview

```bash
# When your feature is ready, merge it to dev
git checkout dev
git pull origin dev
git merge feature/your-feature-name

# Push to GitHub (triggers auto-deploy to preview)
git push origin dev

# Wait 2-5 minutes, then check your preview URL
# Test on the preview environment
```

### 5️⃣ Deploying to Production

```bash
# When dev is stable and tested, merge to main
git checkout main
git pull origin main
git merge dev

# Push to GitHub (triggers auto-deploy to production)
git push origin main

# Wait 2-5 minutes, production is live!
```

### 6️⃣ Cleanup (Optional)

```bash
# Delete local feature branch after merging
git branch -d feature/your-feature-name

# Delete remote feature branch if you pushed it
git push origin --delete feature/your-feature-name
```

---

## 🎯 Quick Commands Reference

```bash
# Check current branch
git branch

# Switch branches
git checkout dev
git checkout main
git checkout feature/name

# Pull latest changes
git pull origin dev

# See recent commits
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (CAREFUL!)
git reset --hard HEAD

# Stash changes temporarily
git stash
git stash pop

# Create and push new feature branch
git checkout -b feature/my-feature
git push -u origin feature/my-feature
```

---

## 🚨 Emergency Fixes (Hotfix)

If production is broken and you need an urgent fix:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make your fix
# ... edit files ...

# Commit
git add .
git commit -m "fix: critical bug in authentication"

# Merge directly to main
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# Also merge back to dev to keep them in sync
git checkout dev
git merge hotfix/critical-bug-fix
git push origin dev

# Delete hotfix branch
git branch -d hotfix/critical-bug-fix
```

---

## 📊 Typical Week

**Monday:**
```bash
git checkout dev
git pull origin dev
git checkout -b feature/weekly-reports
# ... work work work ...
git add .
git commit -m "feat: add weekly sales report"
```

**Tuesday:**
```bash
# Continue working
git add .
git commit -m "feat: add export to PDF for reports"
```

**Wednesday:**
```bash
# Merge to dev for testing
git checkout dev
git merge feature/weekly-reports
git push origin dev
# Check preview URL, test with team
```

**Thursday:**
```bash
# Another feature while first is being tested
git checkout -b feature/customer-search-improvement
# ... work ...
```

**Friday:**
```bash
# If dev is stable all week, deploy to production
git checkout main
git merge dev
git push origin main
# 🎉 Week's work is live!
```

---

## 🔧 Helper Scripts

I've created these scripts for you:

### Quick Start New Feature
```bash
./scripts/new-feature.sh feature-name
```

### Quick Deploy to Dev
```bash
./scripts/deploy-dev.sh "commit message"
```

### Quick Deploy to Production
```bash
./scripts/deploy-production.sh
```

---

## ⚙️ Coolify Setup (One-Time)

In your Coolify dashboard:

### 1. Create Two Applications

**Production App:**
- Name: `mobile-repair-production`
- Branch: `main`
- Webhook: Enable and copy URL
- Domain: `your-domain.com`

**Preview App:**
- Name: `mobile-repair-preview`
- Branch: `dev`
- Webhook: Enable and copy URL
- Domain: `dev.your-domain.com` or `preview.your-domain.com`

### 2. Add GitHub Secrets

In GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these:
- `COOLIFY_WEBHOOK_URL` = Production webhook URL from Coolify
- `COOLIFY_DEV_WEBHOOK_URL` = Preview webhook URL from Coolify

### 3. Environment Variables

Set these in **both** Coolify apps:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
POSTGRES_PASSWORD=your-secure-password

# Auth
JWT_SECRET=your-32-char-secret
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-domain.com

# Integrations (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=
LIGHTSPEED_API_KEY=
GEMINI_API_KEY=

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

---

## 🎓 Best Practices

### ✅ DO:
- Always work on feature branches
- Pull latest changes before starting work
- Test locally before pushing
- Test on dev before deploying to production
- Write clear commit messages
- Deploy to production on Fridays (after testing all week)

### ❌ DON'T:
- Work directly on `main` or `dev` branches
- Push untested code to dev
- Deploy to production on Fridays late afternoon (no time to fix if broken)
- Force push (`git push -f`) unless you know what you're doing
- Commit sensitive data (API keys, passwords)

---

## 🆘 Common Issues

### "Merge conflict"
```bash
# Pull latest changes
git pull origin dev

# Fix conflicts in your editor (look for <<<<<<, ======, >>>>>>)
# Then:
git add .
git commit -m "fix: resolve merge conflicts"
```

### "My changes disappeared"
```bash
# Check if they're stashed
git stash list
git stash pop

# Or check reflog (Git's time machine)
git reflog
git checkout HEAD@{2}  # Go back to a previous state
```

### "I committed to wrong branch"
```bash
# If you haven't pushed yet
git reset --soft HEAD~1  # Undo commit, keep changes
git checkout correct-branch
git add .
git commit -m "your message"
```

### "Production is broken!"
```bash
# Quick rollback
git checkout main
git reset --hard HEAD~1  # Go back one commit
git push origin main --force  # Force push (use carefully!)
```

---

## 📱 Mobile/GitHub Workflow

If you're making changes directly on GitHub:

1. Edit file on GitHub web interface
2. Select: "Create a new branch and start a pull request"
3. Branch name: `feature/your-change`
4. Create pull request to `dev` branch
5. Review and merge
6. `dev` auto-deploys to preview
7. When stable, create PR from `dev` to `main`
8. Merge to deploy to production

---

## 📞 Quick Reference Card

| Task | Command |
|------|---------|
| Start new feature | `git checkout dev && git pull && git checkout -b feature/name` |
| Save changes | `git add . && git commit -m "feat: description"` |
| Deploy to preview | `git checkout dev && git merge feature/name && git push origin dev` |
| Deploy to production | `git checkout main && git merge dev && git push origin main` |
| See what changed | `git status` and `git diff` |
| Undo last commit | `git reset --soft HEAD~1` |

---

## 🎉 You're All Set!

Your workflow is:
1. **Create feature branch** → Work → Commit
2. **Merge to dev** → Auto-deploys to preview → Test
3. **Merge to main** → Auto-deploys to production → Live!

Simple, safe, and professional! 🚀
