# 🔌 API & Integrations Comprehensive Upgrade Plan

**Date:** November 10, 2025  
**Focus:** APIs, Integrations, and External Services  
**Status:** Complete Analysis & Strategic Plan

---

## 📊 Executive Summary

### Current State:
- ✅ **16 API routes** implemented in repair-dashboard
- ✅ **Smart pricing algorithm** with interpolation (85% confidence)
- ✅ **4 integration services** partially implemented:
  - Lightspeed POS (customer sync)
  - Gemini AI (pricing intelligence)
  - Twilio (SMS - placeholder)
  - SendGrid (Email - placeholder)
- ⚠️ **Gaps:** Incomplete notification system, missing WebSocket, no webhooks, limited error handling

### Upgrade Goals:
1. ✅ Complete all API routes to REST best practices
2. ✅ Implement real Twilio and SendGrid integrations
3. ✅ Add WebSocket for real-time updates
4. ✅ Create webhook system for integrations
5. ✅ Add API rate limiting and security
6. ✅ Comprehensive API documentation (OpenAPI/Swagger)
7. ✅ Integration testing and monitoring

---

## 🗂️ Table of Contents

1. [Current API Analysis](#current-api-analysis)
2. [Integration Status](#integration-status)
3. [API Gaps & Issues](#api-gaps--issues)
4. [Upgrade Architecture](#upgrade-architecture)
5. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
6. [API Documentation](#api-documentation)
7. [Integration Examples](#integration-examples)
8. [Testing Strategy](#testing-strategy)
9. [Security & Performance](#security--performance)
10. [Cost Analysis](#cost-analysis)

---

## 1. Current API Analysis

### ✅ Implemented API Routes (16 routes)

#### Core CRUD APIs:
| Route | Methods | Status | Completeness |
|-------|---------|--------|--------------|
| `/api/brands` | GET, POST | ✅ Complete | 100% |
| `/api/device-models` | GET, POST | ✅ Complete | 100% |
| `/api/repair-types` | GET, POST | ✅ Complete | 100% |
| `/api/part-types` | GET, POST | ✅ Complete | 100% |
| `/api/customers` | GET, POST, PUT | ✅ Complete | 100% |
| `/api/customers/[id]` | GET, PUT, DELETE | ✅ Complete | 100% |
| `/api/repairs` | GET, POST | ✅ Complete | 90% |
| `/api/repairs/[id]` | GET, PUT, DELETE | ✅ Complete | 90% |
| `/api/repairs/[id]/status` | PATCH | ✅ Complete | 85% |
| `/api/pricing` | GET, POST, PUT | ✅ Complete | 95% |
| `/api/pricing/estimate` | POST | ✅ Complete | 100% |
| `/api/devices` | GET | ✅ Complete | 100% |
| `/api/settings` | GET, PUT | ✅ Complete | 80% |

#### Integration APIs:
| Route | Methods | Status | Completeness |
|-------|---------|--------|--------------|
| `/api/integrations/lightspeed/customers` | GET, POST, PUT | ✅ Implemented | 90% |
| `/api/integrations/lightspeed/pricing` | GET, POST | ✅ Implemented | 85% |
| `/api/integrations/gemini/pricing` | GET, POST | ✅ Implemented | 90% |

### 📊 API Structure Quality

**Strengths:**
- ✅ RESTful design principles
- ✅ Proper HTTP status codes
- ✅ JSON request/response format
- ✅ Query parameter filtering
- ✅ Prisma ORM for type safety
- ✅ Server-side rendering with Next.js

**Weaknesses:**
- ⚠️ **No authentication/authorization** (critical security issue)
- ⚠️ **Limited error handling** (generic 500 errors)
- ⚠️ **No input validation middleware** (Zod schemas not used in API)
- ⚠️ **No rate limiting**
- ⚠️ **No API versioning** (/v1, /v2)
- ⚠️ **No pagination on large datasets**
- ⚠️ **No CORS configuration**
- ⚠️ **No request logging/monitoring**
- ⚠️ **No caching headers**

---

## 2. Integration Status

### 2.1 Lightspeed POS Integration 🟢 90% Complete

**Status:** Core functionality implemented, needs refinement

**Implemented:**
- ✅ Customer sync (bidirectional)
- ✅ Customer creation in Lightspeed
- ✅ Customer update sync
- ✅ Item/pricing sync structure
- ✅ Basic authentication (API key)

**Missing:**
- ❌ Sales/transaction sync
- ❌ Inventory sync
- ❌ Webhook listeners
- ❌ Bulk sync operations
- ❌ Conflict resolution
- ❌ Sync status dashboard
- ❌ Error recovery mechanism
- ❌ Rate limit handling

**Code Quality:**
```typescript
// Current implementation (lib/lightspeed.ts)
export class LightspeedService {
  ✅ Good: Singleton pattern
  ✅ Good: Type-safe interfaces
  ✅ Good: Error handling
  ⚠️  Needs: Rate limit management
  ⚠️  Needs: Retry logic
  ⚠️  Needs: Webhook support
}
```

---

### 2.2 Gemini AI Integration 🟡 75% Complete

**Status:** Functional but needs production hardening

**Implemented:**
- ✅ Price intelligence API
- ✅ Market insights generation
- ✅ Structured prompt engineering
- ✅ JSON response parsing
- ✅ Fallback handling

**Missing:**
- ❌ Response caching (expensive API calls)
- ❌ Batch processing for multiple items
- ❌ Cost tracking/limits
- ❌ A/B testing of prompts
- ❌ Feedback loop for accuracy
- ❌ Alternative model support (GPT-4, Claude)
- ❌ Prompt versioning

**Improvements Needed:**
```typescript
// Current issues:
1. No caching → Every request hits Gemini API ($$$)
2. No cost tracking → Could exceed budget
3. Hard-coded model → Should be configurable
4. No prompt templates → Difficult to A/B test
5. No fallback to alternative AI providers
```

**Recommendation:**
```typescript
// Upgrade to multi-provider system
interface AIProvider {
  name: 'gemini' | 'openai' | 'anthropic'
  getPricing(params): Promise<PriceRecommendation>
}

// Add caching layer
class CachedAIService {
  private cache: Redis // or in-memory
  private provider: AIProvider
  
  async getPricing(params) {
    const cacheKey = hash(params)
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    const result = await this.provider.getPricing(params)
    await this.cache.set(cacheKey, result, TTL_24_HOURS)
    return result
  }
}
```

---

### 2.3 Twilio SMS Integration 🔴 30% Complete

**Status:** Placeholder only, needs full implementation

**Current State:**
```typescript
// lib/notifications.ts - Placeholder only
export async function sendNotification(data: NotificationData) {
  console.log('Notification queued:', data) // ❌ NOT ACTUALLY SENDING
  return true
}
```

**What's Needed:**
```typescript
// Proper Twilio implementation
import twilio from 'twilio'

export class TwilioService {
  private client: twilio.Twilio
  
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }
  
  async sendSMS(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      })
      
      // Log to database
      await this.logNotification({
        type: 'sms',
        externalId: result.sid,
        status: result.status,
        to: to,
        message: message
      })
      
      return { success: true, messageId: result.sid }
    } catch (error) {
      // Log error
      await this.logNotification({
        type: 'sms',
        status: 'failed',
        error: error.message,
        to: to,
        message: message
      })
      
      throw error
    }
  }
  
  async handleStatusCallback(webhookData: TwilioStatusCallback) {
    // Update notification status in database
    await prisma.notification.update({
      where: { externalId: webhookData.MessageSid },
      data: {
        status: webhookData.MessageStatus,
        deliveredAt: webhookData.MessageStatus === 'delivered' 
          ? new Date() 
          : null
      }
    })
  }
}
```

**Features to Implement:**
- ✅ SMS sending with Twilio
- ✅ Delivery status tracking (webhooks)
- ✅ Template management
- ✅ Opt-out handling
- ✅ Cost tracking per message
- ✅ Queue system for batch sending
- ✅ Retry failed messages
- ✅ International number support
- ✅ Message history

---

### 2.4 SendGrid Email Integration 🔴 30% Complete

**Status:** Placeholder only, needs full implementation

**What's Needed:**
```typescript
import sgMail from '@sendgrid/mail'

export class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  }
  
  async sendEmail(params: {
    to: string
    subject: string
    html: string
    templateId?: string
    dynamicData?: object
  }) {
    try {
      const msg = {
        to: params.to,
        from: {
          email: process.env.FROM_EMAIL,
          name: process.env.BUSINESS_NAME
        },
        subject: params.subject,
        html: params.html,
        ...(params.templateId && {
          templateId: params.templateId,
          dynamicTemplateData: params.dynamicData
        })
      }
      
      const result = await sgMail.send(msg)
      
      // Log to database
      await this.logNotification({
        type: 'email',
        externalId: result[0].headers['x-message-id'],
        status: 'sent',
        to: params.to,
        subject: params.subject
      })
      
      return { success: true, messageId: result[0].headers['x-message-id'] }
    } catch (error) {
      await this.logNotification({
        type: 'email',
        status: 'failed',
        error: error.message,
        to: params.to,
        subject: params.subject
      })
      
      throw error
    }
  }
  
  async handleWebhook(events: SendGridEvent[]) {
    for (const event of events) {
      await prisma.notification.update({
        where: { externalId: event['sg_message_id'] },
        data: {
          status: event.event, // 'delivered', 'opened', 'bounced', etc.
          deliveredAt: event.event === 'delivered' ? new Date(event.timestamp * 1000) : null
        }
      })
    }
  }
}
```

**Features to Implement:**
- ✅ Email sending with SendGrid
- ✅ HTML template support
- ✅ Dynamic template system
- ✅ Attachment support
- ✅ Event tracking (open, click, bounce)
- ✅ Webhook handlers
- ✅ Unsubscribe management
- ✅ Email validation
- ✅ Batch sending
- ✅ A/B testing support

---

### 2.5 Missing Integrations 🔴 Not Implemented

#### Payment Processors (High Priority)
**Stripe Integration:**
```typescript
// Add for online payments, deposits
class StripeService {
  // Payment intents
  // Checkout sessions
  // Subscription billing (for protection plans)
  // Refunds
  // Payment history
}
```

**Benefits:**
- Accept credit cards
- Manage deposits
- Automated invoicing
- Recurring billing for protection plans

#### Cloud Storage (Medium Priority)
**AWS S3 or Cloudinary:**
```typescript
// For device photos
class CloudStorageService {
  // Upload before/after photos
  // Compress images
  // Generate thumbnails
  // CDN delivery
}
```

#### Analytics (Medium Priority)
**Posthog or Mixpanel:**
```typescript
// Track user behavior
class AnalyticsService {
  // Track repair creation
  // Monitor conversion rates
  // A/B test features
  // Customer journey
}
```

#### Error Monitoring (High Priority)
**Sentry:**
```typescript
// Track errors in production
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1
})
```

---

## 3. API Gaps & Issues

### 3.1 Critical Issues 🔴

#### Issue #1: No Authentication
**Problem:** All API routes are public  
**Risk:** Anyone can read/modify data  
**Impact:** Critical security vulnerability

**Solution:**
```typescript
// Implement NextAuth.js with API route protection
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permissions
  if (!session.user.permissions.includes('read:repairs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Continue with request...
}
```

#### Issue #2: No Input Validation
**Problem:** API accepts any data without validation  
**Risk:** SQL injection, bad data, crashes  
**Impact:** High

**Solution:**
```typescript
// Use Zod for validation
import { z } from 'zod'

const createRepairSchema = z.object({
  customerId: z.number().positive(),
  deviceModelId: z.number().positive(),
  issueDescription: z.string().min(10).max(1000),
  priority: z.enum(['normal', 'urgent', 'express']),
  items: z.array(z.object({
    repairTypeId: z.number().positive(),
    partTypeId: z.number().positive(),
    unitPrice: z.number().positive()
  })).min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createRepairSchema.parse(body)
    
    // Use validated data...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 422 })
    }
  }
}
```

#### Issue #3: No Rate Limiting
**Problem:** APIs can be abused with unlimited requests  
**Risk:** DDoS, increased costs, performance degradation  
**Impact:** High

**Solution:**
```typescript
// Use upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true
})

export async function GET(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success, limit, remaining } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString()
        }
      }
    )
  }
  
  // Continue...
}
```

### 3.2 High Priority Issues 🟡

#### Issue #4: No WebSocket Support
**Problem:** No real-time updates  
**Use Cases:** Live status board, notifications, collaborative editing

**Solution:**
```typescript
// Use Socket.io
import { Server } from 'socket.io'

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL }
  })
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    
    socket.on('subscribe:repairs', (shopId) => {
      socket.join(`shop:${shopId}:repairs`)
    })
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
  
  return io
}

// Emit events from API routes
export async function updateRepairStatus(repairId: number, status: string) {
  const repair = await prisma.repairOrder.update({
    where: { id: repairId },
    data: { status }
  })
  
  // Emit to all connected clients
  io.to(`shop:${repair.shopId}:repairs`).emit('repair:updated', repair)
  
  return repair
}
```

#### Issue #5: No Webhook System
**Problem:** No way for external systems to notify us  
**Use Cases:** Payment confirmations, SMS delivery status, Lightspeed sync

**Solution:**
```typescript
// Create webhook receiver
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature')
  const body = await request.text()
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  // Handle different event types
  switch (event.type) {
    case 'twilio.sms.delivered':
      await handleSMSDelivered(event.data)
      break
    case 'stripe.payment.succeeded':
      await handlePaymentSucceeded(event.data)
      break
    // ... more event types
  }
  
  return NextResponse.json({ received: true })
}
```

#### Issue #6: No API Documentation
**Problem:** Developers don't know how to use APIs  
**Impact:** Poor developer experience, integration errors

**Solution:**
```typescript
// Generate OpenAPI/Swagger docs
import { createSwaggerSpec } from 'next-swagger-doc'

const swaggerSpec = createSwaggerSpec({
  apiFolder: 'app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Repair Dashboard API',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
})

// Serve at /api-docs
```

### 3.3 Medium Priority Issues 🟠

- ❌ No API versioning (/api/v1, /api/v2)
- ❌ No pagination metadata
- ❌ No field selection (GraphQL-like)
- ❌ No bulk operations
- ❌ No async job system
- ❌ No request/response compression
- ❌ No CORS configuration
- ❌ No request ID tracking
- ❌ No response caching

---

## 4. Upgrade Architecture

### 4.1 Target Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Pages    │  │ Components │  │   Hooks    │            │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘            │
│         │                │                │                   │
│         └────────────────┴────────────────┘                   │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   API Layer │
                    │  (Next.js)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                   │
  ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
  │   Auth    │     │  Business │     │ WebSocket │
  │ Middleware│     │   Logic   │     │  Server   │
  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼─────┐           ┌─────▼─────┐
        │  Prisma   │           │   Redis   │
        │    ORM    │           │  (Cache)  │
        └─────┬─────┘           └───────────┘
              │
        ┌─────▼─────┐
        │ PostgreSQL│
        │ (Primary) │
        └───────────┘

┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Lightspeed POS │   Gemini AI     │  Twilio SMS             │
│  (Customer Sync)│   (Pricing)     │  (Notifications)        │
├─────────────────┼─────────────────┼─────────────────────────┤
│  SendGrid Email │   Stripe        │  Sentry                 │
│  (Notifications)│   (Payments)    │  (Error Tracking)       │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 4.2 API Route Organization

```
/api
├── /v1                         # Version 1 (current)
│   ├── /auth
│   │   ├── /login              POST
│   │   ├── /logout             POST
│   │   ├── /refresh            POST
│   │   └── /me                 GET
│   ├── /repairs
│   │   ├── /                   GET, POST
│   │   ├── /[id]               GET, PUT, DELETE
│   │   ├── /[id]/status        PATCH
│   │   ├── /[id]/items         GET, POST
│   │   ├── /[id]/photos        GET, POST
│   │   ├── /[id]/timeline      GET
│   │   └── /stats              GET
│   ├── /customers
│   │   ├── /                   GET, POST
│   │   ├── /[id]               GET, PUT, DELETE
│   │   ├── /[id]/repairs       GET
│   │   └── /search             GET
│   ├── /pricing
│   │   ├── /                   GET, POST, PUT
│   │   ├── /estimate           POST
│   │   ├── /batch-estimate     POST
│   │   ├── /import             POST (CSV)
│   │   └── /export             GET (CSV)
│   ├── /notifications
│   │   ├── /                   GET, POST
│   │   ├── /[id]/resend        POST
│   │   └── /templates          GET, POST, PUT
│   ├── /integrations
│   │   ├── /lightspeed
│   │   │   ├── /customers      GET, POST, PUT
│   │   │   ├── /sync           POST
│   │   │   └── /status         GET
│   │   ├── /gemini
│   │   │   ├── /pricing        POST
│   │   │   └── /insights       GET
│   │   └── /twilio
│   │       ├── /send           POST
│   │       └── /webhook        POST
│   ├── /webhooks
│   │   ├── /twilio             POST
│   │   ├── /sendgrid           POST
│   │   ├── /stripe             POST
│   │   └── /lightspeed         POST
│   ├── /analytics
│   │   ├── /dashboard          GET
│   │   ├── /revenue            GET
│   │   ├── /repairs            GET
│   │   └── /customers          GET
│   └── /admin
│       ├── /users              GET, POST, PUT, DELETE
│       ├── /settings           GET, PUT
│       └── /logs               GET
└── /v2                         # Future version
    └── ...
```

---

## 5. Phase-by-Phase Implementation

### Phase 1: Security & Foundation (Week 1-2) 🔴 CRITICAL

#### 1.1 Authentication & Authorization
```bash
npm install next-auth@latest @auth/prisma-adapter bcryptjs
npm install --save-dev @types/bcryptjs
```

**Implementation:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !await compare(credentials.password, user.password)) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Protect API Routes:**
```typescript
// lib/auth-helpers.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest, NextResponse } from 'next/server'

export async function requireAuth(
  request: NextRequest,
  requiredRoles?: string[]
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (requiredRoles && !requiredRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  return null // Auth successful
}

// Usage in API route
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request, ['admin', 'manager'])
  if (authError) return authError
  
  // Continue with request...
}
```

#### 1.2 Input Validation
```typescript
// lib/validation-schemas.ts
import { z } from 'zod'

export const createRepairSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
  deviceModelId: z.number().int().positive('Device model is required'),
  deviceImei: z.string().optional(),
  devicePassword: z.string().optional(),
  priority: z.enum(['normal', 'urgent', 'express']).default('normal'),
  issueDescription: z.string().min(10, 'Please provide more details').max(2000),
  cosmeticCondition: z.string().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  depositPaid: z.number().min(0).default(0),
  items: z.array(z.object({
    repairTypeId: z.number().int().positive(),
    partTypeId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).max(100).default(0)
  })).min(1, 'At least one repair item is required')
})

export const updateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'in_progress',
    'waiting_parts',
    'completed',
    'ready_pickup',
    'delivered',
    'cancelled'
  ]),
  notes: z.string().optional()
})

// Middleware for validation
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<{ data: T } | NextResponse> => {
    try {
      const body = await request.json()
      const data = schema.parse(body)
      return { data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 422 })
      }
      throw error
    }
  }
}
```

#### 1.3 Rate Limiting
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create multiple rate limiters for different use cases
export const globalRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'ratelimit:global'
})

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 login attempts per 15 minutes
  analytics: true,
  prefix: 'ratelimit:auth'
})

export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 API calls per minute
  analytics: true,
  prefix: 'ratelimit:api'
})

// Middleware
export async function applyRateLimit(
  request: NextRequest,
  limiter: Ratelimit = globalRateLimit
) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success, limit, remaining, reset } = await limiter.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  return null // Rate limit passed
}
```

**Timeline:** 1-2 weeks  
**Priority:** Critical  
**Cost:** $0 (Upstash free tier: 10,000 requests/day)

---

### Phase 2: Complete Notification System (Week 3) 🔴 HIGH

#### 2.1 Twilio SMS Integration
```bash
npm install twilio
```

```typescript
// lib/services/twilio.service.ts
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

