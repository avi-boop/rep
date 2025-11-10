# 🎯 EASY SETUP GUIDE FOR NON-DEVELOPERS

**Follow these steps EXACTLY - just copy and paste the commands!**

No technical knowledge needed. This will take about 15-30 minutes.

---

## 📥 STEP 1: INSTALL REQUIRED PROGRAMS (One Time Only)

You need to install 3 programs. Click the links and download:

### A. Install Node.js (JavaScript Runtime)

1. Go to: **https://nodejs.org/**
2. Click the **big green button** that says "Download Node.js (LTS)"
3. Run the downloaded file
4. Click "Next" → "Next" → "Install" 
5. Wait for it to finish
6. Click "Finish"

**✅ How to check it worked:**
- Open Terminal (Mac) or Command Prompt (Windows)
- Type: `node --version`
- You should see something like: `v18.17.0` or `v20.x.x`

### B. Install PostgreSQL (Database)

**For Mac:**
1. Go to: **https://postgresapp.com/**
2. Click "Download"
3. Open the downloaded file
4. Drag Postgres.app to Applications folder
5. Open Postgres.app from Applications
6. Click "Initialize" 

**For Windows:**
1. Go to: **https://www.postgresql.org/download/windows/**
2. Click "Download the installer"
3. Download version 15.x
4. Run the installer
5. Click "Next" through everything
6. **IMPORTANT:** When it asks for a password, set: `postgres123` (write this down!)
7. Keep clicking "Next" → "Finish"

**✅ How to check it worked:**
- Type in Terminal/Command Prompt: `psql --version`
- You should see: `psql (PostgreSQL) 15.x`

### C. Install a Code Editor (to edit files)

1. Go to: **https://code.visualstudio.com/**
2. Click "Download for Mac" or "Download for Windows"
3. Install it like any other program
4. Open Visual Studio Code

---

## 📂 STEP 2: OPEN THE PROJECT

### Mac Instructions:
1. Press `Command + Space`
2. Type: `Terminal`
3. Press Enter
4. Type this command and press Enter:
   ```bash
   cd /workspace/repair-dashboard
   ```

### Windows Instructions:
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter
4. Type this command and press Enter:
   ```bash
   cd C:\workspace\repair-dashboard
   ```
   
   *If that doesn't work, find where you saved the project and use that path*

**✅ You should now see something like:**
```
/workspace/repair-dashboard>
```

---

## 🗄️ STEP 3: CREATE THE DATABASE

This is where your repair data will be stored.

### Mac Users - Copy and Paste These Commands:

**Command 1:** Create the database
```bash
createdb repair_shop_db
```

**✅ If it works:** Nothing happens (no error message = success!)

**❌ If you see an error:** PostgreSQL might not be running. Open Postgres.app and make sure it's running.

### Windows Users - Copy and Paste These Commands:

**Command 1:** Open PostgreSQL
```bash
psql -U postgres
```
Type your password: `postgres123` (or whatever you set during install)

**Command 2:** Create the database (copy this exactly)
```sql
CREATE DATABASE repair_shop_db;
```

**Command 3:** Exit
```sql
\q
```

**✅ You should see:** `CREATE DATABASE`

---

## ⚙️ STEP 4: CONFIGURE THE APPLICATION

We need to tell the app how to connect to your database.

### Mac Users:

**Command 1:** Copy the example settings file
```bash
cp .env.example .env
```

**Command 2:** Open the file to edit it
```bash
open -e .env
```

This opens a text editor. Find this line:
```
DATABASE_URL="postgresql://user:password@localhost:5432/repair_shop_db?schema=public"
```

Change it to:
```
DATABASE_URL="postgresql://postgres:@localhost:5432/repair_shop_db?schema=public"
```

**Save the file** (Command+S) and close it.

### Windows Users:

**Command 1:** Copy the example settings file
```bash
copy .env.example .env
```

**Command 2:** Open the file to edit it
```bash
notepad .env
```

This opens Notepad. Find this line:
```
DATABASE_URL="postgresql://user:password@localhost:5432/repair_shop_db?schema=public"
```

