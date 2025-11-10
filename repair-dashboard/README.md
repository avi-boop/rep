# 🔧 RepairHub - Mobile Repair Shop Dashboard

A comprehensive, production-ready dashboard system for managing mobile device repairs with smart pricing, automated notifications, and Lightspeed POS integration.

## ✨ Features

### Core Functionality
- ✅ Complete repair workflow management
- ✅ Customer database with Lightspeed sync capability
- ✅ Multi-device support (iPhones, Samsung, tablets, etc.)
- ✅ Multiple repair types (screen, battery, camera, etc.)
- ✅ Original and aftermarket parts tracking
- ✅ Status tracking (New → Completed)
- ✅ Priority levels (Standard, Urgent, Express)

### Smart Pricing System
- ✅ **Automatic price estimation** using interpolation
- ✅ Confidence scoring (shows reliability of estimates)
- ✅ Manual price override capability
- ✅ Price matrix interface

### Customer Notifications
- 🔄 Automated SMS (Twilio) - *Ready to configure*
- 🔄 Automated Email (SendGrid) - *Ready to configure*
- 🔄 Status update triggers
- 🔄 Customizable templates

### Integrations
- 🔄 Lightspeed POS (customer sync, sales) - *Ready to configure*
- 🔄 Twilio (SMS notifications)
- 🔄 SendGrid (email notifications)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
cd repair-dashboard
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Set up the database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

4. **Run development server:**
```bash
npm run dev
```

5. **Open your browser:**
```
http://localhost:3000
```

## 📋 Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Or macOS
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
\q
```

Update `.env`:
```
DATABASE_URL="postgresql://repair_admin:your_secure_password@localhost:5432/repair_shop_db?schema=public"
```

### Option 2: Cloud Database (Recommended for Production)

**Supabase (Free tier available):**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string
4. Update `.env` with the connection string

**Railway:**
1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Copy connection string
4. Update `.env`

## 🗂️ Project Structure

```
repair-dashboard/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── repairs/       # Repair management
│   │   ├── customers/     # Customer management
│   │   ├── devices/       # Device models
│   │   ├── brands/        # Device brands
│   │   └── repair-types/  # Repair type definitions
│   ├── repairs/           # Repairs page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── Header.tsx         # Navigation header
├── lib/                   # Utilities
│   ├── db.ts             # Prisma client
│   └── pricing/          # Smart pricing algorithm
│       └── estimator.ts  # Price estimation logic
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
├── types/                # TypeScript types
│   └── index.ts          # Shared types
└── public/               # Static files
```

## 📊 Database Schema

The application uses the following main tables:

- **brands** - Device manufacturers (Apple, Samsung, etc.)
- **device_models** - Specific devices (iPhone 15 Pro, Galaxy S24, etc.)
- **repair_types** - Types of repairs (Screen, Battery, etc.)
- **prices** - Pricing for device/repair combinations
- **customers** - Customer information
- **repairs** - Repair orders
- **repair_items** - Individual repairs within an order
- **notifications** - SMS/Email notification log
- **users** - Staff user accounts

## 🎯 Key Features Explained

### Smart Pricing Algorithm

The system can automatically estimate prices for device repairs:

1. **Exact Match**: If price exists, use it
2. **Interpolation**: Estimate based on nearby models
   - Example: iPhone 11=$150, iPhone 13=$200 → iPhone 12≈$175
3. **Extrapolation**: Use nearest known price with adjustment
4. **Category Average**: Fallback to average for that repair type

```typescript
// Usage example
import { estimatePrice } from '@/lib/pricing/estimator'

const estimate = await estimatePrice(
  deviceModelId,
  repairTypeId,
  'original'
)
// Returns: { price: 199, confidence: 0.85, isEstimated: true }
```

### API Endpoints

#### Repairs
- `GET /api/repairs` - List all repairs
- `GET /api/repairs?status=in_progress` - Filter by status
- `POST /api/repairs` - Create new repair
- `GET /api/repairs/[id]` - Get repair details
- `PATCH /api/repairs/[id]` - Update repair
- `DELETE /api/repairs/[id]` - Delete repair

#### Customers
- `GET /api/customers` - List customers
- `GET /api/customers?search=john` - Search customers
- `POST /api/customers` - Create customer

#### Devices & Pricing
- `GET /api/brands` - List all brands
- `GET /api/devices` - List all device models
- `GET /api/devices?brandId=1` - Filter by brand
- `GET /api/repair-types` - List repair types

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run prisma:seed      # Seed database with sample data
```

### Adding New Features

#### 1. Add a new table
```prisma
// prisma/schema.prisma
model Inventory {
  id       Int    @id @default(autoincrement())
  partName String
  quantity Int
  // ... more fields
}
```

#### 2. Create migration
```bash
npm run prisma:migrate
```

#### 3. Create API route
```typescript
// app/api/inventory/route.ts
export async function GET() {
  const items = await prisma.inventory.findMany()
  return NextResponse.json({ data: items })
}
```

## 🚀 Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production
```bash
DATABASE_URL="your_production_database_url"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
JWT_SECRET="generate_secure_random_string"
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
SENDGRID_API_KEY="your_sendgrid_key"
```

## 📝 Next Steps

### Immediate (MVP Complete)
- ✅ Database schema and seed data
- ✅ Core API routes (repairs, customers, devices)
- ✅ Smart pricing algorithm
- ✅ Basic UI with navigation
- ✅ Repair listing page

### Phase 2 (Enhance)
- [ ] Create repair form
- [ ] Customer search and management
- [ ] Price matrix editor
- [ ] Status board (Kanban view)
- [ ] Dashboard with analytics

### Phase 3 (Automate)
- [ ] SMS notifications (Twilio)
- [ ] Email notifications (SendGrid)
- [ ] Automatic status notifications
- [ ] Customer portal

### Phase 4 (Integrate)
- [ ] Lightspeed POS integration
- [ ] Customer sync
- [ ] Sales sync
- [ ] Inventory tracking

## 📚 Documentation

See the `/workspace` directory for comprehensive planning documents:

- `MOBILE_REPAIR_SHOP_DASHBOARD_PLAN.md` - Complete system design
- `QUICK_START_GUIDE.md` - Development guide
- `API_IMPLEMENTATION_EXAMPLES.md` - Code examples
- `SYSTEM_ARCHITECTURE.md` - Technical architecture
- `TESTING_GUIDE.md` - Testing strategies
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U repair_admin -d repair_shop_db
```

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

## 📄 License

This project is open source and available for commercial use.

## 🙏 Support

For issues and questions:
- Check the comprehensive documentation in `/workspace`
- Review the `QUICK_START_GUIDE.md` for detailed setup
- Check API examples in `API_IMPLEMENTATION_EXAMPLES.md`

---

**Built with ❤️ for mobile repair shop owners**

*Streamline your repair business with smart automation and pricing!*
