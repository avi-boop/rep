# Deployment Guide - Mobile Repair Dashboard

## 🚀 Production Deployment Roadmap

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema finalized
- [ ] SSL certificate ready
- [ ] Domain configured
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Documentation complete

---

## Option 1: Vercel + Supabase (Recommended for Quick Start)

### Why This Stack?
- ✅ Zero configuration deployment
- ✅ Free tier available
- ✅ Automatic SSL
- ✅ Built-in CDN
- ✅ Great DX (Developer Experience)

### Step-by-Step Deployment

#### 1. Set Up Supabase (Database)

```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Wait for database provisioning (~2 minutes)
# 4. Go to Settings > Database
# 5. Copy connection string
```

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### 2. Initialize Database

```bash
# Connect to Supabase
psql "postgresql://postgres:..."

# Run schema
\i prisma/schema.sql

# Run seeds
\i DATABASE_SEEDS.sql

# Verify
SELECT COUNT(*) FROM brands;
```

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: repair-dashboard
# - Directory: ./
# - Override settings? No

# Set environment variables
vercel env add DATABASE_URL production
# Paste your Supabase connection string

vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
# ... add all env vars

# Deploy to production
vercel --prod
```

#### 4. Configure Domain

```bash
# Add custom domain
vercel domains add yourdomain.com

# Follow DNS configuration instructions
# Add these records to your domain:
# A     @     76.76.21.21
# CNAME www   cname.vercel-dns.com
```

#### 5. Enable Cron Jobs (Optional)

**`vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-lightspeed",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## Option 2: AWS (Scalable Production Setup)

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Route 53                          │
│                  (DNS Management)                    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  CloudFront                          │
│              (CDN + SSL Certificate)                 │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Application Load Balancer               │
└─────────┬─────────────────────────┬──────────────────┘
          │                         │
    ┌─────▼─────┐           ┌───────▼───────┐
    │  ECS Task │           │   ECS Task    │
    │  (Web App)│           │   (Web App)   │
    └─────┬─────┘           └───────┬───────┘
          │                         │
          └──────────┬──────────────┘
                     │
    ┌────────────────▼────────────────────────┐
    │         RDS PostgreSQL                  │
    │         (Multi-AZ for HA)               │
    └─────────────────────────────────────────┘
```

### Step-by-Step AWS Deployment

#### 1. Prepare Docker Image

**`Dockerfile`**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**`next.config.js`** (add this)
```javascript
module.exports = {
  output: 'standalone',
  // ... rest of config
}
```

#### 2. Build and Push to ECR

```bash
# Login to AWS
aws configure

# Create ECR repository
aws ecr create-repository --repository-name repair-dashboard

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t repair-dashboard .

