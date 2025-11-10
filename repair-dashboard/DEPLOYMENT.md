# 🚀 Deployment Guide

Complete guide to deploy RepairHub to production.

## Deployment Options

### Option 1: Vercel + Supabase (Recommended - Easiest)

**Best for:**
- Quick deployment
- Free tier available
- Automatic HTTPS
- Zero DevOps

**Cost:** ~$0-20/month

#### Step 1: Deploy Database (Supabase)

1. Go to https://supabase.com
2. Create new project: `repair-shop-production`
3. Set strong database password
4. Wait for provisioning (2 minutes)
5. Go to Settings → Database → Connection String
6. Copy the URI (starts with `postgresql://`)

#### Step 2: Deploy Application (Vercel)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/repair-dashboard.git
git push -u origin main
```

2. Go to https://vercel.com
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

5. Add Environment Variables:
```
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_APP_NAME=RepairHub
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api
JWT_SECRET=generate_random_string_minimum_32_chars
```

6. Click "Deploy"
7. Wait 2-3 minutes
8. Your app is live! 🎉

#### Step 3: Run Migrations

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Run migrations in production
vercel env pull .env.production
npm run prisma:migrate deploy

# Seed data (optional)
npm run prisma:seed
```

#### Step 4: Custom Domain (Optional)

1. In Vercel → Your Project → Settings → Domains
2. Add your domain (e.g., repairs.yourshop.com)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic, 5-10 minutes)

---

### Option 2: DigitalOcean App Platform

**Best for:**
- Full control
- Affordable ($12-30/month)
- Managed database included

#### Step 1: Create Database

1. Go to https://cloud.digitalocean.com
2. Create → Databases → PostgreSQL
3. Choose:
   - Plan: Basic ($15/month)
   - Datacenter: Closest to you
   - Database name: `repair-shop-db`
4. Wait for creation (5 minutes)
5. Go to Settings → Connection Details
6. Copy connection string

#### Step 2: Deploy App

1. Create → Apps
2. Connect GitHub repository
3. Configure:
   - Resource Type: Web Service
   - Build Command: `npm run build && npm run prisma:generate`
   - Run Command: `npm start`

4. Add environment variables (same as Vercel)

5. Click "Create Resources"

#### Step 3: Run Migrations

```bash
# Connect via DO console or:
doctl apps create-deployment <app-id>

# Or via connection string:
DATABASE_URL="your_do_connection_string" npm run prisma:migrate deploy
```

---

### Option 3: Self-Hosted (VPS)

**Best for:**
- Maximum control
- Custom requirements
- Cost optimization for scale

**Cost:** ~$5-40/month (VPS + DB)

#### Prerequisites
- Ubuntu 22.04 VPS
- Domain name
- SSH access

#### Step 1: Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y
```

#### Step 2: Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
\q
```

#### Step 3: Deploy Application

