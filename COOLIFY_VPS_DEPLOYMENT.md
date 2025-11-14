# 🚀 Coolify VPS Deployment Guide - Mobile Repair Dashboard

Complete step-by-step guide to deploy your Mobile Repair Dashboard to your VPS using Coolify.

---

## 📋 Prerequisites

### On Your VPS:
- ✅ Coolify v4+ installed and running
- ✅ Docker and Docker Compose installed
- ✅ Domain name pointed to your VPS
- ✅ SSL certificate (Coolify handles this automatically)
- ✅ Minimum 2GB RAM, 2 CPU cores recommended

### Access Requirements:
- ✅ SSH access to VPS
- ✅ Coolify dashboard access (https://your-vps-ip:8000 or your Coolify domain)
- ✅ GitHub repository access (this repo)

---

## 🎯 Deployment Architecture

Your deployment will include:

```
┌─────────────────────────────────────────────────┐
│              Your VPS (Coolify)                  │
│                                                  │
│  ┌─────────────────────────────────────┐        │
│  │   Dashboard App (Next.js 15)        │        │
│  │   Port: 3000                        │        │
│  │   Domain: dashboard.yourdomain.com  │        │
│  └────────────┬────────────────────────┘        │
│               │                                  │
│               ├─► PostgreSQL 15 (Internal)      │
│               │   Database: mobile_repair_db    │
│               │   User: repair_admin            │
│               │                                  │
│               └─► Redis 7 (Optional - Caching)  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Deployment (15 Minutes)

### Step 1: Login to Coolify Dashboard (2 min)

1. Access your Coolify dashboard:
   ```
   https://your-coolify-domain.com
   # or
   https://your-vps-ip:8000
   ```

2. Login with your Coolify credentials

### Step 2: Create New Project (3 min)

1. **Create Project:**
   - Click **"Projects"** in sidebar
   - Click **"+ Add"** button
   - Name: `Mobile Repair Shop`
   - Description: `Repair shop management dashboard`
   - Click **"Continue"**

2. **Select Environment:**
   - Choose **"Production"** (or create new environment)
   - Click **"Continue"**

### Step 3: Add Application from GitHub (5 min)

1. **Add New Resource:**
   - Inside your project, click **"+ New Resource"**
   - Select **"Application"**
   - Select **"Public Repository"** (or connect your GitHub account)

2. **Repository Configuration:**
   - **Git Source**: `https://github.com/avi-boop/rep.git`
   - **Branch**: `main` (or `claude/check-project-status-01AdcLLvccWCmsBf4J8QvGvB` for testing)
   - **Build Pack**: Select **"Dockerfile"**
   - Click **"Continue"**

3. **Build Configuration:**
   - **Dockerfile Location**: `dashboard/Dockerfile.production`
   - **Build Context**: `dashboard`
   - **Port**: `3000`
   - Click **"Continue"**

### Step 4: Configure Database (3 min)

1. **Add PostgreSQL:**
   - In your application settings, scroll to **"Services"**
   - Click **"+ Add Service"**
   - Select **"PostgreSQL"**
   - Version: **"15"** (or latest)
   - Configuration:
     ```
     Database Name: mobile_repair_db
     Username: repair_admin
     Password: [Generate Strong Password - Save This!]
     ```
   - **Volume**: Enable persistent storage
   - Click **"Add"**

2. **Add Redis (Optional - for caching):**
   - Click **"+ Add Service"** again
   - Select **"Redis"**
   - Version: **"7"**
   - Enable persistent storage
   - Click **"Add"**

### Step 5: Set Environment Variables (5 min)

In your application settings, go to **"Environment Variables"** and add:

#### **Required Variables:**

```bash
# Node Environment
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Database Configuration
# Coolify automatically creates DATABASE_URL from PostgreSQL service
# If not automatic, use format below:
DATABASE_URL=postgresql://repair_admin:YOUR_PASSWORD@postgres:5432/mobile_repair_db
DIRECT_URL=postgresql://repair_admin:YOUR_PASSWORD@postgres:5432/mobile_repair_db

# JWT Authentication (CHANGE THESE!)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-super-secure-refresh-token-secret-32-characters-here
REFRESH_TOKEN_EXPIRES_IN=7d

# NextAuth (CHANGE THIS!)
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-minimum-32-chars-here
NEXTAUTH_URL=https://dashboard.yourdomain.com
```

#### **Optional Integrations:**

```bash
# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# SendGrid Email (Optional)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@yourdomain.com

# Lightspeed POS Integration (Optional)
LIGHTSPEED_API_KEY=
LIGHTSPEED_ACCOUNT_ID=
LIGHTSPEED_API_URL=https://api.lightspeedapp.com

# Gemini AI (Optional - for smart pricing)
GEMINI_API_KEY=

# Redis (if added)
REDIS_URL=redis://redis:6379
```

**🔒 Security Note:**
- Generate secrets using: `openssl rand -base64 48`
- Never commit these to git
- Store securely (password manager)

### Step 6: Configure Domain (2 min)

1. **Add Domain:**
   - In application settings, find **"Domains"** section
   - Click **"+ Add Domain"**
   - Enter: `dashboard.yourdomain.com` (or your preferred subdomain)
   - **Enable SSL**: ✅ (Coolify auto-generates Let's Encrypt certificate)
   - Click **"Add"**

2. **DNS Configuration:**
   - In your DNS provider (Cloudflare, Namecheap, etc.):
   - Add A record:
     ```
     Type: A
     Name: dashboard (or your subdomain)
     Value: YOUR_VPS_IP_ADDRESS
     TTL: Auto or 300
     ```
   - Wait 1-5 minutes for propagation

### Step 7: Deploy! (5-10 min)

1. **Initial Deployment:**
   - Click **"Deploy"** button (top right)
   - Coolify will:
     - Clone repository
     - Build Docker image using your Dockerfile
     - Run database migrations (Prisma)
     - Start the application
   - Watch build logs in real-time

2. **Post-Deploy Commands:**
   Coolify should automatically run these (defined in coolify.json):
   ```bash
   npx prisma migrate deploy  # Run migrations
   npx prisma generate        # Generate Prisma client
   npx prisma db seed         # Seed database with sample data
   ```

3. **Monitor Deployment:**
   - Check build logs for errors
   - Look for: `✓ Ready on https://0.0.0.0:3000`
   - First build takes 5-10 minutes

### Step 8: Verify Deployment (2 min)

1. **Health Check:**
   ```bash
   curl https://dashboard.yourdomain.com/api/health
   ```
   Should return:
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

2. **Access Dashboard:**
   - Open: `https://dashboard.yourdomain.com`
   - You should see the login/home page

3. **Check Logs:**
   - In Coolify dashboard, click **"Logs"**
   - Verify no errors
   - Should see: `Server listening on port 3000`

---

## ⚙️ Advanced Configuration

### Auto-Deployment on Git Push

1. **Enable Webhook:**
   - In application settings → **"Webhooks"**
   - Click **"Enable"** for GitHub webhooks
   - Coolify generates webhook URL

2. **Configure GitHub:**
   - Go to: `https://github.com/avi-boop/rep/settings/hooks`
   - Click **"Add webhook"**
   - **Payload URL**: Paste Coolify webhook URL
   - **Content type**: `application/json`
   - **Events**: Select "Just the push event"
   - Click **"Add webhook"**

3. **Test:**
   - Make a small change in your repo
   - Commit and push to main branch
   - Watch automatic deployment in Coolify! 🎉

### Custom Build Commands

If you need to run additional commands, update in Coolify dashboard:

**Pre-Deploy:**
```bash
echo "Starting deployment..."
```

**Post-Deploy:**
```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
echo "Deployment complete!"
```

### Database Backups

1. **Automatic Backups:**
   - In PostgreSQL service settings
   - Enable **"Scheduled Backups"**
   - Set frequency: Daily at 2 AM
   - Retention: 7 days

2. **Manual Backup:**
   ```bash
   # SSH into VPS
   ssh user@your-vps

   # Find PostgreSQL container
   docker ps | grep postgres

   # Create backup
   docker exec <postgres-container> pg_dump -U repair_admin mobile_repair_db > backup_$(date +%Y%m%d).sql
   ```

### Monitoring and Logs

1. **View Logs:**
   - Coolify Dashboard → Your App → **"Logs"** tab
   - Real-time log streaming
   - Filter by severity

2. **Resource Monitoring:**
   - Check CPU/Memory usage in Coolify
   - Set up alerts for high usage

3. **Health Checks:**
   - Coolify automatically pings `/api/health` every 30s
   - Auto-restart if unhealthy

---

## 🐛 Troubleshooting

### Build Fails with Prisma Error

**Problem:** `Failed to fetch Prisma engine`

**Solution:**
```dockerfile
# Already fixed in Dockerfile.production
# Ensure OpenSSL is installed:
RUN apk add --no-cache openssl libc6-compat
```

### Database Connection Failed

**Problem:** `Error: P1001: Can't reach database server`

**Solution 1:** Check DATABASE_URL format
```bash
# Correct format:
postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db

# NOT localhost or 127.0.0.1, use 'postgres' (service name)
```

**Solution 2:** Verify PostgreSQL service is running
```bash
# In Coolify, check Services tab
# PostgreSQL should show "Running" status
```

### Port Already in Use

**Problem:** `Port 3000 is already allocated`

**Solution:** Change application port in Coolify settings
- Go to **"General"** → **"Port"**
- Change to `3001` or another available port
- Update environment: `PORT=3001`

### SSL Certificate Issues

**Problem:** `ERR_CERT_AUTHORITY_INVALID`

**Solution:**
- Wait 2-5 minutes after adding domain
- Coolify auto-generates Let's Encrypt certificate
- Check domain DNS is properly configured
- Verify A record points to correct VPS IP

### Application Crashes on Startup

**Check logs for:**

1. **Missing environment variables:**
   ```
   Error: Environment validation failed
   ```
   Solution: Add all required env vars in Coolify

2. **Database migration failed:**
   ```
   Error: Migration failed
   ```
   Solution: Manually run migrations:
   ```bash
   docker exec <app-container> npx prisma migrate deploy
   ```

3. **Out of memory:**
   ```
   JavaScript heap out of memory
   ```
   Solution: Increase container memory in Coolify settings

---

## 📊 Post-Deployment Tasks

### 1. Create Admin User

Since authentication isn't fully implemented, you'll need to seed an admin user:

```bash
# SSH to VPS
ssh user@your-vps

# Find app container
docker ps | grep dashboard

# Create admin user (via Prisma Studio)
docker exec -it <container-id> npx prisma studio

# Or via SQL
docker exec -it <postgres-container> psql -U repair_admin -d mobile_repair_db

# Insert admin user (password should be hashed with bcrypt)
INSERT INTO users (email, password, name, role)
VALUES ('admin@yourshop.com', 'hashed_password', 'Admin', 'ADMIN');
```

### 2. Configure Integrations

**Twilio (SMS):**
- Sign up: https://www.twilio.com
- Get Account SID and Auth Token
- Buy phone number
- Add to environment variables
- Restart application

**SendGrid (Email):**
- Sign up: https://sendgrid.com
- Create API key
- Verify sender email
- Add to environment variables
- Restart application

**Lightspeed POS:**
- Get API credentials from Lightspeed account
- Add to environment variables
- Test sync: `curl https://dashboard.yourdomain.com/api/integrations/lightspeed/customers`

### 3. Set Up Monitoring

**Uptime Monitoring:**
- Use: UptimeRobot, Pingdom, or StatusCake
- Monitor: `https://dashboard.yourdomain.com/api/health`
- Alert when down

**Error Tracking:**
- Recommended: Sentry
- Add Sentry DSN to environment
- Captures errors automatically

---

## 🔄 Updating Your Application

### Method 1: Auto-Deploy (Recommended)

1. Make changes in your code
2. Commit and push to GitHub
3. Webhook triggers automatic deployment
4. Check Coolify dashboard for build status

### Method 2: Manual Deploy

1. Go to Coolify dashboard
2. Select your application
3. Click **"Deploy"** button
4. Select branch (main or feature branch)
5. Deployment starts immediately

### Method 3: Rollback

If deployment breaks:
1. In Coolify dashboard → **"Deployments"** tab
2. See list of all deployments
3. Click **"Rollback"** on last working deployment
4. Instant rollback to previous version

---

## 📈 Scaling Considerations

### Vertical Scaling (Single Server)

Current setup handles ~100 concurrent users.

**To scale up:**
- Increase VPS resources (CPU/RAM)
- In Coolify, update container resources
- Recommended: 4GB RAM, 2 CPU cores for 500+ users

### Horizontal Scaling (Multiple Servers)

For high traffic:
1. **Load Balancer:**
   - Add Nginx/HAProxy in front
   - Distribute traffic across multiple app instances

2. **Database:**
   - Move PostgreSQL to managed service (Supabase, RDS)
   - Enable connection pooling
   - Use read replicas for heavy reads

3. **Redis:**
   - Required for session management across instances
   - Use managed Redis (Upstash, Redis Cloud)

---

## 💰 Cost Estimate

**VPS Hosting:**
- Basic (1GB RAM): $5-10/month (Hetzner, DigitalOcean)
- Recommended (4GB RAM): $20-25/month
- Enterprise (8GB RAM): $40-50/month

**Coolify:** FREE (self-hosted)

**Domain:** $10-15/year

**SSL:** FREE (Let's Encrypt via Coolify)

**Total:** ~$30/month for production-ready setup

---

## ✅ Deployment Checklist

### Pre-Deployment:
- [ ] Coolify installed on VPS
- [ ] Domain purchased and DNS configured
- [ ] GitHub repository access
- [ ] Environment variables prepared
- [ ] Strong passwords/secrets generated

### Deployment:
- [ ] Project created in Coolify
- [ ] Application added from GitHub
- [ ] PostgreSQL service configured
- [ ] Environment variables set
- [ ] Domain added with SSL
- [ ] Initial deployment successful
- [ ] Health check passing

### Post-Deployment:
- [ ] Application accessible via domain
- [ ] Database connection working
- [ ] Admin user created
- [ ] Integrations configured (if needed)
- [ ] Monitoring set up
- [ ] Backups enabled
- [ ] Auto-deploy webhook configured

---

## 🎉 Success!

Your Mobile Repair Dashboard is now live on your VPS!

**Access your dashboard:**
```
https://dashboard.yourdomain.com
```

**Check health:**
```bash
curl https://dashboard.yourdomain.com/api/health
```

**View logs:**
```
Coolify Dashboard → Your App → Logs
```

---

## 📞 Support

**Issues:**
- Check Coolify docs: https://coolify.io/docs
- GitHub issues: https://github.com/avi-boop/rep/issues
- Coolify Discord: https://coolify.io/discord

**Quick Fixes:**
- Restart app: Coolify Dashboard → Restart button
- View logs: Coolify Dashboard → Logs tab
- Check health: `/api/health` endpoint

---

**Happy Deploying! 🚀**

*Need help? Check the troubleshooting section or create a GitHub issue.*
