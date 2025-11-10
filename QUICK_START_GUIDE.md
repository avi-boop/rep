# Quick Start Guide - Mobile Repair Dashboard

## 🚀 Getting Started in 5 Steps

### Step 1: Choose Your Tech Stack (Day 1)
**Recommended for Quick Start:**
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (same repo) or FastAPI (separate)
- **Database**: PostgreSQL (Supabase for managed option)
- **Hosting**: Vercel (frontend) + Railway (database)

**Why this stack?**
- Fast development
- Single codebase option with Next.js
- Free tiers available
- Easy deployment

### Step 2: Set Up Development Environment (Day 1-2)
```bash
# Create project
npx create-next-app@latest repair-dashboard --typescript --tailwind
cd repair-dashboard

# Install key dependencies
npm install @tanstack/react-query zustand
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install prisma @prisma/client
npm install date-fns

# Dev dependencies
npm install -D prisma tsx

# Initialize database
npx prisma init
```

### Step 3: Database Setup (Day 2-3)
1. **Create PostgreSQL database** (Supabase/Railway/local)
2. **Copy schema from plan** → `prisma/schema.prisma`
3. **Run migrations**: `npx prisma migrate dev`
4. **Seed initial data**: Create seed script

**Quick Seed Data:**
```sql
-- Insert brands
INSERT INTO brands (name, is_primary) VALUES 
  ('Apple', true),
  ('Samsung', true),
  ('Google', false),
  ('OnePlus', false);

-- Insert iPhone models (top 10)
INSERT INTO device_models (brand_id, name, variant, release_year, release_month, tier_level) VALUES
  (1, 'iPhone 15', 'Pro Max', 2023, 9, 1),
  (1, 'iPhone 15', 'Pro', 2023, 9, 1),
  (1, 'iPhone 15', 'Standard', 2023, 9, 2),
  (1, 'iPhone 14', 'Pro Max', 2022, 9, 1),
  (1, 'iPhone 14', 'Pro', 2022, 9, 1),
  (1, 'iPhone 14', 'Standard', 2022, 9, 2),
  (1, 'iPhone 13', 'Pro Max', 2021, 9, 1),
  (1, 'iPhone 13', 'Pro', 2021, 9, 1),
  (1, 'iPhone 13', 'Standard', 2021, 2),
  (1, 'iPhone 12', 'Standard', 2020, 10, 2);

-- Insert repair types
INSERT INTO repair_types (name, category, complexity_level, avg_time_minutes) VALUES
  ('Screen Replacement', 'display', 3, 45),
  ('Battery Replacement', 'battery', 2, 30),
  ('Back Glass', 'housing', 4, 60),
  ('Charging Port', 'port', 3, 45),
  ('Camera Replacement', 'camera', 3, 40),
  ('Audio/Speaker', 'audio', 3, 35);
```

### Step 4: Build MVP Features (Week 1-2)
**Priority Order:**

#### Day 3-4: Basic UI Layout
- [ ] Dashboard shell with navigation
- [ ] Repair list page (static data first)
- [ ] Create repair form
- [ ] Simple pricing table

#### Day 5-7: Core Functionality
- [ ] Create repair (full flow)
- [ ] View repair details
- [ ] Update repair status
- [ ] Basic price calculation

#### Day 8-10: Customer & Pricing
- [ ] Customer search/create
- [ ] Price matrix CRUD
- [ ] Link customers to repairs

#### Day 11-14: Status Board
- [ ] Kanban board view
- [ ] Drag & drop status updates
- [ ] Filters and search

### Step 5: Deploy MVP (Day 15)
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial MVP"
git push origin main

# Deploy frontend (Vercel)
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables
# 3. Deploy

# Deploy database
# Already done if using Supabase/Railway