export class TwilioService {
  private client: twilio.Twilio
  
  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured')
    }
    
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }
  
  async sendSMS(params: {
    to: string
    message: string
    repairOrderId?: number
    customerId: number
  }) {
    try {
      // Send via Twilio
      const result = await this.client.messages.create({
        body: params.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: params.to,
        statusCallback: `${process.env.APP_URL}/api/webhooks/twilio`
      })
      
      // Log to database
      await prisma.notification.create({
        data: {
          customerId: params.customerId,
          repairOrderId: params.repairOrderId,
          type: 'sms',
          message: params.message,
          status: 'sent',
          externalId: result.sid
        }
      })
      
      return { success: true, messageId: result.sid }
    } catch (error: any) {
      // Log failed attempt
      await prisma.notification.create({
        data: {
          customerId: params.customerId,
          repairOrderId: params.repairOrderId,
          type: 'sms',
          message: params.message,
          status: 'failed',
          errorMessage: error.message
        }
      })
      
      throw error
    }
  }
  
  async handleWebhook(data: any) {
    await prisma.notification.update({
      where: { externalId: data.MessageSid },
      data: {
        status: data.MessageStatus,
        deliveredAt: data.MessageStatus === 'delivered' ? new Date() : null
      }
    })
  }
  
  async getMessageStatus(messageSid: string) {
    const message = await this.client.messages(messageSid).fetch()
    return message.status
  }
}

