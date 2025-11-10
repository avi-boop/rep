# System Architecture - Mobile Repair Dashboard

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                           │
├─────────────────────────────────────────────────────────────────┤
│  Web Dashboard (React)  │  Mobile App (Future)  │  Customer     │
│  - Staff Portal         │  - Technician View    │  Portal       │
│  - Admin Panel          │  - Quick Updates      │  - Status     │
│  - Reports              │  - Photo Upload       │  - History    │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / BACKEND                       │
├─────────────────────────────────────────────────────────────────┤
│                    REST API / GraphQL Server                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Auth       │  │  Business    │  │  Background Jobs    │  │
│  │   Service    │  │  Logic       │  │  - Notifications    │  │
│  │              │  │              │  │  - Sync Tasks       │  │
│  └──────────────┘  └──────────────┘  │  - Price Updates    │  │
│                                       └─────────────────────┘  │
└────────┬─────────────┬──────────────────┬─────────────────────┘
         │             │                  │
         ▼             ▼                  ▼
┌────────────────┐ ┌──────────────┐ ┌────────────────────────┐
│   PostgreSQL   │ │    Redis     │ │   File Storage (S3)    │
│   Database     │ │    Cache     │ │   - Photos             │
│                │ │    Sessions  │ │   - Documents          │
│                │ │    Job Queue │ │   - Receipts           │
└────────────────┘ └──────────────┘ └────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Lightspeed  │  │   Twilio     │  │    SendGrid/SES     │  │
│  │  POS System  │  │   SMS API    │  │    Email Service    │  │
│  │              │  │              │  │                     │  │
│  │  - Customers │  │  - Send SMS  │  │  - Send Emails      │  │
│  │  - Sales     │  │  - Status    │  │  - Templates        │  │
│  │  - Inventory │  │  - Delivery  │  │  - Tracking         │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Layer

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          Pages/Routes                          │    │
│  ├────────────────────────────────────────────────┤    │
│  │  /dashboard     - Main overview                │    │
│  │  /repairs       - Repair management            │    │
│  │  /repairs/new   - Create new repair            │    │
│  │  /repairs/:id   - Repair details               │    │
│  │  /pricing       - Price matrix                 │    │
│  │  /customers     - Customer list                │    │
│  │  /reports       - Analytics                    │    │
│  │  /settings      - Configuration                │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          Shared Components                     │    │
│  ├────────────────────────────────────────────────┤    │
│  │  - DeviceSelector (Brand → Model → Variant)   │    │
│  │  - RepairTypeCheckbox (Multi-select)          │    │
│  │  - PriceCalculator (Auto + Manual Override)   │    │
│  │  - StatusBoard (Kanban Drag & Drop)           │    │
│  │  - CustomerSearch (Lightspeed Link)           │    │
│  │  - NotificationPanel                          │    │
│  │  - PriceMatrix (Interactive Table)            │    │
│  │  - PhotoUpload (Multi-image)                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          State Management                      │    │
│  ├────────────────────────────────────────────────┤    │
│  │  - Global State (Zustand/Redux)               │    │
│  │  - Server State (React Query)                 │    │
│  │  - Form State (React Hook Form)               │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Backend Layer

```
┌─────────────────────────────────────────────────────────┐
│                Backend API Server (Node.js/FastAPI)     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          API Routes                            │    │
│  ├────────────────────────────────────────────────┤    │
│  │  /api/repairs                                  │    │
│  │  /api/customers                                │    │
│  │  /api/devices                                  │    │
│  │  /api/pricing                                  │    │
│  │  /api/pricing/estimate                        │    │
│  │  /api/notifications                            │    │
│  │  /api/lightspeed/sync                         │    │
│  │  /api/reports                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          Services                              │    │
│  ├────────────────────────────────────────────────┤    │
│  │  RepairService                                 │    │
│  │    - Create, update, track repairs            │    │
│  │    - Status transitions                       │    │
│  │    - Cost calculations                        │    │
│  │                                                │    │
│  │  PricingService                                │    │
│  │    - Price CRUD operations                    │    │
│  │    - Smart estimation algorithm               │    │
│  │    - Confidence scoring                       │    │
│  │                                                │    │
│  │  NotificationService                           │    │
│  │    - Template rendering                       │    │
│  │    - Multi-channel sending                    │    │
│  │    - Delivery tracking                        │    │
│  │                                                │    │
│  │  LightspeedService                             │    │
│  │    - API authentication                       │    │
│  │    - Data synchronization                     │    │
│  │    - Webhook handling                         │    │
│  │                                                │    │
│  │  CustomerService                               │    │
│  │    - Customer management                      │    │
│  │    - Lightspeed integration                   │    │
│  │                                                │    │
│  │  AnalyticsService                              │    │
│  │    - Report generation                        │    │
│  │    - Metrics calculation                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          Background Workers                    │    │
│  ├────────────────────────────────────────────────┤    │
│  │  - Scheduled sync jobs (cron)                 │    │
│  │  - Notification queue processor               │    │
│  │  - Price estimation batch updates             │    │
│  │  - Report generation                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. New Repair Creation Flow

```
┌──────────┐
│  Staff   │
│  User    │
└────┬─────┘
     │ 1. Enters repair details
     ▼
