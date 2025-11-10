# 🔧 Backend-Focused Upgrade Plan - Repair Dashboard

**Version:** 1.0  
**Date:** 2025-11-10  
**Focus:** Backend Architecture, APIs, Database, Services & Infrastructure

---

## 📋 Executive Summary

This document provides a comprehensive backend upgrade plan for the repair-dashboard system, focusing exclusively on server-side improvements, API architecture, database optimization, and service integrations.

### Current Backend State
- ✅ Next.js 15 API Routes (16 endpoints)
- ✅ Prisma ORM with SQLite
- ✅ Basic CRUD operations
- ✅ Smart pricing algorithm
- 🟡 No authentication/authorization
- 🟡 No caching layer
- 🟡 No background job processing
- 🟡 Limited error handling
- ❌ No API versioning
- ❌ No rate limiting
- ❌ No WebSocket support

### Backend Upgrade Goals
1. **Scalable API Architecture** - RESTful best practices, versioning, validation
2. **Robust Database Layer** - Migration to PostgreSQL, optimization, backup
3. **Service Integration** - Complete Twilio, SendGrid, Lightspeed, Gemini AI
4. **Security Hardening** - Auth, rate limiting, input validation, encryption
5. **Background Processing** - Queue system for notifications, reports, sync
6. **Monitoring & Logging** - Structured logging, error tracking, metrics
7. **Performance** - Caching, connection pooling, query optimization
8. **Testing** - Comprehensive API testing, integration tests, load tests

---

## 🏗️ Phase 1: Backend Infrastructure Setup (Days 1-3)

### Task 1.1: Fix Database Schema Issues ⚠️ CRITICAL

**Priority:** 🔴 BLOCKING - Current code won't work

#### Issue Analysis
```typescript
// lib/pricing/estimator.ts references fields that don't exist:
const tierAdjustment = getTierAdjustment(targetDevice.tierLevel) // ❌ tierLevel missing
partsQuality: PartsQuality // ❌ PartsQuality enum missing
```

#### Solution: Update Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
// Add missing enum
enum PartsQuality {
  original
  aftermarket_premium
  aftermarket_standard
  aftermarket_economy
}

// Update DeviceModel
model DeviceModel {
  id           Int        @id @default(autoincrement())
  brandId      Int
  name         String
  modelNumber  String?
  releaseYear  Int?
  deviceType   String
  screenSize   Float?
  tierLevel    Int        @default(2)  // ← ADD: 1=Flagship, 2=Standard, 3=Budget
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  brand        Brand      @relation(fields: [brandId], references: [id], onDelete: Cascade)
  pricings     Pricing[]
  repairOrders RepairOrder[]
  
  @@unique([brandId, name])
  @@index([brandId])
  @@index([isActive])
  @@map("device_models")
}

// Update PartType
model PartType {
  id              Int                 @id @default(autoincrement())
  name            String              @unique
  quality         PartsQuality        @default(aftermarket_standard)  // ← ADD
  qualityLevel    Int                 // Keep for backward compatibility
  warrantyMonths  Int                 @default(3)
  description     String?
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  pricings        Pricing[]
  repairOrderItems RepairOrderItem[]
  
  @@index([isActive])
  @@map("part_types")
}

// Update Pricing with proper unique constraint
model Pricing {
  id              Int          @id @default(autoincrement())
  deviceModelId   Int
  repairTypeId    Int
  partTypeId      Int
  partQuality     PartsQuality @default(aftermarket_standard)  // ← ADD
  price           Float
  cost            Float?
  isActive        Boolean      @default(true)
  isEstimated     Boolean      @default(false)
  confidenceScore Float?
  validFrom       DateTime     @default(now())
  validUntil      DateTime?
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  deviceModel     DeviceModel  @relation(fields: [deviceModelId], references: [id], onDelete: Cascade)
  repairType      RepairType   @relation(fields: [repairTypeId], references: [id], onDelete: Cascade)
  partType        PartType     @relation(fields: [partTypeId], references: [id], onDelete: Cascade)
  priceHistory    PriceHistory[]
  repairOrderItems RepairOrderItem[]
  
  @@unique([deviceModelId, repairTypeId, partTypeId, partQuality])  // ← UPDATE
  @@index([deviceModelId])
  @@index([repairTypeId])
  @@index([isActive])
  @@map("pricing")
}
```

#### Migration Commands

```bash
cd /workspace/repair-dashboard

# Generate migration
npx prisma migrate dev --name add_missing_fields

