# Mobile Repair Dashboard - Quick Start Guide

## 🚀 Getting Started

This guide will help you get from planning to development in the fastest way possible.

---

## Step 1: Set Up Your Development Environment (Day 1)

### Install Required Tools

1. **Node.js** (v20 LTS or later)
   ```bash
   # Download from https://nodejs.org/
   # Or use nvm (Node Version Manager)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

2. **PostgreSQL** (v15 or later)
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Linux
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

3. **Redis** (for caching)
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu/Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   
   # Windows
   # Download from https://github.com/microsoftarchive/redis/releases
   ```

4. **Git**
   ```bash
   # macOS
   brew install git
   
   # Ubuntu/Linux
   sudo apt-get install git
   
   # Windows
   # Download from https://git-scm.com/download/win
   ```

5. **VS Code** (recommended IDE)
   - Download from https://code.visualstudio.com/
   - Install extensions:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features
     - PostgreSQL (by Chris Kolkman)
     - GitLens

---

## Step 2: Create Your Project Structure (Day 1)

### Initialize the Project

```bash
# Create project directory
mkdir mobile-repair-dashboard
cd mobile-repair-dashboard

# Initialize Git
git init
git branch -M main

# Create directory structure
mkdir frontend backend database docs
```

### Frontend Setup (React + TypeScript)

```bash
cd frontend

# Create React app with TypeScript
npx create-react-app . --template typescript

# Install core dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install date-fns recharts

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Initialize Tailwind CSS (update tailwind.config.js)
```

**tailwind.config.js:**
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Backend Setup (Node.js + Express + TypeScript)

```bash
cd ../backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv
npm install jsonwebtoken bcrypt
npm install prisma @prisma/client
npm install joi express-validator
npm install socket.io
npm install winston
npm install twilio nodemailer

# Install dev dependencies
npm install -D typescript @types/node @types/express
npm install -D ts-node nodemon
npm install -D @types/jsonwebtoken @types/bcrypt @types/cors
npm install -D jest @types/jest ts-jest supertest @types/supertest

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

**tsconfig.json (backend):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## Step 3: Set Up Database (Day 1-2)

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE mobile_repair_db;
CREATE USER repair_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mobile_repair_db TO repair_admin;
\q
```

### Configure Prisma Schema

**backend/prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Customer {
  id                      Int       @id @default(autoincrement())
  lightspeedCustomerId    String?   @unique
  firstName               String
  lastName                String
  phone                   String    @unique
  email                   String?
  address                 String?
  city                    String?
  state                   String?
  zip                     String?
  marketingConsent        Boolean   @default(false)
  preferredContactMethod  String    @default("SMS")
  notes                   String?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  repairOrders            RepairOrder[]
  customerDevices         CustomerDevice[]
  notifications           Notification[]
}

model Device {
  id              Int       @id @default(autoincrement())
  brand           String
  model           String
  variant         String?
  releaseYear     Int?
  deviceCategory  String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  priceList       PriceList[]
  customerDevices CustomerDevice[]
  partsInventory  PartsInventory[]
}

model CustomerDevice {
  id              Int       @id @default(autoincrement())
  customerId      Int
  deviceId        Int
  imeiSerial      String?
  color           String?
  conditionNotes  String?
  firstSeenAt     DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  customer        Customer  @relation(fields: [customerId], references: [id])
  device          Device    @relation(fields: [deviceId], references: [id])
  repairOrders    RepairOrder[]
}

model RepairType {
  id                      Int       @id @default(autoincrement())
  name                    String
  category                String
  description             String?
  typicalDurationMinutes  Int?
  active                  Boolean   @default(true)
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  priceList               PriceList[]
  repairOrderItems        RepairOrderItem[]
  partsInventory          PartsInventory[]
}

model PriceList {
  id                Int       @id @default(autoincrement())
  deviceId          Int
  repairTypeId      Int
  partQuality       String
  price             Decimal   @db.Decimal(10, 2)
  cost              Decimal?  @db.Decimal(10, 2)
  isEstimated       Boolean   @default(false)
  confidenceScore   Int?
  effectiveFrom     DateTime  @default(now())
  effectiveUntil    DateTime?
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  device            Device    @relation(fields: [deviceId], references: [id])
  repairType        RepairType @relation(fields: [repairTypeId], references: [id])
  
  @@unique([deviceId, repairTypeId, partQuality, effectiveFrom])
}

