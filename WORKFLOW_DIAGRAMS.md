# Mobile Repair Dashboard - Workflow Diagrams

## 1. Repair Order Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                    REPAIR ORDER WORKFLOW                         │
└──────────────────────────────────────────────────────────────────┘

Customer Arrives
      │
      ▼
┌─────────────────┐
│   CHECK-IN      │  • Verify customer details
│   (Status: New) │  • Record device info (IMEI, condition)
└────────┬────────┘  • Document issues (photos)
         │           • Collect device passcode
         │           • Confirm backup
         ▼
┌─────────────────┐
│   DIAGNOSIS     │  • Technician examines device
│   (In Progress) │  • Identify all issues
└────────┬────────┘  • Check for additional problems
         │           • Test all functions
         │
         ▼
┌─────────────────┐
│  QUOTE APPROVAL │  • Calculate total price
│   (Pending)     │  • Send quote to customer
└────────┬────────┘  • Wait for approval
         │           • (Optional: send SMS/Email)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
APPROVED   DECLINED
    │         │
    │         └──► Order Cancelled
    │
    ▼
┌─────────────────┐
│ PARTS ORDERING  │  • Check parts inventory
│ (Awaiting Parts)│  • Order if not in stock
└────────┬────────┘  • Update ETA
         │           • Notify customer of delays
         │
         ▼
┌─────────────────┐
│  REPAIR START   │  • Assign to technician
│   (In Progress) │  • Begin repair work
└────────┬────────┘  • Update status as repairs complete
         │           • Document any issues
         │
         ▼
┌─────────────────┐
│ QUALITY CHECK   │  • Test all functions
│      (QC)       │  • Screen responsiveness
└────────┬────────┘  • Battery performance
         │           • Camera, audio, charging
         │           • Software updates
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  PASS      FAIL
    │         │
    │         └──► Back to Repair
    │
    ▼
┌─────────────────┐
│  READY FOR      │  • Send pickup notification
│    PICKUP       │  • Prepare invoice
└────────┬────────┘  • Package device securely
         │           • Take final photos
         │
         ▼
┌─────────────────┐
│   CUSTOMER      │  • Demonstrate fixes
│   PICKUP        │  • Collect payment
└────────┬────────┘  • Get signature
         │           • Provide warranty info
         │
         ▼
┌─────────────────┐
│    COMPLETED    │  • Archive order
│    (Closed)     │  • Request review
└─────────────────┘  • Update analytics


Auto-Reminders Timeline:
• Diagnosis Complete → Immediate quote notification
• Quote Sent → 24hr follow-up if no response
• Repair Complete → Immediate pickup notification
• Pickup Ready → 24hr, 3 day, 7 day reminders
```

---

## 2. Smart Pricing Algorithm Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    SMART PRICING WORKFLOW                        │
└──────────────────────────────────────────────────────────────────┘

User Selects:
• Device: iPhone 12 Pro
• Repair: Front Screen
• Quality: Original
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  CHECK PRICE DATABASE                                       │
│  Query: device_id=X, repair_type_id=Y, part_quality=Z      │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │ EXACT MATCH  │        │  NO MATCH    │
    │    FOUND     │        │    FOUND     │
    └──────┬───────┘        └──────┬───────┘
           │                       │
           │                       ▼
           │              ┌─────────────────────┐
           │              │ SMART ESTIMATION    │
           │              │ ALGORITHM ACTIVATED │
           │              └──────────┬──────────┘
           │                         │
           │                         ▼
           │              ┌─────────────────────┐
           │              │ Find Similar Models │
           │              │ • iPhone 11 Pro: $180│
           │              │ • iPhone 13 Pro: $240│
           │              └──────────┬──────────┘
           │                         │
           │                         ▼
           │              ┌─────────────────────┐
           │              │ Linear Interpolation│
           │              │                     │
           │              │ Model Position:     │
           │              │ 11 ←─── 12 ───→ 13 │
           │              │                     │
           │              │ Price Calculation:  │
           │              │ $180 + (240-180)*0.5│
           │              │ = $210              │
           │              │                     │
           │              │ Confidence: 85%     │
           │              └──────────┬──────────┘
           │                         │
           └─────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │  DISPLAY PRICE TO USER │
           │                        │
           │  Price: $210           │
           │  [⚠ Estimated]         │
           │  Confidence: 85%       │
           │                        │
           │  [Adjust Price]        │
           └────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ User Accepts │      │ User Overrides   │
│  Estimated   │      │ Manual Price:    │
│    Price     │      │     $215         │
└──────┬───────┘      └────────┬─────────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ LOG TO PRICING_HISTORY│
       │ • Estimated: $210     │
       │ • Actual: $215        │
       │ • Was_Estimated: true │
       │                       │
       │ Used for ML Learning  │
       └───────────────────────┘
```

