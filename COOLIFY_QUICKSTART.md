# Coolify Auto-Deployment - Quick Start Guide

Get your Mobile Repair Dashboard deployed on Coolify in under 15 minutes!

## Prerequisites

- ✅ Coolify instance running (v4+)
- ✅ GitHub repository access
- ✅ Domain name (optional but recommended)

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Login to Coolify (1 min)

1. Access your Coolify dashboard: `https://your-coolify-domain.com`
2. Login with your credentials

### Step 2: Create New Project (2 min)

1. Click **"+ New"** → **"Project"**
2. Name: `Mobile Repair Dashboard`
3. Click **"Create Project"**
4. Inside project, click **"+ New"** → **"Resource"** → **"Application"**
5. Enter your GitHub repository URL
6. Select branch: `main`
7. Click **"Continue"**

### Step 3: Deploy Backend (5 min)

1. **Build Settings:**
   - Build Pack: `Dockerfile`
   - Dockerfile: `backend/Dockerfile`
   - Base Directory: `backend`

2. **Port:** `3001`

3. **Domain:** `api.yourdomain.com` (enable SSL)

4. **Add Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db
   REDIS_URL=redis://redis:6379
   JWT_SECRET=generate-random-secret-here
   SESSION_SECRET=generate-random-secret-here
   ```

5. **Add Database Services:**
   - Click **"+ Add Service"**
   - Select **"PostgreSQL 15"**
   - Set credentials (username: `repair_admin`, database: `mobile_repair_db`)
   - Click **"+ Add Service"** again
   - Select **"Redis 7"**

6. Click **"Deploy"**

### Step 4: Deploy Frontend (3 min)

1. In the same project, click **"+ New"** → **"Application"**
2. Same repository, branch `main`
3. **Build Settings:**
   - Build Pack: `Dockerfile`
   - Dockerfile: `frontend/Dockerfile`
   - Base Directory: `frontend`

4. **Port:** `3000`

5. **Domain:** `app.yourdomain.com` (enable SSL)

6. **Environment Variables:**
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_TELEMETRY_DISABLED=1
   ```

7. Click **"Deploy"**

### Step 5: Enable Auto-Deployment (2 min)

1. In **Backend** application, go to **"Webhooks"** tab
2. Click **"Enable GitHub Webhook"** (automatic)
   - OR copy webhook URL and add manually to GitHub:
     - GitHub Repo → Settings → Webhooks → Add webhook
     - Paste webhook URL
     - Content type: `application/json`
     - Events: Just the push event
     - Save

3. Repeat for **Frontend** application

4. **Test:** Make a small change, commit, and push - deployment should trigger automatically! 🎉

---

## 📋 Quick Reference

### Service Ports

| Service   | Port | URL Pattern              |
|-----------|------|--------------------------|
| Backend   | 3001 | api.yourdomain.com       |
| Frontend  | 3000 | app.yourdomain.com       |
| App       | 3000 | admin.yourdomain.com     |
| Dashboard | 3000 | dashboard.yourdomain.com |

### Required Environment Variables

**Minimum for Backend:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret
SESSION_SECRET=your-secret
```

**Minimum for Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

### Health Check Endpoints

- Backend: `GET /api/health`
- Frontend/App/Dashboard: `GET /`

---

## 🔥 Deploy Additional Services

Already have backend and frontend running? Deploy the other services:

### Deploy App (Next.js 16)

```bash
# Coolify Application Settings
Base Directory: app
Dockerfile: app/Dockerfile
Port: 3000
Domain: admin.yourdomain.com

# Environment Variables
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Deploy Dashboard

```bash
# Coolify Application Settings
Base Directory: dashboard
Dockerfile: dashboard/Dockerfile.production
Port: 3000
Domain: dashboard.yourdomain.com

# Environment Variables
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NODE_ENV=production
```

---

## 🎯 Deployment Flow

```
Developer → git push → GitHub → Webhook → Coolify
                                            ↓
                                    Auto Build & Deploy
                                            ↓
                                    Run Migrations
                                            ↓
                                    Health Checks
                                            ↓
                                    Live! 🚀
```

---

## ⚡ Common Commands

### Generate Secrets

```bash
# JWT Secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

### View Logs

In Coolify:
1. Navigate to application
2. Click **"Logs"** tab
3. View real-time logs

### Rollback Deployment

1. Navigate to application
2. Click **"Deployments"** tab
3. Find previous successful deployment
4. Click **"Rollback"**

### Manual Deployment

1. Navigate to application
2. Click **"Deploy"** button
3. Deployment starts immediately

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not working | Check GitHub webhook delivery logs, verify URL |
| Build fails | Check Dockerfile, verify dependencies, check logs |
| Can't connect to DB | Verify DATABASE_URL, check DB service is running |
| Health check fails | Check health endpoint, verify app starts correctly |
| Port conflict | Ensure unique ports per service |

---

## 📚 Full Documentation

For detailed setup, advanced configuration, and troubleshooting:

**Read:** `COOLIFY_SETUP.md` in this repository

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and healthy
- [ ] Database connected and migrations run
- [ ] Redis cache working
- [ ] SSL certificates active
- [ ] Auto-deployment webhook configured
- [ ] Test deployment by pushing a small change
- [ ] Configure monitoring/alerts (optional)
- [ ] Set up database backups (recommended)

---

## 🎊 Success!

Your application should now be live and auto-deploying on every push to GitHub!

**Test Auto-Deployment:**
1. Make a small change (e.g., update a comment)
2. Commit: `git commit -m "test: verify auto-deployment"`
3. Push: `git push origin main`
4. Watch Coolify dashboard - deployment should start automatically
5. Verify changes are live on your domain

---

## 🆘 Need Help?

- **Coolify Docs:** https://coolify.io/docs
- **Coolify Discord:** https://discord.gg/coolify
- **Full Setup Guide:** See `COOLIFY_SETUP.md`
- **GitHub Issues:** Report bugs in the repository

---

**Happy Deploying! 🚀**