# Test production build
```

---

## 📋 Development Checklist

### Week 1: Foundation
- [ ] Project setup complete
- [ ] Database schema implemented
- [ ] Basic UI components created
- [ ] API routes/endpoints set up
- [ ] Authentication (optional for MVP)

### Week 2: Core Features
- [ ] Repair CRUD operations
- [ ] Customer management
- [ ] Price database
- [ ] Status tracking
- [ ] Basic search functionality

### Week 3: Smart Pricing
- [ ] Price calculation logic
- [ ] Smart estimation algorithm
- [ ] Confidence scoring
- [ ] Price matrix interface

### Week 4: Notifications
- [ ] SMS integration (Twilio)
- [ ] Email integration (SendGrid)
- [ ] Notification triggers
- [ ] Template system

### Week 5-6: Lightspeed Integration
- [ ] API authentication
- [ ] Customer sync
- [ ] Sales sync
- [ ] Webhook handlers

### Week 7-8: Polish & Testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] User testing
- [ ] Documentation

---

## 🎯 Essential Features Breakdown

### 1. New Repair Flow (Most Critical)
```
User Journey:
1. Click "New Repair" button
2. Search/Create customer
3. Select device (Brand → Model → Variant)
4. Check repair types needed
5. Select parts quality (Original/Aftermarket)
6. See auto-calculated price
7. Add notes
8. Submit
9. Auto-generate repair number
10. Send customer notification
```

**Required Components:**
- CustomerSearchDialog
- DeviceSelector (cascading dropdowns)
- RepairTypeCheckboxGroup
- PriceCalculator
- NotesTextarea
- SubmitButton

### 2. Status Board (Second Priority)
```
Columns:
[New] [Diagnosed] [Awaiting Parts] [In Progress] [Testing] [Ready] [Completed]

Features:
- Drag card to new column → updates status
- Color coding by priority
- Click card → view details
- Badge shows time in current status
```

**Required Components:**
- KanbanBoard
- RepairCard
- DragAndDrop (react-beautiful-dnd)
- StatusColumn

### 3. Price Matrix (Third Priority)
```
Table Layout:
          | Screen | Battery | Charging Port | Camera |
----------|--------|---------|---------------|--------|
iPhone 15 | $329 ✓ | $99 ✓   | $89 ✓         | $159 ✓ |
iPhone 14 | $279 ✓ | $89 ✓   | $79 ✓         | $139 ✓ |
iPhone 13 | $239 ✓ | $79 ✓   | $69 ✓         | $119 ~ |

