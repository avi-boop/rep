# Mobile Repair Dashboard - Comprehensive Improvement Plan

**Project**: repair.theprofitplatform.com.au
**Created**: 2025-11-17
**Estimated Duration**: 6-8 weeks
**Total Effort**: 136 hours
**Focus**: Quality over Quantity

---

## 📊 Executive Summary

This plan transforms your mobile repair dashboard from a functional MVP into a production-ready, secure, and scalable SaaS application. The plan prioritizes security and stability first, then code quality, testing, and performance.

### Success Criteria
- ✅ 100% of API endpoints authenticated and validated
- ✅ 70%+ automated test coverage
- ✅ Zero critical security vulnerabilities
- ✅ API response times < 200ms (P95)
- ✅ Production monitoring and alerting active
- ✅ All existing features fully implemented and polished

---

## 🎯 Project Phases Overview

| Phase | Focus | Duration | Effort | Deploy? |
|-------|-------|----------|--------|---------|
| **Phase 0** | Preparation & Setup | 2 days | 8h | No |
| **Phase 1** | Security Foundation | 1 week | 40h | Test |
| **Phase 2** | Code Quality & Types | 1 week | 24h | Test |
| **Phase 3** | Testing Infrastructure | 1 week | 24h | Test |
| **Phase 4** | Performance & Scale | 1 week | 20h | Staging |
| **Phase 5** | Feature Completion | 1 week | 28h | Production |
| **Phase 6** | Polish & Documentation | 3 days | 12h | Production |

**Total Timeline**: 6-7 weeks
**Total Effort**: 136 hours

---

## 📅 Detailed Phase Breakdown

---

# PHASE 0: Preparation & Setup (2 Days - 8 hours)

**Goal**: Establish development workflow and safety nets

## Tasks

### Task 0.1: Development Branch Strategy (1h)
**Owner**: Claude Code
**Files Changed**: None
**Description**: Set up proper git workflow

**Steps**:
1. Create `develop` branch from `main`
2. Create `test-deployment` branch
3. Configure branch protection rules (require PR reviews)
4. Set up git pre-commit hooks

**Deliverables**:
- [ ] `develop` branch created
- [ ] Branch protection enabled on `main`
- [ ] Pre-commit hooks installed

**Success Criteria**: Can't accidentally push broken code to production

---

### Task 0.2: Environment Configuration (2h)
**Owner**: You + Claude Code
**Dependencies**: None
**Files Changed**:
- `.env.development`
- `.env.test`
- `.env.production`
- `.env.example`

**Steps**:
1. **YOU DO**: Rotate all exposed API keys:
   - Generate new Supabase credentials
   - Generate new Lightspeed token
   - Generate new Gemini API key
2. **Claude Code Does**: Update `.env.example` with proper documentation
3. **Claude Code Does**: Create environment variable validation schema

**Deliverables**:
- [ ] All API keys rotated
- [ ] Separate env files for dev/test/prod
- [ ] Environment validation on startup

**Success Criteria**: App fails fast if required env vars missing

---

### Task 0.3: Backup Strategy (2h)
**Owner**: You + Claude Code
**Files Changed**:
- `scripts/backup-database.sh`
- `scripts/restore-database.sh`

**Steps**:
1. **Claude Code Does**: Create automated backup script
2. **YOU DO**: Run manual backup before starting
3. **Claude Code Does**: Set up daily automated backups
4. **Claude Code Does**: Test restore procedure

**Deliverables**:
- [ ] Manual backup completed
- [ ] Automated backup script created
- [ ] Restore procedure tested

**Success Criteria**: Can rollback to current state anytime

---

### Task 0.4: Test Environment Setup (3h)
**Owner**: Claude Code
**Files Changed**:
- `.github/workflows/ci-cd.yml`
- Coolify configuration

**Steps**:
1. Configure `test.theprofitplatform.com.au` deployment
2. Update CI/CD to deploy `develop` branch to test
3. Set up separate test database
4. Verify test environment works

**Deliverables**:
- [ ] Test environment accessible
- [ ] Auto-deploys from `develop` branch
- [ ] Separate test database configured

**Success Criteria**: Can safely test changes before production

---

**Phase 0 Complete**: ✅ Safe development environment ready

---

# PHASE 1: Security Foundation (1 Week - 40 hours)

**Goal**: Make application secure and production-ready

---

## Task 1.1: Authentication System (8h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: None
**Branch**: `feat/authentication`

### Files to Create:
```
dashboard/
├── lib/
│   └── auth.ts                    # NextAuth configuration
├── middleware.ts                   # Route protection
├── app/api/auth/
│   └── [...nextauth]/route.ts     # NextAuth handlers
└── types/
    └── auth.ts                     # Auth type definitions
```

### Files to Modify:
- `dashboard/app/api/**/route.ts` (all 20 routes) - Add auth checks
- `dashboard/components/Header.tsx` - Add login/logout UI
- `dashboard/.env.example` - Add NextAuth vars

### Implementation Steps:

#### 1.1.1: Install Dependencies (15min)
```bash
npm install next-auth@latest @auth/prisma-adapter bcrypt
npm install -D @types/bcrypt
```

#### 1.1.2: Update Database Schema (30min)
```prisma
// Add to schema.prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  name          String?
  passwordHash  String
  role          String    @default("technician") // admin, manager, technician
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       Int
  expires      DateTime
  sessionToken String   @unique
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sessions")
}

// Update existing models
model RepairOrder {
  // ... existing fields
  checkedInBy          Int?
  checkedOutBy         Int?

  checkedInByUser      User?    @relation("CheckedInBy", fields: [checkedInBy], references: [id])
  checkedOutByUser     User?    @relation("CheckedOutBy", fields: [checkedOutBy], references: [id])
}
```

#### 1.1.3: Create Auth Configuration (2h)
Create `lib/auth.ts` with:
- Credentials provider
- Session strategy
- Role-based access control helpers
- Password hashing utilities

#### 1.1.4: Create Protected Route Middleware (1h)
Create `middleware.ts` to:
- Protect all `/dashboard/*` routes
- Protect all `/api/*` routes (except `/api/auth/*`)
- Redirect unauthenticated users to login

#### 1.1.5: Add Auth Checks to API Routes (3h)
Update all 20 API routes to:
- Verify session
- Check user permissions
- Log user actions

#### 1.1.6: Create Login UI (1h)
- Add login page at `/app/login/page.tsx`
- Add logout button to Header
- Add user info display

#### 1.1.7: Create Seed Users (30min)
Update `prisma/seed.ts` to create:
- Admin user: admin@theprofitplatform.com.au
- Manager user: manager@theprofitplatform.com.au
- Technician user: tech@theprofitplatform.com.au

### Testing Checklist:
- [ ] Can log in with seed users
- [ ] Cannot access API without auth
- [ ] Cannot access dashboard without auth
- [ ] Correct roles have correct permissions
- [ ] Sessions persist across page reloads
- [ ] Logout works correctly

### Deployment:
1. Deploy to test environment
2. YOU TEST: Verify authentication works
3. Merge to `develop` → deploy to test
4. After 24h testing → merge to `main` → production

**Task 1.1 Complete**: ✅ Authentication implemented

---

## Task 1.2: Input Validation with Zod (12h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: None
**Branch**: `feat/input-validation`

### Files to Create:
```
dashboard/
├── lib/
│   ├── validations/
│   │   ├── repairs.ts          # Repair validation schemas
│   │   ├── customers.ts        # Customer validation schemas
│   │   ├── pricing.ts          # Pricing validation schemas
│   │   ├── common.ts           # Shared schemas (pagination, etc)
│   │   └── index.ts            # Export all schemas
│   └── api-helpers.ts          # Validation middleware
```

### Implementation Steps:

#### 1.2.1: Create Common Schemas (2h)
```typescript
// lib/validations/common.ts
import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

// ... more common schemas
```

#### 1.2.2: Create Entity Schemas (4h)
- Repair order schemas (create, update, status change)
- Customer schemas (create, update)
- Pricing schemas (create, update, estimate)
- Device model schemas
- Brand schemas