export const twilioService = new TwilioService()
```

#### 2.2 SendGrid Email Integration
```bash
npm install @sendgrid/mail
```

```typescript
// lib/services/sendgrid.service.ts
import sgMail from '@sendgrid/mail'
import { prisma } from '@/lib/prisma'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export class SendGridService {
  async sendEmail(params: {
    to: string
    subject: string
    html: string
    templateId?: string
    dynamicData?: object
    repairOrderId?: number
    customerId: number
  }) {
    try {
      const msg: any = {
        to: params.to,
        from: {
          email: process.env.FROM_EMAIL!,
          name: process.env.BUSINESS_NAME || 'Repair Shop'
        },
        subject: params.subject,
        html: params.html
      }
      
      // Use template if provided
      if (params.templateId) {
        msg.templateId = params.templateId
        msg.dynamicTemplateData = params.dynamicData
        delete msg.html
      }
      
      const result = await sgMail.send(msg)
      
      // Log to database
      await prisma.notification.create({
        data: {
          customerId: params.customerId,
          repairOrderId: params.repairOrderId,
          type: 'email',
          subject: params.subject,
          message: params.html,
          status: 'sent',
          externalId: result[0].headers['x-message-id']
        }
      })
      
      return { success: true, messageId: result[0].headers['x-message-id'] }
    } catch (error: any) {
      await prisma.notification.create({
        data: {
          customerId: params.customerId,
          repairOrderId: params.repairOrderId,
          type: 'email',
          subject: params.subject,
          message: params.html,
          status: 'failed',
          errorMessage: error.message
        }
      })
      
      throw error
    }
  }
  
  async handleWebhook(events: any[]) {
    for (const event of events) {
      await prisma.notification.update({
        where: { externalId: event['sg_message_id'] },
        data: {
          status: event.event,
          deliveredAt: event.event === 'delivered' 
            ? new Date(event.timestamp * 1000) 
            : null
        }
      })
    }
  }
}