┌─────────────────┐
│  Web Dashboard  │
│                 │
│  - Device sel   │
│  - Repair types │
│  - Parts qual   │
└────┬────────────┘
     │ 2. Request price calculation
     ▼
┌─────────────────┐
│  Pricing API    │──────► 3. Check database for exact price
│                 │
│                 │──────► 4. If not found, run smart pricing
│                 │           algorithm
└────┬────────────┘
     │ 5. Return price + confidence score
     ▼
┌─────────────────┐
│  Web Dashboard  │
│  Shows:         │
│  - Calculated $ │
│  - Confidence % │
│  - Allow edit   │
└────┬────────────┘
     │ 6. Staff confirms
     ▼
┌─────────────────┐
│  Repair API     │
│  - Create       │
│  - Assign #     │
│  - Set status   │
└────┬────────────┘
     │ 7. Trigger notification
     ▼
┌─────────────────┐         ┌──────────────┐
│  Notification   │────────►│   Customer   │
│  Service        │ SMS     │              │
│                 │────────►│ "Received"   │
└─────────────────┘ Email   └──────────────┘
```

### 2. Smart Pricing Estimation Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Request: Estimate price for iPhone 12 Screen (Aftermarket) │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │  Smart Pricing Engine  │
              └────────────┬───────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌────────┐       ┌────────┐       ┌────────┐
    │Find    │       │Find    │       │Get     │
    │nearby  │       │same    │       │tier    │
    │models  │       │tier    │       │info    │
    └───┬────┘       └───┬────┘       └───┬────┘
        │                │                │
        │  Results:      │  Results:      │
        │  - iPhone 11   │  - iPhone 12   │
        │    $159        │    Mini $179   │
        │  - iPhone 13   │  - iPhone 12   │
        │    $239        │    Pro $259    │
        │                │                │
        └────────────────┼────────────────┘
                         ▼
              ┌─────────────────────┐
              │  Calculate          │
              │  Interpolation:     │
              │                     │
              │  (159 + 239) / 2    │
              │  = $199             │
              │                     │
              │  Adjust for tier:   │
              │  $199 * 1.0 = $199  │
              │                     │
              │  Confidence: 85%    │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Return Estimate:   │
              │  Price: $199        │
              │  Confidence: 85%    │
              │  References:        │
              │  - iPhone 11        │
              │  - iPhone 13        │
              └─────────────────────┘
```

### 3. Lightspeed Sync Flow