model RepairOrder {
  id                        Int       @id @default(autoincrement())
  orderNumber               String    @unique
  customerId                Int
  customerDeviceId          Int
  status                    String    @default("received")
  priority                  String    @default("standard")
  checkedInAt               DateTime  @default(now())
  estimatedCompletionAt     DateTime?
  completedAt               DateTime?
  deliveredAt               DateTime?
  assignedTechnicianId      Int?
  customerIssueDescription  String
  technicianDiagnosis       String?
  devicePasscode            String?
  deviceConditionNotes      String?
  backupConfirmed           Boolean   @default(false)
  totalPrice                Decimal   @db.Decimal(10, 2)
  depositPaid               Decimal   @default(0) @db.Decimal(10, 2)
  finalPaymentStatus        String    @default("unpaid")
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
  
  customer                  Customer  @relation(fields: [customerId], references: [id])
  customerDevice            CustomerDevice @relation(fields: [customerDeviceId], references: [id])
  assignedTechnician        User?     @relation(fields: [assignedTechnicianId], references: [id])
  
  repairOrderItems          RepairOrderItem[]
  notifications             Notification[]
}

model RepairOrderItem {
  id              Int       @id @default(autoincrement())
  repairOrderId   Int
  repairTypeId    Int
  partQuality     String
  price           Decimal   @db.Decimal(10, 2)
  cost            Decimal?  @db.Decimal(10, 2)
  status          String    @default("pending")
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  repairOrder     RepairOrder @relation(fields: [repairOrderId], references: [id])
  repairType      RepairType @relation(fields: [repairTypeId], references: [id])
}

model PartsInventory {
  id                Int       @id @default(autoincrement())
  deviceId          Int?
  repairTypeId      Int
  partQuality       String
  sku               String?   @unique
  quantityInStock   Int       @default(0)
  reorderThreshold  Int       @default(5)
  unitCost          Decimal   @db.Decimal(10, 2)
  supplierName      String?
  supplierContact   String?
  location          String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  device            Device?   @relation(fields: [deviceId], references: [id])
  repairType        RepairType @relation(fields: [repairTypeId], references: [id])
}

model Notification {
  id              Int       @id @default(autoincrement())
  repairOrderId   Int
  customerId      Int
  type            String
  templateName    String
  recipient       String
  subject         String?
  message         String
  status          String    @default("pending")
  sentAt          DateTime?
  errorMessage    String?
  createdAt       DateTime  @default(now())
  
  repairOrder     RepairOrder @relation(fields: [repairOrderId], references: [id])
  customer        Customer  @relation(fields: [customerId], references: [id])
}

model User {
  id          Int       @id @default(autoincrement())
  username    String    @unique
  email       String    @unique
  passwordHash String
  firstName   String
  lastName    String
  role        String
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  repairOrders RepairOrder[]
}
```

### Run Migrations

```bash
cd backend

# Create .env file
echo "DATABASE_URL=\"postgresql://repair_admin:your_secure_password@localhost:5432/mobile_repair_db\"" > .env
echo "JWT_SECRET=\"your_jwt_secret_key_here\"" >> .env
echo "PORT=3001" >> .env

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Open Prisma Studio to view database
npm run prisma:studio
```

---

## Step 4: Build Core Backend (Days 3-7)

### Create Basic Server

**backend/src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Import routes
import customerRoutes from './routes/customers';
import repairOrderRoutes from './routes/repairOrders';
import priceRoutes from './routes/prices';

app.use('/api/customers', customerRoutes);
app.use('/api/repair-orders', repairOrderRoutes);
app.use('/api/prices', priceRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { prisma };
```

### Create Route Files

Create these directories and starter files:
```bash
mkdir -p src/routes src/controllers src/services src/middleware
touch src/routes/customers.ts
touch src/routes/repairOrders.ts
touch src/routes/prices.ts
```

---

## Step 5: Build Frontend (Days 8-14)

### Create Basic App Structure