# Regenerate Prisma client
npm run db:generate

# Verify schema
npx prisma validate
```

**Expected Outcome:**
- ✅ Schema matches code expectations
- ✅ No TypeScript errors
- ✅ Pricing estimator works correctly

---

### Task 1.2: Database Migration to PostgreSQL

**Why PostgreSQL?**
- Production-ready (SQLite is dev-only)
- Better performance for concurrent writes
- Advanced features (JSON, full-text search)
- Better backup/restore options
- Required for most hosting platforms

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql
brew services start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE repair_shop_db;
CREATE USER repair_admin WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE repair_shop_db TO repair_admin;
ALTER DATABASE repair_shop_db OWNER TO repair_admin;
\q
```

#### Option B: Cloud PostgreSQL (Recommended)

**Neon (Serverless PostgreSQL):**
```bash
# 1. Sign up at https://neon.tech
# 2. Create new project
# 3. Copy connection string
# Format: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb

# Update .env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Supabase:**
```bash
# 1. Sign up at https://supabase.com
# 2. Create new project
# 3. Go to Settings > Database
# 4. Copy connection string (URI format)

DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
```

#### Update Schema for PostgreSQL

```prisma
datasource db {
  provider = "postgresql"  // ← Change from sqlite
  url      = env("DATABASE_URL")
}
```

#### Migration Process

```bash
# 1. Backup SQLite data (if exists)
npx prisma db pull  # Create schema from existing DB
npx prisma db seed  # Ensure seed script is ready

# 2. Update to PostgreSQL
# Edit prisma/schema.prisma (change provider)

# 3. Create new migrations
npx prisma migrate dev --name init_postgresql

# 4. Seed new database
npm run db:seed

# 5. Verify data
npx prisma studio
```

**Expected Outcome:**
- ✅ PostgreSQL database running
- ✅ All migrations applied
- ✅ Data seeded correctly
- ✅ Application connects successfully

---

### Task 1.3: Standardize Prisma Client

**Issue:** Two files export Prisma client:
- `lib/db.ts` (with logging)
- `lib/prisma.ts` (without logging)

**Solution:** Keep one, update all imports

**File:** `lib/prisma.ts` (standardized version)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
```

**Update all imports:**

```bash
# Find all files importing from lib/db.ts
grep -r "from '@/lib/db'" .

# Update lib/pricing/estimator.ts
# Change: import { prisma } from '@/lib/db'
# To: import { prisma } from '@/lib/prisma'

# Delete lib/db.ts
rm lib/db.ts
```

**Expected Outcome:**
- ✅ Single Prisma client instance
- ✅ Proper logging configuration
- ✅ Graceful shutdown handling

---

### Task 1.4: Add Database Indexes for Performance

```prisma
model RepairOrder {
  // ... existing fields
  
  @@index([customerId])
  @@index([deviceModelId])
  @@index([status])
  @@index([priority])
  @@index([createdAt])
  @@index([status, createdAt])  // Compound index
}

model Customer {
  // ... existing fields
  
  @@index([phone])
  @@index([email])
  @@index([lightspeedId])
  @@index([isActive])
}

model Notification {
  // ... existing fields
  
  @@index([customerId])
  @@index([repairOrderId])
  @@index([status])
  @@index([sentAt])
}
```

```bash
# Generate migration for indexes
npx prisma migrate dev --name add_performance_indexes
```

**Expected Outcome:**
- ✅ Faster query performance
- ✅ Optimized lookups
- ✅ Better database performance

---

## 🔐 Phase 2: Authentication & Authorization (Days 4-6)

### Task 2.1: Implement JWT-based Authentication

**Install Dependencies:**

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

**Create Auth Service:**

**File:** `lib/auth/auth-service.ts`

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface TokenPayload {
  userId: number
  email: string
  role: string
}

export class AuthService {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
      return null
    }
  }

  /**
   * Authenticate user
   */
  static async authenticate(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await this.verifyPassword(password, user.password)

    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(oldToken: string) {
    const payload = this.verifyToken(oldToken)
    
    if (!payload) {
      throw new Error('Invalid token')
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    return this.generateToken(payload)
  }

  /**
   * Get user from token
   */
  static async getUserFromToken(token: string) {
    const payload = this.verifyToken(token)
    
    if (!payload) {
      return null
    }

    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })
  }
}
```

**Create Auth Middleware:**

**File:** `lib/auth/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from './auth-service'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number
    email: string
    role: string
  }
}