#### 1.2.3: Create Validation Helper (2h)
```typescript
// lib/api-helpers.ts
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
    }
    return {
      error: NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }
}
```

#### 1.2.4: Update All API Routes (4h)
Update all 20 API routes to use validation:

```typescript
// Before:
export async function POST(request: NextRequest) {
  const body = await request.json()
  const pricing = await prisma.pricing.create({ data: body })
  return NextResponse.json(pricing)
}

// After:
import { validateRequest } from '@/lib/api-helpers'
import { createPricingSchema } from '@/lib/validations/pricing'

export async function POST(request: NextRequest) {
  const result = await validateRequest(request, createPricingSchema)
  if ('error' in result) return result.error

  const pricing = await prisma.pricing.create({ data: result.data })
  return NextResponse.json(pricing)
}
```

### Testing Checklist:
- [ ] All API routes reject invalid input
- [ ] Validation errors return 400 with details
- [ ] Type coercion works (string "5" → number 5)
- [ ] Optional fields handled correctly
- [ ] Array validations work
- [ ] Nested object validations work

**Task 1.2 Complete**: ✅ Input validation implemented

---

## Task 1.3: Fix Duplicate Prisma Clients (1h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: None
**Branch**: `fix/prisma-client`

### Files to Delete:
- `dashboard/lib/prisma.ts` ❌

### Files to Modify:
- `dashboard/lib/db.ts` (keep this one, enhance it)
- All files importing from `lib/prisma.ts` (update imports)

### Implementation Steps:

#### 1.3.1: Enhance lib/db.ts (15min)
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
```

#### 1.3.2: Update All Imports (30min)
Find and replace in all files:
- `from '@/lib/prisma'` → `from '@/lib/db'`
- `from '../lib/prisma'` → `from '../lib/db'`

#### 1.3.3: Delete Old File (5min)
```bash
rm dashboard/lib/prisma.ts
```

#### 1.3.4: Add Health Check Endpoint (15min)
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

export async function GET() {
  const dbHealthy = await checkDatabaseConnection()

  return NextResponse.json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  }, {
    status: dbHealthy ? 200 : 503
  })
}
```

### Testing Checklist:
- [ ] No duplicate Prisma client warnings
- [ ] All API routes still work
- [ ] Health check endpoint works
- [ ] Connection pooling working correctly

**Task 1.3 Complete**: ✅ Prisma client consolidated

---

## Task 1.4: Encrypt Device Passwords (4h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: Task 1.3
**Branch**: `feat/encrypt-passwords`

### Files to Create:
```
dashboard/
└── lib/
    └── encryption.ts              # AES-256-GCM encryption utilities
```

### Files to Modify:
- `dashboard/app/api/repairs/route.ts` - Encrypt on create
- `dashboard/app/api/repairs/[id]/route.ts` - Decrypt on read

### Implementation Steps:

#### 1.4.1: Install Dependency (5min)
```bash
npm install crypto-js
npm install -D @types/crypto-js
```

#### 1.4.2: Create Encryption Utilities (1h)
```typescript
// lib/encryption.ts
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}

export function encryptDevicePassword(password: string): string {
  if (!password) return ''
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString()
}

export function decryptDevicePassword(encryptedPassword: string): string {
  if (!encryptedPassword) return ''
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

#### 1.4.3: Update API Routes (1.5h)
```typescript
// app/api/repairs/route.ts
import { encryptDevicePassword } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  // ... validation

  const repairOrder = await prisma.repairOrder.create({
    data: {
      ...validatedData,
      devicePassword: validatedData.devicePassword
        ? encryptDevicePassword(validatedData.devicePassword)
        : null
    }
  })

  return NextResponse.json(repairOrder)
}

// app/api/repairs/[id]/route.ts
import { decryptDevicePassword } from '@/lib/encryption'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const repair = await prisma.repairOrder.findUnique({
    where: { id: parseInt(params.id) }
  })

  if (!repair) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...repair,
    devicePassword: repair.devicePassword
      ? decryptDevicePassword(repair.devicePassword)
      : null
  })
}
```

#### 1.4.4: Generate Encryption Key (15min)
```bash
# Generate secure 256-bit key
openssl rand -base64 32
```

**YOU DO**: Add to `.env`:
```
ENCRYPTION_KEY="your_generated_key_here"
```

#### 1.4.5: Migrate Existing Data (1h)
Create migration script:
```typescript
// scripts/encrypt-existing-passwords.ts
import { prisma } from '../dashboard/lib/db'
import { encryptDevicePassword } from '../dashboard/lib/encryption'

async function migratePasswords() {
  const repairs = await prisma.repairOrder.findMany({
    where: {
      devicePassword: { not: null }
    }
  })

  console.log(`Found ${repairs.length} repairs with passwords`)

  for (const repair of repairs) {
    if (repair.devicePassword) {
      const encrypted = encryptDevicePassword(repair.devicePassword)
      await prisma.repairOrder.update({
        where: { id: repair.id },
        data: { devicePassword: encrypted }
      })
    }
  }

  console.log('Migration complete')
}

migratePasswords()
```

### Testing Checklist:
- [ ] New passwords are encrypted in database
- [ ] Existing passwords migrated
- [ ] Decryption works on read
- [ ] Empty passwords handled correctly
- [ ] Encryption key validated on startup

**Task 1.4 Complete**: ✅ Device passwords encrypted

---

## Task 1.5: Improve Error Handling (8h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: Task 1.2
**Branch**: `feat/error-handling`

### Files to Create:
```
dashboard/
├── lib/
│   ├── errors.ts                 # Custom error classes
│   └── error-handler.ts          # Error handling middleware
└── types/
    └── api.ts                     # API response types
```

### Implementation Steps:

#### 1.5.1: Create Custom Error Classes (1h)
```typescript
// lib/errors.ts
export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string | number) {
    super(`${resource} not found${id ? `: ${id}` : ''}`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}
```

#### 1.5.2: Create Error Handler (2h)
```typescript
// lib/error-handler.ts
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import * as Errors from './errors'
import { logger } from './logger'

export function handleApiError(error: unknown): NextResponse {
  // Log error
  logger.error('API Error:', error)

  // Validation errors
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: 'Validation failed',
      details: error.errors
    }, { status: 400 })
  }

  if (error instanceof Errors.ValidationError) {
    return NextResponse.json({
      error: error.message,
      details: error.details
    }, { status: 400 })
  }

  // Not found errors
  if (error instanceof Errors.NotFoundError) {
    return NextResponse.json({
      error: error.message
    }, { status: 404 })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Resource not found'
      }, { status: 404 })
    }

    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Duplicate entry',
        field: error.meta?.target
      }, { status: 409 })
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Invalid reference',
        field: error.meta?.field_name
      }, { status: 400 })
    }
  }

  // Auth errors
  if (error instanceof Errors.UnauthorizedError) {
    return NextResponse.json({
      error: error.message
    }, { status: 401 })
  }

  if (error instanceof Errors.ForbiddenError) {
    return NextResponse.json({
      error: error.message
    }, { status: 403 })
  }

  // Conflict errors
  if (error instanceof Errors.ConflictError) {
    return NextResponse.json({
      error: error.message
    }, { status: 409 })
  }

  // Default server error
  return NextResponse.json({
    error: 'Internal server error'
  }, { status: 500 })
}
```

#### 1.5.3: Update All API Routes (4h)
Wrap all route handlers:

```typescript
// Before:
export async function GET(request: NextRequest) {
  try {
    const repairs = await prisma.repairOrder.findMany()
    return NextResponse.json(repairs)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// After:
import { handleApiError } from '@/lib/error-handler'
import { NotFoundError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const repairs = await prisma.repairOrder.findMany()
    return NextResponse.json(repairs)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const repair = await prisma.repairOrder.delete({
      where: { id: parseInt(params.id) }
    })
    return NextResponse.json(repair)
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 1.5.4: Create Standard Response Types (1h)
```typescript
// types/api.ts
export interface ApiSuccessResponse<T = unknown> {
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export interface ApiErrorResponse {
  error: string
  details?: unknown
  field?: string
}
```

### Testing Checklist:
- [ ] 400 for validation errors
- [ ] 404 for not found
- [ ] 409 for unique constraint violations
- [ ] 401 for unauthorized
- [ ] 403 for forbidden
- [ ] 500 for unexpected errors
- [ ] Error details properly logged
- [ ] No sensitive data in error responses

**Task 1.5 Complete**: ✅ Error handling improved

---

## Task 1.6: Add Rate Limiting (5h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: None
**Branch**: `feat/rate-limiting`

### Files to Create:
```
dashboard/
├── lib/
│   └── rate-limit.ts             # Rate limiting middleware
└── middleware.ts                  # Update with rate limiting
```

### Implementation Steps:

#### 1.6.1: Install Upstash Redis (15min)
```bash
npm install @upstash/redis @upstash/ratelimit
```

#### 1.6.2: Create Rate Limit Utility (2h)
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Different rate limits for different endpoints
export const rateLimits = {
  // AI endpoints - expensive, limit strictly
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: true,
  }),

  // API endpoints - moderate
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  }),

  // Read endpoints - generous
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1 m'), // 200 requests per minute
    analytics: true,
  }),

  // Write endpoints - stricter
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'), // 50 requests per minute
    analytics: true,
  }),
}

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimits = 'api'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const result = await rateLimits[type].limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
```

#### 1.6.3: Update Middleware (1h)
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit } from './lib/rate-limit'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip rate limiting for static files
  if (path.startsWith('/_next') || path.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Get identifier (user email or IP)
  const token = await getToken({ req: request })
  const identifier = token?.email || request.ip || 'anonymous'

  // Determine rate limit type
  let limitType: 'ai' | 'api' | 'read' | 'write' = 'api'

  if (path.includes('/api/pricing/estimate') || path.includes('/api/integrations/gemini')) {
    limitType = 'ai'
  } else if (request.method === 'GET') {
    limitType = 'read'
  } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method || '')) {
    limitType = 'write'
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(identifier, limitType)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    )
  }

  // Add rate limit headers to response
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

  return response
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}
```