```
┌──────────────────────────────────────────────────────────┐
│              Lightspeed Integration                       │
└──────────────────────────────────────────────────────────┘

┌─────────────┐                             ┌──────────────┐
│  Dashboard  │                             │  Lightspeed  │
│             │                             │     POS      │
└──────┬──────┘                             └──────┬───────┘
       │                                           │
       │ 1. Staff searches for customer            │
       │    by phone/name                          │
       ▼                                           │
┌────────────────┐                                 │
│  Customer API  │                                 │
│                │                                 │
│  Checks local  │                                 │
│  database      │                                 │
└────────┬───────┘                                 │
         │                                         │
         │ 2. Not found locally                    │
         ▼                                         │
┌─────────────────────┐                            │
│ Lightspeed Service  │                            │
│                     │                            │
│ - Build API request │                            │
│ - Authenticate      │────────3. API Request─────►│
│                     │                            │
│                     │◄───4. Customer data────────│
└──────────┬──────────┘        (JSON)              │
           │                                       │
           │ 5. Save to local DB                   │
           ▼                                       │
┌────────────────┐                                 │
│  Local         │                                 │
│  Database      │                                 │
│                │                                 │
│  Customer      │                                 │
│  saved with    │                                 │
│  lightspeed_id │                                 │
└────────┬───────┘                                 │
         │                                         │
         │ 6. Return to frontend                   │
         ▼                                         │
┌─────────────────┐                                │
│   Dashboard     │                                │
│                 │                                │
│   Customer info │                                │
│   populated     │                                │
└─────────────────┘                                │
                                                   │
    ════════════════════════════════════════════   │
    When repair completed:                         │
    ════════════════════════════════════════════   │
                                                   │
┌─────────────────┐                                │
│  Repair marked  │                                │
│  "Completed"    │                                │
└────────┬────────┘                                │
         │                                         │
         │ 7. Trigger Lightspeed sale sync         │
         ▼                                         │
┌─────────────────────┐                            │
│ Lightspeed Service  │                            │
│                     │                            │
│ - Build sale data   │                            │
│ - Include items     │                            │
│ - Customer link     │──────8. Create Sale───────►│
│                     │                            │
│                     │◄─────9. Sale ID────────────│
└──────────┬──────────┘                            │
           │                                       │
           │ 10. Log sync status                   │
           ▼                                       │
┌────────────────┐                                 │
│  Sync Log      │                                 │
│  Table         │                                 │
└────────────────┘                                 │
```

---

## Database Entity Relationship Diagram

```
┌──────────────┐          ┌────────────────┐          ┌──────────────┐
│   brands     │          │ device_models  │          │ repair_types │
├──────────────┤          ├────────────────┤          ├──────────────┤
│ id (PK)      │─────────►│ id (PK)        │          │ id (PK)      │
│ name         │ 1      * │ brand_id (FK)  │          │ name         │
│ is_primary   │          │ name           │          │ category     │
└──────────────┘          │ variant        │          │ complexity   │
                          │ release_year   │          └──────────────┘
                          │ tier_level     │                 │
                          └────────┬───────┘                 │
                                   │                         │
                                   │ 1                       │ 1
                                   │                         │
                                   ▼ *                       ▼ *
                          ┌────────────────┐          ┌──────────────┐
                          │    prices      │          │repair_items  │
                          ├────────────────┤          ├──────────────┤
                          │ id (PK)        │          │ id (PK)      │
                          │ device_id (FK) │◄─────┐   │ repair_id(FK)│
                          │ repair_type(FK)│      │   │ type_id (FK) │
                          │ parts_quality  │      │   │ parts_quality│
                          │ total_price    │      │   │ final_price  │
                          │ is_estimated   │      │   │ status       │
                          │ confidence     │      │   └──────┬───────┘
                          └────────────────┘      │          │
                                   │              │          │
                                   │              │          │ *
                                   │              │          │
                                   │              │          ▼ 1
┌──────────────┐          ┌────────────────┐     │   ┌──────────────┐
│  customers   │          │    repairs     │◄────┘   │notifications │
├──────────────┤          ├────────────────┤         ├──────────────┤
│ id (PK)      │─────────►│ id (PK)        │────────►│ id (PK)      │
│ lightspeed_id│ 1      * │ repair_number  │ 1    * │ repair_id(FK)│
│ first_name   │          │ customer_id(FK)│         │ customer(FK) │
│ last_name    │          │ device_id (FK) │         │ type         │
│ phone        │          │ status         │         │ channel      │
│ email        │          │ priority       │         │ message      │
│ notification │          │ total_cost     │         │ sent_at      │
│ _preference  │          │ created_at     │         │ delivered    │
└──────────────┘          └────────────────┘         └──────────────┘
       │                          │
       │                          │
       │                          │
       │                          ▼
       │                  ┌────────────────────┐
       │                  │lightspeed_sync_log │
       │                  ├────────────────────┤
       └─────────────────►│ id (PK)            │
                          │ sync_type          │
                          │ entity_id          │
                          │ lightspeed_id      │
                          │ sync_status        │
                          │ synced_at          │
                          └────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
└─────────────────────────────────────────────────────────────┘

1. Network Layer
   ┌──────────────────────────────────────────┐
   │  - HTTPS/TLS 1.3                         │
   │  - DDoS Protection (Cloudflare)          │
   │  - Rate Limiting                         │
   │  - IP Whitelisting (optional)            │
   └──────────────────────────────────────────┘

2. Authentication Layer
   ┌──────────────────────────────────────────┐
   │  - JWT Tokens (HttpOnly, Secure)         │
   │  - Password Hashing (bcrypt/Argon2)      │
   │  - 2FA for Admin (optional)              │
   │  - Session Management (Redis)            │
   └──────────────────────────────────────────┘

3. Authorization Layer
   ┌──────────────────────────────────────────┐
   │  Role-Based Access Control (RBAC)        │
   │                                          │
   │  Admin     - Full access                 │
   │  Manager   - All except settings         │
   │  Technician- View/update assigned repairs│
   │  Front Desk- Create/view repairs         │
   └──────────────────────────────────────────┘

4. Data Layer
   ┌──────────────────────────────────────────┐
   │  - Encrypted at rest (AES-256)           │
   │  - Encrypted in transit (TLS)            │
   │  - PII data masking in logs              │
   │  - Audit logging                         │
   │  - Regular backups (encrypted)           │
   └──────────────────────────────────────────┘

5. API Layer
   ┌──────────────────────────────────────────┐
   │  - Input validation/sanitization         │
   │  - SQL injection prevention (ORM)        │
   │  - XSS protection                        │
   │  - CSRF tokens                           │
   │  - API key rotation                      │
   └──────────────────────────────────────────┘

6. Integration Layer
   ┌──────────────────────────────────────────┐
   │  - OAuth 2.0 for Lightspeed              │
   │  - API keys stored in env vars           │
   │  - Webhook signature verification        │
   │  - Timeout on external calls             │
   └──────────────────────────────────────────┘
```

