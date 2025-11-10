# Implementation Guide - Quick Start

## 🚀 Getting Started

This guide will help you get your mobile repair shop dashboard up and running quickly.

---

## Prerequisites

### Required
- **Node.js** 18+ or **Python** 3.10+ (choose your backend stack)
- **PostgreSQL** 12+
- **Redis** 6+ (for notifications queue)
- **Git**

### For Notifications
- **Twilio Account** (for SMS)
- **SendGrid Account** (for email)

### For Integration
- **Lightspeed POS Account** with API access

---

## Step 1: Database Setup

### 1.1 Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
```

### 1.2 Create Database
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
\q
```

### 1.3 Run Database Setup Script
```bash
psql -U repair_admin -d repair_shop_db -f DATABASE_SETUP.sql
```

This will:
- Create all tables with proper indexes
- Set up triggers for auto-updates
- Insert seed data (brands, repair types, sample devices)
- Create views for common queries

---

## Step 2: Backend Setup

### Option A: Node.js Backend

#### 2.1 Initialize Project
```bash
mkdir repair-shop-backend
cd repair-shop-backend
npm init -y
```

#### 2.2 Install Dependencies
```bash
npm install express pg cors dotenv bcrypt jsonwebtoken
npm install express-validator multer redis twilio @sendgrid/mail
npm install --save-dev nodemon typescript @types/node @types/express
```

#### 2.3 Create .env File
```bash
cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=repair_shop_db
DB_USER=repair_admin
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRES_IN=24h

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourshop.com

# Lightspeed
LIGHTSPEED_API_KEY=your_lightspeed_key
LIGHTSPEED_ACCOUNT_ID=your_account_id
LIGHTSPEED_API_URL=https://api.lightspeedapp.com

# App
PORT=3000
NODE_ENV=development
EOF
```

#### 2.4 Basic Server Structure
```bash
mkdir -p src/{routes,controllers,models,middleware,services,utils}
```

Create `src/index.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

#### 2.5 Database Connection
Create `src/utils/db.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

#### 2.6 Start Server
```bash
npm run dev
```

### Option B: Python Backend (FastAPI)

#### 2.1 Create Virtual Environment
```bash
mkdir repair-shop-backend
cd repair-shop-backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

#### 2.2 Install Dependencies
```bash
pip install fastapi uvicorn psycopg2-binary sqlalchemy pydantic
pip install python-jose[cryptography] passlib[bcrypt] python-multipart
pip install redis twilio sendgrid python-dotenv
```

Create `requirements.txt`:
```bash
pip freeze > requirements.txt
```

#### 2.3 Create .env File
(Same as Node.js version above)

#### 2.4 Basic Server Structure
```bash
mkdir -p app/{routes,models,services,utils}
```

Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Repair Shop API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include routers
from app.routes import devices, pricing, orders, customers

app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["pricing"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 2.5 Start Server
```bash
uvicorn app.main:app --reload
```

---

## Step 3: Frontend Setup

### 3.1 Create React App with Next.js
```bash
npx create-next-app@latest repair-shop-frontend
cd repair-shop-frontend
```

Choose:
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router
- ❌ Turbopack (for now)

### 3.2 Install UI Dependencies
```bash
npm install @tanstack/react-query axios
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install lucide-react recharts date-fns
npm install react-hook-form zod @hookform/resolvers
```

### 3.3 Install Shadcn/ui (Optional but Recommended)
```bash
npx shadcn-ui@latest init
```

Add components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
```