export const sendGridService = new SendGridService()
```

#### 2.3 Notification Orchestrator
```typescript
// lib/services/notification.service.ts
import { twilioService } from './twilio.service'
import { sendGridService } from './sendgrid.service'
import { prisma } from '@/lib/prisma'

export class NotificationService {
  async sendRepairNotification(
    repairOrderId: number,
    eventType: 'created' | 'status_changed' | 'ready_pickup' | 'completed',
    customOverride?: { message?: string; subject?: string }
  ) {
    // Get repair order with customer
    const repair = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        deviceModel: {
          include: { brand: true }
        }
      }
    })
    
    if (!repair) throw new Error('Repair order not found')
    
    // Get customer notification preferences
    const prefs = JSON.parse(repair.customer.notificationPreferences || '{}')
    
    // Generate message based on event type
    const message = customOverride?.message || this.getMessageTemplate(eventType, repair)
    const subject = customOverride?.subject || this.getSubjectTemplate(eventType, repair)
    
    // Send SMS if enabled
    if (prefs.sms && repair.customer.phone) {
      try {
        await twilioService.sendSMS({
          to: repair.customer.phone,
          message: message.sms,
          repairOrderId: repair.id,
          customerId: repair.customerId
        })
      } catch (error) {
        console.error('Failed to send SMS:', error)
      }
    }
    
    // Send Email if enabled
    if (prefs.email && repair.customer.email) {
      try {
        await sendGridService.sendEmail({
          to: repair.customer.email,
          subject,
          html: message.html,
          repairOrderId: repair.id,
          customerId: repair.customerId
        })
      } catch (error) {
        console.error('Failed to send email:', error)
      }
    }
  }
  
  private getMessageTemplate(eventType: string, repair: any) {
    const deviceName = `${repair.deviceModel.brand.name} ${repair.deviceModel.name}`
    const orderNumber = repair.orderNumber
    const customerName = repair.customer.firstName
    
    const templates = {
      created: {
        sms: `Hi ${customerName}! We've received your ${deviceName}. Order #${orderNumber}. We'll update you soon!`,
        html: `<h2>Hi ${customerName}!</h2><p>We've received your <strong>${deviceName}</strong> for repair.</p><p>Order Number: <strong>${orderNumber}</strong></p><p>We'll diagnose it and send you a quote shortly.</p>`
      },
      status_changed: {
        sms: `Update: Your repair #${orderNumber} status is now ${repair.status}.`,
        html: `<h2>Repair Status Update</h2><p>Order #${orderNumber}</p><p>Status: <strong>${repair.status}</strong></p>`
      },
      ready_pickup: {
        sms: `Great news ${customerName}! Your ${deviceName} is ready for pickup. Order #${orderNumber}.`,
        html: `<h2>Device Ready for Pickup!</h2><p>Hi ${customerName},</p><p>Your <strong>${deviceName}</strong> is ready!</p><p>Order #${orderNumber}</p>`
      },
      completed: {
        sms: `Thank you ${customerName}! Your repair #${orderNumber} is complete. We hope to see you again!`,
        html: `<h2>Repair Complete!</h2><p>Thank you ${customerName}!</p><p>Your repair #${orderNumber} is complete.</p>`
      }
    }
    
    return templates[eventType as keyof typeof templates] || templates.created
  }
  
  private getSubjectTemplate(eventType: string, repair: any) {
    const subjects = {
      created: `Repair Order Received - ${repair.orderNumber}`,
      status_changed: `Repair Status Update - ${repair.orderNumber}`,
      ready_pickup: `Device Ready for Pickup - ${repair.orderNumber}`,
      completed: `Repair Completed - ${repair.orderNumber}`
    }
    
    return subjects[eventType as keyof typeof subjects] || `Repair Update - ${repair.orderNumber}`
  }
}