Change it to (use the password you set earlier):
```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/repair_shop_db?schema=public"
```

**Save the file** (Ctrl+S) and close Notepad.

---

## 📦 STEP 5: INSTALL THE APPLICATION

Now we install all the code libraries needed.

**Copy and paste this command:**
```bash
npm install
```

**⏳ This will take 2-5 minutes.** You'll see lots of text scrolling.

**✅ When done, you should see:**
```
added 450 packages
```
(The number might be different - that's OK!)

**❌ If you see errors about "permission denied":**
- Mac: Try: `sudo npm install` (it will ask for your Mac password)
- Windows: Right-click Command Prompt → "Run as Administrator" → try again

---

## 🏗️ STEP 6: BUILD THE DATABASE TABLES

Now we create all the tables where your data will go.

**Command 1:** Generate database tools
```bash
npm run db:generate
```

**✅ You should see:** `✔ Generated Prisma Client`

**Command 2:** Create all the tables
```bash
npm run db:push
```

**✅ You should see:** `Your database is now in sync with your schema.`

**Command 3:** Add sample data (devices, repairs, etc.)
```bash
npm run db:seed
```

**✅ You should see:**
```
🌱 Seeding database...
✅ Created 4 brands
✅ Created 10 devices
✅ Created 5 repair types
✅ Created sample customers
✅ Database seeded successfully!
```

---

## 🚀 STEP 7: START THE APPLICATION

This is the final step!

**Copy and paste this command:**
```bash
npm run dev
```

**⏳ Wait 10-20 seconds...**

**✅ When ready, you'll see:**
```
▲ Next.js 15.1.0
- Local:        http://localhost:3000

✓ Ready in 3s
```

**🎉 SUCCESS!** Your repair dashboard is now running!

---

## 🌐 STEP 8: OPEN IN YOUR BROWSER

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. In the address bar, type: `localhost:3000`
3. Press Enter

**You should see your Repair Dashboard!**

---

## ✅ WHAT YOU SHOULD SEE

When you open `localhost:3000`, you should see:

### Home Page:
- A header with "RepairHub" (or similar name)
- Navigation menu with: Dashboard, Repairs, Pricing, etc.
- Cards showing statistics

### What You Can Do Now:
1. Click "Repairs" → See a sample repair (iPhone screen replacement)
2. Click "Dashboard" → See overview of your repair shop
3. Explore the different pages

---

## 🛑 STOPPING THE APPLICATION

When you're done and want to stop:

1. Go back to the Terminal/Command Prompt window
2. Press `Ctrl + C` (both Mac and Windows)
3. Type: `Y` or just press Enter
4. The application stops

**To start again later:**
1. Open Terminal/Command Prompt
2. Go to the project: `cd /workspace/repair-dashboard`
3. Run: `npm run dev`
4. Open browser: `localhost:3000`

---

## 😰 HELP! SOMETHING WENT WRONG

### Problem: "command not found: npm"
**Solution:** Node.js didn't install correctly
- Go back to Step 1A and reinstall Node.js
- Make sure to close and reopen Terminal/Command Prompt after installing

### Problem: "command not found: createdb" or "psql: command not found"
**Solution:** PostgreSQL didn't install correctly
- Go back to Step 1B and reinstall PostgreSQL
- **Mac:** Make sure Postgres.app is open and running
- **Windows:** Check Services app and make sure PostgreSQL service is running

### Problem: "Cannot connect to database"
**Solution:** Database isn't running
- **Mac:** Open Postgres.app → Make sure it says "Running"
- **Windows:** Open Services → Find "PostgreSQL" → Click "Start"

### Problem: "Port 3000 is already in use"
**Solution:** Something else is using that port
- Close other programs that might be using it
- Or use a different port: `PORT=3001 npm run dev`
- Then open: `localhost:3001` in browser

### Problem: "Error: P1001: Can't reach database"
**Solution:** Wrong database connection info
- Open the `.env` file again
- Make sure the DATABASE_URL line is correct
- Make sure your PostgreSQL password matches

### Problem: Terminal shows errors I don't understand
**Solution:** Take a screenshot and:
1. Read the error carefully - it usually tells you what's wrong
2. Google the exact error message
3. Or go back and make sure you followed every step exactly

---

## 📸 VISUAL GUIDE - WHAT EACH STEP LOOKS LIKE

### When you type `npm install`:
```
⠙ Fetching packages...
⠹ Installing packages...
⠸ Linking dependencies...
✓ Success! Installed 450 packages
```

### When you type `npm run dev`:
```
   ▲ Next.js 15.1.0
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.5:3000

 ✓ Ready in 3.2s
 ○ Compiling / ...
 ✓ Compiled / in 2.1s
```

### In your browser at `localhost:3000`:
```
┌─────────────────────────────────────┐
│  RepairHub Dashboard                │
├─────────────────────────────────────┤
│                                      │
│  📊 Overview                        │
│                                      │
│  [Total Repairs: 1]                 │
│  [Active: 1]                        │
│  [Completed: 0]                     │
│                                      │
└─────────────────────────────────────┘
```

---

## 🎯 CHECKLIST - DID EVERYTHING WORK?

Go through this checklist:

- [ ] Node.js installed (typed `node --version` and saw a version number)
- [ ] PostgreSQL installed (typed `psql --version` and saw a version number)
- [ ] Created database (no error when running `createdb`)
- [ ] Edited .env file (changed DATABASE_URL line)
- [ ] Ran `npm install` (saw "added 450 packages" or similar)
- [ ] Ran `npm run db:generate` (saw "Generated Prisma Client")
- [ ] Ran `npm run db:push` (saw "database is now in sync")
- [ ] Ran `npm run db:seed` (saw "Database seeded successfully")
- [ ] Ran `npm run dev` (saw "Ready in 3s")
- [ ] Opened `localhost:3000` in browser (saw the dashboard)
- [ ] Can click around and see sample repairs

**✅ If you checked all of these - CONGRATULATIONS! You did it!** 🎉

---

## 🎓 WHAT EACH STEP DID (EXPLAINED SIMPLY)

1. **Node.js** = The engine that runs the application code
2. **PostgreSQL** = The database where all your repair data is stored
3. **npm install** = Downloads all the code libraries the app needs
4. **db:generate** = Creates tools to talk to the database
5. **db:push** = Creates empty tables in the database
6. **db:seed** = Fills the database with sample data
7. **npm run dev** = Starts the application
8. **localhost:3000** = The address where your app runs on your computer

---

## 🔄 HOW TO USE IT EVERY DAY

**To start the application:**
1. Open Terminal/Command Prompt
2. Type: `cd /workspace/repair-dashboard`
3. Type: `npm run dev`
4. Open browser: `localhost:3000`

**To stop the application:**
1. In Terminal/Command Prompt, press `Ctrl + C`

**Your data is saved** in the PostgreSQL database, so it won't be lost when you stop the app!

---

## 📞 NEXT STEPS - AFTER IT'S RUNNING

Now that it's working:

### Week 1: Learn the System
1. Click around and explore
2. Create a test repair
3. Add a test customer
4. Try different features

### Week 2: Customize It
1. Add your real device models (iPhones, Samsungs you repair)
2. Add your real repair types (screens, batteries, etc.)
3. Set your actual prices

### Week 3: Add Real Data
1. Add your real customers
2. Create real repair orders
3. Train your staff

### Month 1: Go Live!
1. Use it for every repair
2. Track everything
3. See how it helps your business!

---

## 🎉 CONGRATULATIONS!

You just set up a complete repair shop management system!

**You now have:**
- ✅ A working dashboard
- ✅ Repair tracking system
- ✅ Customer management
- ✅ Pricing tools
- ✅ Sample data to practice with

**No programming knowledge required!**

---

*Need help? Go through the troubleshooting section or check if you missed any steps.*

*Created: 2025-11-10 for Non-Developers 💙*