```bash
# Create app directory
mkdir -p /var/www/repair-dashboard
cd /var/www/repair-dashboard

# Clone repository
git clone https://github.com/yourusername/repair-dashboard.git .

# Install dependencies
npm install

# Create .env
nano .env
# Paste production environment variables

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate deploy

# Seed data (optional)
npm run prisma:seed

# Build application
npm run build

# Start with PM2
pm2 start npm --name "repair-dashboard" -- start
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx

```bash
nano /etc/nginx/sites-available/repair-dashboard
```

```nginx
server {
    listen 80;
    server_name repairs.yourshop.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/repair-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: SSL Certificate (Free)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d repairs.yourshop.com

# Auto-renewal is set up automatically
```

---

## Environment Variables for Production

### Required
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXT_PUBLIC_APP_NAME="RepairHub"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
JWT_SECRET="minimum-32-character-random-string"
```

### Optional (Notifications)
```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="+1234567890"
SENDGRID_API_KEY="SG.xxxxxxxxx"
FROM_EMAIL="noreply@yourshop.com"
```

### Optional (Lightspeed)
```bash
LIGHTSPEED_API_KEY="your_key"
LIGHTSPEED_ACCOUNT_ID="123456"
LIGHTSPEED_API_URL="https://api.lightspeedapp.com"
```

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall (UFW or provider firewall)
- [ ] Restrict database access to application server only
- [ ] Set up automated backups
- [ ] Enable fail2ban (self-hosted only)
- [ ] Set NODE_ENV=production
- [ ] Remove test users from database
- [ ] Review and remove unnecessary API endpoints
- [ ] Set up monitoring (Sentry, etc.)

## Database Backup

### Automated (Recommended)

**Supabase:**
- Automatic daily backups (paid plans)
- Point-in-time recovery available

**DigitalOcean:**
- Automatic daily backups included
- Configure in DB settings

**Self-Hosted:**
```bash
# Create backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/repair-shop"
mkdir -p $BACKUP_DIR

pg_dump -U repair_admin -d repair_shop_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

```bash
# Make executable
chmod +x /root/backup-db.sh

# Schedule daily at 2 AM
crontab -e
0 2 * * * /root/backup-db.sh
```

## Monitoring & Maintenance

### Error Tracking

**Sentry (Recommended):**
1. Sign up at https://sentry.io
2. Create project
3. Install SDK:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

4. Add environment variable:
```
NEXT_PUBLIC_SENTRY_DSN="your_dsn_here"
```

### Uptime Monitoring

**UptimeRobot (Free):**
1. Go to https://uptimerobot.com
2. Add monitor:
   - URL: https://your-domain.com
   - Interval: 5 minutes
3. Set up email alerts

### Performance Monitoring

**Vercel Analytics:**
- Automatically included with Vercel
- View in dashboard

**Google Analytics:**
Add to `app/layout.tsx`:
```typescript
// Add Google Analytics tracking code
```

## Scaling Considerations

### When to Scale

Scale when you experience:
- Response times > 2 seconds
- Database CPU > 80%
- Memory usage > 80%
- 1000+ repairs/month
- 50+ concurrent users

### Scaling Options

**Database:**
- Increase connection pool
- Add read replicas
- Enable query caching
- Optimize indexes

**Application:**
- Enable CDN (Vercel automatically does this)
- Add Redis caching
- Horizontal scaling (multiple instances)
- Enable compression

**Example Redis Setup:**
```bash
# Install Redis
npm install redis

# Add to .env
REDIS_URL="redis://localhost:6379"
```

```typescript
// lib/cache.ts
import { createClient } from 'redis'

const client = createClient({ url: process.env.REDIS_URL })
await client.connect()

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await client.get(key)
  if (cached) return JSON.parse(cached)

  const data = await fetcher()
  await client.setEx(key, ttl, JSON.stringify(data))
  return data
}
```

## Rollback Procedure

If deployment fails:

**Vercel:**
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

**DigitalOcean:**
1. Redeploy previous commit from GitHub

**Self-Hosted:**
```bash
pm2 stop repair-dashboard
git checkout <previous-commit-hash>
npm install
npm run build
pm2 restart repair-dashboard
```

## Production Checklist

Before launch:

- [ ] Database is backed up
- [ ] SSL certificate is active
- [ ] Environment variables are set
- [ ] Domain is configured
- [ ] Migrations are run
- [ ] Sample data is seeded (or real data imported)
- [ ] Admin user is created
- [ ] Test all core workflows:
  - [ ] Create repair
  - [ ] Update status
  - [ ] View customer
  - [ ] Check pricing
- [ ] Error monitoring is set up
- [ ] Uptime monitoring is active
- [ ] Backups are automated
- [ ] Team is trained
- [ ] Documentation is accessible

## Post-Deployment

### Day 1
- Monitor error logs
- Watch for slow queries
- Check uptime
- Verify notifications work

### Week 1
- Gather user feedback
- Fix critical bugs
- Optimize slow pages
- Adjust pricing if needed

### Month 1
- Review analytics
- Plan feature improvements
- Optimize database queries
- Scale if needed

---

**Congratulations! Your RepairHub is now live! 🎉**

Need help? Check the comprehensive documentation or the troubleshooting guides.
