# 🚀 RepairHub Setup Guide

Complete step-by-step guide to get your repair shop dashboard running.

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version`)
- [ ] PostgreSQL 12+ installed and running
- [ ] Git installed (optional, for version control)
- [ ] Code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
# Navigate to project directory
cd repair-dashboard

# Install all dependencies
npm install

# This will install:
# - Next.js and React
# - Prisma ORM
# - TypeScript
# - Tailwind CSS
# - All required libraries
```

**Expected output:** No errors, ~400 packages installed

### 2. Database Setup (5 minutes)

#### Option A: Local PostgreSQL

```bash
# Start PostgreSQL service
# Ubuntu/Debian:
sudo service postgresql start

# macOS:
brew services start postgresql

# Windows:
# Use PostgreSQL service in Services app

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
ALTER DATABASE repair_shop_db OWNER TO repair_admin;
\q
```

#### Option B: Cloud Database (Easier)

**Using Supabase (Recommended):**
1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Name: `repair-shop-db`
   - Database Password: (save this!)
   - Region: (closest to you)
5. Wait for setup (1-2 minutes)
6. Go to Settings → Database
7. Copy "Connection String" (URI format)

**Using Railway:**
1. Go to https://railway.app
2. Sign up / Log in
3. New Project → Provision PostgreSQL
4. Click on PostgreSQL
5. Go to "Connect" tab
6. Copy "Postgres Connection URL"

### 3. Configure Environment Variables (2 minutes)

```bash
# Copy example environment file
cp .env.example .env

# Open .env in your editor
nano .env
# or
code .env
# or
vim .env
```

**Update the DATABASE_URL:**

For local PostgreSQL:
```
DATABASE_URL="postgresql://repair_admin:your_secure_password@localhost:5432/repair_shop_db?schema=public"
```

For Supabase/Railway:
```
DATABASE_URL="postgresql://user:password@host.supabase.co:5432/postgres"
```

**Verify connection format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### 4. Generate Prisma Client (1 minute)

```bash
# Generate Prisma client from schema
npm run prisma:generate

# Expected output:
# ✔ Generated Prisma Client
```

### 5. Run Database Migrations (2 minutes)

```bash
# Create all database tables
npm run prisma:migrate

# When prompted for migration name, enter:
init

# Expected output:
# ✔ Applying migration `20231110000000_init`
# ✔ Generated Prisma Client
```

**What this does:**
- Creates all 9 tables
- Sets up relationships
- Creates indexes
- Applies constraints

### 6. Seed Sample Data (1 minute)

```bash
# Populate database with sample data
npm run prisma:seed

# Expected output:
# 🌱 Starting database seed...
# Creating brands...
# Creating iPhone models...
# Creating Samsung models...
# Creating repair types...
# Creating prices...
# Creating sample customers...
# Creating sample users...
# Creating sample repair...
# ✅ Database seeded successfully!
# 
# Summary:
# - 4 brands
# - 10 device models
# - 5 repair types
# - 8 prices
# - 3 customers
# - 2 users
# - 1 repairs
```

**Sample data includes:**
- 4 brands (Apple, Samsung, Google, OnePlus)
- 10 devices (iPhone 15 Pro Max → iPhone 12, Galaxy S24, S23)
- 5 repair types (Screen, Battery, Back Glass, Charging Port, Camera)
- 8 price entries
- 3 sample customers
- 2 users (admin, technician)
- 1 sample repair

### 7. Start Development Server (1 minute)

```bash
# Start the Next.js development server
npm run dev

# Expected output:
# ▲ Next.js 14.x
# - Local:        http://localhost:3000
# - Network:      http://192.168.x.x:3000
# 
# ✓ Ready in 2.5s
```

### 8. Verify Installation (2 minutes)

Open your browser and visit:

1. **Home Page:** http://localhost:3000
   - Should see RepairHub dashboard with 3 cards