# Tag image
docker tag repair-dashboard:latest [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/repair-dashboard:latest

# Push image
docker push [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/repair-dashboard:latest
```

#### 3. Set Up RDS Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier repair-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted
```

#### 4. Create ECS Cluster and Service

**`task-definition.json`**
```json
{
  "family": "repair-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "[ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/repair-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:repair-db-connection"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/repair-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create ECS cluster
aws ecs create-cluster --cluster-name repair-cluster

# Create service
aws ecs create-service \
  --cluster repair-cluster \
  --service-name repair-service \
  --task-definition repair-dashboard \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=3000"
```

#### 5. Set Up Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/repair-cluster/repair-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/repair-cluster/repair-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**`scaling-policy.json`**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

---

## Option 3: DigitalOcean App Platform (Easiest)

### Why DigitalOcean?
- 💰 Affordable ($12/month starting)
- 🎯 Simple setup
- 📦 Managed database included
- 🔄 Auto-deploy from Git

### Deployment Steps

#### 1. Create App

```bash
# Install doctl CLI
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec app-spec.yaml
```

**`app-spec.yaml`**
```yaml
name: repair-dashboard
region: nyc
services:
  - name: web
    github:
      repo: your-username/repair-dashboard
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xs
    http_port: 3000
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: TWILIO_ACCOUNT_SID
        value: ${TWILIO_ACCOUNT_SID}
        type: SECRET
      - key: TWILIO_AUTH_TOKEN
        value: ${TWILIO_AUTH_TOKEN}
        type: SECRET
    routes:
      - path: /

databases:
  - name: db
    engine: PG
    version: "15"
    production: true
    cluster_name: repair-db

jobs:
  - name: migrate
    kind: PRE_DEPLOY
    run_command: npx prisma migrate deploy
```

#### 2. Add Secrets

```bash
# Add encrypted secrets
doctl apps create-deployment [APP_ID] \
  --with-env TWILIO_ACCOUNT_SID=your-value \
  --with-env TWILIO_AUTH_TOKEN=your-value \
  --with-env SENDGRID_API_KEY=your-value
```

#### 3. Configure Domain

```bash
# Add domain to app
doctl apps create-domain [APP_ID] --domain yourdomain.com

# Update DNS records as shown in output
```

---

## Environment Variables Reference

### Required Variables

```bash
# Application
NODE_ENV=production
APP_URL=https://yourdomain.com
SESSION_SECRET=generate-random-32-char-string

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Shop Info
SHOP_NAME="Your Repair Shop"
SHOP_PHONE="+1234567890"
SHOP_ADDRESS="123 Main St, City, State"
SHOP_HOURS="Mon-Sat 9am-6pm"

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Optional: Lightspeed
LIGHTSPEED_CLIENT_ID=your-id
LIGHTSPEED_CLIENT_SECRET=your-secret
LIGHTSPEED_ACCOUNT_ID=your-account
LIGHTSPEED_REFRESH_TOKEN=your-token

# Optional: AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=repair-photos

# Optional: Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Generate Secrets

```bash
# Session secret (32 chars)
openssl rand -hex 32

# JWT secret
openssl rand -base64 32
```

---

## Database Migration Strategy

### Zero-Downtime Migrations

```bash
# 1. Always make migrations backward compatible
# 2. Use these steps:

# Step 1: Add new column as nullable
ALTER TABLE repairs ADD COLUMN new_field VARCHAR(100);

# Step 2: Deploy code that writes to both old and new
# (deploy application)

# Step 3: Backfill data
UPDATE repairs SET new_field = old_field WHERE new_field IS NULL;

# Step 4: Make column non-nullable
ALTER TABLE repairs ALTER COLUMN new_field SET NOT NULL;

# Step 5: Deploy code that only uses new field
# (deploy application)

# Step 6: Remove old column
ALTER TABLE repairs DROP COLUMN old_field;
```

### Backup Before Migration

```bash
# PostgreSQL backup
pg_dump -h host -U user -d database > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore if needed
psql -h host -U user -d database < backup-20250110-120000.sql
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Using Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Monitoring Setup

### 1. Application Monitoring (Sentry)

```bash
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

**`sentry.client.config.js`**
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Don't send password fields
    if (event.request) {
      delete event.request.cookies
    }
    return event
  },
})
```

### 2. Uptime Monitoring (UptimeRobot)

```bash
# 1. Go to https://uptimerobot.com
# 2. Create monitor:
#    - Type: HTTP(s)
#    - URL: https://yourdomain.com/api/health
#    - Interval: 5 minutes
# 3. Add alert contacts (email, SMS)
```

### 3. Health Check Endpoint

**`app/api/health/route.ts`**
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check external services (optional)
    const checks = {
      database: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    }
    
    return NextResponse.json({ status: 'healthy', checks })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

### 4. Logging (Better Stack / Papertrail)

```bash
# Install winston
npm install winston

# Configure logger
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

---

## Backup Strategy

### Automated Daily Backups

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="repair_db"
S3_BUCKET="s3://your-backup-bucket"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup-$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup-$DATE.sql.gz $S3_BUCKET/

# Keep only last 30 days
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +30 -delete

# Verify backup
if [ $? -eq 0 ]; then
    echo "Backup successful: backup-$DATE.sql.gz"
else
    echo "Backup failed!" | mail -s "Backup Error" admin@yourdomain.com
fi
```

**Add to crontab:**
```bash
0 2 * * * /path/to/backup-db.sh
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes on frequently queried columns
CREATE INDEX CONCURRENTLY idx_repairs_status ON repairs(status);
CREATE INDEX CONCURRENTLY idx_repairs_customer ON repairs(customer_id);
CREATE INDEX CONCURRENTLY idx_repairs_created ON repairs(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM repairs WHERE status = 'in_progress';
```

### 2. Enable Redis Caching

```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch and cache
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  
  return data
}
```

### 3. CDN Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.cloudfront.net'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

---

## Rollback Plan

### Quick Rollback Procedure

```bash
# 1. Revert to previous deployment
vercel rollback  # Vercel
# or
aws ecs update-service --cluster repair-cluster --service repair-service --task-definition repair-dashboard:PREVIOUS_VERSION

# 2. If database migration issue, restore from backup
psql -h host -U user -d database < backup-latest.sql

# 3. Clear application cache
redis-cli FLUSHDB

# 4. Verify health
curl https://yourdomain.com/api/health
```

---

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] Database migrations applied
- [ ] Can create new repair
- [ ] SMS notifications send
- [ ] Email notifications send
- [ ] Lightspeed sync works (if enabled)
- [ ] All API endpoints respond
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured
- [ ] Backup ran successfully
- [ ] Performance acceptable (< 2s page load)
- [ ] Mobile version works
- [ ] No JavaScript errors in console
- [ ] Documentation updated
- [ ] Team trained on new features

---

## Support & Maintenance

### Weekly Tasks
- [ ] Review error logs
- [ ] Check backup success
- [ ] Monitor disk space
- [ ] Review performance metrics

### Monthly Tasks
- [ ] Update dependencies
- [ ] Review and optimize slow queries
- [ ] Audit user access
- [ ] Test disaster recovery

### Quarterly Tasks
- [ ] Security audit
- [ ] Review and update documentation
- [ ] Capacity planning
- [ ] User feedback review

---

## 🎉 You're Live!

Your mobile repair dashboard is now deployed and ready to transform your business operations!

**Need help?** Refer back to:
- `QUICK_START_GUIDE.md` for development
- `TESTING_GUIDE.md` for quality assurance
- `SYSTEM_ARCHITECTURE.md` for technical details

**Good luck! 🚀**