#### 1.6.4: Setup Upstash (YOU DO) (30min)
1. Go to https://upstash.com
2. Create free Redis database
3. Copy REST URL and token to `.env`:
```
UPSTASH_REDIS_REST_URL="your_url"
UPSTASH_REDIS_REST_TOKEN="your_token"
```

#### 1.6.5: Test Rate Limiting (1.5h)
Create test script to verify rate limits work:
```typescript
// scripts/test-rate-limit.ts
async function testRateLimit() {
  for (let i = 0; i < 10; i++) {
    const res = await fetch('http://localhost:3000/api/pricing/estimate')
    console.log(`Request ${i + 1}: ${res.status}`)
  }
}
```

### Testing Checklist:
- [ ] AI endpoints limited to 5/min
- [ ] API endpoints limited to 100/min
- [ ] Rate limit headers returned
- [ ] 429 status code on limit exceeded
- [ ] Different users have separate limits
- [ ] Rate limits reset correctly

**Task 1.6 Complete**: ✅ Rate limiting implemented

---

## Task 1.7: Security Headers (2h)

**Owner**: Claude Code
**Priority**: 🔴 P0 Critical
**Dependencies**: None
**Branch**: `feat/security-headers`

### Files to Modify:
- `dashboard/next.config.ts`

### Implementation Steps:

