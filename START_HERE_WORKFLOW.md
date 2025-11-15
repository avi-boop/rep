# 🚀 Your Workflow is Ready!

## ✅ What's Been Set Up

### 1. Git Branches
- **main** → Production (deploys to your live site)
- **dev** → Preview/Staging (deploys to preview site)
- Both branches are pushed to GitHub ✓

### 2. Automated Deployments
- Push to `dev` → Auto-deploys to preview environment
- Push to `main` → Auto-deploys to production
- GitHub Actions configured ✓

### 3. Helper Scripts
Located in `/scripts/`:
- `new-feature.sh` - Start a new feature
- `deploy-dev.sh` - Deploy to preview
- `deploy-production.sh` - Deploy to production
- `status.sh` - Check project status

---

## 🎯 Next Steps (Do These Now!)

### Step 1: Configure Coolify (15 minutes)

Read: `COOLIFY_SETUP.txt` for detailed instructions

Quick version:
1. Login to your Coolify dashboard
2. Create TWO applications:
   - **mobile-repair-production** (branch: main)
   - **mobile-repair-preview** (branch: dev)
3. Enable webhooks on both
4. Copy webhook URLs

### Step 2: Add GitHub Secrets (2 minutes)

1. Go to: https://github.com/avi-boop/rep/settings/secrets/actions
2. Add these secrets:
   - `COOLIFY_WEBHOOK_URL` = Production webhook URL
   - `COOLIFY_DEV_WEBHOOK_URL` = Preview webhook URL

### Step 3: Test the Workflow (5 minutes)

```bash
# Make a small change
cd /home/avi/projects/mobile
git checkout dev
echo "# Test" >> test.txt
git add test.txt
git commit -m "test: verify auto-deployment"
git push origin dev

# Check Coolify dashboard - should see deployment start!
```

---

## 📖 Daily Workflow (Quick Reference)

### Starting Your Day
```bash
cd /home/avi/projects/mobile
./scripts/status.sh           # Check current status
./scripts/new-feature.sh add-customer-photos
```

### Working on Feature
```bash
# Make changes in your editor
# ...

# Save and test locally
cd dashboard
npm run dev
# Test at http://localhost:3000

# When ready, commit
git add .
git commit -m "feat: add customer photo upload"
```

### Deploy to Preview
```bash
./scripts/deploy-dev.sh "feat: add customer photo upload"
# Wait 3-5 minutes
# Check your preview URL
```

### Deploy to Production (when tested)
```bash
./scripts/deploy-production.sh
# Wait 3-5 minutes
# Check your production URL
# 🎉 Live!
```

---

## 📚 Full Documentation

- **WORKFLOW_GUIDE.md** - Complete workflow documentation
- **COOLIFY_SETUP.txt** - Detailed Coolify setup
- **CURRENT_STATUS_NOV_14.md** - Project status
- **README.md** - Project overview

---

## 🔧 Coolify Configuration Checklist

Setup both apps in Coolify with these settings:

### Production App
```
Name: mobile-repair-production
Repository: git@github.com:avi-boop/rep.git
Branch: main
Dockerfile: Dockerfile.production
Base Directory: /dashboard
Port: 3000
Domain: your-domain.com
```

### Preview App
```
Name: mobile-repair-preview
Repository: git@github.com:avi-boop/rep.git
Branch: dev
Dockerfile: Dockerfile.production
Base Directory: /dashboard
Port: 3000
Domain: dev.your-domain.com
```

### Environment Variables (both apps)
```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=32-character-secret
NEXTAUTH_SECRET=32-character-secret
NEXTAUTH_URL=https://your-domain.com  # Different for each!
NODE_ENV=production

# Optional (add when ready)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
LIGHTSPEED_API_KEY=
```

---

## 🎓 Commands Cheat Sheet

```bash
# Check status
./scripts/status.sh
git status
git log --oneline -5

# Start new feature
./scripts/new-feature.sh feature-name
# or manually:
git checkout dev && git pull && git checkout -b feature/name

# Deploy to preview
./scripts/deploy-dev.sh "commit message"
# or manually:
git checkout dev && git merge feature/name && git push origin dev

# Deploy to production
./scripts/deploy-production.sh
# or manually:
git checkout main && git merge dev && git push origin main

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all changes (careful!)
git reset --hard HEAD

# See what changed
git diff
git status
```

---

## 🚨 Troubleshooting

### Deployment not triggering?
- Check GitHub Actions: https://github.com/avi-boop/rep/actions
- Verify webhook URLs are correct in GitHub Secrets
- Check Coolify logs

### Merge conflict?
```bash
git pull origin dev
# Fix conflicts in editor (look for <<<<<<)
git add .
git commit -m "fix: resolve conflicts"
```

### Need to rollback production?
```bash
git checkout main
git reset --hard HEAD~1
git push origin main --force
```

---

## ✅ Verification Checklist

Before you start coding, verify:

- [ ] Two apps created in Coolify
- [ ] Webhooks configured and URLs copied
- [ ] GitHub secrets added (COOLIFY_WEBHOOK_URL, COOLIFY_DEV_WEBHOOK_URL)
- [ ] Environment variables set in both Coolify apps
- [ ] Test push to dev triggers deployment
- [ ] Preview URL works
- [ ] Can access Coolify dashboard

---

## 🎉 You're Ready!

Your professional workflow:
1. **Create feature branch** → Code → Test locally
2. **Push to dev** → Auto-deploys to preview → Test online
3. **Push to main** → Auto-deploys to production → Live!

Start with:
```bash
cd /home/avi/projects/mobile
./scripts/new-feature.sh my-first-feature
```

---

## 💡 Tips

- **Always test on preview before production**
- **Commit often** with clear messages
- **Pull before push** to avoid conflicts
- **Use feature branches** for all work
- **Deploy to production** when preview is tested and stable
- **Friday deployments?** Only if you have time to monitor and fix issues

---

## 📞 Need Help?

Check these files:
1. `WORKFLOW_GUIDE.md` - Complete workflow guide
2. `COOLIFY_SETUP.txt` - Coolify configuration
3. `README.md` - Project overview
4. GitHub Actions logs - https://github.com/avi-boop/rep/actions

---

**Current Branch:** `main`
**Remote:** https://github.com/avi-boop/rep

**Happy coding! 🚀**