2. **Repairs Page:** http://localhost:3000/repairs
   - Should see 1 sample repair (John Doe's iPhone 14 Pro screen)

3. **API Test:**
   - Open: http://localhost:3000/api/repairs
   - Should see JSON with repairs array

4. **Database GUI (Optional):**
```bash
npm run prisma:studio
# Opens http://localhost:5555
# Browse all tables and data
```

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npm run prisma:generate
```

### Issue: "Error: P1001: Can't reach database server"

**Causes:**
1. PostgreSQL not running
2. Wrong credentials in .env
3. Wrong host/port

**Solutions:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection manually
psql postgresql://repair_admin:password@localhost:5432/repair_shop_db

# If fails, check:
# 1. Username/password correct?
# 2. Database exists?
# 3. User has permissions?
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: "Migration failed"

**Solution:**
```bash
# Reset database (⚠️ DELETES ALL DATA)
npm run prisma:migrate reset

# Then seed again
npm run prisma:seed
```

### Issue: Seed script fails

**Common causes:**
1. Tables don't exist → Run migrations first
2. Data already exists → Reset database or skip seed

**Solution:**
```bash
# View exact error
npm run prisma:seed

# If "Unique constraint failed", reset:
npm run prisma:migrate reset
```

## Verification Checklist

After setup, verify:

- [ ] Home page loads at http://localhost:3000
- [ ] Navigation header shows Dashboard, Repairs, Pricing, etc.
- [ ] Repairs page shows 1 sample repair
- [ ] API endpoint works: http://localhost:3000/api/repairs
- [ ] Prisma Studio opens: `npm run prisma:studio`
- [ ] No console errors in browser (F12)
- [ ] No terminal errors

## Next Steps

### Immediate (Day 1)
1. [ ] Customize branding (logo, colors)
2. [ ] Add your device models
3. [ ] Add your repair types
4. [ ] Set your pricing

### Week 1
1. [ ] Create repair form component
2. [ ] Add customer search
3. [ ] Implement status board
4. [ ] Test complete workflow

### Week 2-3
1. [ ] Set up Twilio for SMS
2. [ ] Configure SendGrid for email
3. [ ] Add notification triggers
4. [ ] Test notifications

### Month 1
1. [ ] Configure Lightspeed integration
2. [ ] Import existing customers
3. [ ] Train staff
4. [ ] Go live!

## Development Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code quality

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database GUI
npm run prisma:seed      # Seed sample data

# Advanced
npm run prisma:migrate reset  # ⚠️ Reset database (deletes all data)
npx prisma migrate deploy    # Production migration
npx prisma db push           # Push schema without migration
```

## Environment Variables Explained

```bash
# Database Connection (Required)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Application (Required)
NEXT_PUBLIC_APP_NAME="RepairHub"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Authentication (Required for production)
JWT_SECRET="generate-random-string-here"
JWT_EXPIRES_IN="24h"

# SMS Notifications (Optional - for Phase 3)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email Notifications (Optional - for Phase 3)
SENDGRID_API_KEY="SG.xxxxxxxxx"
FROM_EMAIL="noreply@yourshop.com"

# Lightspeed POS (Optional - for Phase 4)
LIGHTSPEED_API_KEY="your_api_key"
LIGHTSPEED_ACCOUNT_ID="123456"
LIGHTSPEED_API_URL="https://api.lightspeedapp.com"
```

## Getting Help

### Documentation
- README.md - Project overview
- MOBILE_REPAIR_SHOP_DASHBOARD_PLAN.md - Complete system design
- QUICK_START_GUIDE.md - Development guide
- API_IMPLEMENTATION_EXAMPLES.md - Code examples

### Common Resources
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs

### Debugging Tips
1. Check browser console (F12)
2. Check terminal for errors
3. Check database exists: `npm run prisma:studio`
4. Check API response: Visit http://localhost:3000/api/repairs
5. Check logs in terminal running `npm run dev`

## Success! 🎉

If you've completed all steps without errors:

✅ Database is set up and seeded
✅ Application is running on http://localhost:3000
✅ API endpoints are working
✅ Sample repair is visible

**You're ready to start customizing and using RepairHub!**

---

**Need help?** Check the comprehensive documentation in the `/workspace` folder or the troubleshooting section above.