#### 1.7.1: Update Next Config (2h)
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://generativelanguage.googleapis.com",
              "frame-ancestors 'self'",
            ].join('; ')
          }
        ],
      },
    ]
  },

  // Image optimization
  images: {
    domains: ['repair.theprofitplatform.com.au'],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

### Testing Checklist:
- [ ] All security headers present in responses
- [ ] CSP doesn't break functionality
- [ ] HSTS header present on production
- [ ] X-Frame-Options prevents clickjacking
- [ ] Content-Type sniffing blocked

**Task 1.7 Complete**: ✅ Security headers configured

---

**PHASE 1 COMPLETE** ✅

**Deliverables**:
- ✅ Authentication system with NextAuth
- ✅ Input validation on all endpoints
- ✅ Consolidated Prisma client
- ✅ Encrypted device passwords
- ✅ Proper error handling
- ✅ Rate limiting
- ✅ Security headers

**Deploy to Test**: Merge all feature branches to `develop`
**Testing Period**: 2-3 days on test.theprofitplatform.com.au
**Production Deploy**: After testing passes

---

# PHASE 2: Code Quality & Types (1 Week - 24 hours)

**Goal**: Improve maintainability and type safety

---

## Task 2.1: Remove All `any` Types (8h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: Phase 1 complete
**Branch**: `refactor/type-safety`

### Files to Modify:
- All files with `any` type (27 occurrences)

### Implementation Steps:

#### 2.1.1: Create Proper Types (4h)
```typescript
// types/index.ts
import { Prisma } from '@prisma/client'

// Prisma includes
export type RepairOrderWithRelations = Prisma.RepairOrderGetPayload<{
  include: {
    customer: true
    deviceModel: {
      include: { brand: true }
    }
    repairOrderItems: {
      include: {
        repairType: true
        partType: true
      }
    }
  }
}>

export type PricingWithRelations = Prisma.PricingGetPayload<{
  include: {
    deviceModel: {
      include: { brand: true }
    }
    repairType: true
    partType: true
  }
}>

// Component prop types
export interface RepairFormProps {
  initialData?: RepairOrderWithRelations
  onSubmit: (data: RepairFormData) => Promise<void>
  onCancel: () => void
}

export interface RepairFormData {
  customerId: number
  deviceModelId: number
  deviceImei?: string
  deviceSerial?: string
  devicePassword?: string
  status: RepairStatus
  priority: RepairPriority
  issueDescription?: string
  repairItems: RepairItemData[]
}

// ... more types
```

#### 2.1.2: Replace `any` with Proper Types (4h)
Go through each file and replace `any`:

```typescript
// Before:
const where: any = {}

// After:
const where: Prisma.RepairOrderWhereInput = {}

// Before:
const updateRepairItem = (index: number, field: keyof RepairItem, value: any) => {

// After:
const updateRepairItem = <K extends keyof RepairItem>(
  index: number,
  field: K,
  value: RepairItem[K]
) => {

// Before:
} catch (error: any) {

// After:
} catch (error: unknown) {
  if (error instanceof Error) {
    // handle error
  }
}
```

### Testing Checklist:
- [ ] No TypeScript errors
- [ ] IDE autocomplete works correctly
- [ ] No runtime type errors
- [ ] All components properly typed

**Task 2.1 Complete**: ✅ Type safety improved

---

## Task 2.2: Add Structured Logging (4h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: None
**Branch**: `feat/structured-logging`

### Files to Create:
```
dashboard/
└── lib/
    └── logger.ts                 # Pino logger configuration
```

### Implementation Steps:

#### 2.2.1: Install Pino (5min)
```bash
npm install pino pino-pretty
```

#### 2.2.2: Create Logger (1h)
```typescript
// lib/logger.ts
import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Pretty print in development
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,

  // Structured logging in production
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },

  // Add context
  base: {
    env: process.env.NODE_ENV,
    app: 'repair-dashboard',
  },
})

// Helper functions
export const logApiRequest = (method: string, path: string, userId?: number) => {
  logger.info({ method, path, userId }, 'API Request')
}

export const logApiError = (error: unknown, context?: Record<string, unknown>) => {
  logger.error({ error, ...context }, 'API Error')
}

export const logDatabaseQuery = (operation: string, model: string, duration: number) => {
  logger.debug({ operation, model, duration }, 'Database Query')
}
```

#### 2.2.3: Replace All console.log (2.5h)
Remove 80+ console.log statements:

```typescript
// Before:
console.log('Customer synced to Lightspeed:', lightspeedCustomer.id)

// After:
logger.info({ lightspeedCustomerId: lightspeedCustomer.id }, 'Customer synced to Lightspeed')

// Before:
console.error('Error fetching repairs:', error)

// After:
logApiError(error, { context: 'fetch_repairs' })
```

#### 2.2.4: Add Request Logging Middleware (30min)
Update middleware to log all requests.

### Testing Checklist:
- [ ] No console.log statements remain
- [ ] Logs are structured JSON in production
- [ ] Logs are pretty-printed in development
- [ ] Log levels work correctly (debug, info, warn, error)
- [ ] Context properly included in logs

**Task 2.2 Complete**: ✅ Structured logging implemented

---

## Task 2.3: Add Database Indexes (2h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: None
**Branch**: `feat/database-indexes`

### Files to Modify:
- `dashboard/prisma/schema.prisma`

### Implementation Steps:

#### 2.3.1: Add Indexes to Schema (1h)
```prisma
// Update schema.prisma
model Customer {
  // ... existing fields

  @@index([phone])
  @@index([email])
  @@index([lightspeedId])
  @@index([createdAt])
}

model RepairOrder {
  // ... existing fields

  @@index([customerId])
  @@index([deviceModelId])
  @@index([status])
  @@index([orderNumber])
  @@index([createdAt])
  @@index([assignedTechnicianId])
  @@index([status, createdAt])  // Composite index for common query
}

model Pricing {
  // ... existing fields

  @@index([deviceModelId])
  @@index([repairTypeId])
  @@index([partTypeId])
  @@index([isActive])
  @@index([deviceModelId, repairTypeId, partTypeId])  // Composite for lookup
}

model Notification {
  // ... existing fields

  @@index([customerId])
  @@index([repairOrderId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
}
```

#### 2.3.2: Generate and Apply Migration (30min)
```bash
cd dashboard
npx prisma migrate dev --name add_performance_indexes
```

#### 2.3.3: Analyze Query Performance (30min)
Enable Prisma query logging and test common queries:
- List repairs (with filters)
- Search customers
- Price lookup
- Notification queue

### Testing Checklist:
- [ ] Migration applied successfully
- [ ] Query performance improved (measure before/after)
- [ ] All existing queries still work
- [ ] No duplicate indexes

**Task 2.3 Complete**: ✅ Database indexes added

---

## Task 2.4: Implement Pagination (6h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: Task 2.3
**Branch**: `feat/pagination`

### Files to Modify:
- All list API endpoints (repairs, customers, pricing, etc.)
- Frontend components that fetch lists

### Implementation Steps:

#### 2.4.1: Create Pagination Helper (1h)
```typescript
// lib/api-helpers.ts (add to existing file)
import { NextRequest } from 'next/server'

export interface PaginationParams {
  page: number
  limit: number
  skip: number
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export function getPaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  return { page, limit, skip, sortBy, sortOrder }
}

export async function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / params.limit)
  const hasMore = params.page < totalPages

  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore,
    },
  }
}
```

#### 2.4.2: Update List Endpoints (4h)
Update each list endpoint:

```typescript
// Before:
export async function GET(request: NextRequest) {
  const repairs = await prisma.repairOrder.findMany({
    include: { customer: true, deviceModel: true }
  })
  return NextResponse.json(repairs)
}

// After:
export async function GET(request: NextRequest) {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(request)
  const searchParams = request.nextUrl.searchParams

  // Build where clause
  const where: Prisma.RepairOrderWhereInput = {}
  const status = searchParams.get('status')
  if (status) where.status = status

  // Fetch data and count in parallel
  const [repairs, total] = await Promise.all([
    prisma.repairOrder.findMany({
      where,
      include: {
        customer: true,
        deviceModel: { include: { brand: true } }
      },
      skip,
      take: limit,
      orderBy: sortBy
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' }
    }),
    prisma.repairOrder.count({ where })
  ])

  const response = await createPaginatedResponse(repairs, total, { page, limit, skip, sortOrder })
  return NextResponse.json(response)
}
```

Update for:
- `/api/repairs`
- `/api/customers`
- `/api/pricing`
- `/api/brands`
- `/api/device-models`
- `/api/notifications`

#### 2.4.3: Update Frontend (1h)
Update components to handle pagination:
- Add page controls
- Handle loading states
- Update data fetching logic

### Testing Checklist:
- [ ] Pagination works on all list endpoints
- [ ] Correct page counts returned
- [ ] Sorting works correctly
- [ ] Filtering works with pagination
- [ ] Performance improved on large datasets

**Task 2.4 Complete**: ✅ Pagination implemented

---

## Task 2.5: Add Type Exports (4h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Task 2.1
**Branch**: `feat/api-types`

### Files to Create:
```
dashboard/
└── types/
    └── api/
        ├── repairs.ts
        ├── customers.ts
        ├── pricing.ts
        └── index.ts
```

### Implementation Steps:

#### 2.5.1: Create API Type Definitions (3h)
Create request/response types for each API:

```typescript
// types/api/repairs.ts
import { RepairOrder, Customer, DeviceModel } from '@prisma/client'

export interface CreateRepairRequest {
  customerId: number
  deviceModelId: number
  deviceImei?: string
  deviceSerial?: string
  devicePassword?: string
  issueDescription?: string
  priority: 'normal' | 'urgent' | 'express'
  repairItems: CreateRepairItemRequest[]
}

export interface CreateRepairItemRequest {
  repairTypeId: number
  partTypeId: number
  quantity: number
  unitPrice: number
  discount: number
}

export interface UpdateRepairRequest {
  status?: string
  assignedTechnicianId?: number
  estimatedCompletion?: string
  // ... other updatable fields
}

export interface RepairResponse extends RepairOrder {
  customer: Customer
  deviceModel: DeviceModel & {
    brand: Brand
  }
  repairOrderItems: RepairOrderItemResponse[]
}

// ... more types
```

#### 2.5.2: Export from API Routes (1h)
Add type exports to API route files:

```typescript
// app/api/repairs/route.ts
export type { CreateRepairRequest, RepairResponse } from '@/types/api/repairs'
```

### Testing Checklist:
- [ ] All API types exported
- [ ] Frontend can import and use types
- [ ] Types match actual API responses
- [ ] TypeScript autocomplete works

**Task 2.5 Complete**: ✅ API types exported

---

**PHASE 2 COMPLETE** ✅

**Deliverables**:
- ✅ No `any` types remaining
- ✅ Structured logging with Pino
- ✅ Database indexes for performance
- ✅ Pagination on all list endpoints
- ✅ API type definitions exported

**Deploy to Test**: Merge to `develop`
**Testing Period**: 1-2 days

---

# PHASE 3: Testing Infrastructure (1 Week - 24 hours)

**Goal**: Automated test coverage for confidence

---

## Task 3.1: Setup Testing Framework (4h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: Phase 2 complete
**Branch**: `feat/testing-setup`

### Files to Create:
```
dashboard/
├── jest.config.js
├── jest.setup.js
├── __tests__/
│   └── setup.ts
└── __mocks__/
    └── prisma.ts
```

### Implementation Steps:

#### 3.1.1: Install Dependencies (15min)
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest
```

#### 3.1.2: Configure Jest (1h)
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.NEXTAUTH_SECRET = 'test-secret'
```

#### 3.1.3: Create Prisma Mock (1h)
```typescript
// __mocks__/prisma.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})
```

#### 3.1.4: Update package.json (15min)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

#### 3.1.5: Create Test Utilities (1.5h)
```typescript
// __tests__/setup.ts
import { Session } from 'next-auth'

export const mockSession: Session = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockRepairOrder = {
  id: 1,
  orderNumber: 'RO-001',
  customerId: 1,
  deviceModelId: 1,
  status: 'pending',
  priority: 'normal',
  totalPrice: 100,
  depositPaid: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockCustomer = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ... more test fixtures
```

### Testing Checklist:
- [ ] Jest runs successfully
- [ ] Can import test utilities
- [ ] Prisma mock works
- [ ] Coverage reports generate

**Task 3.1 Complete**: ✅ Testing framework configured

---

## Task 3.2: API Route Tests (6h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: Task 3.1
**Branch**: `test/api-routes`

### Files to Create:
```
dashboard/
└── __tests__/
    └── api/
        ├── repairs.test.ts
        ├── customers.test.ts
        ├── pricing.test.ts
        └── auth.test.ts
```

### Implementation Steps:

#### 3.2.1: Test Repairs API (2h)
```typescript
// __tests__/api/repairs.test.ts
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/repairs/route'
import { prismaMock } from '@/__mocks__/prisma'
import { mockRepairOrder } from '@/__tests__/setup'

describe('/api/repairs', () => {
  describe('GET', () => {
    it('returns paginated repairs', async () => {
      prismaMock.repairOrder.findMany.mockResolvedValue([mockRepairOrder])
      prismaMock.repairOrder.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/repairs?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.meta.total).toBe(1)
    })

    it('filters by status', async () => {
      prismaMock.repairOrder.findMany.mockResolvedValue([mockRepairOrder])
      prismaMock.repairOrder.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/repairs?status=pending')
      await GET(request)

      expect(prismaMock.repairOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' }
        })
      )
    })
  })

  describe('POST', () => {
    it('creates a new repair order', async () => {
      const newRepair = {
        customerId: 1,
        deviceModelId: 1,
        status: 'pending',
        priority: 'normal',
        repairItems: []
      }

      prismaMock.repairOrder.create.mockResolvedValue(mockRepairOrder)

      const request = new NextRequest('http://localhost:3000/api/repairs', {
        method: 'POST',
        body: JSON.stringify(newRepair)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(1)
    })

    it('validates input', async () => {
      const invalidRepair = {
        customerId: 'not-a-number', // Invalid
        deviceModelId: 1,
      }

      const request = new NextRequest('http://localhost:3000/api/repairs', {
        method: 'POST',
        body: JSON.stringify(invalidRepair)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
```

#### 3.2.2: Test Customers API (1.5h)
Similar tests for customer endpoints

#### 3.2.3: Test Pricing API (1.5h)
Test pricing endpoints including AI estimation

#### 3.2.4: Test Auth API (1h)
Test authentication flows

### Testing Checklist:
- [ ] All CRUD operations tested
- [ ] Validation tests pass
- [ ] Error cases covered
- [ ] Authentication tested
- [ ] Coverage > 70%

**Task 3.2 Complete**: ✅ API tests written

---

## Task 3.3: Business Logic Tests (4h)

**Owner**: Claude Code
**Priority**: 🟠 P1 High
**Dependencies**: Task 3.1
**Branch**: `test/business-logic`

### Files to Create:
```
dashboard/
└── __tests__/
    └── lib/
        ├── pricing-estimator.test.ts
        ├── encryption.test.ts
        ├── notifications.test.ts
        └── lightspeed.test.ts
```

### Implementation Steps:

#### 3.3.1: Test Pricing Calculator (2h)
```typescript
// __tests__/lib/pricing-estimator.test.ts
import { PricingEstimator } from '@/lib/pricing-estimator'

describe('PricingEstimator', () => {
  let estimator: PricingEstimator

  beforeEach(() => {
    estimator = new PricingEstimator()
  })

  describe('estimate', () => {
    it('calculates price with confidence score', async () => {
      const result = await estimator.estimate({
        deviceModel: 'iPhone 14 Pro',
        repairType: 'Screen Replacement',
        partQuality: 5
      })

      expect(result.estimatedPrice).toBeGreaterThan(0)
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(1)
    })

    it('applies markup correctly', () => {
      const cost = 100
      const markup = 1.5
      const result = estimator.calculatePrice(cost, markup)

      expect(result).toBe(150)
    })

    it('handles edge cases', () => {
      expect(() => estimator.calculatePrice(-100, 1.5)).toThrow()
      expect(() => estimator.calculatePrice(100, -1)).toThrow()
    })
  })
})
```

#### 3.3.2: Test Encryption (1h)
```typescript
// __tests__/lib/encryption.test.ts
import { encryptDevicePassword, decryptDevicePassword } from '@/lib/encryption'

describe('Encryption', () => {
  it('encrypts and decrypts password', () => {
    const password = 'secret123'
    const encrypted = encryptDevicePassword(password)
    const decrypted = decryptDevicePassword(encrypted)

    expect(encrypted).not.toBe(password)
    expect(decrypted).toBe(password)
  })

  it('handles empty strings', () => {
    expect(encryptDevicePassword('')).toBe('')
    expect(decryptDevicePassword('')).toBe('')
  })
})
```

#### 3.3.3: Test Other Utilities (1h)

### Testing Checklist:
- [ ] Pricing calculations tested
- [ ] Encryption/decryption tested
- [ ] Edge cases covered
- [ ] All utility functions tested

**Task 3.3 Complete**: ✅ Business logic tests written

---

## Task 3.4: Component Tests (6h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Task 3.1
**Branch**: `test/components`

### Files to Create:
```
dashboard/
└── __tests__/
    └── components/
        ├── repairs/
        │   ├── NewRepairForm.test.tsx
        │   └── RepairCard.test.tsx
        ├── customers/
        │   └── CustomerForm.test.tsx
        └── Header.test.tsx
```

### Implementation Steps:

#### 3.4.1: Test Forms (3h)
```typescript
// __tests__/components/repairs/NewRepairForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewRepairForm from '@/components/repairs/NewRepairForm'

describe('NewRepairForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders form fields', () => {
    render(<NewRepairForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/device model/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/issue description/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<NewRepairForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/customer is required/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits valid form', async () => {
    render(<NewRepairForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText(/customer/i), '1')
    await user.selectOptions(screen.getByLabelText(/device model/i), '1')
    await user.type(screen.getByLabelText(/issue description/i), 'Screen cracked')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })
})
```

#### 3.4.2: Test Display Components (2h)
Test cards, lists, etc.

#### 3.4.3: Test Header/Navigation (1h)

### Testing Checklist:
- [ ] Form validation tested
- [ ] User interactions tested
- [ ] Accessibility tested
- [ ] Props handled correctly

**Task 3.4 Complete**: ✅ Component tests written

---

## Task 3.5: Error Boundaries (4h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `feat/error-boundaries`

### Files to Create:
```
dashboard/
├── components/
│   └── ErrorBoundary.tsx
└── app/
    └── error.tsx
```

### Implementation Steps:

#### 3.5.1: Create Error Boundary (2h)
```typescript
// components/ErrorBoundary.tsx
'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error({ error, errorInfo }, 'React Error Boundary caught error')
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### 3.5.2: Create Next.js Error Page (1h)
```typescript
// app/error.tsx
'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error({ error }, 'Next.js error boundary caught error')
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-3xl font-bold text-red-600 mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  )
}
```

#### 3.5.3: Wrap Components (1h)
Update key components to use error boundaries

### Testing Checklist:
- [ ] Error boundary catches errors
- [ ] Errors logged correctly
- [ ] Fallback UI displays
- [ ] Reset functionality works

**Task 3.5 Complete**: ✅ Error boundaries implemented

---

**PHASE 3 COMPLETE** ✅

**Deliverables**:
- ✅ Jest + React Testing Library configured
- ✅ 70%+ test coverage on critical paths
- ✅ API route tests
- ✅ Business logic tests
- ✅ Component tests
- ✅ Error boundaries

**Deploy to Test**: Merge to `develop`
**Testing Period**: 2 days

---

# PHASE 4: Performance & Scale (1 Week - 20 hours)

**Goal**: Fast, scalable application

---

## Task 4.1: Redis Caching Layer (6h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Phase 3 complete
**Branch**: `feat/caching`

### Files to Create:
```
dashboard/
└── lib/
    └── cache.ts                  # Redis cache utilities
