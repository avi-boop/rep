# 🚀 Quick Start Guide - Mobile Repair Shop Dashboard

## Prerequisites Checklist

Before you begin, ensure you have:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 12+ installed and running
- [ ] Git installed
- [ ] Terminal/command line access

## 5-Minute Setup

### 1. Database Setup (2 minutes)

```bash
# Create database and user
psql postgres
CREATE DATABASE mobile_repair_db;
CREATE USER repair_admin WITH PASSWORD 'repair123';
GRANT ALL PRIVILEGES ON DATABASE mobile_repair_db TO repair_admin;
\q
```

### 2. Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/mobile_repair_db"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV=development
ENVFILE

# Setup database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start server
npm run dev
```

✅ Backend running at **http://localhost:3001**

### 3. Frontend Setup (1 minute)

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start dev server
npm run dev
```

✅ Frontend running at **http://localhost:3000**

## 🎯 First Login

1. Open http://localhost:3000
2. Login with:
   - **Username:** admin
   - **Password:** admin123

## ✅ Verification Checklist

Test these to ensure everything works:

- [ ] Can login successfully
- [ ] Dashboard shows statistics
- [ ] Can view repairs list (might be empty)
- [ ] Can navigate between pages
- [ ] No console errors

## 🐛 Troubleshooting

### Database connection failed
```bash
# Check PostgreSQL is running
sudo service postgresql status
# or on macOS
brew services list
```

### Port 3001 already in use
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Prisma errors
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # ⚠️ Deletes all data
```

## 📚 Next Steps

1. **Read** `README_IMPLEMENTATION.md` for complete documentation
2. **Explore** the API at http://localhost:3001/health
3. **Test** features using the dashboard
4. **Customize** for your repair shop needs

## 🆘 Need Help?

Check these files:
- `README_IMPLEMENTATION.md` - Complete documentation
- `API_ENDPOINTS.md` - API reference
- `MOBILE_REPAIR_SHOP_DASHBOARD_PLAN.md` - Original plan

---

**Ready to build your repair shop empire! 🔧📱✨**