/**
 * Middleware to verify JWT token
 */
export async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const payload = AuthService.verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    )
  }

  // Attach user to request
  ;(request as any).user = payload

  return null // Continue to route handler
}

/**
 * Role-based authorization
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: AuthenticatedRequest) => {
    const authResult = await authMiddleware(request)
    if (authResult) return authResult

    const user = (request as any).user

    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Extract user from request
 */
export function getAuthUser(request: NextRequest) {
  return (request as any).user
}
```

**Create Auth Endpoints:**

**File:** `app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const result = await AuthService.authenticate(email, password)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.message === 'Invalid credentials') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
```

**File:** `app/api/auth/refresh/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    const newToken = await AuthService.refreshToken(token)

    return NextResponse.json({ token: newToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 401 }
    )
  }
}
```

**File:** `app/api/auth/me/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, getAuthUser } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  const user = getAuthUser(request)

  return NextResponse.json({ user })
}
```

**Update User Schema:**

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  name          String?
  password      String    // Hashed
  role          String    @default("technician") // admin, manager, technician
  isActive      Boolean   @default(true)
  lastLogin     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
  @@index([role])
  @@index([isActive])
  @@map("users")
}
```

**Protect API Routes:**

**Example:** `app/api/repairs/route.ts`

```typescript
import { authMiddleware, getAuthUser } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  const user = getAuthUser(request)

  // User is authenticated, proceed with logic
  const repairs = await prisma.repairOrder.findMany({
    where: user.role === 'technician' 
      ? { assignedTechnicianId: user.userId }  // Technicians see only their repairs
      : undefined,  // Admins/managers see all
    // ... rest of query
  })

  return NextResponse.json(repairs)
}
```

**Expected Outcome:**
- ✅ JWT-based authentication
- ✅ Secure password hashing
- ✅ Login/logout/refresh endpoints
- ✅ Protected API routes
- ✅ Role-based access control

---

### Task 2.2: Add Rate Limiting

**Install Dependencies:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Setup Redis (Upstash - Serverless):**

```bash
# 1. Sign up at https://upstash.com
# 2. Create Redis database
# 3. Copy REST URL and token

# Add to .env
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="Axxx"
```

**Create Rate Limiter:**

**File:** `lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiters for different use cases
export const rateLimiters = {
  // General API calls: 100 requests per 15 minutes per IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '15 m'),
    prefix: 'ratelimit:api',
  }),

  // Authentication: 5 login attempts per 15 minutes per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:auth',
  }),

  // SMS notifications: 10 per hour per user
  sms: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'ratelimit:sms',
  }),

  // Email notifications: 50 per hour per user
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    prefix: 'ratelimit:email',
  }),
}

/**
 * Apply rate limit to a request
 */
export async function rateLimit(
  identifier: string,
  limiter: keyof typeof rateLimiters = 'api'
) {
  const { success, limit, reset, remaining } = await rateLimiters[limiter].limit(
    identifier
  )

  return {
    success,
    limit,
    reset,
    remaining,
  }
}
```

**Apply to Auth Endpoint:**

```typescript
// app/api/auth/login/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitResult = await rateLimit(ip, 'auth')

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: new Date(rateLimitResult.reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        },
      }
    )
  }

  // Continue with authentication...
}
```

**Expected Outcome:**
- ✅ Rate limiting on all endpoints
- ✅ Protection against brute force
- ✅ Rate limit headers in responses
- ✅ Different limits for different operations

---

## 📡 Phase 3: API Architecture Improvements (Days 7-10)

### Task 3.1: Add Input Validation with Zod

**Already installed:** `zod` is in package.json

**Create Validation Schemas:**

**File:** `lib/validation/schemas.ts`

