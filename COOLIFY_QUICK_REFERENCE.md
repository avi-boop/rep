# 🚀 Coolify Deployment - Quick Reference

## One-Page Cheat Sheet for VPS Deployment

---

## 📦 What You're Deploying

**Application:** Mobile Repair Shop Dashboard
**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL
**Location:** `/dashboard` directory
**Domain:** `dashboard.yourdomain.com`

---

## ⚡ Quick Deploy Commands

### 1. Essential Environment Variables

```bash
# Copy these to Coolify Dashboard → Environment Variables

# Database (Auto-configured by Coolify if you add PostgreSQL service)
DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db
DIRECT_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db

# Security Secrets (CHANGE THESE!)
JWT_SECRET=generate-32-char-secret-here
REFRESH_TOKEN_SECRET=generate-32-char-secret-here
NEXTAUTH_SECRET=generate-32-char-secret-here

# App Config
NODE_ENV=production
NEXTAUTH_URL=https://dashboard.yourdomain.com
PORT=3000
```

### 2. Generate Secrets

```bash
# Run these on your local machine to generate secure secrets:
openssl rand -base64 48  # Copy for JWT_SECRET
openssl rand -base64 48  # Copy for REFRESH_TOKEN_SECRET
openssl rand -base64 48  # Copy for NEXTAUTH_SECRET
```

### 3. Coolify Configuration

```json
Repository: https://github.com/avi-boop/rep.git
Branch: main
Build Pack: Dockerfile
Dockerfile: dashboard/Dockerfile.production
Context: dashboard
Port: 3000
```

---

## 🎯 Deployment Steps (Checklist)

### In Coolify Dashboard:

- [ ] **1. Create Project** → Name: "Mobile Repair Shop"
- [ ] **2. Add Application** → Public Repository
- [ ] **3. Repository URL** → `https://github.com/avi-boop/rep.git`
- [ ] **4. Select Branch** → `main`
- [ ] **5. Build Pack** → Dockerfile
- [ ] **6. Dockerfile Location** → `dashboard/Dockerfile.production`
- [ ] **7. Build Context** → `dashboard`
- [ ] **8. Port** → `3000`
- [ ] **9. Add PostgreSQL** → Version 15, DB: mobile_repair_db
- [ ] **10. Add Redis (Optional)** → Version 7
- [ ] **11. Set Environment Variables** → Copy from section above
- [ ] **12. Add Domain** → `dashboard.yourdomain.com`
- [ ] **13. Enable SSL** → Auto (Let's Encrypt)
- [ ] **14. Click Deploy** → Wait 5-10 minutes
- [ ] **15. Test Health** → `curl https://dashboard.yourdomain.com/api/health`

---

## 🔍 Health Check

**Endpoint:** `/api/health`

**Healthy Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T...",
  "services": {
    "database": "connected",
    "api": "healthy"
  }
}
```

**Unhealthy Response:** HTTP 503
```json
{
  "status": "error",
  "services": {
    "database": "disconnected"
  }
}
```

---

## 🐛 Quick Troubleshooting

### Build Fails

**Check:** Build logs in Coolify
**Common Issues:**
- Missing Dockerfile → Verify path: `dashboard/Dockerfile.production`
- Prisma error → Already fixed in Dockerfile
- Out of memory → Increase container memory in settings

### Can't Connect to Database

**Check:** DATABASE_URL format
```bash
# Correct:
postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db

# Wrong:
postgresql://repair_admin:PASSWORD@localhost:5432/mobile_repair_db
# ❌ Don't use 'localhost', use 'postgres' (service name)
```

### Application Won't Start

**Check:**
1. Environment variables set? → Go to Env Vars tab
2. PostgreSQL running? → Check Services tab
3. Port conflict? → Change PORT in settings
4. Logs show errors? → Check Logs tab

### SSL Certificate Not Working

**Wait:** 2-5 minutes for Let's Encrypt
**Verify:**
- Domain DNS points to VPS IP
- Port 80 and 443 open on firewall
- Domain added correctly in Coolify

---

## 📊 Post-Deployment

### Verify Everything Works

```bash
# 1. Health check
curl https://dashboard.yourdomain.com/api/health

# 2. Home page
curl -I https://dashboard.yourdomain.com

# 3. Database connection
# Check health endpoint - should show "connected"
```

### Enable Auto-Deploy

1. Coolify Dashboard → Your App → **Webhooks**
2. Click **"Enable GitHub Webhook"**
3. Done! Pushes to main auto-deploy

### Set Up Monitoring

**UptimeRobot (Free):**
1. Sign up: https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://dashboard.yourdomain.com/api/health`
   - Interval: 5 minutes
3. Get alerts if down

---

## 🔄 Update Application

### Auto (Recommended):
```bash
# Just push to GitHub
git add .
git commit -m "Update feature"
git push origin main
# Coolify auto-deploys!
```

### Manual:
1. Coolify Dashboard
2. Your App → **Deploy** button
3. Select branch → Deploy

### Rollback:
1. Coolify Dashboard
2. **Deployments** tab
3. Find last working deployment
4. Click **Rollback**

---

## 📞 Quick Support

**Check Logs:**
```
Coolify Dashboard → Your App → Logs Tab
```

**Restart App:**
```
Coolify Dashboard → Your App → Restart Button
```

**Database Backup:**
```bash
# SSH to VPS
ssh user@your-vps

# Backup
docker exec <postgres-container> pg_dump -U repair_admin mobile_repair_db > backup.sql
```

**Common Commands:**
```bash
# View running containers
docker ps

# Follow logs
docker logs -f <container-name>

# Restart container
docker restart <container-name>
```

---

## ✅ Success Checklist

- [ ] Application accessible at domain
- [ ] SSL certificate working (https)
- [ ] Health endpoint returns "ok"
- [ ] Database connected
- [ ] Auto-deploy webhook configured
- [ ] Monitoring set up
- [ ] Backups enabled
- [ ] Secrets stored securely

---

## 📝 Quick Notes

**Build Time:** 5-10 minutes (first deploy)
**Deploy Time:** 1-2 minutes (updates)
**Health Check:** Every 30 seconds
**Auto-Restart:** If unhealthy for 3 checks

**Resources:**
- Recommended: 2GB RAM, 2 CPU cores
- Minimum: 1GB RAM, 1 CPU core
- Database: ~100MB initially

---

## 🎉 You're Live!

```
Dashboard: https://dashboard.yourdomain.com
Health:    https://dashboard.yourdomain.com/api/health
Logs:      Coolify Dashboard → Logs
Status:    Coolify Dashboard → Overview
```

**Need detailed guide?** See `COOLIFY_VPS_DEPLOYMENT.md`

---

*Happy Deploying! 🚀*
