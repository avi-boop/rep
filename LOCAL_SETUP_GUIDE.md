# 🚀 LOCAL SETUP GUIDE - Run This On Your Computer

## 📝 Overview

This project is a **Mobile Repair Shop Dashboard** with multiple implementations. This guide will help you run it on your local computer in the **easiest way possible**.

---

## ✅ What You Need (Prerequisites)

Before starting, make sure you have:

1. **Node.js** (version 18 or higher)
   - Check version: `node --version`
   - Download: https://nodejs.org/

2. **A Code Editor** (optional but helpful)
   - VS Code: https://code.visualstudio.com/
   - Or any text editor

3. **Terminal/Command Line** access
   - Mac/Linux: Built-in Terminal
   - Windows: PowerShell or Command Prompt

---

## 🎯 OPTION 1: Simplest Setup (Recommended for Beginners)

This uses the **repair-dashboard** app with SQLite (no database setup needed!)

### Step 1: Open Terminal and Navigate to Project

```bash
cd /workspace/repair-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This will take 1-3 minutes. You'll see a lot of text - that's normal!

### Step 3: Set Up the Database

```bash
npm run db:push
npm run db:seed
```

This creates a database file and fills it with sample data.

### Step 4: Start the Application

```bash
npm run dev
```

You should see:
```
▲ Next.js 15.x.x
- Local:   http://localhost:3000
```

### Step 5: Open Your Browser

Go to: **http://localhost:3000**

🎉 **You should now see the dashboard!**

### What You Can Do:
- View the dashboard at `/dashboard`
- See sample repair data
- Explore the API at various endpoints
- View the database using: `npm run db:studio`

---

## 🎯 OPTION 2: Full Stack Setup (Backend + Frontend)

This uses separate backend and frontend for more flexibility.

### Part A: Set Up the Backend

#### Step 1: Navigate to Backend

```bash
cd /workspace/backend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Set Up Environment Variables

Create a `.env` file:

```bash
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-later"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV=development
EOF
```

#### Step 4: Set Up Database

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

#### Step 5: Start Backend Server

```bash
npm run dev
```

Backend runs at: **http://localhost:3001**

### Part B: Set Up the Frontend

**Open a NEW terminal window** (keep the backend running!)

#### Step 1: Navigate to Frontend

```bash
cd /workspace/frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Set Up Environment Variables

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

#### Step 4: Start Frontend Server

```bash
npm run dev
```

Frontend runs at: **http://localhost:3000**

### Step 5: Open Your Browser

Go to: **http://localhost:3000**

🎉 **Full stack application is running!**

---

## 🎯 OPTION 3: Latest Next.js App (Most Modern)

Uses the `/workspace/app` implementation with Next.js 16.

### Requirements
- **PostgreSQL** database (more setup required)

### Quick Setup with SQLite (Easier)

#### Step 1: Navigate to App Directory

```bash
cd /workspace/app
```

#### Step 2: Update Database to Use SQLite

Edit `prisma/schema.prisma` and change the datasource to:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

#### Step 3: Create .env File

```bash
cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
EOF
```

#### Step 4: Install and Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

#### Step 5: Start the App

```bash
npm run dev
```

Go to: **http://localhost:3000**

---

## 📊 Quick Reference: Project Locations

| Implementation | Location | Database | Best For |
|---------------|----------|----------|----------|
| **Simple App** | `/workspace/repair-dashboard` | SQLite | Quick start, testing |
| **Full Stack** | `/workspace/backend` + `/workspace/frontend` | SQLite/PostgreSQL | Separate services |
| **Modern App** | `/workspace/app` | PostgreSQL/SQLite | Latest features |

---

## 🛠️ Useful Commands

### Once Your App is Running:

```bash
# View the database visually
npm run db:studio

# Stop the server
# Press Ctrl+C in the terminal

# Restart with fresh data
npm run db:seed

# Check for errors
npm run lint
```

---

## 🐛 Troubleshooting

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Or use a different port
npm run dev -- -p 3001
```

### Problem: "Cannot find module"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Database errors