✓ = Set Price
~ = Estimated
- = Missing
```

**Required Components:**
- PriceMatrix (data grid)
- EditablePriceCell
- PriceStatusBadge
- BulkImportButton

---

## 🔧 Code Snippets to Get Started

### 1. Database Schema (Prisma)
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Brand {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  isPrimary Boolean  @default(false) @map("is_primary")
  createdAt DateTime @default(now()) @map("created_at")
  devices   DeviceModel[]
  
  @@map("brands")
}

model DeviceModel {
  id          Int      @id @default(autoincrement())
  brandId     Int      @map("brand_id")
  name        String   @db.VarChar(100)
  variant     String?  @db.VarChar(100)
  releaseYear Int      @map("release_year")
  releaseMonth Int?    @map("release_month")
  tierLevel   Int      @map("tier_level")
  isPhone     Boolean  @default(true) @map("is_phone")
  isTablet    Boolean  @default(false) @map("is_tablet")
  createdAt   DateTime @default(now()) @map("created_at")
  
  brand       Brand    @relation(fields: [brandId], references: [id])
  repairs     Repair[]
  prices      Price[]
  
  @@map("device_models")
}

model RepairType {
  id               Int      @id @default(autoincrement())
  name             String   @db.VarChar(100)
  category         String   @db.VarChar(50)
  complexityLevel  Int      @map("complexity_level")
  avgTimeMinutes   Int      @map("avg_time_minutes")
  createdAt        DateTime @default(now()) @map("created_at")
  
  prices           Price[]
  repairItems      RepairItem[]
  
  @@map("repair_types")
}

enum PartsQuality {
  original
  aftermarket_premium
  aftermarket_standard
  aftermarket_economy
}

model Price {
  id             Int           @id @default(autoincrement())
  deviceModelId  Int           @map("device_model_id")
  repairTypeId   Int           @map("repair_type_id")
  partsQuality   PartsQuality  @map("parts_quality")
  partsCost      Decimal       @db.Decimal(10, 2) @map("parts_cost")
  laborCost      Decimal       @db.Decimal(10, 2) @map("labor_cost")
  totalPrice     Decimal       @db.Decimal(10, 2) @map("total_price")
  isEstimated    Boolean       @default(false) @map("is_estimated")
  confidenceScore Decimal?     @db.Decimal(3, 2) @map("confidence_score")
  lastUpdated    DateTime      @default(now()) @updatedAt @map("last_updated")
  
  deviceModel    DeviceModel   @relation(fields: [deviceModelId], references: [id])
  repairType     RepairType    @relation(fields: [repairTypeId], references: [id])
  repairItems    RepairItem[]
  
  @@unique([deviceModelId, repairTypeId, partsQuality])
  @@map("prices")
}

model Customer {
  id                     Int      @id @default(autoincrement())
  lightspeedCustomerId   String?  @unique @db.VarChar(100) @map("lightspeed_customer_id")
  firstName              String   @db.VarChar(100) @map("first_name")
  lastName               String   @db.VarChar(100) @map("last_name")
  phone                  String   @db.VarChar(20)
  email                  String?  @db.VarChar(100)
  notificationPreference String   @default("sms") @map("notification_preference")
  lastSynced             DateTime? @map("last_synced")
  createdAt              DateTime @default(now()) @map("created_at")
  
  repairs                Repair[]
  notifications          Notification[]
  
  @@map("customers")
}

enum RepairStatus {
  new
  diagnosed
  awaiting_approval
  approved
  awaiting_parts
  in_progress
  testing
  ready
  completed
  cancelled
}

enum Priority {
  standard
  urgent
  express
}

model Repair {
  id                  Int           @id @default(autoincrement())
  repairNumber        String        @unique @db.VarChar(50) @map("repair_number")
  customerId          Int           @map("customer_id")
  deviceModelId       Int           @map("device_model_id")
  deviceImei          String?       @db.VarChar(50) @map("device_imei")
  deviceCondition     String?       @db.Text @map("device_condition")
  status              RepairStatus  @default(new)
  priority            Priority      @default(standard)
  technicianId        Int?          @map("technician_id")
  estimatedCompletion DateTime?     @map("estimated_completion")
  actualCompletion    DateTime?     @map("actual_completion")
  totalCost           Decimal       @db.Decimal(10, 2) @map("total_cost")
  depositPaid         Decimal       @default(0) @db.Decimal(10, 2) @map("deposit_paid")
  notes               String?       @db.Text
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")
  
  customer            Customer      @relation(fields: [customerId], references: [id])
  deviceModel         DeviceModel   @relation(fields: [deviceModelId], references: [id])
  repairItems         RepairItem[]
  notifications       Notification[]
  
  @@map("repairs")
}

model RepairItem {
  id              Int           @id @default(autoincrement())
  repairId        Int           @map("repair_id")
  repairTypeId    Int           @map("repair_type_id")
  partsQuality    PartsQuality  @map("parts_quality")
  priceId         Int?          @map("price_id")
  finalPrice      Decimal       @db.Decimal(10, 2) @map("final_price")
  priceOverridden Boolean       @default(false) @map("price_overridden")
  status          String        @default("pending")
  notes           String?       @db.Text
  
  repair          Repair        @relation(fields: [repairId], references: [id])
  repairType      RepairType    @relation(fields: [repairTypeId], references: [id])
  price           Price?        @relation(fields: [priceId], references: [id])
  
  @@map("repair_items")
}

model Notification {
  id              Int      @id @default(autoincrement())
  repairId        Int      @map("repair_id")
  customerId      Int      @map("customer_id")
  type            String   @db.VarChar(50)
  channel         String   @db.VarChar(20)
  message         String   @db.Text
  sentAt          DateTime @default(now()) @map("sent_at")
  deliveredStatus String   @default("pending") @map("delivered_status")
  readAt          DateTime? @map("read_at")
  
  repair          Repair   @relation(fields: [repairId], references: [id])
  customer        Customer @relation(fields: [customerId], references: [id])
  
  @@map("notifications")
}
```