```

### Implementation Steps:

#### 4.1.1: Install Redis Client (5min)
```bash
npm install ioredis
npm install -D @types/ioredis
```

#### 4.1.2: Create Cache Utility (2h)
```typescript
// lib/cache.ts
import Redis from 'ioredis'
import { logger } from './logger'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('error', (error) => {
  logger.error({ error }, 'Redis connection error')
})

export interface CacheOptions {
  ttl?: number // seconds
  tags?: string[]
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    if (!cached) return null

    return JSON.parse(cached) as T
  } catch (error) {
    logger.error({ error, key }, 'Cache get error')
    return null
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const { ttl = 300 } = options // Default 5 minutes
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    logger.error({ error, key }, 'Cache set error')
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    logger.error({ error, key }, 'Cache delete error')
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    logger.error({ error, pattern }, 'Cache invalidate error')
  }
}

// Cache helper for API responses
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached) {
    logger.debug({ key }, 'Cache hit')
    return cached
  }

  logger.debug({ key }, 'Cache miss')
  const fresh = await fetcher()
  await cacheSet(key, fresh, options)

  return fresh
}
```

#### 4.1.3: Cache Reference Data (2h)
```typescript
// lib/cache-keys.ts
export const cacheKeys = {
  brands: {
    all: () => 'brands:all',
    byId: (id: number) => `brands:${id}`,
  },
  deviceModels: {
    all: () => 'device-models:all',
    byId: (id: number) => `device-models:${id}`,
    byBrand: (brandId: number) => `device-models:brand:${brandId}`,
  },
  repairTypes: {
    all: () => 'repair-types:all',
    active: () => 'repair-types:active',
  },
  partTypes: {
    all: () => 'part-types:all',
    active: () => 'part-types:active',
  },
  pricing: {
    lookup: (deviceId: number, repairId: number, partId: number) =>
      `pricing:${deviceId}:${repairId}:${partId}`,
    byDevice: (deviceId: number) => `pricing:device:${deviceId}`,
  },
}

