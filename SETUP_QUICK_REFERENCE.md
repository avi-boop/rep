# 🎯 QUICK REFERENCE - Local Setup

## 🚀 Two Ways to Get Started

### Method 1: Automated Setup (Easiest) ⭐

```bash
cd /workspace
./quick-setup.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Set up database (PostgreSQL or Docker)
- ✅ Install dependencies
- ✅ Configure environment variables
- ✅ Seed sample data
- ✅ Start the application

---

### Method 2: Manual Setup (More Control)

#### 1️⃣ Start PostgreSQL (Choose one)

**Option A: With Docker (Easiest)**
```bash
docker run --name repair-postgres \
  -e POSTGRES_PASSWORD=repair123 \
  -e POSTGRES_DB=repair_shop_db \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: With existing PostgreSQL**
```bash
sudo -u postgres psql
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'repair123';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
\q
```

#### 2️⃣ Set Up Application (Choose one)

**Option A: repair-dashboard/ (RECOMMENDED)**
```bash
cd /workspace/repair-dashboard

# Install & setup
npm install
cp .env.example .env

# Edit .env and add:
# DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/repair_shop_db"

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start app
npm run dev
```

**Option B: app/**
```bash
cd /workspace/app
npm install
echo 'DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/repair_shop_db"' > .env
npm run db:migrate
npm run db:seed
npm run dev
```

**Option C: backend + frontend**
```bash
# Terminal 1 - Backend
cd /workspace/backend
npm install
cat > .env << 'EOF'
DATABASE_URL="postgresql://repair_admin:repair123@localhost:5432/repair_shop_db"
JWT_SECRET="your-secret-key"
PORT=3001
EOF
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev

# Terminal 2 - Frontend
cd /workspace/frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
npm run dev
```

#### 3️⃣ Open Browser

Go to: **http://localhost:3000**

---

## 🎯 Essential Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
npm run db:studio    # Open database GUI (http://localhost:5555)
```

### Maintenance
```bash
npm install          # Install dependencies
npm run lint         # Check code quality
rm -rf node_modules  # Clear and reinstall
```

---

## 🐛 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Port 5432 in use | `docker stop repair-postgres` or use different port |
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| Can't connect to DB | Check PostgreSQL is running: `docker ps` or `systemctl status postgresql` |
| Prisma errors | Run `npx prisma generate` then `npx prisma db push` |
| Dependencies fail | Clear and reinstall: `rm -rf node_modules && npm install` |
| Missing .env | Copy from `.env.example`: `cp .env.example .env` |

---

## 📁 Project Structure

```
/workspace/
├── repair-dashboard/     ⭐ RECOMMENDED (Full Next.js + Prisma)
├── app/                  Alternative implementation
├── backend/              Express.js API
├── frontend/             Next.js frontend
└── docker-compose.yml    Docker setup
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] No errors in terminal
- [ ] App opens at http://localhost:3000
- [ ] Dashboard shows content
- [ ] No console errors in browser (F12)
- [ ] Database has data: `npm run db:studio`

---

## 🆘 Need Help?

**Full guides:**
- `LOCAL_SETUP_GUIDE.md` - Complete setup instructions
- `README.md` - Project overview
- `TROUBLESHOOTING.md` - Common issues

**Check status:**
```bash
# Database
docker ps | grep postgres

# Node version
node --version  # Need 18+

# PostgreSQL connection
psql postgresql://repair_admin:repair123@localhost:5432/repair_shop_db
```

---

## 🎉 What's Next?

After setup:

1. **Explore** the dashboard at http://localhost:3000
2. **View database** with `npm run db:studio`
3. **Customize** for your shop (edit `prisma/seed.ts`)
4. **Configure** notifications (add Twilio/SendGrid keys to `.env`)
5. **Deploy** when ready (see `DEPLOYMENT_GUIDE.md`)

---

**You're all set! Start building your repair shop empire! 🔧📱✨**
