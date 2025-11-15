# 🚀 Quick Start - Get Live in 30 Minutes!

Follow these 3 simple steps. I'll guide you through everything!

---

## 📋 Before You Start

You need:
- ✅ Coolify dashboard access (your self-hosted instance)
- ✅ GitHub account (you have: avi-boop/rep)
- ✅ Database (PostgreSQL) - can create in Coolify
- ✅ 30 minutes of focused time

---

## 🎯 STEP 1: Generate Secrets (2 minutes)

Run this command:

```bash
cd /home/avi/projects/mobile
./scripts/generate-secrets.sh
```

📝 **COPY THE OUTPUT** - You'll need these secrets in Step 2!

---

## 🎯 STEP 2: Setup Coolify (20 minutes)

### A. Create Database (if you don't have one)

1. In Coolify: Click **"+ New Resource"**
2. Select **"Database"** → **"PostgreSQL"**
3. Settings:
   - Name: `mobile-repair-db`
   - Version: `15-alpine`
   - Database Name: `mobile_repair_prod`
   - Username: `repair_admin`
   - Password: (generate strong password)
4. Click **"Create"**
5. **COPY** the connection string - looks like:
   ```
   postgresql://repair_admin:password@mobile-repair-db:5432/mobile_repair_prod
   ```

### B. Create Preview App

1. In Coolify: Click **"+ New Resource"** → **"Application"**
2. Fill in:
   - **Name:** `mobile-repair-preview`
   - **Git Repository:** `https://github.com/avi-boop/rep.git`
   - **Branch:** `dev`
   - **Build Pack:** Dockerfile
   - **Dockerfile:** `Dockerfile.production`
   - **Base Directory:** `dashboard`
   - **Port:** `3000`
3. **Domain:** Enter your preview domain (e.g., `dev.yourdomain.com`)
4. **Webhook:** Enable it and **COPY the webhook URL**
5. **Environment Variables** - Click "Add" for each:

```env
DATABASE_URL=postgresql://repair_admin:password@mobile-repair-db:5432/mobile_repair_dev
JWT_SECRET=<paste from generate-secrets.sh DEV section>
NEXTAUTH_SECRET=<paste from generate-secrets.sh DEV section>
NEXTAUTH_URL=https://dev.yourdomain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```

6. Click **"Save"** and **"Deploy"**

### C. Create Production App

1. In Coolify: Click **"+ New Resource"** → **"Application"** again
2. Fill in:
   - **Name:** `mobile-repair-production`
   - **Git Repository:** `https://github.com/avi-boop/rep.git`
   - **Branch:** `main`
   - **Build Pack:** Dockerfile
   - **Dockerfile:** `Dockerfile.production`
   - **Base Directory:** `dashboard`
   - **Port:** `3000`
3. **Domain:** Enter your production domain (e.g., `yourdomain.com`)
4. **Webhook:** Enable it and **COPY the webhook URL**
5. **Environment Variables** - Click "Add" for each:

```env
DATABASE_URL=postgresql://repair_admin:password@mobile-repair-db:5432/mobile_repair_prod
JWT_SECRET=<paste from generate-secrets.sh PRODUCTION section>
NEXTAUTH_SECRET=<paste from generate-secrets.sh PRODUCTION section>
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```

6. Click **"Save"** (don't deploy yet)

---

## 🎯 STEP 3: Configure Auto-Deploy (5 minutes)

### Add GitHub Secrets

1. Go to: https://github.com/avi-boop/rep/settings/secrets/actions
2. Click **"New repository secret"**
3. Add **Secret #1:**
   - Name: `COOLIFY_DEV_WEBHOOK_URL`
   - Value: (paste webhook URL from preview app)
   - Click **"Add secret"**
4. Add **Secret #2:**
   - Name: `COOLIFY_WEBHOOK_URL`
   - Value: (paste webhook URL from production app)
   - Click **"Add secret"**

---

## 🎉 STEP 4: Deploy! (3 minutes)

### Test Preview First

```bash
cd /home/avi/projects/mobile
git checkout dev
git push origin dev
```

**What happens:**
1. GitHub Actions triggers (check: https://github.com/avi-boop/rep/actions)
2. Coolify starts building (check: Coolify dashboard → mobile-repair-preview)
3. Wait 3-5 minutes
4. Open your preview URL!

### Deploy to Production

```bash
cd /home/avi/projects/mobile
./scripts/deploy-production.sh
```

**What happens:**
1. Script asks for confirmation
2. Merges dev to main
3. Pushes to GitHub
4. Auto-deploys to production
5. Wait 3-5 minutes
6. Your site is LIVE! 🎉

---

## 🗄️ STEP 5: Setup Database (Once deployed)

### For Production:
1. In Coolify → `mobile-repair-production` → **Terminal**
2. Run:
```bash
cd /app/dashboard
npx prisma migrate deploy
npx prisma db seed
```

### For Preview:
1. In Coolify → `mobile-repair-preview` → **Terminal**
2. Run:
```bash
cd /app/dashboard
npx prisma migrate deploy
npx prisma db seed
```

---

## ✅ Verify It Works

1. **Open production URL** in browser
2. You should see the login page
3. **Login with:**
   - Username: `admin`
   - Password: `admin123`
4. Dashboard should load! 🎉

---

## 🔧 Using Helper Scripts

I've created scripts to make your life easier:

```bash
# Interactive menu
./scripts/quick-deploy.sh

# Check status
./scripts/status.sh

# Start new feature
./scripts/new-feature.sh feature-name

# Deploy to preview
./scripts/deploy-dev.sh "commit message"

# Deploy to production
./scripts/deploy-production.sh
```

---

## 📚 Need More Details?

Check these files:
- `DEPLOYMENT_CHECKLIST.txt` - Detailed step-by-step
- `COOLIFY_SETUP.txt` - Coolify-specific instructions
- `WORKFLOW_GUIDE.md` - Complete workflow documentation

---

## 🆘 Troubleshooting

### Build fails in Coolify?
- Check logs in Coolify dashboard
- Verify environment variables are set correctly
- Make sure DATABASE_URL is correct

### Site doesn't load?
- Check if port 3000 is correct
- Verify domain is pointing to Coolify server
- Check Coolify app logs

### Database connection error?
- Verify DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
- Make sure database is created
- Check database service is running in Coolify

### Webhook not triggering?
- Verify GitHub secrets are set correctly
- Check GitHub Actions logs
- Make sure webhook URLs don't have trailing spaces

---

## 🎯 Quick Reference

| What | Command |
|------|---------|
| Generate secrets | `./scripts/generate-secrets.sh` |
| Deploy to preview | `git checkout dev && git push origin dev` |
| Deploy to production | `./scripts/deploy-production.sh` |
| Check status | `./scripts/status.sh` |
| View logs | Check Coolify dashboard |

---

## 🎊 You're Done!

Your workflow from now on:
1. Create feature branch
2. Make changes
3. Push to `dev` → auto-deploys to preview
4. Test on preview URL
5. Merge to `main` → auto-deploys to production

**That's it! You have a professional deployment pipeline!** 🚀

---

*Time to complete: ~30 minutes*  
*Your site: Production-ready and live!*