// Update API routes to use cache
// app/api/brands/route.ts
import { withCache, cacheKeys } from '@/lib/cache'

export async function GET() {
  const brands = await withCache(
    cacheKeys.brands.all(),
    () => prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    { ttl: 3600 } // Cache for 1 hour
  )

  return NextResponse.json(brands)
}
```

#### 4.1.4: Cache Invalidation (1.5h)
Add cache invalidation on mutations:

```typescript
// app/api/brands/route.ts
export async function POST(request: NextRequest) {
  // ... create brand

  // Invalidate cache
  await cacheDelete(cacheKeys.brands.all())

  return NextResponse.json(brand)
}
```

#### 4.1.5: Setup Redis (YOU DO) (30min)
1. Install Redis locally or use Upstash
2. Add `REDIS_URL` to `.env`

### Testing Checklist:
- [ ] Cache hits work
- [ ] Cache misses fetch fresh data
- [ ] Cache invalidation works
- [ ] TTL expires correctly
- [ ] Performance improved (measure)

**Task 4.1 Complete**: ✅ Redis caching implemented

---

## Task 4.2: Query Optimization (5h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Task 4.1
**Branch**: `perf/query-optimization`

### Implementation Steps:

#### 4.2.1: Audit Slow Queries (1h)
Enable Prisma query logging and identify slow queries

#### 4.2.2: Optimize Dashboard Query (2h)
```typescript
// Before: 4 separate queries
const repairs = await prisma.repairOrder.findMany()
const customers = await prisma.customer.count()
const revenue = await prisma.repairOrder.aggregate({ _sum: { totalPrice: true } })
const pending = await prisma.repairOrder.count({ where: { status: 'pending' } })

// After: Single efficient query with aggregation
const [stats, recentRepairs] = await Promise.all([
  prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT r.id) as total_repairs,
      SUM(r.total_price) as total_revenue,
      COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.id END) as pending_repairs
    FROM repair_orders r
    LEFT JOIN customers c ON r.customer_id = c.id
  `,
  prisma.repairOrder.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      deviceModel: { select: { name: true } }
    }
  })
])
```

#### 4.2.3: Optimize Pricing Lookup (1h)
Add compound index and optimize query

#### 4.2.4: Add Query Result Caching (1h)
Cache expensive aggregation queries

### Testing Checklist:
- [ ] Query times reduced by 50%+
- [ ] No N+1 queries
- [ ] Aggregations optimized
- [ ] Cache working correctly

**Task 4.2 Complete**: ✅ Queries optimized

---

## Task 4.3: Add Monitoring (4h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `feat/monitoring`

### Files to Create:
```
dashboard/
└── lib/
    └── monitoring.ts             # Sentry integration
```

### Implementation Steps:

#### 4.3.1: Setup Sentry (YOU DO) (30min)
1. Create account at sentry.io
2. Create new project
3. Get DSN

#### 4.3.2: Install Sentry (1h)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### 4.3.3: Configure Sentry (1.5h)
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    // Don't send PII
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.Authorization
    }
    return event
  },
})
```

#### 4.3.4: Add Performance Monitoring (1h)
Add transaction tracking for API routes

### Testing Checklist:
- [ ] Errors logged to Sentry
- [ ] Performance tracked
- [ ] No PII sent to Sentry
- [ ] Source maps uploaded

**Task 4.3 Complete**: ✅ Monitoring configured

---

## Task 4.4: Bundle Optimization (3h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `perf/bundle-optimization`

### Implementation Steps:

#### 4.4.1: Analyze Bundle (30min)
```bash
npm install -D @next/bundle-analyzer
```

Update `next.config.ts`:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

Run: `ANALYZE=true npm run build`

#### 4.4.2: Dynamic Imports (1.5h)
Convert large components to dynamic imports:

```typescript
// Before:
import PricingMatrix from '@/components/pricing/PricingMatrix'

// After:
import dynamic from 'next/dynamic'
const PricingMatrix = dynamic(() => import('@/components/pricing/PricingMatrix'), {
  loading: () => <div>Loading...</div>
})
```

#### 4.4.3: Remove Unused Dependencies (30min)
```bash
npm install -D depcheck
npx depcheck
```

Remove unused packages

#### 4.4.4: Optimize Images (30min)
Use Next.js Image component

### Testing Checklist:
- [ ] Bundle size reduced by 20%+
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals improved
- [ ] No unused dependencies

**Task 4.4 Complete**: ✅ Bundle optimized

---

## Task 4.5: Add CDN (2h)

**Owner**: You + Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `feat/cdn`

### Implementation Steps:

#### 4.5.1: Configure Cloudflare (YOU DO) (1h)
1. Point domain to Cloudflare
2. Enable CDN caching
3. Configure cache rules

#### 4.5.2: Add Cache Headers (1h)
Update Next.js config for optimal caching

### Testing Checklist:
- [ ] Static assets served from CDN
- [ ] Cache headers correct
- [ ] TTFB improved

**Task 4.5 Complete**: ✅ CDN configured

---

**PHASE 4 COMPLETE** ✅

**Deliverables**:
- ✅ Redis caching layer
- ✅ Query optimization
- ✅ Sentry monitoring
- ✅ Bundle optimization
- ✅ CDN configured

**Deploy to Staging**: Merge to staging branch
**Testing Period**: 3-5 days with production-like load

---

# PHASE 5: Feature Completion (1 Week - 28 hours)

**Goal**: Finish half-implemented features

---

## Task 5.1: SMS Notifications (8h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Phase 4 complete
**Branch**: `feat/sms-notifications`

### Files to Create:
```
dashboard/
├── lib/
│   └── twilio.ts                # Twilio integration
└── app/api/
    └── notifications/
        └── send/route.ts         # Send notification endpoint
```

### Implementation Steps:

#### 5.1.1: Create Twilio Service (2h)
```typescript
// lib/twilio.ts
import twilio from 'twilio'
import { logger } from './logger'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export interface SMSParams {
  to: string
  message: string
}

export async function sendSMS({ to, message }: SMSParams): Promise<boolean> {
  try {
    const result = await client.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    })

    logger.info({ messageSid: result.sid, to }, 'SMS sent successfully')
    return true
  } catch (error) {
    logger.error({ error, to }, 'Failed to send SMS')
    return false
  }
}
```

#### 5.1.2: Update Notification Library (2h)
```typescript
// lib/notifications.ts (enhance existing)
import { sendSMS } from './twilio'
import { sendEmail } from './sendgrid'
import { prisma } from './db'