**Solution:**
```bash
# Reset the database
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Problem: "node: command not found"

**Solution:**
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### Problem: Nothing happens when I run npm run dev

**Solution:**
```bash
# Check if you're in the right directory
pwd

# Make sure you ran npm install first
npm install

# Try building first
npm run build
```

---

## 📖 What's Included in the Database?

After running `npm run db:seed`, you'll have:

- **4 Brands**: Apple, Samsung, Google, OnePlus
- **10+ Device Models**: iPhone 15 Pro, iPhone 14, Galaxy S24, etc.
- **5 Repair Types**: Screen, Battery, Back Panel, Charging Port, Camera
- **3 Part Quality Levels**: OEM, Premium Aftermarket, Standard Aftermarket
- **Sample Prices**: Ready-to-use pricing data
- **Sample Customer**: Test customer data
- **Sample Repairs**: Example repair orders (in some implementations)

---

## 🎨 What Can You Do Now?

### 1. Explore the Dashboard
- Navigate to `/dashboard`
- View statistics and metrics
- See recent repairs

### 2. Use the Database GUI
```bash
npm run db:studio
```
Opens a visual interface to view and edit data!

### 3. Test the API
Visit these URLs in your browser:
- http://localhost:3000/api/brands
- http://localhost:3000/api/device-models
- http://localhost:3000/api/repair-types
- http://localhost:3000/api/pricing

### 4. View Sample Pages
- `/dashboard` - Main dashboard
- `/dashboard/repairs` - Repairs page (if implemented)
- `/dashboard/pricing` - Pricing page (if implemented)

---

## 🚀 Next Steps

Once you have it running:

1. **Explore the Code**
   - Check out `/app` folder for pages
   - Look at `/prisma/schema.prisma` for database structure
   - Review `/app/api` for API endpoints

2. **Customize It**
   - Add your own repair shop data
   - Modify colors and branding
   - Add new features

3. **Read the Documentation**
   - `README.md` - Main documentation
   - `QUICK_START_GUIDE.md` - Detailed guide
   - `API_ENDPOINTS.md` - API reference

---

## 💻 Quick Start Cheat Sheet

**The fastest way to get started:**

```bash
# 1. Go to the simplest app
cd /workspace/repair-dashboard

# 2. Install everything
npm install

# 3. Set up database
npm run db:push && npm run db:seed

# 4. Start it
npm run dev

# 5. Open browser to http://localhost:3000
```

**That's it! 🎉**

---

## 📞 Need More Help?

Check these files in your workspace:
- `README.md` - Full project documentation
- `GETTING_STARTED.md` - Getting started guide  
- `QUICK_START_GUIDE.md` - Quick start instructions
- `TECH_STACK.md` - Technology information
- `DEPLOYMENT_GUIDE.md` - How to deploy online

---

## 🔥 Common First-Time User Questions

**Q: Do I need to know programming?**
A: Not to run it! Just follow the steps. But you'll need some knowledge to customize.

**Q: Will this work on Windows/Mac/Linux?**
A: Yes! Node.js works on all platforms.

**Q: Is the data real?**
A: No, it's sample/fake data for testing. You'll add your real data later.

**Q: Can I use this for my repair shop?**
A: Yes! That's what it's built for. Customize it for your needs.

**Q: Do I need to pay for anything?**
A: Not to run it locally! You only pay for hosting when you want to put it online.

**Q: How do I stop the server?**
A: Press `Ctrl+C` in the terminal where it's running.

**Q: Can I run multiple versions at once?**
A: No, they use the same ports. Pick one to start with.

---

## ✅ Success Checklist

After following this guide, you should be able to:

- [ ] Navigate to the project in terminal
- [ ] Install dependencies with `npm install`
- [ ] Set up the database
- [ ] Start the development server
- [ ] Open the app in your browser
- [ ] See the dashboard with sample data
- [ ] View the database in Prisma Studio

**If you can check all these boxes, you're all set!** 🎉

---

**Last Updated:** 2025-11-10
**Recommended Option:** Option 1 (Simplest Setup)
**Support:** Check documentation files in `/workspace` directory

---

*Happy coding! 🚀*
