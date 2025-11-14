# 🚀 LOCAL SETUP GUIDE - Mobile Repair Shop Dashboard

> **Complete step-by-step guide to run this project on your local computer**

---

## 📋 Table of Contents

1. [What You Have](#what-you-have)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Recommended)](#quick-start-recommended)
4. [Alternative Setups](#alternative-setups)
5. [Troubleshooting](#troubleshooting)
6. [Next Steps](#next-steps)

---

## 🎯 What You Have

This repository contains **MULTIPLE implementations** of the repair shop dashboard:

### Option 1: `repair-dashboard/` ⭐ **RECOMMENDED**
- **Type**: Full-stack Next.js application
- **Database**: PostgreSQL with Prisma ORM
- **Features**: Most complete implementation with full CRUD operations
- **Port**: 3000

### Option 2: `app/`
- **Type**: Full-stack Next.js application
- **Database**: PostgreSQL with Prisma ORM
- **Features**: Alternative implementation
- **Port**: 3000

### Option 3: `backend/` + `frontend/`
- **Type**: Separate backend (Express.js) and frontend (Next.js)
- **Database**: PostgreSQL with Prisma ORM
- **Features**: Traditional client-server architecture
- **Ports**: Backend (3001), Frontend (3000)

---

## ✅ Prerequisites

### Required Software

Check if you have these installed:

```bash
# Check Node.js (need v18 or higher)
node --version
# You have: v22.21.1 ✅

# Check npm
npm --version
# You have: 10.9.4 ✅

# Check if PostgreSQL is installed
psql --version
```

### Install PostgreSQL (if needed)

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**On macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Or use Docker (easiest):**
```bash
docker run --name repair-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=repair_shop_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## 🚀 Quick Start (Recommended)

### Using `repair-dashboard/` (Best Option)

This is the most complete implementation. Follow these steps:

#### Step 1: Set Up PostgreSQL Database

**Option A: Using existing PostgreSQL**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'repair123';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
\q
```

**Option B: Using Docker (recommended)**
```bash
docker run --name repair-postgres \
  -e POSTGRES_PASSWORD=repair123 \
  -e POSTGRES_DB=repair_shop_db \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep repair-postgres
```

#### Step 2: Navigate to the Project

```bash
cd /workspace/repair-dashboard
```

#### Step 3: Install Dependencies

```bash
npm install
```

#### Step 4: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor
```

**Update `.env` with these values:**
```env
# Database (required)
DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/repair_shop_db?schema=public"

# App (required)
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# SMS Notifications (optional for now)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Email Notifications (optional for now)
SENDGRID_API_KEY=""
FROM_EMAIL=""

# Lightspeed Integration (optional for now)
LIGHTSPEED_API_KEY=""
LIGHTSPEED_ACCOUNT_ID=""
LIGHTSPEED_API_URL="https://api.lightspeedapp.com"
```

**Generate a secure secret:**
```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and paste it in .env as NEXTAUTH_SECRET
```

#### Step 5: Set Up Database Schema

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

You should see output like:
```
✅ Seeded 8 brands
✅ Seeded 50+ device models
✅ Seeded 27 repair types
✅ Seeded sample customers
✅ Database seeded successfully!
```

#### Step 6: Run the Application

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.5s
○ Compiling / ...
✓ Compiled / in 1.2s
```

#### Step 7: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

🎉 **You should see the Mobile Repair Shop Dashboard!**

---

## 🔧 Alternative Setups

### Option A: Using `app/` Directory

```bash
cd /workspace/app

# Install dependencies
npm install

# Setup environment
cat > .env << 'EOF'
DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/repair_shop_db?schema=public"
EOF

# Setup database
npm run db:migrate
npm run db:seed

# Run the app
npm run dev
```

Open: http://localhost:3000

---

### Option B: Using Separate Backend + Frontend

This runs the backend API and frontend separately.

**Terminal 1 - Backend:**
```bash
cd /workspace/backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/repair_shop_db?schema=public"
JWT_SECRET="super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV=development
EOF

# Setup Prisma
npm run prisma:generate
npm run prisma:migrate

# Seed database
npm run db:seed

# Start backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Start frontend
npm run dev
```

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000

---

## 🐳 Docker Compose Setup (Advanced)

If you want to run everything with Docker:

```bash
cd /workspace

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- pgAdmin: http://localhost:5050

---

## 🔍 Verification Checklist

After setup, verify everything works:

### 1. Check Database Connection
```bash
cd /workspace/repair-dashboard

# Open Prisma Studio to view data
npm run db:studio
```
Opens at: http://localhost:5555

### 2. Test the Application

✅ **Pages to check:**
- [ ] Dashboard home page loads
- [ ] Can view repairs list
- [ ] Can view customers
- [ ] Can view devices/brands
- [ ] No console errors

### 3. Check Database Has Data

```bash
# Connect to database
psql postgresql://repair_admin:repair123@localhost:5432/repair_shop_db

# Run queries
SELECT COUNT(*) FROM brands;
SELECT COUNT(*) FROM device_models;
SELECT COUNT(*) FROM repair_types;

# Exit
\q
```

You should see:
- 8+ brands
- 50+ device models
- 20+ repair types

---

## 🐛 Troubleshooting

### Problem: "Port 5432 already in use"

**Solution:** PostgreSQL is already running
```bash
# Check what's using the port
sudo lsof -i :5432

# If it's PostgreSQL, just use the existing instance
# Update DATABASE_URL in .env to match your existing setup
```

### Problem: "Port 3000 already in use"

**Solution:** Another app is using port 3000
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or run on a different port
PORT=3001 npm run dev
```

### Problem: "Cannot connect to database"

**Solutions:**
```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql
# or
docker ps | grep postgres

# 2. Test connection manually
psql postgresql://repair_admin:repair123@localhost:5432/repair_shop_db

# 3. Check firewall/security groups
sudo ufw status

# 4. Verify credentials in .env match database
cat .env | grep DATABASE_URL
```

### Problem: "Prisma Client not generated"

**Solution:**
```bash
cd /workspace/repair-dashboard  # or /workspace/app
npx prisma generate
```

### Problem: "Database schema out of sync"

**Solution:**
```bash
# Reset and reseed (⚠️ deletes all data!)
npm run db:push
npm run db:seed
```

### Problem: "npm install fails"

**Solution:**
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problem: "Missing environment variables"

**Solution:**
```bash
# Check which variables are required
cat .env.example

# Make sure .env file exists and has all required values
ls -la .env
cat .env
```

---

## 📚 Project Structure

```
/workspace/
├── repair-dashboard/        ⭐ RECOMMENDED - Full Next.js app
│   ├── app/                # Next.js app directory
│   ├── prisma/             # Database schema & seeds
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   └── package.json
│
├── app/                    Alternative Next.js implementation
│   ├── app/
│   ├── prisma/
│   └── package.json
│
├── backend/                Express.js API server
│   ├── src/
│   ├── prisma/
│   └── package.json
│
└── frontend/               Next.js frontend (pairs with backend)
    ├── src/
    └── package.json
```

---

## 🎯 Next Steps

### 1. Explore the Application

**Key Features to Test:**
- [ ] Create a new repair
- [ ] View repair details
- [ ] Update repair status
- [ ] Manage customers
- [ ] View pricing matrix
- [ ] Check dashboard analytics

### 2. Customize for Your Shop

**Edit these files:**
- `prisma/seed.ts` - Add your device models and prices
- `.env` - Configure your API keys (Twilio, SendGrid)
- `app/globals.css` - Customize colors/branding

### 3. Add Sample Data

```bash
cd /workspace/repair-dashboard

# Open Prisma Studio
npm run db:studio

# Manually add:
# - Your actual device models
# - Your repair types
# - Your pricing
# - Test customers
```

### 4. Set Up Notifications (Optional)

**Twilio SMS:**
1. Sign up at https://twilio.com
2. Get your Account SID and Auth Token
3. Get a Twilio phone number
4. Add credentials to `.env`

**SendGrid Email:**
1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to `.env`

### 5. Deploy to Production

See `DEPLOYMENT_GUIDE.md` for deployment options:
- Vercel (recommended for Next.js)
- AWS
- DigitalOcean
- Railway

---

## 🆘 Getting Help

### Documentation Files
- `README.md` - Project overview
- `QUICK_START_GUIDE.md` - Quick reference
- `API_ENDPOINTS.md` - API documentation
- `DEPLOYMENT_GUIDE.md` - Production deployment

### Common Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Maintenance
npm run lint             # Check code quality
npm install              # Install dependencies
rm -rf node_modules      # Clear node_modules
```

---

## ✅ Success Checklist

You're ready when:
- [ ] PostgreSQL is running
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created and configured
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Database seeded with sample data
- [ ] App running at http://localhost:3000
- [ ] No errors in terminal or browser console
- [ ] Can create and view repairs

---

## 🎉 You're All Set!

Your Mobile Repair Shop Dashboard is now running locally!

**Default Test Data:**
- Multiple device brands (Apple, Samsung, Google, etc.)
- 50+ device models
- Various repair types
- Sample pricing data

**Start by:**
1. Exploring the dashboard
2. Creating a test repair
3. Viewing the pricing matrix
4. Customizing for your needs

---

**Need help?** Check the troubleshooting section above or review the documentation files.

**Happy repairing! 🔧📱✨**