export const notificationService = new NotificationService()
```

**Timeline:** 1 week  
**Priority:** High  
**Cost:** ~$50-200/month (Twilio + SendGrid)

---

### Phase 3: WebSocket & Real-time (Week 4) 🟡 MEDIUM

#### 3.1 Socket.io Setup
```bash
npm install socket.io socket.io-client
```

```typescript
// lib/socket-server.ts
import { Server as SocketServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { verify } from 'jsonwebtoken'

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    },
    path: '/api/socket'
  })
  
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Authentication error'))
    }
    
    try {
      const decoded = verify(token, process.env.JWT_SECRET!)
      socket.data.userId = decoded.userId
      socket.data.role = decoded.role
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'User:', socket.data.userId)
    
    // Subscribe to repair updates
    socket.on('subscribe:repairs', () => {
      socket.join('repairs')
      console.log('Client subscribed to repairs:', socket.id)
    })
    
    // Subscribe to specific repair
    socket.on('subscribe:repair', (repairId: number) => {
      socket.join(`repair:${repairId}`)
      console.log('Client subscribed to repair:', repairId)
    })
    
    // Subscribe to notifications
    socket.on('subscribe:notifications', () => {
      socket.join(`notifications:${socket.data.userId}`)
    })
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
  
  return io
}

// Emit events from API routes
export async function emitRepairUpdate(repairId: number, data: any) {
  const io = global.io as SocketServer
  if (!io) return
  
  io.to('repairs').emit('repair:updated', { repairId, data })
  io.to(`repair:${repairId}`).emit('repair:updated', data)
}

export async function emitNotification(userId: number, notification: any) {
  const io = global.io as SocketServer
  if (!io) return
  
  io.to(`notifications:${userId}`).emit('notification', notification)
}
```

**Usage in API Routes:**
```typescript
// app/api/repairs/[id]/status/route.ts
import { emitRepairUpdate } from '@/lib/socket-server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // ... update repair status ...
  
  // Emit real-time update
  await emitRepairUpdate(parseInt(params.id), updatedRepair)
  
  return NextResponse.json(updatedRepair)
}
```

**Frontend Client:**
```typescript
// hooks/use-socket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { data: session } = useSession()
  
  useEffect(() => {
    if (!session?.user) return
    
    const socketInstance = io({
      path: '/api/socket',
      auth: {
        token: session.accessToken
      }
    })
    
    socketInstance.on('connect', () => {
      console.log('Socket connected')
    })
    
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
    })
    
    setSocket(socketInstance)
    
    return () => {
      socketInstance.disconnect()
    }
  }, [session])
  
  return socket
}

// Usage in component
export function RepairList() {
  const socket = useSocket()
  const [repairs, setRepairs] = useState([])
  
  useEffect(() => {
    if (!socket) return
    
    // Subscribe to repair updates
    socket.emit('subscribe:repairs')
    
    socket.on('repair:updated', (data) => {
      setRepairs(prev => 
        prev.map(r => r.id === data.repairId ? data.data : r)
      )
    })
    
    return () => {
      socket.off('repair:updated')
    }
  }, [socket])
  
  return <div>...</div>
}
```

**Timeline:** 1 week  
**Priority:** Medium  
**Cost:** $0 (runs on same server)

---

### Phase 4: API Documentation (Week 5) 🟠 MEDIUM

#### 4.1 OpenAPI/Swagger Implementation
```bash
npm install next-swagger-doc swagger-ui-react
npm install --save-dev @types/swagger-ui-react
```

```typescript
// lib/swagger.ts
import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Repair Dashboard API',
        version: '1.0.0',
        description: 'Complete API documentation for the mobile repair shop management system',
        contact: {
          name: 'API Support',
          email: 'support@repairshop.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        },
        {
          url: 'https://your-domain.com/api',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token'
          }
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error message'
              },
              details: {
                type: 'array',
                items: {
                  type: 'object'
                },
                description: 'Additional error details'
              }
            }
          },
          RepairOrder: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              orderNumber: { type: 'string' },
              customerId: { type: 'integer' },
              deviceModelId: { type: 'integer' },
              status: { 
                type: 'string',
                enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'ready_pickup', 'delivered', 'cancelled']
              },
              priority: {
                type: 'string',
                enum: ['normal', 'urgent', 'express']
              },
              totalPrice: { type: 'number' },
              depositPaid: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  })
  
  return spec
}
```

**API Documentation Page:**
```typescript
// app/api-docs/page.tsx
'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      <SwaggerUI url="/api/docs" />
    </div>
  )
}

// app/api/docs/route.ts
import { NextResponse } from 'next/server'
import { getApiDocs } from '@/lib/swagger'

