# Advanced Usage Guide - Repair Dashboard v1.1.0

Complete guide for advanced features, API usage, and workflow automation.

## 📋 Table of Contents

1. [Advanced API Usage](#advanced-api-usage)
2. [Bi-directional Sync Workflows](#bi-directional-sync-workflows)
3. [Analytics & Reporting](#analytics--reporting)
4. [Notification Automation](#notification-automation)
5. [Custom Scripts](#custom-scripts)
6. [Performance Optimization](#performance-optimization)
7. [Integration Patterns](#integration-patterns)

---

## 🔌 Advanced API Usage

### Device Catalog API

**Get All Devices with Filtering:**
```bash
# Get all devices
curl -s http://localhost:3000/api/devices | jq '.data'

# Filter by brand (using jq)
curl -s http://localhost:3000/api/devices | \
  jq '.data[] | select(.brand.name == "Apple")'

# Get devices by type
curl -s http://localhost:3000/api/devices | \
  jq '.data[] | select(.deviceType == "tablet")'

# Find specific device
curl -s http://localhost:3000/api/devices | \
  jq '.data[] | select(.name | contains("iPhone 14"))'

# Count devices by brand
curl -s http://localhost:3000/api/devices | \
  jq '[.data[] | .brand.name] | group_by(.) | map({brand: .[0], count: length})'
```

**Device Statistics:**
```bash
# Get device model with most repairs
curl -s http://localhost:3000/api/devices | \
  jq '.data | sort_by(.releaseYear) | reverse | .[0:10] |
      .[] | {name, year: .releaseYear, screen: .screenSize}'
```

### Customer Management

**Advanced Customer Queries:**
```bash
# Get customer count
curl -s http://localhost:3000/api/customers | jq 'length'

# Find customer by phone
curl -s http://localhost:3000/api/customers | \
  jq '.[] | select(.phone | contains("0404"))'

# Get customers synced from Lightspeed
curl -s http://localhost:3000/api/customers | \
  jq '.[] | select(.lightspeedId != null)'

# Customer signup trends (by month)
curl -s http://localhost:3000/api/customers | \
  jq '[.[] | .createdAt[0:7]] | group_by(.) |
      map({month: .[0], count: length})'
```

### Pricing Intelligence

**Get Pricing for Specific Repair:**
```bash
# Using Gemini AI
curl -X POST http://localhost:3000/api/integrations/gemini/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "deviceBrand": "Apple",
    "deviceModel": "iPhone 14",
    "repairType": "Front Screen",
    "partQuality": "Original (OEM)"
  }' | jq '.'
```

**Response Structure:**
```json
{
  "success": true,
  "recommendation": {
    "suggestedPrice": 700,
    "minPrice": 670,
    "maxPrice": 770,
    "marketAverage": 710,
    "confidence": 80,
    "reasoning": "Pricing reflects...",
    "sources": ["Part Cost", "Labor", "Market Data"]
  }
}
```

---

## 🔄 Bi-directional Sync Workflows

### Scenario 1: Complete Repair Workflow

```bash
# 1. Create a repair order (use dashboard UI or API)
REPAIR_ID=123

# 2. Mark repair as completed
curl -X PATCH http://localhost:3000/api/repairs/$REPAIR_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Repair completed successfully"
  }'

# 3. Sync to Lightspeed
curl -X POST http://localhost:3000/api/integrations/lightspeed/sales \
  -H "Content-Type: application/json" \
  -d "{\"repairOrderId\": $REPAIR_ID}" | jq '.'

# Response:
# {
#   "success": true,
#   "saleId": "12345",
#   "message": "Repair order successfully synced to Lightspeed POS"
# }
```

### Scenario 2: Bulk Sync Multiple Orders

```bash
#!/bin/bash
# sync-completed-repairs.sh

# Get all completed but not synced repairs
REPAIRS=$(curl -s http://localhost:3000/api/repairs | \
  jq -r '.[] | select(.status == "completed" and .syncedToLightspeed == false) | .id')

echo "Found repairs to sync: $REPAIRS"

for REPAIR_ID in $REPAIRS; do
  echo "Syncing repair #$REPAIR_ID..."

  RESULT=$(curl -s -X POST http://localhost:3000/api/integrations/lightspeed/sales \
    -H "Content-Type: application/json" \
    -d "{\"repairOrderId\": $REPAIR_ID}")

  SUCCESS=$(echo $RESULT | jq -r '.success')

  if [ "$SUCCESS" = "true" ]; then
    SALE_ID=$(echo $RESULT | jq -r '.saleId')
    echo "  ✓ Synced to Lightspeed sale #$SALE_ID"
  else
    ERROR=$(echo $RESULT | jq -r '.error')
    echo "  ✗ Failed: $ERROR"
  fi

  sleep 1  # Rate limiting
done

echo "Sync complete!"
```

### Scenario 3: Verify Sync Status

```bash
# Check which repairs are synced
curl -s http://localhost:3000/api/repairs | \
  jq '[.[] | {
    id,
    orderNumber,
    synced: .syncedToLightspeed,
    lightspeedSaleId
  }]'

# Count synced vs unsynced
curl -s http://localhost:3000/api/repairs | \
  jq '{
    total: length,
    synced: [.[] | select(.syncedToLightspeed == true)] | length,
    unsynced: [.[] | select(.syncedToLightspeed == false)] | length
  }'
```

---

## 📊 Analytics & Reporting

### Revenue Analytics

**Daily Revenue Report:**
```bash
#!/bin/bash
# daily-revenue-report.sh

TODAY=$(date +%Y-%m-%d)

curl -s http://localhost:3000/api/repairs | \
  jq --arg today "$TODAY" '[
    .[] |
    select(.createdAt | startswith($today)) |
    .totalPrice
  ] | add // 0' | \
  xargs -I {} echo "Today's Revenue: \${}"
```

**Monthly Revenue Breakdown:**
```bash
# Get revenue by month
curl -s http://localhost:3000/api/repairs | \
  jq '[.[] | {
    month: .createdAt[0:7],
    amount: .totalPrice
  }] |
  group_by(.month) |
  map({
    month: .[0].month,
    revenue: [.[].amount] | add,
    orders: length
  })'
```

### Performance Metrics

**Average Repair Time:**
```bash
# Calculate avg time from creation to completion
curl -s http://localhost:3000/api/repairs | \
  jq '[.[] |
    select(.status == "completed" and .actualCompletion != null) |
    {
      orderNumber,
      created: .createdAt,
      completed: .actualCompletion,
      hours: (
        (.actualCompletion | fromdateiso8601) -
        (.createdAt | fromdateiso8601)
      ) / 3600
    }
  ]'
```

**Popular Devices Report:**
```bash
# Most repaired devices
curl -s http://localhost:3000/api/repairs | \
  jq '[.[] | .deviceModel.name] |
      group_by(.) |
      map({device: .[0], count: length}) |
      sort_by(.count) |
      reverse |
      .[0:10]'
```

### Export to CSV

**Export Repairs to CSV:**
```bash
#!/bin/bash
# export-repairs-csv.sh

echo "Order Number,Customer,Device,Status,Price,Date" > repairs.csv

curl -s http://localhost:3000/api/repairs | \
  jq -r '.[] | [
    .orderNumber,
    "\(.customer.firstName) \(.customer.lastName)",
    .deviceModel.name,
    .status,
    .totalPrice,
    .createdAt
  ] | @csv' >> repairs.csv

echo "Exported to repairs.csv"
```

---

## 🔔 Notification Automation

### Setup Email Notifications (Resend)

**1. Get API Key from Resend:**
```
https://resend.com → Sign Up → Get API Key
```

**2. Add to `.env`:**
```bash
RESEND_API_KEY="re_..."
NOTIFICATION_FROM_EMAIL="repairs@metrowireless.com.au"
NOTIFICATION_FROM_NAME="Metro Wireless"
```

**3. Restart Services:**
```bash
pm2 restart ecosystem.config.js
```

### Setup SMS Notifications (Twilio)

**1. Get Credentials from Twilio:**
```
https://twilio.com → Console → Account SID & Auth Token
```

**2. Add to `.env`:**
```bash
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+61..."
```

**3. Restart Services:**
```bash
pm2 restart ecosystem.config.js
```

### Notification Triggers

**Implement Auto-Notifications:**

Create `scripts/send-notifications.ts`:
```typescript
import { prisma } from '../lib/prisma'
import { notificationService } from '../lib/notifications'

async function sendStatusNotifications() {
  // Get recent status changes
  const recentUpdates = await prisma.orderStatusHistory.findMany({
    where: {
      changedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    },
    include: {
      repairOrder: {
        include: {
          customer: true
        }
      }
    }
  })

  for (const update of recentUpdates) {
    const eventMap: Record<string, string> = {
      'pending': 'repair_created',
      'approved': 'repair_approved',
      'in_progress': 'repair_in_progress',
      'completed': 'repair_completed',
      'ready_pickup': 'repair_ready_pickup'
    }

    const event = eventMap[update.newStatus]
    if (event) {
      await notificationService.sendRepairNotification(
        update.repairOrderId,
        event as any
      )
    }
  }
}

sendStatusNotifications()
```

**Schedule with PM2:**
```bash
# Add to ecosystem.config.js
{
  name: 'notification-sender',
  script: 'npx',
  args: 'tsx ./scripts/send-notifications.ts',
  cron_restart: '*/5 * * * *', // Every 5 minutes
  autorestart: false
}
```

---

## 🛠️ Custom Scripts

### Automated Pricing Updates

**Bulk Update Pricing from Gemini AI:**
```bash
#!/bin/bash
# update-popular-device-pricing.sh

DEVICES=("iPhone 14" "iPhone 13" "Galaxy S23" "Galaxy S22")
REPAIRS=("Front Screen" "Back Glass" "Battery")

for device in "${DEVICES[@]}"; do
  for repair in "${REPAIRS[@]}"; do
    echo "Getting AI pricing for $device - $repair..."

    curl -X POST http://localhost:3000/api/integrations/gemini/pricing \
      -H "Content-Type: application/json" \
      -d "{
        \"deviceBrand\": \"Apple\",
        \"deviceModel\": \"$device\",
        \"repairType\": \"$repair\",
        \"partQuality\": \"Original (OEM)\"
      }" | jq '.recommendation'

    sleep 2  # Rate limiting
  done
done
```

### Daily Backup Script

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/avi/backups/repair-dashboard"
DB_PATH="/home/avi/projects/mobile/rep/repair-dashboard/prisma/prisma/dev.db"

mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH "$BACKUP_DIR/dev_${DATE}.db"

# Compress
gzip "$BACKUP_DIR/dev_${DATE}.db"

# Keep only last 30 days
find $BACKUP_DIR -name "dev_*.db.gz" -mtime +30 -delete

echo "Backup created: dev_${DATE}.db.gz"
```

**Schedule with cron:**
```bash
crontab -e

# Add line:
0 2 * * * /home/avi/projects/mobile/rep/repair-dashboard/scripts/backup-database.sh
```

---

## ⚡ Performance Optimization

### Database Query Optimization

**Use Prisma Select for Large Datasets:**
```typescript
// Instead of loading all fields
const repairs = await prisma.repairOrder.findMany()

// Load only needed fields
const repairs = await prisma.repairOrder.findMany({
  select: {
    id: true,
    orderNumber: true,
    totalPrice: true,
    status: true
  }
})
```

### Caching Strategies

**Cache Device Catalog (Redis Example):**
```typescript
import { Redis } from 'ioredis'

const redis = new Redis()

async function getDevices() {
  // Check cache first
  const cached = await redis.get('devices:all')
  if (cached) return JSON.parse(cached)

  // Load from database
  const devices = await prisma.deviceModel.findMany({
    include: { brand: true }
  })

  // Cache for 1 hour
  await redis.set('devices:all', JSON.stringify(devices), 'EX', 3600)

  return devices
}
```

### PM2 Clustering

**Enable Clustering for Better Performance:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'repair-dashboard',
    script: 'npm',
    args: 'start',
    instances: 2,  // Run 2 instances
    exec_mode: 'cluster',
    max_memory_restart: '500M'
  }]
}
```

---

## 🔗 Integration Patterns

### Webhook Integration

**Receive Lightspeed Webhooks:**
```typescript
// app/api/webhooks/lightspeed/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const event = await request.json()

  switch (event.type) {
    case 'customer.updated':
      // Sync customer changes
      await syncCustomerFromLightspeed(event.data.id)
      break

    case 'sale.completed':
      // Log sale completion
      console.log('Sale completed:', event.data.id)
      break
  }

  return NextResponse.json({ received: true })
}
```

### Third-Party Integrations

**Zapier Integration Example:**
```bash
# Trigger Zapier webhook when repair is completed
curl -X POST https://hooks.zapier.com/hooks/catch/YOUR_HOOK/ \
  -H "Content-Type: application/json" \
  -d '{
    "event": "repair_completed",
    "repairId": 123,
    "customer": "John Doe",
    "device": "iPhone 14",
    "price": 700
  }'
```

---

## 🎯 Best Practices

### Error Handling

**Implement Retry Logic:**
```typescript
async function syncWithRetry(repairId: number, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fetch('/api/integrations/lightspeed/sales', {
        method: 'POST',
        body: JSON.stringify({ repairOrderId: repairId })
      })

      if (result.ok) return await result.json()

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
}
```

### Monitoring

**Setup Health Check Endpoint:**
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    lightspeed: false,
    gemini: false
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch {}

  // Add other checks...

  const healthy = Object.values(checks).every(v => v)

  return Response.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: healthy ? 200 : 503
  })
}
```

---

## 📞 Support

For questions or advanced usage help:
- **Documentation**: See DEPLOYMENT_GUIDE.md
- **Quick Reference**: See QUICK_REFERENCE.md
- **Integrations**: See INTEGRATIONS.md

---

**Last Updated**: 2025-11-10
**Version**: v1.1.0