---

## Deployment Architecture

### Production Environment

```
                    ┌──────────────────┐
                    │  Load Balancer   │
                    │  (NGINX/ALB)     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  Web App   │ │  Web App   │ │  Web App   │
       │  Instance  │ │  Instance  │ │  Instance  │
       │  (Docker)  │ │  (Docker)  │ │  (Docker)  │
       └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │              │              │
             └──────────────┼──────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       ┌────────────────┐         ┌────────────────┐
       │  PostgreSQL    │         │     Redis      │
       │  (RDS/Managed) │         │   (ElastiCache)│
       │  - Primary     │         │   - Cache      │
       │  - Replica     │         │   - Sessions   │
       │  - Backup      │         │   - Job Queue  │
       └────────────────┘         └────────────────┘

       ┌────────────────┐         ┌────────────────┐
       │  Worker Nodes  │         │  File Storage  │
       │  - Background  │         │     (S3)       │
       │    Jobs        │         │  - Photos      │
       │  - Cron Tasks  │         │  - Documents   │
       └────────────────┘         └────────────────┘
```

### Development/Staging Environment

```
┌────────────────────────────────────────────┐
│          Local Development                 │
│                                            │
│  docker-compose up                         │
│  ├── web (Next.js dev server)             │
│  ├── api (Node.js/FastAPI)                │
│  ├── postgres (local DB)                  │
│  ├── redis (local cache)                  │
│  └── mailcatcher (email testing)          │
│                                            │
│  Hot reload enabled                        │
│  Mock Lightspeed API                       │
│  SMS sent to console                       │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│          Staging Environment               │
│                                            │
│  Mirrors production but:                   │
│  - Smaller instances                       │
│  - Test Lightspeed account                 │
│  - SMS sent to test numbers only           │
│  - Separate database                       │
└────────────────────────────────────────────┘
```

---

## Performance Optimization Strategy

### 1. Database Optimization
```
- Indexes on frequently queried columns
  ✓ repairs.status
  ✓ repairs.customer_id
  ✓ repairs.created_at
  ✓ customers.phone
  ✓ customers.lightspeed_customer_id
  ✓ prices.device_model_id + repair_type_id

- Database connection pooling
- Read replicas for reports
- Materialized views for analytics
```

### 2. API Optimization
```
- Response caching (Redis)
  ✓ Device models list (1 hour)
  ✓ Repair types list (1 hour)
  ✓ Price matrix (15 min)
  ✓ Customer details (5 min)

- Pagination for large lists
- Field selection (GraphQL or sparse fieldsets)
- Compression (gzip)
```

### 3. Frontend Optimization
```
- Code splitting by route
- Lazy loading components
- Image optimization (WebP, lazy load)
- Service Worker (offline support)
- Virtual scrolling for long lists
```