### 2. Smart Pricing Function (TypeScript)
```typescript
// lib/pricing/estimator.ts
import { prisma } from '@/lib/db'

interface PriceEstimate {
  price: number
  confidence: number
  references: number[]
  isEstimated: boolean
}

export async function estimatePrice(
  deviceModelId: number,
  repairTypeId: number,
  partsQuality: string
): Promise<PriceEstimate> {
  // 1. Check if exact price exists
  const exactPrice = await prisma.price.findFirst({
    where: {
      deviceModelId,
      repairTypeId,
      partsQuality: partsQuality as any
    }
  })
  
  if (exactPrice && !exactPrice.isEstimated) {
    return {
      price: Number(exactPrice.totalPrice),
      confidence: 1.0,
      references: [deviceModelId],
      isEstimated: false
    }
  }
  
  // 2. Get target device info
  const targetDevice = await prisma.deviceModel.findUnique({
    where: { id: deviceModelId },
    include: { brand: true }
  })
  
  if (!targetDevice) {
    throw new Error('Device not found')
  }
  
  // 3. Find reference prices from same brand
  const referencePrices = await prisma.price.findMany({
    where: {
      repairTypeId,
      partsQuality: partsQuality as any,
      deviceModel: {
        brandId: targetDevice.brandId,
        releaseYear: {
          gte: targetDevice.releaseYear - 2,
          lte: targetDevice.releaseYear + 2
        }
      }
    },
    include: {
      deviceModel: true
    },
    orderBy: {
      deviceModel: {
        releaseYear: 'asc'
      }
    }
  })
  
  if (referencePrices.length === 0) {
    // Fallback to category average
    return estimateFromCategoryAverage(repairTypeId, partsQuality)
  }
  
  // 4. Find bracketing models (older and newer)
  const older = referencePrices.filter(
    p => p.deviceModel.releaseYear < targetDevice.releaseYear
  )
  const newer = referencePrices.filter(
    p => p.deviceModel.releaseYear > targetDevice.releaseYear
  )
  
  let estimatedPrice: number
  let confidence: number
  
  if (older.length > 0 && newer.length > 0) {
    // Interpolation (best case)
    const closestOlder = older[older.length - 1]
    const closestNewer = newer[0]
    
    const olderPrice = Number(closestOlder.totalPrice)
    const newerPrice = Number(closestNewer.totalPrice)
    const olderYear = closestOlder.deviceModel.releaseYear
    const newerYear = closestNewer.deviceModel.releaseYear
    
    // Linear interpolation
    const yearDiff = newerYear - olderYear
    const targetYearDiff = targetDevice.releaseYear - olderYear
    const priceDiff = newerPrice - olderPrice
    
    estimatedPrice = olderPrice + (priceDiff * (targetYearDiff / yearDiff))
    confidence = 0.85
  } else if (referencePrices.length > 0) {
    // Extrapolation (less confident)
    const nearest = referencePrices[0]
    estimatedPrice = Number(nearest.totalPrice)
    confidence = 0.60
  } else {
    // Fallback
    return estimateFromCategoryAverage(repairTypeId, partsQuality)
  }
  
  // 5. Adjust for tier level
  const tierAdjustment = getTierAdjustment(targetDevice.tierLevel)
  estimatedPrice *= tierAdjustment
  
  // 6. Round to nearest $5 or $9 ending
  estimatedPrice = roundToNiceNumber(estimatedPrice)
  
  return {
    price: estimatedPrice,
    confidence,
    references: referencePrices.map(p => p.deviceModelId),
    isEstimated: true
  }
}

function getTierAdjustment(tierLevel: number): number {
  const adjustments: Record<number, number> = {
    1: 1.15,  // Flagship (Pro, Pro Max)
    2: 1.0,   // Standard
    3: 0.85   // Budget (SE, Mini)
  }
  return adjustments[tierLevel] || 1.0
}

function roundToNiceNumber(price: number): number {
  // Round to nearest $5 or make it end in 9
  const rounded = Math.round(price / 10) * 10
  return rounded - 1  // $149, $199, $249, etc.
}

async function estimateFromCategoryAverage(
  repairTypeId: number,
  partsQuality: string
): Promise<PriceEstimate> {
  const avgResult = await prisma.price.aggregate({
    where: {
      repairTypeId,
      partsQuality: partsQuality as any
    },
    _avg: {
      totalPrice: true
    }
  })
  
  return {
    price: Number(avgResult._avg.totalPrice) || 0,
    confidence: 0.40,
    references: [],
    isEstimated: true
  }
}
```