```typescript
import { z } from 'zod'

// Customer schemas
export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(100),
  lastName: z.string().min(1, 'Last name required').max(100),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  notificationPreferences: z.object({
    sms: z.boolean().default(true),
    email: z.boolean().default(true),
    push: z.boolean().default(false),
  }).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

// Repair order schemas
export const createRepairOrderSchema = z.object({
  customerId: z.number().int().positive(),
  deviceModelId: z.number().int().positive(),
  deviceImei: z.string().max(50).optional().nullable(),
  deviceSerial: z.string().max(50).optional().nullable(),
  devicePassword: z.string().max(100).optional().nullable(),
  priority: z.enum(['normal', 'urgent', 'express']).default('normal'),
  issueDescription: z.string().max(2000).optional().nullable(),
  cosmeticCondition: z.string().max(500).optional().nullable(),
  estimatedCompletion: z.string().datetime().optional().nullable(),
  depositPaid: z.number().min(0).default(0),
  items: z.array(z.object({
    repairTypeId: z.number().int().positive(),
    partTypeId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
    totalPrice: z.number().min(0),
  })).min(1, 'At least one repair item required'),
})

export const updateRepairStatusSchema = z.object({
  status: z.enum([
    'pending',
    'in_progress',
    'waiting_parts',
    'completed',
    'ready_pickup',
    'delivered',
    'cancelled',
  ]),
  notes: z.string().max(1000).optional(),
})

// Pricing schemas
export const createPricingSchema = z.object({
  deviceModelId: z.number().int().positive(),
  repairTypeId: z.number().int().positive(),
  partTypeId: z.number().int().positive(),
  partQuality: z.enum([
    'original',
    'aftermarket_premium',
    'aftermarket_standard',
    'aftermarket_economy',
  ]).default('aftermarket_standard'),
  price: z.number().positive(),
  cost: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const repairFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  assignedTechnicianId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})
```

**Use in API Routes:**

```typescript
// app/api/repairs/route.ts
import { createRepairOrderSchema, repairFilterSchema, paginationSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createRepairOrderSchema.parse(body)

    // Calculate total price from items
    const totalPrice = validatedData.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    )

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create repair order
    const repair = await prisma.repairOrder.create({
      data: {
        orderNumber,
        customerId: validatedData.customerId,
        deviceModelId: validatedData.deviceModelId,
        deviceImei: validatedData.deviceImei,
        deviceSerial: validatedData.deviceSerial,
        devicePassword: validatedData.devicePassword,
        priority: validatedData.priority,
        issueDescription: validatedData.issueDescription,
        cosmeticCondition: validatedData.cosmeticCondition,
        estimatedCompletion: validatedData.estimatedCompletion 
          ? new Date(validatedData.estimatedCompletion) 
          : null,
        totalPrice,
        depositPaid: validatedData.depositPaid,
        repairOrderItems: {
          create: validatedData.items,
        },
      },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true,
          },
        },
      },
    })

    return NextResponse.json(repair, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error creating repair:', error)
    return NextResponse.json(
      { error: 'Failed to create repair' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse and validate query parameters
    const pagination = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const filters = repairFilterSchema.parse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      customerId: searchParams.get('customerId'),
      assignedTechnicianId: searchParams.get('assignedTechnicianId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    })

    // Build where clause
    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.assignedTechnicianId) where.assignedTechnicianId = filters.assignedTechnicianId
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.limit

    // Fetch repairs with pagination
    const [repairs, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        skip,
        take: pagination.limit,
        include: {
          customer: true,
          deviceModel: {
            include: {
              brand: true,
            },
          },
          repairOrderItems: {
            include: {
              repairType: true,
              partType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.repairOrder.count({ where }),
    ])

    return NextResponse.json({
      repairs,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error fetching repairs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repairs' },
      { status: 500 }
    )
  }
}
```

**Expected Outcome:**
- ✅ All inputs validated
- ✅ Clear error messages
- ✅ Type-safe validation
- ✅ Prevents invalid data

---

### Task 3.2: Implement Proper Error Handling

**File:** `lib/errors/api-errors.ts`

```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id?: string | number) {
    super(
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      404,
      'NOT_FOUND'
    )
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}
```

**File:** `lib/errors/error-handler.ts`

```typescript
import { NextResponse } from 'next/server'
import { APIError } from './api-errors'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export function handleAPIError(error: unknown) {
  console.error('API Error:', error)

  // Known API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'A record with this information already exists',
          code: 'DUPLICATE_ERROR',
          details: error.meta,
        },
        { status: 409 }
      )
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Referenced record does not exist',
          code: 'FOREIGN_KEY_ERROR',
          details: error.meta,
        },
        { status: 400 }
      )
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Record not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }
  }

  // Generic error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : undefined,
    },
    { status: 500 }
  )
}
```

**Use in API Routes:**

```typescript
// app/api/repairs/[id]/route.ts
import { handleAPIError } from '@/lib/errors/error-handler'
import { NotFoundError } from '@/lib/errors/api-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request)
    if (authResult) return authResult

    const repair = await prisma.repairOrder.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true,
          },
        },
      },
    })

    if (!repair) {
      throw new NotFoundError('Repair order', params.id)
    }

    return NextResponse.json(repair)
  } catch (error) {
    return handleAPIError(error)
  }
}
```