---

## 3. Customer Notification Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION SYSTEM WORKFLOW                    │
└──────────────────────────────────────────────────────────────────┘

Trigger Event:
• Order Status Changes
• Manual Send by Staff
• Scheduled Reminder
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  CHECK NOTIFICATION SETTINGS                                │
│  • Customer preferences (SMS/Email/Both)                    │
│  • Shop settings (Auto-send enabled?)                       │
│  • Template exists?                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │  AUTO-SEND   │        │ MANUAL REVIEW│
    │   ENABLED    │        │   REQUIRED   │
    └──────┬───────┘        └──────┬───────┘
           │                       │
           │                       ▼
           │              ┌─────────────────┐
           │              │ Queue for Staff │
           │              │ Review & Send   │
           │              └─────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  PREPARE NOTIFICATION                                       │
│                                                             │
│  Template: REPAIR_READY                                    │
│                                                             │
│  Variables:                                                 │
│  • {customer_name} → "John Doe"                            │
│  • {device_model} → "iPhone 13 Pro"                        │
│  • {order_number} → "RO-2025-00123"                        │
│  • {total_price} → "$210"                                  │
│  • {shop_address} → "123 Main St"                          │
│                                                             │
│  Result:                                                    │
│  "Hi John, your iPhone 13 Pro is ready for pickup!        │
│   Order #RO-2025-00123. Total: $210. Visit us at          │
│   123 Main St. Call 555-1234."                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌────────────────┐            ┌────────────────┐
│   SEND SMS     │            │  SEND EMAIL    │
│   via Twilio   │            │  via SendGrid  │
└────────┬───────┘            └────────┬───────┘
         │                             │
         │    ┌────────────────────┐   │
         └───►│   LOG ATTEMPT      │◄──┘
              │   • Timestamp      │
              │   • Status: Sent   │
              │   • Cost: $0.01    │
              └────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   ┌──────────┐              ┌──────────┐
   │ SUCCESS  │              │  FAILED  │
   │          │              │          │
   │ Mark as  │              │ Retry in │
   │  Sent    │              │ 5 mins   │
   └──────────┘              └────┬─────┘
                                  │
                            ┌─────▼─────┐
                            │ Max 3     │
                            │ Retries   │
                            │           │
                            │ Then:     │
                            │ Alert     │
                            │ Staff     │
                            └───────────┘