### 3. Repair Status Board Component (React)
```tsx
// components/StatusBoard.tsx
'use client'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useState } from 'react'
import { RepairCard } from './RepairCard'

const STATUS_COLUMNS = [
  { id: 'new', title: 'New', color: 'bg-gray-100' },
  { id: 'diagnosed', title: 'Diagnosed', color: 'bg-blue-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100' },
  { id: 'testing', title: 'Testing', color: 'bg-purple-100' },
  { id: 'ready', title: 'Ready', color: 'bg-green-100' },
  { id: 'completed', title: 'Completed', color: 'bg-gray-50' }
]

export function StatusBoard({ repairs, onStatusChange }) {
  const [columns, setColumns] = useState(
    STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.id] = repairs.filter(r => r.status === col.id)
      return acc
    }, {})
  )

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    
    const { source, destination, draggableId } = result
    
    if (source.droppableId === destination.droppableId) return
    
    // Update locally
    const sourceColumn = [...columns[source.droppableId]]
    const destColumn = [...columns[destination.droppableId]]
    const [movedRepair] = sourceColumn.splice(source.index, 1)
    destColumn.splice(destination.index, 0, movedRepair)
    
    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    })
    
    // Update on server
    await onStatusChange(draggableId, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map(column => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className={`${column.color} rounded-t-lg px-4 py-2`}>
              <h3 className="font-semibold">
                {column.title} ({columns[column.id]?.length || 0})
              </h3>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[500px] p-2 rounded-b-lg border-2 ${
                    snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {columns[column.id]?.map((repair, index) => (
                    <Draggable
                      key={repair.id}
                      draggableId={repair.id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? 'opacity-50' : ''}
                        >
                          <RepairCard repair={repair} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
```

---

## 💡 Pro Tips

### Development
1. **Start with fake data**: Use mock data before connecting real APIs
2. **Build mobile-first**: Design for tablets/phones from day 1
3. **Use TypeScript**: Catch errors early, better autocomplete
4. **Component library**: Use shadcn/ui or MUI for faster development
5. **Database migrations**: Always use migrations, never manual SQL changes

### Smart Pricing
1. **Require at least 2 prices per brand**: For interpolation to work
2. **Manual override**: Always allow staff to override estimates
3. **Show confidence**: Display confidence score so staff knows to review
4. **Review estimated prices monthly**: Update with actual market prices

### Notifications
1. **Start with manual**: Test SMS templates manually before automating
2. **Opt-out required**: Include unsubscribe option (legal requirement)
3. **Rate limiting**: Don't spam customers with updates
4. **Test numbers**: Use test phone numbers in development

### Lightspeed
1. **Test account first**: Get Lightspeed test account for development
2. **Webhook reliability**: Lightspeed webhooks can be flaky, use polling as backup
3. **Sync conflicts**: Always treat Lightspeed as source of truth for customer data
4. **Error handling**: Lightspeed API can go down, gracefully handle failures

---

## 🚧 Common Pitfalls to Avoid

1. **Over-engineering**: Start simple, add features later
2. **Skipping authentication**: Add basic auth even in MVP
3. **No error handling**: Always handle API failures gracefully
4. **Ignoring mobile**: 50% of staff might use tablets
5. **No backups**: Set up automated backups from day 1
6. **Hard-coded prices**: Always use database, never hard-code
7. **No audit log**: Track who changed what (especially prices)
8. **Forgetting time zones**: Store all dates in UTC

---

## 📞 Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Lightspeed API: https://developers.lightspeedhq.com

### Community
- Next.js Discord
- r/webdev
- Stack Overflow

### Monitoring (Free Tiers)
- Vercel Analytics (built-in)
- Sentry (error tracking)
- UptimeRobot (uptime monitoring)

---

## ✅ MVP Success Criteria

Your MVP is ready to launch when:
- [ ] Staff can create a new repair in < 2 minutes
- [ ] Repairs can be tracked through all status changes
- [ ] Prices are calculated automatically (even if not perfect)
- [ ] Customers receive at least one notification (status update)
- [ ] Reports show daily/weekly repair summary
- [ ] System is deployed and accessible online
- [ ] At least 2 staff members trained and comfortable using it

**Don't wait for perfection!** Launch with MVP and iterate based on real usage.

---

Good luck building your repair shop dashboard! 🔧📱✨