**Expected Outcome:**
- ✅ Consistent error responses
- ✅ Proper HTTP status codes
- ✅ Clear error messages
- ✅ Error code classification

---

### Task 3.3: Add Response Formatting

**File:** `lib/api/response-formatter.ts`

```typescript
import { NextResponse } from 'next/server'

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    timestamp: string
    version: string
  }
}

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    },
    { status }
  )
}

export function createdResponse<T>(data: T, message?: string) {
  return successResponse(data, message, 201)
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 })
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
) {
  return successResponse<PaginatedResponse<T>>({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}
```

**Expected Outcome:**
- ✅ Consistent response format
- ✅ Metadata in all responses
- ✅ Easier API consumption
- ✅ Better documentation

---

## 🔔 Phase 4: Complete Service Integrations (Days 11-14)

### Task 4.1: Complete Notification Service

**File:** `lib/services/notification-service.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// Twilio for SMS
import twilio from 'twilio'
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// SendGrid for Email
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export type NotificationEvent =
  | 'repair_created'
  | 'repair_in_progress'
  | 'repair_completed'
  | 'repair_ready_pickup'
  | 'repair_delivered'
  | 'repair_delayed'
  | 'payment_received'
  | 'payment_reminder'

export class NotificationService {
  /**
   * Send notification to customer
   */
  static async notifyCustomer(
    repairOrderId: number,
    eventType: NotificationEvent,
    customMessage?: string
  ) {
    // Get repair and customer info
    const repair = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
      },
    })

    if (!repair) {
      throw new Error('Repair order not found')
    }

    const { customer } = repair
    const preferences = JSON.parse(customer.notificationPreferences)

    // Generate message from template
    const message = customMessage || this.getTemplate(eventType, repair)

    // Send SMS if enabled
    if (preferences.sms && customer.phone) {
      await this.sendSMS(customer.id, repairOrderId, customer.phone, message)
    }

    // Send email if enabled
    if (preferences.email && customer.email) {
      await this.sendEmail(
        customer.id,
        repairOrderId,
        customer.email,
        `Repair Update: ${repair.orderNumber}`,
        message
      )
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(
    customerId: number,
    repairOrderId: number,
    phone: string,
    message: string
  ) {
    // Rate limit check
    const rateLimitResult = await rateLimit(`sms:${customerId}`, 'sms')
    if (!rateLimitResult.success) {
      console.warn(`SMS rate limit exceeded for customer ${customerId}`)
      return
    }

    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      })

      await prisma.notification.create({
        data: {
          repairOrderId,
          customerId,
          type: 'sms',
          eventType: 'repair_status_update',
          message,
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sid,
        },
      })

      console.log(`SMS sent successfully: ${result.sid}`)
    } catch (error: any) {
      console.error('SMS error:', error)

      await prisma.notification.create({
        data: {
          repairOrderId,
          customerId,
          type: 'sms',
          eventType: 'repair_status_update',
          message,
          status: 'failed',
          errorMessage: error.message,
        },
      })
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmail(
    customerId: number,
    repairOrderId: number,
    email: string,
    subject: string,
    message: string
  ) {
    // Rate limit check
    const rateLimitResult = await rateLimit(`email:${customerId}`, 'email')
    if (!rateLimitResult.success) {
      console.warn(`Email rate limit exceeded for customer ${customerId}`)
      return
    }

    try {
      const html = this.generateEmailHTML(message)

      await sgMail.send({
        to: email,
        from: process.env.FROM_EMAIL || 'noreply@repairshop.com',
        subject,
        html,
      })

      await prisma.notification.create({
        data: {
          repairOrderId,
          customerId,
          type: 'email',
          eventType: 'repair_status_update',
          subject,
          message,
          status: 'sent',
          sentAt: new Date(),
        },
      })

      console.log(`Email sent successfully to ${email}`)
    } catch (error: any) {
      console.error('Email error:', error)

      await prisma.notification.create({
        data: {
          repairOrderId,
          customerId,
          type: 'email',
          eventType: 'repair_status_update',
          subject,
          message,
          status: 'failed',
          errorMessage: error.message,
        },
      })
    }
  }

  /**
   * Get notification template
   */
  private static getTemplate(eventType: NotificationEvent, repair: any): string {
    const templates: Record<NotificationEvent, string> = {
      repair_created: `Your repair ${repair.orderNumber} has been received. We'll update you soon!`,
      repair_in_progress: `Good news! We've started working on your ${repair.deviceModel.brand.name} ${repair.deviceModel.name}.`,
      repair_completed: `Your ${repair.deviceModel.name} is ready for pickup! Visit us anytime.`,
      repair_ready_pickup: `Reminder: Your repair ${repair.orderNumber} is ready for pickup.`,
      repair_delivered: `Thank you! Your device has been delivered. We hope you're satisfied with our service.`,
      repair_delayed: `We're experiencing a slight delay with your repair. We'll keep you updated.`,
      payment_received: `Payment received for ${repair.orderNumber}. Thank you!`,
      payment_reminder: `You have an outstanding balance of $${repair.totalPrice - repair.depositPaid} for repair ${repair.orderNumber}.`,
    }

    return templates[eventType] || `Update on your repair ${repair.orderNumber}`
  }

  /**
   * Generate HTML email template
   */
  private static generateEmailHTML(message: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Repair Dashboard</h1>
            </div>
            <div class="content">
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you opted in to notifications.</p>
              <p>© ${new Date().getFullYear()} Repair Dashboard. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Get notification history for a repair
   */
  static async getNotificationHistory(repairOrderId: number) {
    return prisma.notification.findMany({
      where: { repairOrderId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get notification history for a customer
   */
  static async getCustomerNotifications(customerId: number, limit = 50) {
    return prisma.notification.findMany({
      where: { customerId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Retry failed notification
   */
  static async retryNotification(notificationId: number) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        customer: true,
        repairOrder: true,
      },
    })

    if (!notification || notification.status === 'sent') {
      return
    }

    if (notification.type === 'sms' && notification.customer.phone) {
      await this.sendSMS(
        notification.customerId,
        notification.repairOrderId!,
        notification.customer.phone,
        notification.message
      )
    } else if (notification.type === 'email' && notification.customer.email) {
      await this.sendEmail(
        notification.customerId,
        notification.repairOrderId!,
        notification.customer.email,
        notification.subject || 'Repair Update',
        notification.message
      )
    }
  }
}
```

**Update Status Change to Trigger Notifications:**

```typescript
// app/api/repairs/[id]/status/route.ts
import { NotificationService } from '@/lib/services/notification-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, notes } = await request.json()

    const repair = await prisma.repairOrder.update({
      where: { id: parseInt(params.id) },
      data: { status },
    })

    // Log status change
    await prisma.orderStatusHistory.create({
      data: {
        repairOrderId: repair.id,
        oldStatus: repair.status,
        newStatus: status,
        notes,
      },
    })

    // Send notification
    const eventMap: Record<string, NotificationEvent> = {
      in_progress: 'repair_in_progress',
      completed: 'repair_completed',
      ready_pickup: 'repair_ready_pickup',
      delivered: 'repair_delivered',
    }

    const event = eventMap[status]
    if (event) {
      await NotificationService.notifyCustomer(repair.id, event)
    }

    return NextResponse.json(repair)
  } catch (error) {
    return handleAPIError(error)
  }
}
```

**Expected Outcome:**
- ✅ SMS notifications working
- ✅ Email notifications working
- ✅ Auto-notifications on status change
- ✅ Notification history tracked
- ✅ Rate limiting applied
- ✅ Retry failed notifications

---

### Task 4.2: Background Job Processing

**Install Dependencies:**

```bash
npm install bullmq ioredis
```

**Create Job Queues:**

**File:** `lib/jobs/queue.ts`

```typescript
import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// Define job types
export interface NotificationJob {
  repairOrderId: number
  eventType: string
}

export interface SyncJob {
  type: 'customers' | 'pricing'
  lightspeedId?: string
}

export interface ReportJob {
  type: 'daily' | 'weekly' | 'monthly'
  dateRange: {
    from: string
    to: string
  }
}

// Create queues
export const notificationQueue = new Queue<NotificationJob>('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
})

export const syncQueue = new Queue<SyncJob>('sync', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

export const reportQueue = new Queue<ReportJob>('reports', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
  },
})
```

**Create Workers:**

**File:** `lib/jobs/workers.ts`

```typescript
import { Worker, Job } from 'bullmq'
import { NotificationService } from '@/lib/services/notification-service'
import { lightspeedService } from '@/lib/lightspeed'
import { prisma } from '@/lib/prisma'
import { NotificationJob, SyncJob, ReportJob } from './queue'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Notification Worker
export const notificationWorker = new Worker<NotificationJob>(
  'notifications',
  async (job: Job<NotificationJob>) => {
    const { repairOrderId, eventType } = job.data

    await NotificationService.notifyCustomer(
      repairOrderId,
      eventType as any
    )

    return { success: true }
  },
  { connection }
)

notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`)
})

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err)
})

// Sync Worker
export const syncWorker = new Worker<SyncJob>(
  'sync',
  async (job: Job<SyncJob>) => {
    const { type, lightspeedId } = job.data

    if (type === 'customers') {
      // Sync customers from Lightspeed
      const customers = await lightspeedService.getCustomers()

      for (const lsCustomer of customers) {
        await prisma.customer.upsert({
          where: { lightspeedId: lsCustomer.customerID },
          update: {
            firstName: lsCustomer.firstName,
            lastName: lsCustomer.lastName,
            email: lsCustomer.emailAddress || null,
            phone: lsCustomer.primaryPhone || '',
            lastSyncedAt: new Date(),
          },
          create: {
            lightspeedId: lsCustomer.customerID,
            firstName: lsCustomer.firstName,
            lastName: lsCustomer.lastName,
            email: lsCustomer.emailAddress || null,
            phone: lsCustomer.primaryPhone || '',
            lastSyncedAt: new Date(),
          },
        })
      }

      return { customersSync: customers.length }
    }

    if (type === 'pricing') {
      // Sync pricing from Lightspeed
      const items = await lightspeedService.getItems()

      // Process items...

      return { itemsSynced: items.length }
    }

    return { success: true }
  },
  { connection }
)

// Report Worker
export const reportWorker = new Worker<ReportJob>(
  'reports',
  async (job: Job<ReportJob>) => {
    const { type, dateRange } = job.data

    // Generate report based on type
    const report = await generateReport(type, dateRange)

    // Save report or send via email
    // ...

    return report
  },
  { connection }
)

async function generateReport(type: string, dateRange: any) {
  // Implementation for report generation
  return { type, generated: new Date() }
}
```

