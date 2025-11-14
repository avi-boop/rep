# 🎨 Component Documentation

**Version:** 1.0.0  
**Framework:** Next.js 15 + React 19

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Layout Components](#layout-components)
3. [Page Components](#page-components)
4. [Feature Components](#feature-components)
5. [UI Components](#ui-components)
6. [Component Guidelines](#component-guidelines)

---

## 🎯 Overview

The dashboard uses a component-based architecture with:
- **Server Components** (default) - For data fetching
- **Client Components** (`'use client'`) - For interactivity
- **Shared Components** - Reusable across pages

### File Structure

```
components/
├── layout/
│   ├── Sidebar.tsx       # Main navigation sidebar
│   └── Header.tsx        # Page header (currently unused)
├── customers/
│   └── CustomerList.tsx  # Customer listing table
├── pricing/
│   └── PricingMatrix.tsx # Pricing management grid
└── repairs/
    ├── NewRepairForm.tsx      # Create repair form
    └── RepairStatusBoard.tsx  # Kanban board
```

---

## 🏗️ Layout Components

### Sidebar Component

**Location:** `components/layout/Sidebar.tsx`  
**Type:** Client Component (`'use client'`)

**Purpose:** Main navigation sidebar with active route highlighting

**Props:** None

**Features:**
- Active route detection
- Hover states
- Icon support (Lucide React)
- Responsive design

**Usage:**
```tsx
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

**Navigation Items:**
```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Repairs', href: '/dashboard/repairs', icon: Wrench },
  { name: 'Pricing', href: '/dashboard/pricing', icon: DollarSign },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]
```

**Styling:**
- Dark theme (gray-900 background)
- Active: gray-800 background, white text
- Hover: gray-700 background
- Icon size: 24px (w-6 h-6)

---

### Header Component

**Location:** `components/layout/Header.tsx`  
**Type:** Client Component  
**Status:** Currently unused (can be integrated)

**Purpose:** Page header with title and actions

**Props:**
```typescript
interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}
```

**Usage:**
```tsx
<Header 
  title="Repair Orders" 
  subtitle="Manage all repairs"
  actions={
    <button>New Repair</button>
  }
/>
```

---

## 📄 Page Components

### Dashboard Page

**Location:** `app/dashboard/page.tsx`  
**Type:** Server Component

**Features:**
- Stats cards (4 metrics)
- Recent repairs list
- Quick action cards

**Data Fetching:**
```typescript
async function getDashboardStats() {
  const [totalRepairs, pendingRepairs, completedToday, totalRevenue] = 
    await Promise.all([...])
  return { ... }
}
```

**Components:**
- `StatCard` - Metric display card
- `QuickActionCard` - Navigation card
- Repair list with customer/device info

---

### Repairs Page

**Location:** `app/dashboard/repairs/page.tsx`  
**Type:** Server Component

**Features:**
- Kanban status board
- Filter by status
- New repair button

**Data Fetching:**
```typescript
async function getRepairs() {
  return prisma.repairOrder.findMany({
    where: { status: { notIn: ['completed', 'cancelled'] } },
    include: { customer, deviceModel, repairOrderItems }
  })
}
```

---

### New Repair Page

**Location:** `app/dashboard/repairs/new/page.tsx`  
**Type:** Uses Client Component (NewRepairForm)

**Features:**
- Multi-step form
- Customer selection
- Device selection
- Repair items
- Price calculation

---

### Pricing Page

**Location:** `app/dashboard/pricing/page.tsx`  
**Type:** Uses Client Component (PricingMatrix)

**Features:**
- Grid view of all pricing
- Filter by brand/device
- Quick edit inline
- Add new prices

---

### Customers Page

**Location:** `app/dashboard/customers/page.tsx`  
**Type:** Uses Client Component (CustomerList)

**Features:**
- Customer table
- Search functionality
- View repair history
- Edit customer info

---

### Analytics Page

**Location:** `app/dashboard/analytics/page.tsx`  
**Type:** Server Component  
**Status:** Basic implementation

**Planned Features:**
- Revenue charts
- Popular repairs
- Technician performance
- Time-based analytics

---

## 🔧 Feature Components

### RepairStatusBoard

**Location:** `components/repairs/RepairStatusBoard.tsx`  
**Type:** Client Component

**Purpose:** Kanban-style drag-and-drop repair status board

**Props:**
```typescript
interface Props {
  repairs: Repair[]
}

interface Repair {
  id: number
  orderNumber: string
  status: string
  priority: string
  totalPrice: number
  customer: { firstName: string, lastName: string }
  deviceModel: { name: string, brand: { name: string } }
  repairOrderItems: Array<{ repairType: { name: string } }>
}
```

**Features:**
- Drag and drop between columns
- Status: pending → in_progress → waiting_parts → ready_pickup
- Priority badges (normal, urgent, express)
- Real-time updates via API

**Usage:**
```tsx
<RepairStatusBoard repairs={repairs} />
```

**Status Columns:**
```typescript
const STATUS_COLUMNS = [
  { id: 'pending', title: 'New', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'waiting_parts', title: 'Waiting Parts', color: 'bg-yellow-100' },
  { id: 'ready_pickup', title: 'Ready', color: 'bg-green-100' },
]
```

**Event Handlers:**
```typescript
handleDragStart(repairId: number)
handleDragOver(e: React.DragEvent)
handleDrop(newStatus: string)
```

**API Integration:**
```typescript
await fetch(`/api/repairs/${repairId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status: newStatus })
})
```

---

### NewRepairForm

**Location:** `components/repairs/NewRepairForm.tsx`  
**Type:** Client Component

**Purpose:** Multi-step form for creating new repairs

**Props:**
```typescript
interface Props {
  brands: Brand[]
  repairTypes: RepairType[]
  partTypes: PartType[]
  customers: Customer[]
}
```

**Form Steps:**
1. Customer selection/creation
2. Device selection
3. Repair type and parts
4. Price and deposit
5. Review and submit

**Features:**
- Form validation (React Hook Form + Zod)
- Dynamic price calculation
- Customer autocomplete
- Device filtering by brand
- Multiple repair items

**State Management:**
```typescript
const [step, setStep] = useState(1)
const [formData, setFormData] = useState({})
const [totalPrice, setTotalPrice] = useState(0)
```

**Validation Schema:**
```typescript
const schema = z.object({
  customerId: z.number(),
  deviceModelId: z.number(),
  items: z.array(z.object({
    repairTypeId: z.number(),
    partTypeId: z.number(),
    unitPrice: z.number().positive()
  }))
})
```

---

### PricingMatrix

**Location:** `components/pricing/PricingMatrix.tsx`  
**Type:** Client Component

**Purpose:** Grid view for managing repair pricing

**Props:**
```typescript
interface Props {
  pricing: Pricing[]
  brands: Brand[]
  devices: DeviceModel[]
  repairTypes: RepairType[]
  partTypes: PartType[]
}
```

**Features:**
- Filterable grid (by brand, device, repair type)
- Inline editing
- Bulk price updates
- Add new pricing entries
- Export to CSV
- Import from CSV

**Grid Columns:**
- Device Model
- Repair Type
- Part Type
- Cost
- Price
- Margin %
- Active Status
- Actions (Edit, Delete)

**State:**
```typescript
const [filters, setFilters] = useState({
  brandId: null,
  deviceModelId: null,
  repairTypeId: null
})
const [editingId, setEditingId] = useState<number | null>(null)
```

---

### CustomerList

**Location:** `components/customers/CustomerList.tsx`  
**Type:** Client Component

**Purpose:** Searchable customer list with actions

**Props:**
```typescript
interface Props {
  customers: Customer[]
}
```

**Features:**
- Search by name, email, phone
- Sort by columns
- Pagination
- View repair history
- Edit customer
- Quick contact actions

**Table Columns:**
- Name
- Email
- Phone
- Total Repairs
- Last Repair Date
- Actions

**Search Implementation:**
```typescript
const [searchTerm, setSearchTerm] = useState('')
const filtered = customers.filter(c => 
  c.firstName.toLowerCase().includes(searchTerm) ||
  c.lastName.toLowerCase().includes(searchTerm) ||
  c.email?.includes(searchTerm) ||
  c.phone.includes(searchTerm)
)
```

---

## 🎨 UI Components

### Recommended Component Library

**Install shadcn/ui for production:**

```bash
npx shadcn-ui@latest init
```

**Then add components:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
```

### Custom UI Components

#### StatCard

**Usage:**
```tsx
<StatCard
  title="Total Repairs"
  value="125"
  icon={<Wrench />}
  color="blue"
/>
```

#### StatusBadge

**Usage:**
```tsx
<StatusBadge status="in_progress" />
// Renders: <span className="bg-blue-100 text-blue-800">IN PROGRESS</span>
```

#### PriorityBadge

**Usage:**
```tsx
<PriorityBadge priority="urgent" />
// Renders: <span className="bg-orange-100 text-orange-800">URGENT</span>
```

---

## 📐 Component Guidelines

### Server vs Client Components

**Use Server Components when:**
- Fetching data from database
- Accessing backend resources
- No user interaction needed
- SEO is important

**Use Client Components when:**
- Using React hooks (useState, useEffect)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Real-time updates

### Component Best Practices

#### 1. Props Interface
```typescript
// Always define prop types
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  // Component code
}
```

#### 2. Component Organization
```typescript
// Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Types/Interfaces
interface MyComponentProps {
  // ...
}

// Main Component
export function MyComponent({ }: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState()
  
  // 2. Event handlers
  const handleClick = () => {}
  
  // 3. Render functions
  const renderHeader = () => {}
  
  // 4. Return JSX
  return <div>...</div>
}

// Helper components (if needed)
function HelperComponent() {}
```

#### 3. File Naming
```
PascalCase for components: UserProfile.tsx
camelCase for utilities: formatDate.ts
kebab-case for pages: user-profile.tsx (Next.js convention)
```

#### 4. Import Aliases
```typescript
// Use @ alias
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

// Not relative paths
import { prisma } from '../../../lib/prisma'
```

#### 5. Error Boundaries
```typescript
// Wrap client components
<ErrorBoundary fallback={<ErrorPage />}>
  <MyComponent />
</ErrorBoundary>
```

---

## 🎯 Component Checklist

When creating new components:

- [ ] Define TypeScript interface for props
- [ ] Add JSDoc comments for documentation
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Handle empty states
- [ ] Add accessibility attributes (ARIA)
- [ ] Make responsive (mobile-first)
- [ ] Add hover/focus states
- [ ] Optimize re-renders (React.memo if needed)
- [ ] Add prop validation
- [ ] Test with various data

---

## 🔄 Component Lifecycle

### Server Component Lifecycle
```
1. Request received
2. Component renders on server
3. Data fetched (async/await)
4. HTML sent to client
5. Hydration (if needed)
```

### Client Component Lifecycle
```
1. Mount (useEffect with [])
2. Updates (useEffect with dependencies)
3. Re-renders (state/prop changes)
4. Cleanup (useEffect return function)
5. Unmount
```

---

## 📚 Additional Resources

- [React 19 Docs](https://react.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript React](https://react-typescript-cheatsheet.netlify.app/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

*Last Updated: November 10, 2025*  
*Component Library Version: 1.0.0*
