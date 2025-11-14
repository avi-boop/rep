# 📋 SIMPLE COPY & PASTE COMMANDS

**Just copy each command and paste into Terminal/Command Prompt**

---

## ✅ BEFORE YOU START:

1. Install Node.js from: https://nodejs.org (click the big green button)
2. Install PostgreSQL:
   - **Mac:** https://postgresapp.com
   - **Windows:** https://www.postgresql.org/download/windows/
3. Close and reopen Terminal/Command Prompt after installing

---

## 🚀 COPY THESE COMMANDS ONE BY ONE:

### STEP 1: Go to the project folder

**Mac/Linux:**
```bash
cd /workspace/repair-dashboard
```

**Windows:**
```bash
cd C:\workspace\repair-dashboard
```

---

### STEP 2: Create the database

**Mac/Linux:**
```bash
createdb repair_shop_db
```

**Windows (PowerShell):**
```powershell
& "C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres repair_shop_db
```

---

### STEP 3: Copy the settings file

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```bash
copy .env.example .env
```

---

### STEP 4: Edit the .env file

**Mac:**
```bash
open -e .env
```

**Windows:**
```bash
notepad .env
```

**In the file, find this line:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/repair_shop_db?schema=public"
```

**Change to (Mac):**
```
DATABASE_URL="postgresql://postgres:@localhost:5432/repair_shop_db?schema=public"
```

**Change to (Windows - use your password):**
```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/repair_shop_db?schema=public"
```

**Save and close the file**

---

### STEP 5: Install everything (takes 2-5 minutes)

```bash
npm install
```

**Wait for it to finish...** ☕

---

### STEP 6: Set up the database

**Command 1:**
```bash
npm run db:generate
```

**Command 2:**
```bash
npm run db:push
```

**Command 3:**
```bash
npm run db:seed
```

---

### STEP 7: Start the application!

```bash
npm run dev
```

**✅ When you see "Ready in 3s", open your browser and go to:**
```
localhost:3000
```

---

## 🎉 DONE!

Your repair dashboard is now running!

---

## 🛑 TO STOP THE APPLICATION:

Press: **Ctrl + C**

---

## 🔄 TO START AGAIN LATER:

```bash
cd /workspace/repair-dashboard
npm run dev
```

Then open browser: `localhost:3000`

---

## ⚠️ IF YOU GET ERRORS:

### "command not found: npm"
→ Node.js not installed correctly. Reinstall from https://nodejs.org

### "command not found: createdb"
→ PostgreSQL not installed correctly
- **Mac:** Open Postgres.app
- **Windows:** Reinstall PostgreSQL

### "Cannot connect to database"
→ Check your DATABASE_URL in the .env file
→ Make sure PostgreSQL is running

### "Port 3000 already in use"
→ Use this instead:
```bash
PORT=3001 npm run dev
```
Then open: `localhost:3001`

---

**That's it! Just follow these commands in order.** 🚀