### 4. Background Job Optimization
```
- Job queue priority levels
- Batch processing for notifications
- Scheduled sync during off-hours
- Failed job retry with exponential backoff
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────┐
│              Monitoring Stack                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Application Metrics                                 │
│  ├── Response times                                  │
│  ├── Error rates                                     │
│  ├── API endpoint usage                              │
│  └── Database query performance                      │
│                                                      │
│  Business Metrics                                    │
│  ├── Repairs per day                                 │
│  ├── Average turnaround time                         │
│  ├── Customer satisfaction                           │
│  └── Revenue tracking                                │
│                                                      │
│  Integration Health                                  │
│  ├── Lightspeed sync status                          │
│  ├── SMS delivery rate                               │
│  ├── Email delivery rate                             │
│  └── API error rates                                 │
│                                                      │
│  Infrastructure                                      │
│  ├── CPU/Memory usage                                │
│  ├── Disk space                                      │
│  ├── Database connections                            │
│  └── Cache hit rate                                  │
│                                                      │
│  Tools:                                              │
│  - Application: Sentry (error tracking)              │
│  - Metrics: Prometheus + Grafana                     │
│  - Logs: CloudWatch / Papertrail                     │
│  - Uptime: UptimeRobot / Pingdom                     │
│  - Alerts: PagerDuty / Opsgenie                      │
└─────────────────────────────────────────────────────┘
```

---

## API Endpoints Reference

### Repairs
```
GET    /api/repairs                  # List all repairs (paginated)
POST   /api/repairs                  # Create new repair
GET    /api/repairs/:id              # Get repair details
PATCH  /api/repairs/:id              # Update repair
DELETE /api/repairs/:id              # Delete repair
PATCH  /api/repairs/:id/status       # Update status
GET    /api/repairs/:id/timeline     # Get status history
POST   /api/repairs/:id/photos       # Upload photos
GET    /api/repairs/:id/invoice      # Generate invoice PDF
```

### Customers
```
GET    /api/customers                # List customers
POST   /api/customers                # Create customer
GET    /api/customers/:id            # Get customer
PATCH  /api/customers/:id            # Update customer
GET    /api/customers/search         # Search by phone/name
GET    /api/customers/:id/repairs    # Get repair history
POST   /api/customers/sync           # Sync from Lightspeed
```

### Pricing
```
GET    /api/pricing                  # Get price matrix
GET    /api/pricing/:id              # Get specific price
POST   /api/pricing                  # Create price
PATCH  /api/pricing/:id              # Update price
DELETE /api/pricing/:id              # Delete price
POST   /api/pricing/estimate         # Smart price estimate
POST   /api/pricing/import           # Bulk import (CSV)
GET    /api/pricing/export           # Export to CSV
GET    /api/pricing/gaps             # Find missing prices
```

### Devices
```
GET    /api/brands                   # List brands
GET    /api/devices                  # List device models
POST   /api/devices                  # Add new device
GET    /api/devices/search           # Search devices
GET    /api/repair-types             # List repair types
```

### Notifications
```
GET    /api/notifications            # List notifications
POST   /api/notifications/send       # Send notification
GET    /api/notifications/:id        # Get notification
GET    /api/notifications/templates  # Get templates
PATCH  /api/notifications/templates  # Update templates
```

### Reports
```
GET    /api/reports/revenue          # Revenue report
GET    /api/reports/repairs          # Repairs breakdown
GET    /api/reports/technicians      # Tech performance
GET    /api/reports/customers        # Customer insights
GET    /api/reports/popular-repairs  # Most common repairs
```

### Lightspeed
```
POST   /api/lightspeed/sync          # Manual sync trigger
GET    /api/lightspeed/status        # Sync status
POST   /api/lightspeed/webhook       # Webhook endpoint
GET    /api/lightspeed/customers/:id # Fetch customer
```

---

## Environment Configuration

```env
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://repairs.yourshop.com
SESSION_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/repairs_db
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Lightspeed
LIGHTSPEED_CLIENT_ID=your-client-id
LIGHTSPEED_CLIENT_SECRET=your-client-secret
LIGHTSPEED_ACCOUNT_ID=your-account-id
LIGHTSPEED_REFRESH_TOKEN=your-refresh-token
LIGHTSPEED_WEBHOOK_SECRET=your-webhook-secret

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourshop.com

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=repair-photos

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

This architecture document provides a comprehensive technical overview of the system structure, data flows, and deployment strategy for the mobile repair dashboard. Use it alongside the main project plan for implementation.
