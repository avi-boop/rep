# Deployment Guide - Mobile Repair Dashboard

## 🚀 Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- PostgreSQL database (Supabase recommended)

### Step 1: Database Setup

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the `Connection pooling` URL (transaction mode)
5. Save for later use

#### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the `DATABASE_URL` from Variables tab

#### Option C: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

### Step 2: Push to GitHub

```bash
cd /workspace/repair-dashboard
git init
git add .
git commit -m "Initial commit - Mobile Repair Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/repair-dashboard.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (or leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

5. Add Environment Variables:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-32-char-string
NEXTAUTH_URL=https://your-app.vercel.app
```

6. Click "Deploy"

### Step 4: Initialize Database

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Push database schema
npx prisma db push

# Seed database
npx prisma db seed
```

Alternatively, use Vercel's terminal:
1. Go to your project → Settings → Functions
2. Use the Vercel CLI in the online terminal

### Step 5: Configure Domain (Optional)

1. Go to Project Settings → Domains
2. Add custom domain
3. Follow DNS instructions

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
docker build -t repair-dashboard .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  repair-dashboard
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/repair_db
      - NEXTAUTH_SECRET=your-secret
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=repair_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

---

## ☁️ AWS Deployment

### Using AWS Amplify

1. Go to AWS Amplify Console
2. Connect repository
3. Set build settings:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```
4. Add environment variables
5. Deploy

### Using AWS ECS (Advanced)

See AWS ECS documentation for containerized deployment.

---

## 🔧 DigitalOcean App Platform

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Create new app → GitHub repository
3. Configure:
   - **Type:** Web Service
   - **Build Command:** `npm run build`
   - **Run Command:** `npm start`
4. Add PostgreSQL database (managed)
5. Set environment variables
6. Deploy

---

## 📦 Manual VPS Deployment

### Requirements
- Ubuntu 20.04+ or similar
- Node.js 18+
- PostgreSQL 12+
- Nginx
- PM2

### Setup Steps

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 3. Create database
sudo -u postgres psql
CREATE DATABASE repair_db;
CREATE USER repair_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE repair_db TO repair_user;
\q

# 4. Install PM2
sudo npm install -g pm2

# 5. Clone and setup project
git clone https://github.com/YOUR_USERNAME/repair-dashboard.git
cd repair-dashboard
npm install
npx prisma db push
npx prisma db seed
npm run build

# 6. Start with PM2
pm2 start npm --name "repair-dashboard" -- start
pm2 save
pm2 startup

# 7. Install and configure Nginx
sudo apt install nginx
sudo nano /etc/nginx/sites-available/repair-dashboard
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
sudo ln -s /etc/nginx/sites-available/repair-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security Checklist

- [ ] Change default `NEXTAUTH_SECRET` to random 32+ character string
- [ ] Use PostgreSQL in production (not SQLite)
- [ ] Enable SSL/HTTPS
- [ ] Set up firewall rules
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Use environment variables for all secrets
- [ ] Enable Sentry or error tracking
- [ ] Set up monitoring (UptimeRobot, etc.)

---

## 🔄 Post-Deployment

### 1. Verify Deployment
```bash
curl https://your-domain.com/api/brands
```

### 2. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 3. Seed Initial Data
```bash
npx prisma db seed
```

### 4. Test Features
- [ ] Create repair order
- [ ] Update status
- [ ] View dashboard
- [ ] Check pricing matrix
- [ ] Test customer search

### 5. Set Up Monitoring
- Configure Sentry for error tracking
- Set up UptimeRobot for uptime monitoring
- Configure analytics (Google Analytics)

---

## 🐛 Troubleshooting

### Build Errors

**Issue:** Module not found
```bash
# Solution
rm -rf node_modules package-lock.json
npm install
```

**Issue:** Prisma client not generated
```bash
# Solution
npx prisma generate
npm run build
```

### Runtime Errors

**Issue:** Database connection failed
- Check `DATABASE_URL` in environment variables
- Verify database is accessible from deployment platform
- Check firewall rules

**Issue:** 500 Internal Server Error
- Check application logs
- Verify all environment variables are set
- Check Prisma schema matches database

### Performance Issues

**Issue:** Slow page loads
- Enable Next.js caching
- Use CDN for static assets
- Optimize database queries with indexes
- Consider read replicas for database

---

## 📊 Monitoring & Maintenance

### Recommended Tools

**Error Tracking:**
- Sentry (recommended)
- Rollbar
- Bugsnag

**Uptime Monitoring:**
- UptimeRobot (free)
- Pingdom
- StatusCake

**Analytics:**
- Google Analytics
- Plausible
- PostHog

**Database Monitoring:**
- Datadog
- New Relic
- PostgreSQL built-in monitoring

### Backup Strategy

**Database Backups:**
```bash
# Daily automated backup
0 2 * * * pg_dump -U repair_user repair_db > /backups/repair_db_$(date +\%Y\%m\%d).sql
```

**Application Backups:**
- Use Git for code
- Regular database dumps
- Store in S3 or similar

---

## 🚀 Performance Optimization

### Next.js Optimizations

1. **Enable Image Optimization**
```js
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
  },
}
```

2. **Enable Compression**
```bash
npm install compression
```

3. **Database Connection Pooling**
Already configured in Prisma

### CDN Setup

Use Vercel Edge Network (automatic) or configure CloudFlare

---

## 📞 Support

For deployment issues:
1. Check application logs
2. Review this deployment guide
3. Check Next.js deployment docs
4. Check Prisma deployment docs

---

**Deployment Complete! Your Mobile Repair Dashboard is now live! 🎉**
