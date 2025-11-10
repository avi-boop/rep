# Mobile Repair Shop Dashboard

A comprehensive, modern dashboard system for managing mobile device repairs with smart pricing, customer notifications, and business analytics.

## 🚀 Project Status

✅ **IMPLEMENTED:**
- Next.js 15 with TypeScript and Tailwind CSS
- SQLite database with Prisma ORM
- Complete database schema (11 tables)
- Seeded test data (brands, devices, repair types, parts, pricing)
- Dashboard layout with sidebar navigation
- Main dashboard with stats and recent repairs
- API routes for CRUD operations:
  - Brands
  - Device Models
  - Repair Types
  - Part Types
  - Pricing

🚧 **IN PROGRESS:**
- Pricing Matrix UI
- Smart Pricing Algorithm
- Repair Order Management
- Customer Management
- Status Board (Kanban)

## 📋 Prerequisites

- Node.js 18+ or 20+ LTS
- npm or yarn

## 🛠️ Installation

1. **Navigate to the project:**
   ```bash
   cd /workspace/repair-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
repair-dashboard/
├── app/
│   ├── api/                    # API routes
│   │   ├── brands/
│   │   ├── device-models/
│   │   ├── pricing/
│   │   ├── repair-types/
│   │   └── part-types/
│   ├── dashboard/              # Dashboard pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── repairs/
│   │   ├── pricing/
│   │   └── customers/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/                 # Layout components
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/                     # UI components
├── lib/
│   ├── prisma.ts              # Prisma client
│   └── utils.ts               # Utility functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── dev.db                 # SQLite database
├── .env
├── package.json
└── README.md
```

## 🗃️ Database Schema

### Core Tables
- **brands** - Device manufacturers (Apple, Samsung, etc.)
- **device_models** - Specific device models (iPhone 15 Pro, Galaxy S24)
- **repair_types** - Types of repairs (Screen, Battery, etc.)
- **part_types** - Quality levels (OEM, Aftermarket Premium, etc.)
- **pricing** - Repair pricing with smart estimation support
- **customers** - Customer information
- **repair_orders** - Main repair tracking
- **repair_order_items** - Individual repair items per order
- **notifications** - SMS/Email notification tracking
- **order_status_history** - Audit log of status changes
- **photos** - Before/after photos

## 🎯 Features

### Implemented
✅ Dashboard with key metrics
✅ Recent repairs display
✅ Navigation sidebar
✅ API endpoints for all core data
✅ Database with sample data

### Planned
- 📋 Repair Order Management
  - Create new repairs
  - Status tracking (Kanban board)
  - Update status
  - Add photos
  
- 💰 Smart Pricing System
  - Price matrix interface
  - Auto-estimation algorithm
  - Confidence scores
  - Bulk import/export

- 👥 Customer Management
  - Search customers
  - View repair history
  - Contact information

- 📊 Analytics & Reports
  - Revenue tracking
  - Popular repairs
  - Technician performance
  - Custom date ranges

- 📱 Notifications
  - SMS via Twilio
  - Email via SendGrid
  - Automated triggers

- 🔌 Lightspeed POS Integration
  - Customer sync
  - Sales sync
  - Inventory tracking

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio GUI

# Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## 🌐 API Endpoints

### Brands
- `GET /api/brands` - List all brands
- `POST /api/brands` - Create new brand

### Device Models
- `GET /api/device-models` - List device models
- `GET /api/device-models?brandId=1` - Filter by brand
- `POST /api/device-models` - Create device model

### Repair Types
- `GET /api/repair-types` - List repair types
- `POST /api/repair-types` - Create repair type

### Part Types
- `GET /api/part-types` - List part types
- `POST /api/part-types` - Create part type

### Pricing
- `GET /api/pricing` - List all pricing
- `GET /api/pricing?deviceModelId=1` - Filter by device
- `POST /api/pricing` - Create pricing
- `PUT /api/pricing` - Update pricing

## 🎨 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **State:** Zustand (planned)
- **API:** Next.js API Routes

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# App (optional for now)
NEXTAUTH_SECRET="development-secret"
NEXTAUTH_URL="http://localhost:3000"

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# SendGrid (for Email)
SENDGRID_API_KEY=""
FROM_EMAIL=""

# Lightspeed (optional)
LIGHTSPEED_API_KEY=""
LIGHTSPEED_ACCOUNT_ID=""
```

## 📱 Sample Data

The database is seeded with:
- 4 brands (Apple, Samsung, Google, OnePlus)
- 10 device models (iPhone 15 Pro, iPhone 14, Galaxy S24, etc.)
- 5 repair types (Screen, Battery, Back Panel, Charging Port, Camera)
- 3 part types (OEM, Aftermarket Premium, Aftermarket Standard)
- 3 pricing entries
- 1 sample customer

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Railway.app
- Digital Ocean App Platform
- AWS (ECS/EKS)
- Heroku

**Note:** For production, switch to PostgreSQL by updating DATABASE_URL in .env

## 📖 Documentation

For more detailed documentation, see:
- `/workspace/MOBILE_REPAIR_DASHBOARD_PLAN.md` - Complete feature specifications
- `/workspace/QUICK_START_GUIDE.md` - Quick start guide
- `/workspace/IMPLEMENTATION_GUIDE.md` - Implementation details
- `/workspace/SYSTEM_ARCHITECTURE.md` - System architecture
- `/workspace/DEPLOYMENT_GUIDE.md` - Deployment instructions

## 🐛 Known Issues

- Using SQLite for development (switch to PostgreSQL for production)
- Authentication not yet implemented
- Notifications require Twilio/SendGrid setup

## 🤝 Contributing

This is a custom business application. For modifications:
1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit for review

## 📝 License

Proprietary - All rights reserved

## 📞 Support

For issues or questions, refer to the project documentation in the `/workspace` directory.

## 🎯 Next Steps

1. **Complete Repair Management:**
   - Build repair order form
   - Implement status board
   - Add photo upload

2. **Implement Smart Pricing:**
   - Price matrix UI
   - Estimation algorithm
   - Import/export functionality

3. **Customer Features:**
   - Customer search
   - Repair history
   - Communication log

4. **Notifications:**
   - Integrate Twilio for SMS
   - Set up SendGrid for email
   - Create notification templates

5. **Deploy:**
   - Set up production database
   - Configure environment variables
   - Deploy to Vercel

---

**Built with ❤️ for mobile repair shops**