export async function GET() {
  const spec = getApiDocs()
  return NextResponse.json(spec)
}
```

**Add JSDoc Comments to APIs:**
```typescript
/**
 * @swagger
 * /api/repairs:
 *   get:
 *     summary: Get all repair orders
 *     description: Retrieve a list of all repair orders with optional filtering
 *     tags: [Repairs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, waiting_parts, completed]
 *         description: Filter by repair status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of repair orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repairs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RepairOrder'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalPages: { type: integer }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a new repair order
 *     description: Create a new repair order with items
 *     tags: [Repairs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - deviceModelId
 *               - items
 *             properties:
 *               customerId: { type: integer }
 *               deviceModelId: { type: integer }
 *               deviceImei: { type: string }
 *               priority: { type: string, enum: [normal, urgent, express] }
 *               issueDescription: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     repairTypeId: { type: integer }
 *                     partTypeId: { type: integer }
 *                     unitPrice: { type: number }
 *     responses:
 *       201:
 *         description: Repair order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest) {
  // ... implementation
}

export async function POST(request: NextRequest) {
  // ... implementation
}
```

**Timeline:** 1 week  
**Priority:** Medium  
**Cost:** $0

---

## 6. API Documentation Examples

### 6.1 Complete API Reference

#### Authentication

##### POST /api/auth/login
**Description:** Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "admin@repairshop.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@repairshop.com",
    "name": "Admin User",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

---

#### Repairs

##### GET /api/repairs
**Description:** Get all repair orders with filtering and pagination

**Query Parameters:**
- `status` (optional): Filter by status (pending, in_progress, completed, etc.)
- `customerId` (optional): Filter by customer ID
- `priority` (optional): Filter by priority (normal, urgent, express)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "repairs": [
    {
      "id": 1,
      "orderNumber": "RR25111001",
      "customerId": 5,
      "deviceModelId": 10,
      "status": "in_progress",
      "priority": "normal",
      "issueDescription": "Screen cracked, not responding to touch",
      "totalPrice": 249.99,
      "depositPaid": 50.00,
      "estimatedCompletion": "2025-11-12T14:00:00Z",
      "createdAt": "2025-11-10T09:00:00Z",
      "customer": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+61412345678",
        "email": "john@example.com"
      },
      "deviceModel": {
        "id": 10,
        "name": "iPhone 15 Pro",
        "brand": {
          "id": 1,
          "name": "Apple"
        }
      },
      "repairOrderItems": [
        {
          "id": 1,
          "repairTypeId": 1,
          "partTypeId": 1,
          "quantity": 1,
          "unitPrice": 249.99,
          "totalPrice": 249.99,
          "repairType": {
            "id": 1,
            "name": "Screen Replacement"
          },
          "partType": {
            "id": 1,
            "name": "OEM (Original)"
          }
        }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Example:**
```bash
# Get all repairs
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/repairs

# Get pending repairs for customer #5
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/repairs?status=pending&customerId=5"
```

##### POST /api/repairs
**Description:** Create a new repair order

**Request:**
```json
{
  "customerId": 5,
  "deviceModelId": 10,
  "deviceImei": "123456789012345",
  "devicePassword": "1234",
  "priority": "normal",
  "issueDescription": "Screen cracked after drop, touch not responding in bottom right corner",
  "cosmeticCondition": "Good condition overall, minor scratches on back",
  "estimatedCompletion": "2025-11-12T14:00:00Z",
  "depositPaid": 50.00,
  "items": [
    {
      "repairTypeId": 1,
      "partTypeId": 1,
      "quantity": 1,
      "unitPrice": 249.99,
      "discount": 0
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 1,
  "orderNumber": "RR25111001",
  "customerId": 5,
  "deviceModelId": 10,
  "status": "pending",
  "priority": "normal",
  "totalPrice": 249.99,
  "depositPaid": 50.00,
  "createdAt": "2025-11-10T09:00:00Z",
  "customer": { ... },
  "deviceModel": { ... },
  "repairOrderItems": [ ... ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/repairs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5,
    "deviceModelId": 10,
    "priority": "normal",
    "issueDescription": "Screen cracked",
    "items": [{
      "repairTypeId": 1,
      "partTypeId": 1,
      "unitPrice": 249.99
    }]
  }'
```

---

#### Pricing Estimation

##### POST /api/pricing/estimate
**Description:** Get intelligent price estimate for a repair

**Request:**
```json
{
  "deviceModelId": 10,
  "repairTypeId": 1,
  "partTypeId": 1,
  "save": false
}
```

**Response (200):**
```json
{
  "price": 249,
  "confidence": 0.85,
  "isEstimated": true,
  "method": "interpolation",
  "references": [8, 12],
  "deviceModelId": 10,
  "repairTypeId": 1,
  "partTypeId": 1,
  "explanation": "Price estimated based on iPhone 14 Pro ($229) and iPhone 15 Pro Max ($269) using linear interpolation",
  "priceRange": {
    "min": 229,
    "max": 269
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/pricing/estimate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceModelId": 10,
    "repairTypeId": 1,
    "partTypeId": 1
  }'
```

---

#### Gemini AI Pricing Intelligence

##### POST /api/integrations/gemini/pricing
**Description:** Get AI-powered pricing recommendations

**Request:**
```json
{
  "deviceBrand": "Apple",
  "deviceModel": "iPhone 15 Pro",
  "repairType": "Screen Replacement",
  "partQuality": "OEM"
}
```

**Response (200):**
```json
{
  "success": true,
  "configured": true,
  "recommendation": {
    "suggestedPrice": 289,
    "minPrice": 249,
    "maxPrice": 329,
    "marketAverage": 279,
    "confidence": 85,
    "reasoning": "Based on current Sydney market rates for iPhone 15 Pro screen replacements with OEM parts. Premium device commands premium pricing, but competition keeps prices below $300 for most shops.",
    "sources": [
      "Current market analysis (November 2025)",
      "Part availability and cost trends",
      "Sydney CBD pricing comparison",
      "Device popularity and demand"
    ],
    "lastUpdated": "2025-11-10T10:30:00Z"
  }
}
```

---

#### Lightspeed Customer Sync

##### GET /api/integrations/lightspeed/customers?action=sync
**Description:** Sync customers from Lightspeed POS

**Response (200):**
```json
{
  "success": true,
  "synced": 15,
  "customers": [
    {
      "action": "created",
      "customer": {
        "id": 10,
        "lightspeedId": "LS12345",
        "firstName": "Jane",
        "lastName": "Smith",
        "phone": "+61412345678",
        "email": "jane@example.com",
        "lastSyncedAt": "2025-11-10T10:00:00Z"
      }
    },
    {
      "action": "updated",
      "customer": {
        "id": 11,
        "lightspeedId": "LS12346",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+61412345679",
        "email": "john@example.com",
        "lastSyncedAt": "2025-11-10T10:00:01Z"
      }
    }
  ]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/integrations/lightspeed/customers?action=sync&limit=100"
```

---

### 6.2 Error Responses

All API endpoints follow consistent error response format:

#### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required parameter: customerId"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

#### 422 Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "customerId",
      "message": "Customer ID must be a positive integer"
    },
    {
      "field": "items",
      "message": "At least one repair item is required"
    }
  ]
}
```

#### 429 Rate Limit Exceeded
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 60 seconds",
  "retryAfter": 60
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "requestId": "req_abc123xyz"
}
```

---

## 7. Integration Examples

### 7.1 Complete Workflow Example

**Scenario:** Customer brings in iPhone for screen repair

#### Step 1: Create/Find Customer
```bash
# Search for existing customer
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/customers?search=john%20doe"

# Create new customer if not found
curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+61412345678",
    "email": "john@example.com",
    "notificationPreferences": "{\"sms\":true,\"email\":true}"
  }'
```

#### Step 2: Get Price Estimate
```bash
# Option A: Use local algorithm
curl -X POST http://localhost:3000/api/pricing/estimate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceModelId": 10,
    "repairTypeId": 1,
    "partTypeId": 1
  }'

# Option B: Get AI recommendation
curl -X POST http://localhost:3000/api/integrations/gemini/pricing \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceBrand": "Apple",
    "deviceModel": "iPhone 15 Pro",
    "repairType": "Screen Replacement",
    "partQuality": "OEM"
  }'
```

#### Step 3: Create Repair Order
```bash
curl -X POST http://localhost:3000/api/repairs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5,
    "deviceModelId": 10,
    "deviceImei": "123456789012345",
    "priority": "normal",
    "issueDescription": "Cracked screen, touch not working",
    "depositPaid": 50,
    "items": [{
      "repairTypeId": 1,
      "partTypeId": 1,
      "unitPrice": 249.99
    }]
  }'
```
**Response:** Repair created, SMS & Email automatically sent to customer

#### Step 4: Update Status (Triggers Notifications)
```bash
# Start repair
curl -X PATCH http://localhost:3000/api/repairs/1/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Technician has started working on the repair"
  }'
# → Customer receives: "Your repair #RR25111001 is now in progress"

# Mark ready for pickup
curl -X PATCH http://localhost:3000/api/repairs/1/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ready_pickup",
    "notes": "Repair complete, tested successfully"
  }'
# → Customer receives: "Great news! Your device is ready for pickup"
```

#### Step 5: Customer Picks Up (Final Status)
```bash
curl -X PATCH http://localhost:3000/api/repairs/1/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
# → Customer receives: "Thank you! Your repair is complete."
```

---

### 7.2 Lightspeed Integration Workflow

```bash
# 1. Initial sync of customers from Lightspeed
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/integrations/lightspeed/customers?action=sync&limit=500"

# 2. Create customer in both systems
curl -X POST http://localhost:3000/api/integrations/lightspeed/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+61412345678"
  }'
# → Creates in Lightspeed AND local database

# 3. Update customer in both systems
curl -X PUT http://localhost:3000/api/integrations/lightspeed/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 10,
    "lightspeedId": "LS12345",
    "updates": {
      "email": "jane.smith@newemail.com",
      "phone": "+61412999888"
    }
  }'
# → Updates in Lightspeed AND local database
```

---

### 7.3 Webhook Handlers

#### Twilio SMS Status Webhook
```typescript
// app/api/webhooks/twilio/route.ts
export async function POST(request: NextRequest) {
  const body = await request.formData()
  
  const data = {
    MessageSid: body.get('MessageSid'),
    MessageStatus: body.get('MessageStatus'), // delivered, undelivered, failed
    To: body.get('To'),
    From: body.get('From'),
    ErrorCode: body.get('ErrorCode')
  }
  
  // Update notification status in database
  await prisma.notification.update({
    where: { externalId: data.MessageSid as string },
    data: {
      status: data.MessageStatus as string,
      deliveredAt: data.MessageStatus === 'delivered' ? new Date() : null,
      errorMessage: data.ErrorCode ? `Error ${data.ErrorCode}` : null
    }
  })
  
  return NextResponse.json({ received: true })
}
```

#### SendGrid Event Webhook
```typescript
// app/api/webhooks/sendgrid/route.ts
export async function POST(request: NextRequest) {
  const events = await request.json()
  
  for (const event of events) {
    await prisma.notification.update({
      where: { externalId: event['sg_message_id'] },
      data: {
        status: event.event, // delivered, open, click, bounce, etc.
        deliveredAt: event.event === 'delivered' 
          ? new Date(event.timestamp * 1000) 
          : undefined
      }
    })
  }
  
  return NextResponse.json({ received: true })
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Jest + Testing Library)
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/lib/pricing-estimator.test.ts
import { estimatePrice } from '@/lib/pricing-estimator'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pricing: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn()
    },
    deviceModel: {
      findUnique: jest.fn()
    }
  }
}))

describe('Price Estimator', () => {
  it('should return exact price when match exists', async () => {
    (prisma.pricing.findFirst as jest.Mock).mockResolvedValue({
      price: 249.99,
      isEstimated: false
    })
    
    const result = await estimatePrice(1, 1, 1)
    
    expect(result.price).toBe(249.99)
    expect(result.isEstimated).toBe(false)
    expect(result.confidence).toBe(1.0)
    expect(result.method).toBe('exact')
  })
  
  it('should interpolate price between two models', async () => {
    (prisma.pricing.findFirst as jest.Mock).mockResolvedValue(null)
    (prisma.deviceModel.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      brandId: 1,
      name: 'iPhone 14',
      releaseYear: 2022
    })
    (prisma.pricing.findMany as jest.Mock).mockResolvedValue([
      {
        deviceModelId: 1,
        price: 229,
        deviceModel: { releaseYear: 2021 }
      },
      {
        deviceModelId: 3,
        price: 269,
        deviceModel: { releaseYear: 2023 }
      }
    ])
    
    const result = await estimatePrice(2, 1, 1)
    
    expect(result.price).toBeCloseTo(249, 0)
    expect(result.isEstimated).toBe(true)
    expect(result.confidence).toBe(0.85)
    expect(result.method).toBe('interpolation')
  })
})
```

### 8.2 Integration Tests (Playwright)
```bash
npm install --save-dev @playwright/test
```

```typescript
// __tests__/e2e/repair-workflow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Complete Repair Workflow', () => {
  test('should create repair and send notifications', async ({ page, request }) => {
    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'admin@test.com',
        password: 'password123'
      }
    })
    const { accessToken } = await loginResponse.json()
    
    // Create customer
    const customerResponse = await request.post('/api/customers', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+61400000000',
        email: 'test@example.com'
      }
    })
    const customer = await customerResponse.json()
    expect(customerResponse.ok()).toBeTruthy()
    
    // Create repair
    const repairResponse = await request.post('/api/repairs', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        customerId: customer.id,
        deviceModelId: 1,
        priority: 'normal',
        issueDescription: 'Screen cracked',
        items: [{
          repairTypeId: 1,
          partTypeId: 1,
          unitPrice: 249.99
        }]
      }
    })
    const repair = await repairResponse.json()
    expect(repairResponse.ok()).toBeTruthy()
    expect(repair.orderNumber).toMatch(/^RR/)
    
    // Check notifications were created
    const notificationsResponse = await request.get(
      `/api/notifications?repairOrderId=${repair.id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )
    const notifications = await notificationsResponse.json()
    expect(notifications.length).toBeGreaterThan(0)
  })
})
```

### 8.3 API Load Testing (k6)
```bash
npm install --save-dev k6
```

```javascript
// __tests__/load/api-load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  },
}

const BASE_URL = 'http://localhost:3000'
let token = ''

export function setup() {
  // Login once
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  const body = JSON.parse(loginRes.body)
  return { token: body.accessToken }
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  }
  
  // Test GET /api/repairs
  let res = http.get(`${BASE_URL}/api/repairs`, { headers })
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
  
  // Test POST /api/pricing/estimate
  res = http.post(`${BASE_URL}/api/pricing/estimate`, JSON.stringify({
    deviceModelId: 1,
    repairTypeId: 1,
    partTypeId: 1
  }), { headers })
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has price': (r) => JSON.parse(r.body).price > 0,
  })
  
  sleep(1)
}
```

---

## 9. Security & Performance

### 9.1 Security Checklist

#### API Security
- ✅ **Authentication:** JWT tokens with expiration
- ✅ **Authorization:** Role-based access control
- ✅ **Input Validation:** Zod schemas on all inputs
- ✅ **Rate Limiting:** Per-IP and per-user limits
- ✅ **CORS:** Whitelist frontend origins only
- ✅ **HTTPS Only:** Enforce SSL in production
- ✅ **SQL Injection:** Prevented by Prisma ORM
- ✅ **XSS Prevention:** Sanitize HTML outputs
- ✅ **CSRF Protection:** SameSite cookies + tokens
- ✅ **API Versioning:** /api/v1, /api/v2
- ✅ **Error Messages:** Don't leak sensitive info
- ✅ **Webhook Signatures:** Verify all webhooks
- ✅ **Secrets Management:** Environment variables only

#### Integration Security
- ✅ **API Keys:** Store in env variables, never commit
- ✅ **OAuth Tokens:** Refresh tokens securely
- ✅ **Webhook Verification:** HMAC signatures
- ✅ **Retry Logic:** Exponential backoff
- ✅ **Timeout Handling:** Prevent hanging requests
- ✅ **Error Logging:** Sentry for production

### 9.2 Performance Optimization

#### Caching Strategy
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Check cache
  const cached = await redis.get(key)
  if (cached) return cached as T
  
  // Fetch and cache
  const data = await fetcher()
  await redis.set(key, JSON.stringify(data), { ex: ttl })
  return data
}

// Usage in API route
export async function GET(request: NextRequest) {
  const repairs = await getCached(
    'repairs:recent',
    async () => await prisma.repairOrder.findMany({ take: 20 }),
    300 // 5 minutes
  )
  
  return NextResponse.json(repairs)
}
```

#### Database Indexing
```prisma
// prisma/schema.prisma
model RepairOrder {
  id Int @id @default(autoincrement())
  orderNumber String @unique
  customerId Int
  status String
  createdAt DateTime @default(now())
  
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
  @@index([customerId, status])
}
```

#### API Response Compression
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Enable compression
  response.headers.set('Content-Encoding', 'gzip')
  
  // Cache static assets
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store')
  }
  
  return response
}
```

---

## 10. Cost Analysis

### 10.1 Monthly Operating Costs

| Service | Tier | Usage | Monthly Cost |
|---------|------|-------|--------------|
| **Twilio SMS** | Pay-as-you-go | 500 SMS/month | $50 |
| | | 1000 SMS/month | $100 |
| | | 2000 SMS/month | $200 |
| **SendGrid Email** | Essentials | 40,000 emails/month | $15 |
| | | 100,000 emails/month | $50 |
| **Gemini AI** | Pay-per-use | 1000 requests/month | $10 |
| | | 5000 requests/month | $50 |
| **Upstash Redis** | Pay-as-you-go | 10,000 req/day | $0 (free tier) |
| | | 100,000 req/day | $10 |
| **Sentry** | Team | Error monitoring | $26 |
| **Lightspeed** | Included | POS integration | $0 (API included) |
| **Vercel** | Pro | Hosting | $20 |
| **Total (Low)** | | | **$121/month** |
| **Total (Medium)** | | | **$266/month** |
| **Total (High)** | | | **$366/month** |

### 10.2 Development Costs

| Phase | Duration | Effort | Cost @ $100/hr |
|-------|----------|--------|----------------|
| Phase 1: Security & Auth | 2 weeks | 80 hrs | $8,000 |
| Phase 2: Notifications | 1 week | 40 hrs | $4,000 |
| Phase 3: WebSocket | 1 week | 40 hrs | $4,000 |
| Phase 4: Documentation | 1 week | 40 hrs | $4,000 |
| Phase 5: Testing | 1 week | 40 hrs | $4,000 |
| **Total** | **6 weeks** | **240 hrs** | **$24,000** |

### 10.3 ROI Calculation

**Assumptions:**
- Shop processes 200 repairs/month
- Saves 5 minutes per repair (automation)
- Staff hourly rate: $25/hour

**Monthly Savings:**
- Time saved: 200 × 5min = 1,000 min = 16.67 hours
- Labor savings: 16.67 × $25 = **$417/month**

**Net Savings:**
- Monthly savings: $417
- Monthly costs: $266
- **Net gain: $151/month**

**Break-even:**
- Development cost: $24,000
- Monthly net gain: $151
- **Break-even: 159 months (13 years)**

**BUT with increased efficiency:**
- Process 20% more repairs: 240/month
- Additional revenue: 40 × $150 average = **$6,000/month**
- **Break-even: 4 months**

---

## 11. Conclusion & Recommendations

### 11.1 Priority Matrix

| Priority | Items | Timeline | Cost |
|----------|-------|----------|------|
| 🔴 **Critical** | Authentication, Input Validation, Rate Limiting | Week 1-2 | $8,000 |
| 🔴 **High** | Twilio SMS, SendGrid Email | Week 3 | $4,000 |
| 🟡 **Medium** | WebSocket, API Docs | Week 4-5 | $8,000 |
| 🟢 **Low** | Advanced features, Optimizations | Week 6+ | $4,000+ |

### 11.2 Recommended Approach

**Phase 1 (Weeks 1-2): Security Foundation**
1. Implement NextAuth.js
2. Add input validation (Zod)
3. Set up rate limiting
4. Configure CORS properly

**Phase 2 (Week 3): Notifications**
1. Complete Twilio integration
2. Complete SendGrid integration
3. Set up webhook handlers
4. Test notification flow

**Phase 3 (Week 4): Real-time**
1. Implement Socket.io
2. Add real-time status updates
3. Test with multiple clients

**Phase 4 (Week 5): Documentation**
1. Generate OpenAPI spec
2. Add JSDoc comments
3. Create integration guides
4. Set up Swagger UI

**Phase 5 (Week 6+): Polish**
1. Performance optimization
2. Error monitoring (Sentry)
3. Load testing
4. Production deployment

### 11.3 Success Metrics

**Technical KPIs:**
- API response time: < 200ms (p95)
- Uptime: > 99.9%
- Error rate: < 0.1%
- Test coverage: > 80%

**Business KPIs:**
- SMS delivery rate: > 95%
- Email open rate: > 40%
- Customer satisfaction: > 4.5/5
- Time saved per repair: 5+ minutes

### 11.4 Next Steps

1. ✅ **Review this plan** with stakeholders
2. ✅ **Approve budget** ($24,000 development + $266/month operations)
3. ✅ **Set up development environment**
4. ✅ **Begin Phase 1** (Security & Authentication)
5. ✅ **Track progress** weekly
6. ✅ **Deploy to staging** after Phase 2
7. ✅ **User acceptance testing** after Phase 4
8. ✅ **Production launch** after Phase 5

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Ready for Implementation  
**Estimated Completion:** 6 weeks from start

---

*This comprehensive plan provides a complete roadmap for upgrading the API and integrations systems. Follow the phases sequentially for best results, or adjust priorities based on business needs.*