**Start Workers (separate process):**

**File:** `lib/jobs/start-workers.ts`

```typescript
import { notificationWorker, syncWorker, reportWorker } from './workers'

console.log('Starting background workers...')

notificationWorker.on('ready', () => {
  console.log('Notification worker ready')
})

syncWorker.on('ready', () => {
  console.log('Sync worker ready')
})

reportWorker.on('ready', () => {
  console.log('Report worker ready')
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...')
  await Promise.all([
    notificationWorker.close(),
    syncWorker.close(),
    reportWorker.close(),
  ])
  process.exit(0)
})
```

**Add to package.json:**

```json
{
  "scripts": {
    "workers": "tsx lib/jobs/start-workers.ts"
  }
}
```

**Use in API:**

```typescript
// Instead of direct notification:
await NotificationService.notifyCustomer(repairId, 'repair_completed')

// Queue the job:
await notificationQueue.add('notify-customer', {
  repairOrderId: repairId,
  eventType: 'repair_completed',
})
```

**Expected Outcome:**
- ✅ Background job processing
- ✅ Retry logic for failed jobs
- ✅ Job history and monitoring
- ✅ Decoupled from API requests
- ✅ Scalable processing

---

## 📊 Phase 5: Monitoring & Observability (Days 15-16)

### Task 5.1: Structured Logging

```bash
npm install pino pino-pretty
```

**File:** `lib/logger.ts`

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
  },
})

// Child loggers for different modules
export const apiLogger = logger.child({ module: 'api' })
export const dbLogger = logger.child({ module: 'database' })
export const authLogger = logger.child({ module: 'auth' })
export const jobLogger = logger.child({ module: 'jobs' })
```

**Use in API:**

```typescript
import { apiLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    apiLogger.info({ path: request.url }, 'Processing repair creation')

    // ... create repair ...

    apiLogger.info(
      {
        repairId: repair.id,
        orderNumber: repair.orderNumber,
        duration: Date.now() - startTime,
      },
      'Repair created successfully'
    )

    return NextResponse.json(repair)
  } catch (error) {
    apiLogger.error(
      {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      },
      'Failed to create repair'
    )

    return handleAPIError(error)
  }
}
```

**Expected Outcome:**
- ✅ Structured JSON logs
- ✅ Log levels (info, warn, error)
- ✅ Request/response logging
- ✅ Performance tracking

---

### Task 5.2: Health Check Endpoint

**File:** `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Check Redis (if using)
    // await redis.ping()

    const duration = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        // redis: 'ok',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: `${duration}ms`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    )
  }
}
```

**Expected Outcome:**
- ✅ Health check for monitoring
- ✅ Database connection check
- ✅ System metrics
- ✅ Uptime tracking

---

## 🚀 Phase 6: Performance & Caching (Days 17-18)

### Task 6.1: Implement Redis Caching

**File:** `lib/cache.ts`

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export class Cache {
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  }

  /**
   * Set cached value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 300) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  }

  /**
   * Delete cached value
   */
  static async del(key: string) {
    await redis.del(key)
  }

  /**
   * Delete keys by pattern
   */
  static async delPattern(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  /**
   * Cache with automatic fetch
   */
  static async remember<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached) return cached

    const data = await fetcher()
    await this.set(key, data, ttl)
    return data
  }
}
```