### 3.4 Create .env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=RepairHub
```

### 3.5 Basic Folder Structure
```bash
mkdir -p src/{components,lib,hooks,types}
mkdir -p src/components/{dashboard,orders,pricing,customers}
```

### 3.6 Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Step 4: Key Features Implementation Priority

### Week 1-2: Foundation
- [ ] Authentication (login/logout)
- [ ] Dashboard layout with navigation
- [ ] Brand & Device model management
- [ ] Repair types setup

### Week 3-4: Core Functionality
- [ ] Create repair order form
- [ ] Order list with filters
- [ ] Customer management
- [ ] Basic pricing table

### Week 5-6: Smart Pricing
- [ ] Pricing grid interface
- [ ] Smart pricing algorithm implementation
- [ ] Confidence indicators
- [ ] CSV import/export

### Week 7: Notifications
- [ ] SMS integration (Twilio)
- [ ] Email templates
- [ ] Auto-send on status change
- [ ] Notification history

### Week 8: Analytics
- [ ] Dashboard KPIs
- [ ] Revenue charts
- [ ] Popular repairs
- [ ] Performance metrics

### Week 9-10: Lightspeed Integration
- [ ] OAuth setup
- [ ] Customer sync
- [ ] Payment sync
- [ ] Inventory updates

---

## Step 5: Testing

### 5.1 Test Database Setup
```bash
# Verify all tables exist
psql -U repair_admin -d repair_shop_db -c "\dt"

# Check seed data
psql -U repair_admin -d repair_shop_db -c "SELECT name FROM brands;"
psql -U repair_admin -d repair_shop_db -c "SELECT COUNT(*) FROM device_models;"
```

### 5.2 Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get brands
curl http://localhost:3000/api/devices/brands

# Get device models
curl http://localhost:3000/api/devices/models
```

### 5.3 Create Test User
```bash
# Using psql
INSERT INTO users (email, password_hash, role, name)
VALUES (
  'admin@shop.com',
  '$2b$10$...',  -- Use bcrypt to hash 'password123'
  'admin',
  'Admin User'
);
```

---

## Step 6: Deployment

### 6.1 Backend Deployment (Example: DigitalOcean)
```bash
# Create droplet
# Install Node.js/Python
# Clone repository
# Install dependencies
# Set environment variables
# Use PM2 for Node.js
npm install -g pm2
pm2 start src/index.js --name repair-api

# Setup nginx as reverse proxy
```

### 6.2 Frontend Deployment (Vercel - Easiest)
```bash
npm install -g vercel
vercel login
vercel
```

### 6.3 Database Deployment
- Use managed PostgreSQL (DigitalOcean, AWS RDS, or Heroku)
- Update connection strings in .env
- Run migrations

---

## Step 7: Configuration Checklist

### Business Setup
- [ ] Add your business information
- [ ] Set tax rate
- [ ] Configure business hours
- [ ] Upload logo

### Device Setup
- [ ] Add all device models you service
- [ ] Set up repair types
- [ ] Configure part types

### Pricing Setup
- [ ] Enter pricing for common repairs
- [ ] Set cost values for margin tracking
- [ ] Test smart pricing estimates

### Notification Setup
- [ ] Configure Twilio credentials
- [ ] Test SMS sending
- [ ] Configure SendGrid
- [ ] Customize email templates
- [ ] Set auto-send preferences

### Lightspeed Setup
- [ ] Get API credentials
- [ ] Test connection
- [ ] Sync initial customer data
- [ ] Configure sync frequency

---

## Common Issues & Solutions

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check credentials
psql -U repair_admin -d repair_shop_db

# Check .env file has correct values
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Twilio SMS Not Sending
- Verify account is not in trial mode (trial only sends to verified numbers)
- Check phone number format (+1234567890)
- Verify credentials in .env

---

## Next Steps

1. **Customize the UI**: Modify colors, logos, and branding
2. **Add more device models**: Populate your specific inventory
3. **Set realistic pricing**: Enter your actual repair prices
4. **Train your team**: Create user accounts and train staff
5. **Test thoroughly**: Run through complete repair workflow
6. **Go live**: Start with a few test repairs before full rollout

---

## Support Resources

### Documentation
- See `MOBILE_REPAIR_DASHBOARD_PLAN.md` for complete system design
- See `API_ENDPOINTS.md` for API documentation
- See `smart_pricing_example.py` for smart pricing implementation

### Frameworks
- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Integration APIs
- **Lightspeed**: https://developers.lightspeedhq.com/
- **Twilio**: https://www.twilio.com/docs
- **SendGrid**: https://docs.sendgrid.com/

---

## Recommended VS Code Extensions

- ESLint
- Prettier
- PostgreSQL
- Thunder Client (API testing)
- GitLens
- Tailwind CSS IntelliSense

---

**Good luck with your repair shop dashboard! 🚀**