export async function sendRepairStatusNotification(
  repairOrderId: number,
  newStatus: string
) {
  const repair = await prisma.repairOrder.findUnique({
    where: { id: repairOrderId },
    include: {
      customer: true,
      deviceModel: { include: { brand: true } }
    }
  })

  if (!repair) return

  const preferences = JSON.parse(repair.customer.notificationPreferences || '{}')
  const message = generateStatusMessage(repair, newStatus)

  // Create notification record
  const notification = await prisma.notification.create({
    data: {
      repairOrderId,
      customerId: repair.customerId,
      type: preferences.sms ? 'sms' : 'email',
      eventType: 'status_change',
      subject: `Repair Status Update: ${repair.orderNumber}`,
      message,
      status: 'pending'
    }
  })

  // Send based on preference
  if (preferences.sms && repair.customer.phone) {
    const sent = await sendSMS({
      to: repair.customer.phone,
      message
    })

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: sent ? 'sent' : 'failed',
        sentAt: sent ? new Date() : null,
        errorMessage: sent ? null : 'Failed to send SMS'
      }
    })
  }

  if (preferences.email && repair.customer.email) {
    const sent = await sendEmail({
      to: repair.customer.email,
      subject: `Repair Status Update: ${repair.orderNumber}`,
      html: message
    })

    // Update notification status
  }
}

function generateStatusMessage(repair: any, status: string): string {
  const statusMessages: Record<string, string> = {
    in_progress: `Your ${repair.deviceModel.brand.name} ${repair.deviceModel.name} repair is now in progress.`,
    completed: `Great news! Your device repair is complete.`,
    ready_pickup: `Your device is ready for pickup at our store.`,
    delivered: `Your device has been delivered. Thank you for choosing us!`
  }

  return statusMessages[status] || `Your repair status has been updated to: ${status}`
}
```

#### 5.1.3: Trigger Notifications on Status Change (2h)
Update `/api/repairs/[id]/status/route.ts`:

```typescript
import { sendRepairStatusNotification } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await request.json()

  const repair = await prisma.repairOrder.update({
    where: { id: parseInt(params.id) },
    data: { status }
  })

  // Send notification asynchronously
  sendRepairStatusNotification(repair.id, status).catch(error => {
    logger.error({ error, repairId: repair.id }, 'Failed to send notification')
  })

  return NextResponse.json(repair)
}
```

#### 5.1.4: Create Notification Queue (2h)
Use BullMQ for reliable delivery:

```bash
npm install bullmq
```

```typescript
// lib/queues/notifications.ts
import { Queue, Worker } from 'bullmq'
import { sendSMS } from '../twilio'
import { sendEmail } from '../sendgrid'

export const notificationQueue = new Queue('notifications', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Worker to process notifications
const worker = new Worker('notifications', async (job) => {
  const { type, to, message, subject } = job.data

  if (type === 'sms') {
    await sendSMS({ to, message })
  } else if (type === 'email') {
    await sendEmail({ to, subject, html: message })
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})
```

### Testing Checklist:
- [ ] SMS messages sent successfully
- [ ] Twilio credentials validated
- [ ] Notifications queued correctly
- [ ] Failed messages retried
- [ ] Customer preferences respected

**Task 5.1 Complete**: ✅ SMS notifications implemented

---

## Task 5.2: Email Notifications (8h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Task 5.1
**Branch**: `feat/email-notifications`

### Files to Create:
```
dashboard/
├── lib/
│   ├── sendgrid.ts              # SendGrid integration
│   └── email-templates/
│       ├── repair-status.ts
│       ├── repair-complete.ts
│       └── ready-pickup.ts
```

### Implementation Steps:

#### 5.2.1: Create SendGrid Service (2h)
```typescript
// lib/sendgrid.ts
import sgMail from '@sendgrid/mail'
import { logger } from './logger'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export interface EmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL || 'noreply@theprofitplatform.com.au'
}: EmailParams): Promise<boolean> {
  try {
    await sgMail.send({
      to,
      from,
      subject,
      html,
    })

    logger.info({ to, subject }, 'Email sent successfully')
    return true
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email')
    return false
  }
}
```

#### 5.2.2: Create Email Templates (4h)
```typescript
// lib/email-templates/repair-status.ts
export interface RepairStatusEmailData {
  customerName: string
  orderNumber: string
  deviceName: string
  status: string
  estimatedCompletion?: string
}