**Use in APIs:**

```typescript
// Cache brands (rarely change)
const brands = await Cache.remember(
  'brands:all',
  3600, // 1 hour
  async () => {
    return prisma.brand.findMany({
      include: {
        deviceModels: true,
      },
    })
  }
)

// Invalidate cache on update
await prisma.brand.update({...})
await Cache.del('brands:all')
```

**Expected Outcome:**
- ✅ Faster API responses
- ✅ Reduced database load
- ✅ Cache invalidation strategies
- ✅ TTL management

---

## ✅ Implementation Checklist

### Phase 1: Infrastructure (Days 1-3)
- [ ] Fix Prisma schema (add tierLevel, PartsQuality enum)
- [ ] Migrate to PostgreSQL
- [ ] Standardize Prisma client
- [ ] Add database indexes
- [ ] Run migrations and seed data

### Phase 2: Auth & Security (Days 4-6)
- [ ] Implement JWT authentication
- [ ] Add auth middleware
- [ ] Create login/logout endpoints
- [ ] Protect API routes
- [ ] Implement rate limiting
- [ ] Add role-based access control

### Phase 3: API Improvements (Days 7-10)
- [ ] Add Zod validation to all endpoints
- [ ] Implement error handling
- [ ] Add response formatting
- [ ] Add pagination to list endpoints
- [ ] Document API with OpenAPI/Swagger

### Phase 4: Services (Days 11-14)
- [ ] Complete notification service (SMS + Email)
- [ ] Implement background job queues
- [ ] Complete Lightspeed integration
- [ ] Test Gemini AI integration
- [ ] Add webhook support

### Phase 5: Monitoring (Days 15-16)
- [ ] Add structured logging
- [ ] Implement health checks
- [ ] Set up error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Create admin dashboard for metrics

### Phase 6: Performance (Days 17-18)
- [ ] Implement Redis caching
- [ ] Optimize database queries
- [ ] Add connection pooling
- [ ] Load testing
- [ ] Performance benchmarks

---

## 📈 Success Metrics

### Performance
- [ ] API response time < 200ms (95th percentile)
- [ ] Database query time < 50ms average
- [ ] Cache hit rate > 70%
- [ ] Background job processing < 5s

### Reliability
- [ ] 99.9% uptime
- [ ] < 0.1% error rate
- [ ] 100% notification delivery
- [ ] Zero data loss

### Security
- [ ] Zero authentication bypasses
- [ ] Rate limiting active
- [ ] All inputs validated
- [ ] Secrets encrypted

---

## 🎯 Quick Start Command

```bash
#!/bin/bash
# Run this to get started immediately

cd /workspace/repair-dashboard

# 1. Install dependencies
npm install

# 2. Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://user:pass@localhost:5432/repair_db"
JWT_SECRET="change-this-to-random-64-char-string"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
SENDGRID_API_KEY=""
FROM_EMAIL=""
LIGHTSPEED_ACCOUNT_ID=""
LIGHTSPEED_PERSONAL_TOKEN=""
GEMINI_API_KEY=""
EOF

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed database
npm run db:seed

# 6. Start dev server
npm run dev

# 7. Start background workers (in separate terminal)
npm run workers
```

---

## 📚 Additional Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [JWT Authentication](https://jwt.io/introduction)
- [BullMQ Guide](https://docs.bullmq.io/)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)

---

**Backend Status:** Ready for upgrade  
**Estimated Time:** 18 days for complete backend transformation  
**Priority:** Start with Phase 1 (CRITICAL) immediately  

This plan focuses exclusively on backend architecture and will result in a production-ready, scalable, and maintainable server-side application. 🚀