**frontend/src/App.tsx:**
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Dashboard from './pages/Dashboard';
import RepairOrders from './pages/RepairOrders';
import Customers from './pages/Customers';
import Pricing from './pages/Pricing';
import Login from './pages/Login';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/repairs" element={<RepairOrders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
```

### Create Pages

```bash
mkdir -p src/pages src/components src/hooks src/services src/types
touch src/pages/Dashboard.tsx
touch src/pages/RepairOrders.tsx
touch src/pages/Customers.tsx
touch src/pages/Pricing.tsx
touch src/pages/Login.tsx
```

---

## Step 6: Set Up Third-Party Services (Day 15)

### Twilio (SMS)

1. Sign up at https://www.twilio.com/
2. Get Account SID and Auth Token
3. Get a phone number
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### SendGrid (Email)

1. Sign up at https://sendgrid.com/
2. Create API key
3. Add to `.env`:
   ```
   SENDGRID_API_KEY=your_api_key
   SENDGRID_FROM_EMAIL=noreply@yourshop.com
   ```

---

## Step 7: Deploy (Week 3)

### Option A: Railway.app (Easiest)

1. Sign up at https://railway.app/
2. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Login:
   ```bash
   railway login
   ```
4. Deploy:
   ```bash
   railway init
   railway up
   ```

### Option B: Digital Ocean

1. Create Droplet (Ubuntu 22.04)
2. SSH into server
3. Install Node.js, PostgreSQL, Redis, Nginx
4. Clone repository
5. Set up PM2 for process management
6. Configure Nginx reverse proxy
7. Set up SSL with Let's Encrypt

---

## Step 8: Initial Data Setup (Day 20)

### Seed Database

**backend/prisma/seed.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@yourshop.com',
      passwordHash: 'hashed_password_here', // Use bcrypt in production
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  // Create repair types
  const repairTypes = [
    { name: 'Front Screen', category: 'Display' },
    { name: 'Back Glass', category: 'Display' },
    { name: 'Battery', category: 'Power' },
    { name: 'Charging Port', category: 'Power' },
    { name: 'Camera', category: 'Hardware' },
    { name: 'Speaker', category: 'Audio' },
  ];

  for (const type of repairTypes) {
    await prisma.repairType.create({ data: type });
  }

  // Create devices
  const iphones = [
    'iPhone 11', 'iPhone 12', 'iPhone 12 Pro', 
    'iPhone 13', 'iPhone 13 Pro', 'iPhone 14', 'iPhone 14 Pro'
  ];

  for (const model of iphones) {
    await prisma.device.create({
      data: {
        brand: 'Apple',
        model,
        deviceCategory: 'Phone',
        releaseYear: parseInt(model.match(/\d+/)?.[0] || '2020') + 2008,
      },
    });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

Run seed:
```bash
npx ts-node prisma/seed.ts
```

---

## Development Workflow

### Daily Development Routine

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **View Database:**
   ```bash
   cd backend
   npm run prisma:studio
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/repair-orders

# Make changes, then commit
git add .
git commit -m "Add repair order creation"

# Push to remote
git push origin feature/repair-orders

# Create pull request on GitHub
```

---

## Testing Your Setup

### Backend Test

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Frontend Test

Open http://localhost:3000 in browser

---

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

### Database Connection Error
- Check PostgreSQL is running: `psql postgres`
- Verify DATABASE_URL in `.env`
- Check user permissions

### Prisma Generate Error
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
npm run prisma:generate
```

### CORS Error
- Ensure backend has `cors()` middleware
- Check frontend API base URL

---

## Next Steps

After completing this setup:

1. ✅ Build customer management (CRUD)
2. ✅ Build repair order creation
3. ✅ Implement pricing system
4. ✅ Add authentication
5. ✅ Build dashboard with stats
6. ✅ Implement notifications
7. ✅ Add reporting

---

## Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **Material-UI**: https://mui.com
- **Express.js**: https://expressjs.com
- **Twilio Docs**: https://www.twilio.com/docs

---

## Need Help?

- Check the main planning document: `MOBILE_REPAIR_DASHBOARD_PLAN.md`
- Review API endpoints: `API_ENDPOINTS.md`
- Check tech stack details: `TECH_STACK.md`

Happy coding! 🚀
