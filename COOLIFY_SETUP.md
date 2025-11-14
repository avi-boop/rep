# Coolify Auto-Deployment Setup Guide

Complete guide for setting up automatic deployment from GitHub to Coolify for the Mobile Repair Dashboard application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Application Architecture](#application-architecture)
4. [Coolify Configuration Files](#coolify-configuration-files)
5. [Step-by-Step Setup](#step-by-step-setup)
6. [GitHub Webhook Configuration](#github-webhook-configuration)
7. [Environment Variables](#environment-variables)
8. [Deployment Process](#deployment-process)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This repository contains a full-stack mobile repair shop dashboard with multiple services:

- **Backend**: Express.js API (Port 3001)
- **Frontend**: Next.js 14 application (Port 3000)
- **App**: Next.js 16 application with Prisma (Port 3000)
- **Dashboard**: Secured Next.js dashboard (Port 3000)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

Each service has its own `coolify.json` configuration file for easy deployment.

---

## Prerequisites

1. **Coolify Instance** (v4 or later)
   - Self-hosted or managed Coolify instance
   - Access to Coolify dashboard
   - SSL certificate configured (recommended)

2. **GitHub Repository**
   - Repository with push access
   - Admin access to configure webhooks

3. **Domain Names** (optional but recommended)
   - Separate domains/subdomains for each service
   - DNS configured to point to Coolify server

4. **Database Credentials**
   - PostgreSQL password
   - Redis password (if using authentication)

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub Repo                         │
│                    (Source of Truth)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Webhook on Push
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      Coolify Instance                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Backend    │  │   Frontend   │  │     App      │     │
│  │  (API:3001)  │  │  (Next:3000) │  │ (Next:3000)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼───────┐   │
│  │              Shared Services                        │   │
│  │  ┌──────────────┐      ┌──────────────┐           │   │
│  │  │  PostgreSQL  │      │    Redis     │           │   │
│  │  │   (15-alpine)│      │  (7-alpine)  │           │   │
│  │  └──────────────┘      └──────────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Coolify Configuration Files

Each service has a `coolify.json` file in its directory:

### 1. Backend (`backend/coolify.json`)

```json
{
  "name": "mobile-repair-backend",
  "type": "application",
  "build": {
    "type": "dockerfile",
    "dockerfile": "Dockerfile"
  },
  "port": 3001,
  "services": {
    "postgres": {...},
    "redis": {...}
  },
  "healthcheck": {
    "path": "/api/health"
  },
  "commands": {
    "postDeploy": [
      "npx prisma migrate deploy",
      "npx prisma generate"
    ]
  }
}
```

**Key Features:**
- Automatic Prisma migrations after deployment
- Health check endpoint at `/api/health`
- Includes PostgreSQL and Redis services
- Persistent volumes for uploads and logs

### 2. Frontend (`frontend/coolify.json`)

```json
{
  "name": "mobile-repair-frontend",
  "type": "application",
  "build": {
    "type": "dockerfile",
    "dockerfile": "Dockerfile"
  },
  "port": 3000,
  "dependsOn": ["mobile-repair-backend"]
}
```

**Key Features:**
- Depends on backend service
- Next.js 14 production build
- Health check at root path `/`

### 3. App (`app/coolify.json`)

```json
{
  "name": "mobile-repair-app",
  "type": "application",
  "build": {
    "type": "dockerfile",
    "dockerfile": "Dockerfile"
  },
  "port": 3000,
  "services": {
    "postgres": {...}
  },
  "commands": {
    "postDeploy": [
      "npx prisma migrate deploy",
      "npx prisma generate"
    ]
  }
}
```

**Key Features:**
- Next.js 16 with React 19
- Separate Prisma database
- Automatic migrations

### 4. Dashboard (`dashboard/coolify.json`)

```json
{
  "name": "mobile-repair-dashboard",
  "type": "application",
  "build": {
    "type": "dockerfile",
    "dockerfile": "Dockerfile.production"
  },
  "port": 3000,
  "services": {
    "postgres": {...},
    "redis": {...}
  }
}
```

**Key Features:**
- Secured dashboard with httpOnly authentication
- Uses production Dockerfile
- Includes PostgreSQL and Redis

---

## Step-by-Step Setup

### Step 1: Login to Coolify

1. Access your Coolify dashboard (e.g., `https://coolify.yourdomain.com`)
2. Login with your credentials

### Step 2: Create a New Project

1. Click **"+ New"** → **"Project"**
2. Name: `Mobile Repair Dashboard`
3. Click **"Create Project"**

### Step 3: Add Your GitHub Repository

1. Inside the project, click **"+ New"** → **"Resource"** → **"Application"**
2. Choose **"Public Repository"** or connect your GitHub account for private repos
3. Enter repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO`
4. Select branch: `main` (or your production branch)
5. Click **"Continue"**

### Step 4: Configure Backend Service

1. **Build Configuration:**
   - Build Pack: Select **"Dockerfile"**
   - Dockerfile Location: `backend/Dockerfile`
   - Base Directory: `backend`

2. **Port Configuration:**
   - Port: `3001`

3. **Domain Configuration:**
   - Add domain: `api.yourdomain.com` (or subdomain of your choice)
   - Enable **"Generate SSL Certificate"**

4. **Environment Variables** (see [Environment Variables](#environment-variables) section)

5. Click **"Save"** and **"Deploy"**

### Step 5: Configure PostgreSQL Database

**Option A: Use Coolify's Built-in PostgreSQL**

1. In the project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Configure:
   - Version: `15-alpine`
   - Database Name: `mobile_repair_db`
   - Username: `repair_admin`
   - Password: Generate strong password
3. Click **"Create"**
4. Note the connection string for backend configuration

**Option B: Use Service in coolify.json**

The `coolify.json` files already define PostgreSQL as a service. Coolify will automatically provision it.

### Step 6: Configure Redis Cache

**Option A: Use Coolify's Built-in Redis**

1. In the project, click **"+ New"** → **"Database"** → **"Redis"**
2. Configure:
   - Version: `7-alpine`
   - Persistence: Enable AOF
3. Click **"Create"**
4. Note the connection string

**Option B: Use Service in coolify.json**

The `coolify.json` files already define Redis as a service. Coolify will automatically provision it.

### Step 7: Configure Frontend Service

1. **Build Configuration:**
   - Build Pack: **"Dockerfile"**
   - Dockerfile Location: `frontend/Dockerfile`
   - Base Directory: `frontend`

2. **Port Configuration:**
   - Port: `3000`

3. **Domain Configuration:**
   - Add domain: `app.yourdomain.com`
   - Enable SSL

4. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

5. **Deploy Order:**
   - Set to deploy AFTER backend
   - Add dependency on backend service

6. Click **"Save"** and **"Deploy"**

### Step 8: Configure App Service

1. **Build Configuration:**
   - Build Pack: **"Dockerfile"**
   - Dockerfile Location: `app/Dockerfile`
   - Base Directory: `app`

2. **Port Configuration:**
   - Port: `3000`

3. **Domain Configuration:**
   - Add domain: `admin.yourdomain.com`
   - Enable SSL

4. **Environment Variables:**
   ```env
   DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

5. Click **"Save"** and **"Deploy"**

### Step 9: Configure Dashboard Service

1. **Build Configuration:**
   - Build Pack: **"Dockerfile"**
   - Dockerfile Location: `dashboard/Dockerfile.production`
   - Base Directory: `dashboard`

2. **Port Configuration:**
   - Port: `3000`

3. **Domain Configuration:**
   - Add domain: `dashboard.yourdomain.com`
   - Enable SSL

4. **Environment Variables:**
   ```env
   DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db
   REDIS_URL=redis://redis:6379
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

5. Click **"Save"** and **"Deploy"**

---

## GitHub Webhook Configuration

To enable automatic deployments when you push code to GitHub:

### Automatic Setup (Recommended)

1. In Coolify, go to your application
2. Navigate to **"Webhooks"** tab
3. Click **"Enable GitHub Webhook"**
4. Coolify will automatically configure the webhook on GitHub (requires GitHub app integration)

### Manual Setup

If automatic setup doesn't work, configure manually:

1. **Get Webhook URL from Coolify:**
   - In Coolify, go to your application
   - Navigate to **"Webhooks"** tab
   - Copy the webhook URL (format: `https://coolify.yourdomain.com/webhooks/YOUR_UNIQUE_ID`)

2. **Configure in GitHub:**
   - Go to your GitHub repository
   - Navigate to **Settings** → **Webhooks** → **Add webhook**
   - Configure:
     - **Payload URL**: Paste the webhook URL from Coolify
     - **Content type**: `application/json`
     - **Secret**: Leave empty (or set if Coolify requires)
     - **SSL verification**: Enable SSL verification
     - **Which events would you like to trigger this webhook?**
       - Select **"Just the push event"**
     - **Active**: Check this box
   - Click **"Add webhook"**

3. **Test the Webhook:**
   - GitHub will send a test ping
   - Check in Coolify logs if the webhook was received
   - Make a small commit and push to trigger deployment

### Webhook for Multiple Services

If deploying multiple services, you can either:

**Option A: Single Webhook for All Services**
- Create a Coolify "Project" webhook that triggers all services
- Configure: Settings → Webhooks → Enable project-wide webhook

**Option B: Individual Webhooks per Service**
- Create separate webhook URLs for each service (backend, frontend, app, dashboard)
- Configure each in GitHub (you can have multiple webhooks per repository)

### Deployment Branches

Configure which branches trigger deployment:

- **Production**: `main` branch
- **Staging**: `develop` branch
- **Feature branches**: Optionally deploy to preview environments

In Coolify:
1. Go to application settings
2. Set **"Branch"** field to match your desired branch
3. For preview deployments, enable **"Pull Request Deployments"**

---

## Environment Variables

### Required Environment Variables

#### Backend Service

```env
# Database
DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db

# Redis
REDIS_URL=redis://redis:6379

# Application
NODE_ENV=production
PORT=3001

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=https://app.yourdomain.com,https://dashboard.yourdomain.com
```

#### Frontend Service

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### App Service

```env
# Database
DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### Dashboard Service

```env
# Database
DATABASE_URL=postgresql://repair_admin:PASSWORD@postgres:5432/mobile_repair_db

# Redis
REDIS_URL=redis://redis:6379

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here
```

### Setting Environment Variables in Coolify

1. Navigate to your application in Coolify
2. Click on **"Environment Variables"** tab
3. For each variable:
   - Click **"+ Add"**
   - Enter **Key** and **Value**
   - For secrets (passwords, API keys):
     - Check **"Is Secret"** to hide the value
4. Click **"Save"**
5. **Redeploy** the application for changes to take effect

### Best Practices

1. **Never commit secrets** to your repository
2. **Use strong passwords** for database and Redis
3. **Rotate secrets regularly** (at least every 90 days)
4. **Use different secrets** for staging and production
5. **Keep `.env.example` updated** but without actual values

---

## Deployment Process

### How Auto-Deployment Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                            │
│                   git push origin main                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      GitHub                                 │
│              (Receives Push Event)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Webhook Trigger
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Coolify                                │
│                                                              │
│  1. Receive webhook notification                           │
│  2. Clone/pull latest code from GitHub                     │
│  3. Read coolify.json configuration                        │
│  4. Build Docker image using specified Dockerfile          │
│  5. Run health checks                                       │
│  6. Stop old container (if running)                        │
│  7. Start new container                                     │
│  8. Run post-deploy commands (migrations, etc.)            │
│  9. Update load balancer / proxy                           │
│ 10. Send deployment notification                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Deployment Complete                         │
│            Application Live & Accessible                    │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Steps Detail

1. **Code Push**
   - Developer pushes code to GitHub
   - GitHub webhook triggers Coolify

2. **Pre-Build**
   - Coolify clones repository
   - Checks out specified branch
   - Reads `coolify.json` configuration

3. **Build Phase**
   - Builds Docker image using multi-stage Dockerfile
   - Caches layers for faster subsequent builds
   - Runs `npm install` and compiles code

4. **Database Migrations** (Backend & App)
   - Runs Prisma migrations: `npx prisma migrate deploy`
   - Generates Prisma Client: `npx prisma generate`
   - Ensures database schema is up-to-date

5. **Container Deployment**
   - Starts new container with built image
   - Maps ports and volumes
   - Connects to database and Redis services

6. **Health Checks**
   - Waits for application to be healthy
   - Checks defined health check endpoints
   - Fails deployment if health checks fail

7. **Traffic Switching** (Zero-Downtime)
   - Routes traffic to new container
   - Keeps old container running briefly
   - Gracefully shuts down old container

8. **Post-Deploy**
   - Runs any post-deploy commands
   - Sends notifications (if configured)
   - Updates deployment logs

### Zero-Downtime Deployment

Coolify ensures zero-downtime deployments by:

1. Starting new container before stopping old one
2. Running health checks on new container
3. Only switching traffic after new container is healthy
4. Keeping old container as backup for quick rollback

### Rollback Process

If a deployment fails or you need to rollback:

1. In Coolify, navigate to your application
2. Go to **"Deployments"** tab
3. Find the previous successful deployment
4. Click **"Rollback"** button
5. Confirm rollback

Coolify will:
- Deploy the previous version
- Run all necessary migrations (backwards if needed)
- Switch traffic to the rolled-back version

---

## Troubleshooting

### Common Issues

#### 1. Webhook Not Triggering Deployment

**Symptoms:**
- Push to GitHub doesn't trigger Coolify deployment
- No deployment logs in Coolify

**Solutions:**
- Verify webhook URL is correct in GitHub settings
- Check webhook delivery logs in GitHub (Settings → Webhooks → Recent Deliveries)
- Ensure Coolify server is accessible from internet
- Check firewall rules allow incoming webhooks
- Verify webhook secret (if configured)

#### 2. Build Failures

**Symptoms:**
- Build fails during Docker image creation
- Error in Coolify build logs

**Solutions:**
- Check Dockerfile syntax
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility (backend: 18, app: 20)
- Check for missing environment variables during build
- Review build logs in Coolify for specific errors

#### 3. Database Connection Errors

**Symptoms:**
- Application starts but can't connect to database
- Prisma errors in logs

**Solutions:**
- Verify `DATABASE_URL` environment variable is correct
- Check database service is running in Coolify
- Ensure database credentials match
- Verify database network connectivity
- Check PostgreSQL logs for connection attempts

#### 4. Prisma Migration Failures

**Symptoms:**
- Post-deploy commands fail
- "Migration failed" errors

**Solutions:**
- Run migrations manually first to identify issues
- Check database has proper permissions
- Verify Prisma schema is valid
- Ensure database is accessible during deployment
- Check for conflicting migrations

#### 5. Container Health Check Failures

**Symptoms:**
- Deployment fails at health check stage
- Container keeps restarting

**Solutions:**
- Verify health check endpoint is correct (`/api/health` for backend, `/` for frontend)
- Ensure application starts within health check timeout
- Check application logs for startup errors
- Increase health check timeout in `coolify.json`
- Verify application binds to correct port

#### 6. Environment Variables Not Loaded

**Symptoms:**
- Application behaves differently than expected
- Missing configuration errors

**Solutions:**
- Verify environment variables are set in Coolify
- Check variable names match exactly (case-sensitive)
- Redeploy after changing environment variables
- Check if variables need `NEXT_PUBLIC_` prefix (Next.js frontend)
- Review logs for "undefined" environment variable messages

#### 7. Port Conflicts

**Symptoms:**
- Container fails to start
- "Port already in use" errors

**Solutions:**
- Ensure each service uses unique port
- Backend: 3001, Frontend/App/Dashboard: 3000 (on different services)
- Check no other services using the same ports
- Verify port mapping in Coolify settings

#### 8. SSL Certificate Issues

**Symptoms:**
- HTTPS not working
- Certificate errors in browser

**Solutions:**
- Verify domain DNS points to Coolify server
- Wait for Let's Encrypt certificate generation (can take up to 10 minutes)
- Check Coolify has proper SSL provider configured
- Verify domain is accessible on port 80 (required for Let's Encrypt)
- Check SSL certificate logs in Coolify

### Viewing Logs

#### Application Logs

1. Navigate to your application in Coolify
2. Click on **"Logs"** tab
3. View real-time logs
4. Filter by:
   - Build logs
   - Runtime logs
   - Error logs

#### Database Logs

1. Navigate to PostgreSQL service in Coolify
2. Click on **"Logs"** tab
3. View database connection attempts and errors

#### Deployment Logs

1. Navigate to application in Coolify
2. Click on **"Deployments"** tab
3. Click on specific deployment to view detailed logs

### Getting Help

1. **Coolify Documentation**: https://coolify.io/docs
2. **Coolify Discord**: https://discord.gg/coolify
3. **GitHub Issues**: Check repository issues for similar problems
4. **Application Logs**: Always check logs first for error messages

### Useful Commands

#### Access Container Shell

```bash
# In Coolify, go to application → "Terminal" tab
# Or via SSH to Coolify server:
docker exec -it <container_id> sh
```

#### Check Database Connection

```bash
# Inside backend container
npx prisma db pull
```

#### Run Migrations Manually

```bash
# Inside backend/app container
npx prisma migrate deploy
npx prisma generate
```

#### Check Environment Variables

```bash
# Inside container
printenv | grep DATABASE_URL
```

---

## Advanced Configuration

### Preview Deployments (Pull Requests)

Enable preview deployments for pull requests:

1. In Coolify application settings
2. Enable **"Pull Request Deployments"**
3. Configure:
   - Which branches to deploy (e.g., all branches except main)
   - Auto-delete preview after PR merge
   - Custom subdomain pattern: `pr-{PR_NUMBER}.yourdomain.com`

### Custom Build Arguments

Add build-time arguments in `coolify.json`:

```json
{
  "build": {
    "type": "dockerfile",
    "dockerfile": "Dockerfile",
    "args": {
      "NODE_VERSION": "18",
      "BUILD_ENV": "production"
    }
  }
}
```

### Custom Docker Compose

For complex setups, use Docker Compose instead of coolify.json:

1. Create `docker-compose.coolify.yml` in repository root
2. In Coolify, select **"Docker Compose"** as build type
3. Coolify will use your compose file for deployment

### Scheduled Tasks / Cron Jobs

Run periodic tasks:

1. In Coolify application, go to **"Scheduled Tasks"** tab
2. Add cron expression and command
3. Example: Database backup every day at 2 AM
   - Cron: `0 2 * * *`
   - Command: `npm run backup:database`

### Monitoring & Alerts

Set up monitoring:

1. In Coolify project settings, go to **"Notifications"**
2. Configure notification channels:
   - Email
   - Slack
   - Discord
   - Webhook
3. Set alert rules:
   - Deployment failed
   - Health check failed
   - High resource usage

---

## Security Checklist

- [ ] All environment variables are set and secured
- [ ] Database passwords are strong and unique
- [ ] JWT secrets are randomly generated and secure
- [ ] SSL certificates are properly configured
- [ ] CORS is configured with specific origins (not `*`)
- [ ] API rate limiting is enabled (helmet, express-rate-limit)
- [ ] Database backups are configured
- [ ] Coolify instance is on latest version
- [ ] GitHub webhook secret is configured (optional but recommended)
- [ ] Non-root users are used in Docker containers
- [ ] Sensitive files are not committed to repository
- [ ] Health check endpoints don't expose sensitive information

---

## Next Steps

After completing the Coolify setup:

1. **Test the Auto-Deployment**
   - Make a small change to your code
   - Commit and push to GitHub
   - Verify deployment triggers automatically
   - Check application is updated

2. **Set Up Monitoring**
   - Configure uptime monitoring (e.g., UptimeRobot, Pingdom)
   - Set up error tracking (e.g., Sentry)
   - Configure log aggregation

3. **Configure Backups**
   - Set up automated database backups
   - Test restore process
   - Store backups off-site (S3, Backblaze B2)

4. **Performance Optimization**
   - Configure CDN for static assets
   - Enable Redis caching
   - Optimize Docker images for size

5. **Documentation**
   - Document your specific environment variables
   - Create runbook for common issues
   - Document custom configurations

---

## Support

For issues specific to:
- **Coolify**: https://coolify.io/docs or Discord
- **This Application**: Create issue in GitHub repository
- **General Docker**: https://docs.docker.com
- **Prisma**: https://www.prisma.io/docs

---

**Last Updated**: 2025-11-14
**Version**: 1.0
