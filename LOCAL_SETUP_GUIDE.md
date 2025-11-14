# 🚀 LOCAL SETUP GUIDE - Mobile Repair Dashboard

Complete step-by-step guide to run this project on your local computer.

---

## 📋 Prerequisites

Before starting, make sure you have these installed:

- ✅ **Node.js 18+** - [Download here](https://nodejs.org/)
- ✅ **PostgreSQL 12+** - [Download here](https://www.postgresql.org/download/)
- ✅ **Git** - [Download here](https://git-scm.com/)
- ✅ **Code Editor** - VS Code recommended

### Check if installed:
```bash
node --version    # Should show v18 or higher
npm --version     # Should show 8 or higher
psql --version    # Should show PostgreSQL 12 or higher
```

---

## 🎯 CHOOSE YOUR PATH

This project has **3 different applications**. Choose which one you want to run:

### **Option A: Repair Dashboard (RECOMMENDED ⭐)**
The main Next.js dashboard - most complete and modern.
- Path: `/workspace/repair-dashboard/`
- Tech: Next.js + Prisma + PostgreSQL
- [Jump to Option A setup](#option-a-repair-dashboard-recommended-)

### **Option B: Full Stack (Backend + Frontend)**
Separate backend API and frontend application.
- Paths: `/workspace/backend/` + `/workspace/frontend/`
- Tech: Express.js + Next.js
- [Jump to Option B setup](#option-b-full-stack-backend--frontend)

### **Option C: Docker (Easiest for quick testing)**
Run everything with Docker in containers.
- Uses docker-compose
- [Jump to Option C setup](#option-c-docker-setup-easiest)

---

## Option A: Repair Dashboard (RECOMMENDED ⭐)

### Step 1: Set Up PostgreSQL Database

#### On macOS:
```bash
# Start PostgreSQL
brew services start postgresql

# Create database
createdb repair_shop_db
```

#### On Ubuntu/Linux:
```bash
# Start PostgreSQL
sudo service postgresql start

# Create database and user
sudo -u postgres psql
```

Then in the PostgreSQL prompt:
```sql
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
ALTER DATABASE repair_shop_db OWNER TO repair_admin;
\q
```

#### On Windows:
```bash
# Start PostgreSQL service from Services app
# Then use pgAdmin or psql to create database
createdb repair_shop_db
```

### Step 2: Configure Environment

```bash
# Navigate to repair-dashboard folder
cd /workspace/repair-dashboard

# Copy environment template
cp .env.example .env

# Edit the .env file
nano .env
# or
code .env
```

**Update DATABASE_URL in .env:**
```env
DATABASE_URL="postgresql://repair_admin:your_secure_password@localhost:5432/repair_shop_db?schema=public"
```

### Step 3: Install Dependencies

```bash
# Install all packages
npm install

# This installs:
# - Next.js, React, TypeScript
# - Prisma ORM
# - Tailwind CSS
# - All required libraries
```

### Step 4: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:push

# Seed sample data
npm run db:seed
```

**What gets created:**
- ✅ All database tables (repairs, customers, devices, prices, etc.)
- ✅ Sample brands (Apple, Samsung, Google, OnePlus)
- ✅ Sample devices (iPhone 15 Pro Max → iPhone 12, Galaxy S24/S23)
- ✅ Sample repair types (Screen, Battery, Camera, etc.)
- ✅ Sample customers and repairs

### Step 5: Start Development Server

```bash
# Start the app
npm run dev
```

**Expected output:**
```
▲ Next.js 15.x
- Local:   http://localhost:3000
✓ Ready in 2.5s
```

### Step 6: Access the Application

Open your browser:
- **Main Dashboard:** http://localhost:3000
- **Repairs Page:** http://localhost:3000/repairs
- **Dashboard:** http://localhost:3000/dashboard
- **API Test:** http://localhost:3000/api/repairs

### Step 7: (Optional) Open Database GUI

```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555 to view/edit data.

---

## Option B: Full Stack (Backend + Frontend)

This runs a separate Express.js backend API and Next.js frontend.

### Step 1: Set Up PostgreSQL (Same as Option A)

Follow [Step 1 from Option A](#step-1-set-up-postgresql-database)

### Step 2: Set Up Backend

```bash
# Navigate to backend folder
cd /workspace/backend

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Update these in backend/.env:**
```env
DATABASE_URL="postgresql://repair_admin:your_secure_password@localhost:5432/mobile_repair_db"
JWT_SECRET="your_very_long_random_jwt_secret_here"
SESSION_SECRET="your_very_long_session_secret_here"
PORT=3001
NODE_ENV=development
```

**Generate secure secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run db:seed

# Start backend server
npm run dev
```

**Backend will run on:** http://localhost:3001

### Step 3: Set Up Frontend (New Terminal)

```bash
# Open NEW terminal window
cd /workspace/frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start frontend
npm run dev
```

**Frontend will run on:** http://localhost:3000

### Step 4: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/health

---

## Option C: Docker Setup (Easiest)

Perfect if you have Docker installed and want everything running with one command.

### Step 1: Install Docker

- **macOS/Windows:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** 
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```

### Step 2: Configure Environment

```bash
# Navigate to project root
cd /workspace

# Copy environment template
cp .env.example .env

# Edit if needed (optional for testing)
nano .env
```

### Step 3: Start All Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# This starts:
# - PostgreSQL database
# - Redis cache
# - Backend API (port 3001)
# - Frontend (port 3000)
```

### Step 4: Run Migrations & Seed

```bash
# Run database migrations
docker-compose exec api npm run prisma:migrate

# Seed sample data
docker-compose exec api npm run db:seed
```

### Step 5: Access Services

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **pgAdmin:** http://localhost:5050 (admin@repairshop.local / admin)
- **Redis Commander:** http://localhost:8081

### Docker Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and start
docker-compose up -d --build
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"

**Check if PostgreSQL is running:**
```bash
# macOS
brew services list

# Linux
sudo service postgresql status

# Windows - Check Services app
```

**Test connection:**
```bash
psql postgresql://repair_admin:your_password@localhost:5432/repair_shop_db
```

### Issue: "Port already in use"

**Find what's using the port:**
```bash
# Check port 3000
lsof -i :3000

# Check port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

**Or use different ports:**
```bash
PORT=3002 npm run dev
```

### Issue: "Module not found" or "Cannot find module"

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For Prisma errors
npm run db:generate
```

### Issue: "Prisma migration failed"

```bash
# Reset database (⚠️ DELETES ALL DATA)
npm run db:push

# Or manually reset
npx prisma migrate reset
npx prisma db push
npm run db:seed
```

### Issue: "Command not found: npm"

Install Node.js: https://nodejs.org/

### Issue: Docker containers won't start

```bash
# Check Docker is running
docker ps

# View detailed errors
docker-compose logs

# Clean restart
docker-compose down -v
docker-compose up -d --build
```

---

## 📚 Available Commands

### Repair Dashboard Commands
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Check code quality
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:seed     # Seed sample data
npm run db:studio   # Open database GUI
```

### Backend Commands
```bash
npm run dev              # Start with nodemon (auto-reload)
npm start               # Start production server
npm test                # Run tests
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run db:seed         # Seed database
```

---

## 🎯 What's Included After Setup

Once running, you'll have:

### Sample Data
- ✅ 4 brands (Apple, Samsung, Google, OnePlus)
- ✅ 10+ device models
- ✅ 5+ repair types (Screen, Battery, Camera, etc.)
- ✅ Sample pricing data
- ✅ 3 sample customers
- ✅ 2 sample users (admin, technician)
- ✅ 1 sample repair

### Features
- ✅ Dashboard with repair overview
- ✅ Repairs management (CRUD)
- ✅ Customer management
- ✅ Device and pricing management
- ✅ Smart pricing algorithm (interpolation)
- ✅ Status tracking workflow
- ✅ API endpoints ready

### Not Yet Configured (Optional)
- ⚠️ SMS notifications (requires Twilio account)
- ⚠️ Email notifications (requires SendGrid account)
- ⚠️ Lightspeed POS integration (requires API credentials)
- ⚠️ File uploads to S3 (requires AWS account)

---

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change this immediately in production!

---

## 🚀 Next Steps

### Day 1
1. ✅ Complete setup (you just did this!)
2. Explore the dashboard
3. Create a test repair
4. Add your own devices
5. Set your pricing

### Week 1
1. Customize branding (logo, colors)
2. Add all your device models
3. Add all repair types you offer
4. Import your customer list
5. Train staff on the system

### Week 2-3
1. Set up Twilio for SMS (optional)
2. Configure SendGrid for email (optional)
3. Test notification workflows
4. Configure Lightspeed integration (optional)

### Month 1
1. Go live with real customers
2. Import historical repair data
3. Set up automated backups
4. Configure monitoring
5. Train all staff members

---

## 📖 Additional Documentation

- **README.md** - Project overview
- **MOBILE_REPAIR_SHOP_DASHBOARD_PLAN.md** - Complete feature specs
- **API_ENDPOINTS.md** - API documentation
- **DEPLOYMENT_GUIDE.md** - How to deploy to production
- **TESTING_GUIDE.md** - Testing strategies

---

## 💬 Need Help?

### Common Resources
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs/
- Tailwind CSS: https://tailwindcss.com/docs

### Debugging Checklist
1. Check browser console (F12) for errors
2. Check terminal for error messages
3. Verify database is running: `psql -l`
4. Test API: `curl http://localhost:3001/health`
5. Check Prisma Studio: `npm run db:studio`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Development server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Dashboard loads and shows cards
- [ ] Repairs page shows sample repair
- [ ] API endpoint responds: http://localhost:3000/api/repairs
- [ ] No console errors in browser
- [ ] Database has sample data (check with Prisma Studio)

---

## 🎉 Success!

If everything is working:

✅ **Your repair shop dashboard is running!**

You can now:
- Create and manage repairs
- Track repair status
- Manage customers
- Set pricing
- View analytics

**Start customizing it for your shop!** 🔧📱💻

---

*Last updated: 2025-11-10*
*Questions? Check the documentation files in /workspace*