export function generateRepairStatusEmail(data: RepairStatusEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Repair Status Update</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>We have an update on your repair:</p>
            <ul>
              <li><strong>Order Number:</strong> ${data.orderNumber}</li>
              <li><strong>Device:</strong> ${data.deviceName}</li>
              <li><strong>Status:</strong> <span class="status-badge">${data.status}</span></li>
              ${data.estimatedCompletion ? `<li><strong>Estimated Completion:</strong> ${data.estimatedCompletion}</li>` : ''}
            </ul>
            <p>Thank you for choosing The Profit Platform!</p>
          </div>
          <div class="footer">
            <p>The Profit Platform<br>
            repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

Create templates for:
- Repair status changes
- Repair completed
- Ready for pickup
- Delivered

#### 5.2.3: Integrate Email Sending (1h)
Update notification library to use templates

#### 5.2.4: Add Email Testing Endpoint (1h)
```typescript
// app/api/notifications/test/route.ts
export async function POST(request: NextRequest) {
  const { email, type } = await request.json()

  const testData = {
    customerName: 'Test User',
    orderNumber: 'RO-TEST',
    deviceName: 'iPhone 14 Pro',
    status: 'completed'
  }

  const html = generateRepairStatusEmail(testData)

  const sent = await sendEmail({
    to: email,
    subject: 'Test Email from Repair Dashboard',
    html
  })

  return NextResponse.json({ success: sent })
}
```

### Testing Checklist:
- [ ] Emails sent successfully
- [ ] Templates render correctly
- [ ] Responsive design works
- [ ] SendGrid credentials validated
- [ ] Unsubscribe link included

**Task 5.2 Complete**: ✅ Email notifications implemented

---

## Task 5.3: Photo Upload API (8h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `feat/photo-upload`

### Files to Create:
```
dashboard/
├── lib/
│   └── storage.ts               # Blob storage utilities
└── app/api/
    └── repairs/
        └── [id]/
            └── photos/
                └── route.ts      # Photo upload endpoint
```

### Implementation Steps:

#### 5.3.1: Choose Storage Solution (YOU DECIDE) (30min)
Options:
- Supabase Storage (easiest, already using Supabase)
- AWS S3
- Cloudflare R2
- Vercel Blob

Recommendation: **Supabase Storage** (integrated with your DB)

#### 5.3.2: Setup Supabase Storage (1h)
```bash
npm install @supabase/storage-js
```

Create storage bucket in Supabase dashboard

#### 5.3.3: Create Storage Utility (2h)
```typescript
// lib/storage.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '' // Use service key for server-side
)

export async function uploadRepairPhoto(
  repairOrderId: number,
  file: File,
  photoType: 'before' | 'after' | 'issue' | 'testing'
): Promise<string | null> {
  try {
    const fileName = `repairs/${repairOrderId}/${photoType}-${Date.now()}.${file.name.split('.').pop()}`

    const { data, error } = await supabase.storage
      .from('repair-photos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('repair-photos')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error) {
    logger.error({ error, repairOrderId }, 'Failed to upload photo')
    return null
  }
}

export async function deleteRepairPhoto(photoUrl: string): Promise<boolean> {
  try {
    const fileName = photoUrl.split('/').slice(-3).join('/')

    const { error } = await supabase.storage
      .from('repair-photos')
      .remove([fileName])

    if (error) throw error
    return true
  } catch (error) {
    logger.error({ error, photoUrl }, 'Failed to delete photo')
    return false
  }
}
```

#### 5.3.4: Create Upload Endpoint (2h)
```typescript
// app/api/repairs/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uploadRepairPhoto } from '@/lib/storage'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repairOrderId = parseInt(params.id)
    const formData = await request.formData()

    const file = formData.get('file') as File
    const photoType = formData.get('type') as 'before' | 'after' | 'issue' | 'testing'
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Upload to storage
    const photoUrl = await uploadRepairPhoto(repairOrderId, file, photoType)

    if (!photoUrl) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Save to database
    const photo = await prisma.photo.create({
      data: {
        repairOrderId,
        photoUrl,
        photoType,
        description,
        uploadedBy: 1, // TODO: Get from session
        uploadedAt: new Date()
      }
    })

    return NextResponse.json(photo)
  } catch (error) {
    logger.error({ error }, 'Photo upload error')
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const photos = await prisma.photo.findMany({
    where: { repairOrderId: parseInt(params.id) },
    orderBy: { uploadedAt: 'desc' }
  })

  return NextResponse.json(photos)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { photoId } = await request.json()

  const photo = await prisma.photo.findUnique({
    where: { id: photoId }
  })

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  // Delete from storage
  await deleteRepairPhoto(photo.photoUrl)

  // Delete from database
  await prisma.photo.delete({
    where: { id: photoId }
  })

  return NextResponse.json({ success: true })
}
```

#### 5.3.5: Create Frontend Component (2.5h)
```typescript
// components/repairs/PhotoUpload.tsx
'use client'

import { useState } from 'react'

interface PhotoUploadProps {
  repairOrderId: number
  onUploadComplete?: () => void
}

export default function PhotoUpload({ repairOrderId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<any[]>([])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'issue')

    try {
      const res = await fetch(`/api/repairs/${repairOrderId}/photos`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const photo = await res.json()
        setPhotos(prev => [...prev, photo])
        onUploadComplete?.()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}

      <div className="grid grid-cols-3 gap-4 mt-4">
        {photos.map(photo => (
          <img
            key={photo.id}
            src={photo.photoUrl}
            alt={photo.photoType}
            className="w-full h-32 object-cover rounded"
          />
        ))}
      </div>
    </div>
  )
}
```

### Testing Checklist:
- [ ] Photos upload successfully
- [ ] File validation works (size, type)
- [ ] Photos display correctly
- [ ] Delete functionality works
- [ ] Storage bucket configured

**Task 5.3 Complete**: ✅ Photo upload implemented

---

## Task 5.4: Webhook Handlers (4h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: Task 5.1, 5.2
**Branch**: `feat/webhooks`

### Files to Create:
```
dashboard/
└── app/api/
    └── webhooks/
        ├── twilio/route.ts       # Twilio delivery status
        └── sendgrid/route.ts     # SendGrid delivery status
```

### Implementation Steps:

#### 5.4.1: Twilio Webhook (2h)
```typescript
// app/api/webhooks/twilio/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const messageSid = formData.get('MessageSid') as string
  const status = formData.get('MessageStatus') as string

  // Find notification by external ID
  const notification = await prisma.notification.findFirst({
    where: { externalId: messageSid }
  })

  if (notification) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: status === 'delivered' ? 'delivered' : 'failed',
        deliveredAt: status === 'delivered' ? new Date() : null,
        errorMessage: status === 'failed' ? 'Delivery failed' : null
      }
    })
  }

  return NextResponse.json({ success: true })
}
```

#### 5.4.2: SendGrid Webhook (2h)
Similar implementation for email delivery tracking

### Testing Checklist:
- [ ] Webhook endpoints respond correctly
- [ ] Delivery status updated
- [ ] Failed messages logged
- [ ] Webhook security validated

**Task 5.4 Complete**: ✅ Webhooks implemented

---

**PHASE 5 COMPLETE** ✅

**Deliverables**:
- ✅ SMS notifications with Twilio
- ✅ Email notifications with SendGrid
- ✅ Photo upload with blob storage
- ✅ Webhook handlers for delivery tracking

**Deploy to Production**: Merge to `main`

---

# PHASE 6: Polish & Documentation (3 Days - 12 hours)

**Goal**: Production-ready documentation and final polish

---

## Task 6.1: Update Documentation (4h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: All phases complete
**Branch**: `docs/final-update`

### Files to Create/Update:
```
/
├── README.md                     # Main project README
├── DEPLOYMENT.md                 # Deployment guide
├── TESTING.md                    # Testing guide
├── API.md                        # API documentation
└── CHANGELOG.md                  # Version history
```

### Tasks:
- Update README with current features
- Document all environment variables
- Create deployment checklist
- Document testing procedures
- Create troubleshooting guide

**Task 6.1 Complete**: ✅ Documentation updated

---

## Task 6.2: Add Health Checks (2h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `feat/health-checks`

### Implementation:
Enhance `/api/health` endpoint:

```typescript
export async function GET() {
  const checks = {
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    twilio: await checkTwilioConnection(),
    sendgrid: await checkSendGridConnection(),
  }

  const healthy = Object.values(checks).every(check => check)

  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: healthy ? 200 : 503
  })
}
```

**Task 6.2 Complete**: ✅ Health checks implemented

---

## Task 6.3: Add OpenAPI Documentation (3h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: None
**Branch**: `docs/openapi`

### Implementation:
Generate OpenAPI/Swagger documentation for all API endpoints

**Task 6.3 Complete**: ✅ API documentation generated

---

## Task 6.4: Performance Audit (2h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: All phases complete
**Branch**: `perf/audit`

### Tasks:
- Run Lighthouse audit
- Test Core Web Vitals
- Load test with k6
- Document performance benchmarks

**Task 6.4 Complete**: ✅ Performance audited

---

## Task 6.5: Security Audit (1h)

**Owner**: Claude Code
**Priority**: 🟡 P2 Medium
**Dependencies**: All phases complete
**Branch**: `security/final-audit`

### Tasks:
- Run `npm audit`
- Check OWASP Top 10 compliance
- Verify all secrets rotated
- Penetration testing checklist

**Task 6.5 Complete**: ✅ Security audited

---

**PHASE 6 COMPLETE** ✅

**Deliverables**:
- ✅ Complete documentation
- ✅ Health check endpoint
- ✅ OpenAPI documentation
- ✅ Performance benchmarks
- ✅ Security audit report

---

# 🎉 PROJECT COMPLETE

---

## Final Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (70%+ coverage)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size optimized
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Backup strategy in place

### Deployment
- [ ] Deploy to test environment
- [ ] Run smoke tests
- [ ] Monitor for 48 hours
- [ ] Deploy to production
- [ ] Enable monitoring
- [ ] Set up alerts

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] User acceptance testing
- [ ] Documentation published
- [ ] Team training completed

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | 70%+ | 0% → 75% |
| Security Score | 8/10+ | 2/10 → 9/10 |
| Type Safety | 95%+ | 65% → 98% |
| API Response Time | <200ms | 800ms → 150ms |
| Lighthouse Score | 90+ | - → 93 |
| Bug Count | <5 | - |

---

## Maintenance Plan

### Weekly
- Review error logs in Sentry
- Check performance metrics
- Review failed notifications

### Monthly
- Update dependencies
- Security audit
- Performance optimization
- Backup verification

### Quarterly
- Major feature releases
- Architecture review
- Load testing
- Disaster recovery drill

---

## Support & Resources

**Documentation**: `/docs`
**API Docs**: `/api-docs`
**Monitoring**: Sentry Dashboard
**Logs**: Cloudflare/Vercel Dashboard
**Database**: Supabase Dashboard

---

## Next Steps (Future Enhancements)

### Phase 7 (Optional)
- Mobile app (React Native)
- Advanced analytics dashboard
- Multi-tenant support
- Customer portal
- Inventory management
- Warranty tracking
- Loyalty points system
- Integration with more POS systems

---

**Total Investment**: 136 hours over 6-7 weeks
**ROI**: Production-ready, secure, scalable SaaS application
**Quality Score**: 5.5/10 → 9/10

---

*End of Comprehensive Improvement Plan*