Notification Types & Timing:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. REPAIR_RECEIVED      → Immediate (at check-in)
2. DIAGNOSIS_COMPLETE   → Immediate (after diagnosis)
3. QUOTE_REMINDER       → 24 hours after quote sent
4. REPAIR_STARTED       → When status = "in_progress"
5. REPAIR_COMPLETE      → Immediate (when status = "ready")
6. PICKUP_REMINDER_1    → 24 hours after ready
7. PICKUP_REMINDER_2    → 3 days after ready
8. PICKUP_REMINDER_3    → 7 days after ready
```

---

## 4. Lightspeed Integration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              LIGHTSPEED POS INTEGRATION WORKFLOW                 │
└──────────────────────────────────────────────────────────────────┘

Phase 1: Initial Setup
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTHENTICATION                                             │
│                                                             │
│  1. Admin enters Lightspeed API credentials:               │
│     • Account ID                                            │
│     • Client ID                                             │
│     • Client Secret                                         │
│                                                             │
│  2. OAuth Flow:                                             │
│     Dashboard → Lightspeed Auth → Redirect → Store Token   │
│                                                             │
│  3. Test Connection → ✓ Success                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  INITIAL CUSTOMER SYNC (One-Time)                          │
│                                                             │
│  Fetch all customers from Lightspeed:                       │
│  GET /API/Account/{accountID}/Customer.json                 │
│                                                             │
│  For each customer:                                         │
│    ┌─────────────────────────────────────┐                │
│    │ Check if exists in local DB         │                │
│    │ (by email or phone)                  │                │
│    └───────────┬─────────────────────────┘                │
│                │                                            │
│      ┌─────────┴────────┐                                 │
│      │                  │                                  │
│      ▼                  ▼                                  │
│  ┌────────┐       ┌──────────┐                           │
│  │ Exists │       │ New      │                            │
│  │ Update │       │ Create   │                            │
│  └────────┘       └──────────┘                            │
│                                                             │
│  Store lightspeed_customer_id for linking                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  INCREMENTAL SYNC (Every 15 minutes)                       │
│                                                             │
│  Query: updatedAt >= last_sync_timestamp                    │
│  • Fetch updated/new customers                              │
│  • Update local records                                     │
│  • Log sync status                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼

┌─────────────────────────────────────────────────────────────┐
│                  DAILY OPERATIONS                           │
└─────────────────────────────────────────────────────────────┘

Scenario 1: Existing Customer Arrives for Repair
      │
      ▼
┌─────────────────────────────────┐
│ Staff searches for customer     │
│ by phone: "555-1234"            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Customer Found!                 │
│ • Name: John Doe                │
│ • Email: john@email.com         │
│ • Lightspeed ID: 12345          │
│ • Last Purchase: 2 weeks ago    │
│                                  │
│ [View Lightspeed History]       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Create Repair Order             │
│ (Linked to existing customer)   │
└─────────────────────────────────┘


Scenario 2: New Walk-in Customer
      │
      ▼
┌─────────────────────────────────┐
│ Staff searches: "Jane Smith"    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Not Found in Local DB           │
│                                  │
│ [Check Lightspeed]              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ API Call to Lightspeed:         │
│ Search by name/phone            │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐      ┌──────────┐
│ Found   │      │ Not Found│
│ in LS   │      │ in LS    │
└────┬────┘      └─────┬────┘
     │                 │
     ▼                 ▼
┌─────────┐      ┌──────────┐
│ Import  │      │ Create   │
│ to DB   │      │ Locally  │
└────┬────┘      └─────┬────┘
     │                 │
     └────────┬────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Create Repair Order             │
└─────────────────────────────────┘


Phase 2: Bi-Directional Sync (Future)
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Repair Order Completed → Push to Lightspeed as Sale       │
│                                                             │
│  POST /API/Account/{accountID}/Sale.json                    │
│  Body:                                                      │
│  {                                                          │
│    customerID: 12345,                                       │
│    completed: true,                                         │
│    SaleLines: [                                             │
│      { itemID: "SCREEN_REPAIR", price: 210.00 }           │
│    ]                                                        │
│  }                                                          │
│                                                             │
│  Result: Repair appears in customer's purchase history     │
└─────────────────────────────────────────────────────────────┘


Error Handling:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ Lightspeed API Unavailable      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Dashboard continues working     │
│ • Queue sync operations         │
│ • Store locally                 │
│ • Retry every 5 minutes         │
│ • Alert admin after 30 min      │
└─────────────────────────────────┘
```

---

## 5. User Authentication & Authorization

```
┌──────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION & AUTHORIZATION                   │
└──────────────────────────────────────────────────────────────────┘

Login Flow:
      │
      ▼
┌─────────────────────────────────┐
│ User enters credentials:        │
│ • Username: "john"              │
│ • Password: "********"          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Backend validates:              │
│ 1. User exists?                 │
│ 2. Password correct? (bcrypt)   │
│ 3. Account active?              │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐      ┌──────────┐
│ Valid   │      │ Invalid  │
└────┬────┘      └─────┬────┘
     │                 │
     │                 ▼
     │          ┌──────────────────┐
     │          │ Return Error:    │
     │          │ "Invalid login"  │
     │          │ Log attempt      │
     │          └──────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ Generate JWT Token:             │
│                                  │
│ Payload:                         │
│ {                                │
│   userId: 123,                   │
│   username: "john",              │
│   role: "technician",            │
│   exp: timestamp + 8h            │
│ }                                │
│                                  │
│ Signed with JWT_SECRET           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Return to client:               │
│ {                                │
│   token: "eyJhbGc...",           │
│   user: {                        │
│     id: 123,                     │
│     name: "John",                │
│     role: "technician"           │
│   }                              │
│ }                                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Client stores token:            │
│ • localStorage or httpOnly      │
│   cookie                         │
│ • Include in all API requests:  │
│   Authorization: Bearer token   │
└─────────────────────────────────┘


Authorization (Role-Based Access Control):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│  API Request with Token                                     │
│  GET /api/repair-orders/123                                 │
│  Authorization: Bearer eyJhbGc...                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware: Verify JWT                                     │
│  • Token valid?                                             │
│  • Not expired?                                             │
│  • Signature matches?                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │   Valid      │        │   Invalid    │
    │   Extract    │        │   Return 401 │
    │   User Info  │        │ Unauthorized │
    └──────┬───────┘        └──────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Check Permissions (by Role)                                │
│                                                             │
│  Endpoint: GET /api/repair-orders/123                       │
│  Required: "read:repair-orders"                             │
│                                                             │
│  User Role: "technician"                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Permission Matrix:                                         │
│                                                             │
│  Admin:       ✓ All permissions                            │
│  Manager:     ✓ Read/Write repair orders                   │
│               ✓ Read/Write customers                        │
│               ✓ Read pricing                                │
│               ✓ View reports                                │
│  Technician:  ✓ Read/Write assigned repair orders          │
│               ✓ Read customers                              │
│               ✓ Read pricing                                │
│  Front Desk:  ✓ Create/Read repair orders                  │
│               ✓ Read/Write customers                        │
│               ✓ Read pricing                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │  Authorized  │        │  Forbidden   │
    │  Proceed     │        │  Return 403  │
    └──────┬───────┘        └──────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Execute Request                 │
│ Return Response                 │
└─────────────────────────────────┘
```

---

## 6. Data Backup & Recovery

```
┌──────────────────────────────────────────────────────────────────┐
│                    BACKUP & RECOVERY WORKFLOW                    │
└──────────────────────────────────────────────────────────────────┘

Automated Daily Backup:
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Cron Job runs at 2:00 AM daily                            │
│  /usr/local/bin/backup-database.sh                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Dump:                                           │
│  pg_dump mobile_repair_db > backup_$(date +%Y%m%d).sql     │
│                                                             │
│  File: backup_20251110.sql (150 MB)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Compress:                                                  │
│  gzip backup_20251110.sql                                   │
│  → backup_20251110.sql.gz (15 MB)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Upload to S3:                                              │
│  aws s3 cp backup_20251110.sql.gz                          │
│    s3://mobile-repair-backups/2025/11/                     │
│                                                             │
│  Retention: 30 days                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Send Success Notification:                                 │
│  • Email to admin                                           │
│  • Log to monitoring system                                 │
│  • Update dashboard backup status                           │
└─────────────────────────────────────────────────────────────┘


Disaster Recovery Process:
      │
      ▼
┌─────────────────────────────────┐
│ Problem Detected:               │
│ • Database corruption           │
│ • Data loss                     │
│ • Server failure                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 1. Stop Application             │
│    systemctl stop app           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. Download Latest Backup       │
│    aws s3 cp s3://backups/...   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. Decompress                   │
│    gunzip backup.sql.gz         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. Drop & Recreate Database     │
│    dropdb mobile_repair_db      │
│    createdb mobile_repair_db    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 5. Restore from Backup          │
│    psql mobile_repair_db <      │
│      backup.sql                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 6. Verify Data Integrity        │
│    • Check record counts        │
│    • Test queries               │
│    • Verify relationships       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 7. Start Application            │
│    systemctl start app          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 8. Test Critical Functions      │
│    • Login                      │
│    • View orders                │
│    • Create order               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ ✅ Recovery Complete             │
│ Document incident & notify team │
└─────────────────────────────────┘


RTO: 4 hours (from detection to full restoration)
RPO: 24 hours (maximum data loss = 1 day)
```

---

These workflow diagrams provide visual guides for the most critical processes in your mobile repair shop dashboard. Use them as reference during development and staff training.
