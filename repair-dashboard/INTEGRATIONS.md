# Repair Dashboard - Integration Guide

Complete guide for Lightspeed POS and Gemini AI integrations.

## Table of Contents

1. [Overview](#overview)
2. [Lightspeed POS Integration](#lightspeed-pos-integration)
3. [Gemini AI Integration](#gemini-ai-integration)
4. [Automated Sync Service](#automated-sync-service)
5. [Bulk AI Pricing Tool](#bulk-ai-pricing-tool)
6. [API Endpoints](#api-endpoints)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This repair dashboard integrates with:

- **Lightspeed POS (X Series)**: Customer data synchronization
- **Gemini AI 2.5-flash**: Intelligent pricing recommendations

### Integration Status

✅ **Lightspeed POS**: Connected and syncing
✅ **Gemini AI**: Active and providing pricing intelligence
✅ **Automated Sync**: Configured for 6-hour intervals
✅ **Bulk Pricing**: Available at `/dashboard/pricing/ai-bulk`

---

## Lightspeed POS Integration

### Configuration

The integration uses Lightspeed X Series API v2.0.

**Environment Variables** (`.env`):
```bash
LIGHTSPEED_DOMAIN_PREFIX="metrowireless"
LIGHTSPEED_PERSONAL_TOKEN="your_personal_token_here"
```

### Features

#### 1. Customer Synchronization

**What it syncs:**
- Customer name (first + last)
- Email address
- Phone number (required for sync)
- Lightspeed customer ID

**Sync behavior:**
- ✅ Creates new customers not in database
- ✅ Updates existing customers by Lightspeed ID
- ⏭️ Skips customers without phone numbers
- ⏭️ Skips duplicate phone numbers

**Manual sync:**
```bash
# Via API
curl http://localhost:3000/api/integrations/lightspeed/customers?action=sync&limit=1000

# Via sync script
npx tsx scripts/sync-lightspeed-customers.ts --once
```

#### 2. API Endpoints

**GET** `/api/integrations/lightspeed/customers`
- `?action=sync` - Trigger customer sync
- `?limit=N` - Limit customers to sync (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "synced": 1000,
  "customers": [
    {
      "action": "created|updated|skipped_no_phone|skipped_duplicate",
      "customer": { "id": 1, "firstName": "John", ... }
    }
  ]
}
```

### Lightspeed X Series API Details

**Base URL:**
```
https://{domain_prefix}.retail.lightspeed.app/api/2.0/
```

**Authentication:**
```
Authorization: Bearer {personal_token}
```

**Field Mapping:**
- Lightspeed `id` → Dashboard `lightspeedId`
- Lightspeed `first_name` → Dashboard `firstName`
- Lightspeed `last_name` → Dashboard `lastName`
- Lightspeed `email` → Dashboard `email`
- Lightspeed `phone` OR `mobile` → Dashboard `phone`

---

## Gemini AI Integration

### Configuration

Uses Google's Gemini 2.5-flash model for fast, intelligent pricing.

**Environment Variables** (`.env`):
```bash
GEMINI_API_KEY="AIzaSyC-..."
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta"
```

### Features

#### 1. Single Pricing Recommendation

Get AI-powered pricing for a specific repair:

```bash
curl -X POST http://localhost:3000/api/integrations/gemini/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "deviceBrand": "Apple",
    "deviceModel": "iPhone 14",
    "repairType": "Front Screen",
    "partQuality": "Original (OEM)"
  }'
```

**Response:**
```json
{
  "success": true,
  "recommendation": {
    "suggestedPrice": 700,
    "minPrice": 670,
    "maxPrice": 770,
    "marketAverage": 710,
    "confidence": 80,
    "reasoning": "Pricing reflects high cost of genuine Apple OEM displays...",
    "sources": ["Part Cost", "Labor", "Market Data", "Competition"]
  }
}
```

#### 2. Pricing Intelligence

The AI considers:
- ✅ Current Sydney market rates (2025)
- ✅ Device popularity and age
- ✅ Part availability and costs
- ✅ Competition in the area
- ✅ Typical repair margins (40-60%)
- ✅ Consumer price expectations

#### 3. Sample Pricing Data

Based on Sydney market, OEM parts (as of 2025):

| Device | Repair | Price | Range | Confidence |
|--------|--------|-------|-------|------------|
| iPhone 14 | Screen | $700 | $670-$770 | 80% |
| iPhone 13 | Screen | $419 | $399-$449 | 90% |
| Galaxy S23 | Screen | $999 | $750-$1,240 | 90% |
| iPhone 14 | Back Glass | $750 | $580-$950 | 85% |
| iPhone 13 | Battery | $170 | $150-$190 | 90% |

---

## Automated Sync Service

### Overview

Automatically syncs Lightspeed customers every 6 hours.

### Installation Options

#### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# View status
pm2 status
pm2 logs lightspeed-sync

# Save configuration
pm2 save
pm2 startup
```

**Services:**
- `repair-dashboard`: Next.js application (port 3000)
- `lightspeed-sync`: Customer sync service

#### Option 2: Systemd

```bash
# Copy service file
sudo cp lightspeed-sync.service /etc/systemd/system/

# Enable and start
sudo systemctl enable lightspeed-sync
sudo systemctl start lightspeed-sync

# Check status
sudo systemctl status lightspeed-sync

# View logs
sudo journalctl -u lightspeed-sync -f
```

#### Option 3: Cron

Add to crontab (`crontab -e`):
```bash
0 */6 * * * cd /home/avi/projects/mobile/rep/repair-dashboard && npx tsx scripts/sync-lightspeed-customers.ts --once >> logs/sync-cron.log 2>&1
```

### Monitoring

**Check sync status:**
```bash
# PM2
pm2 logs lightspeed-sync --lines 50

# Systemd
sudo journalctl -u lightspeed-sync --since "1 hour ago"

# Direct log files
tail -f logs/sync-out.log
```

**Manual trigger:**
```bash
npx tsx scripts/sync-lightspeed-customers.ts --once
```

---

## Bulk AI Pricing Tool

### Access

Navigate to: **Dashboard → Pricing → AI Bulk Pricing**

URL: `http://31.97.222.218:3000/dashboard/pricing/ai-bulk`

### Features

1. **Multi-Select**: Choose multiple devices, repair types, and part qualities
2. **Bulk Processing**: Generate AI pricing for all combinations at once
3. **Progress Tracking**: Real-time status for each pricing request
4. **Save to Database**: Automatically save successful pricing
5. **Export CSV**: Download pricing data for external use

### Usage Example

**Step 1**: Select combinations
- Devices: iPhone 14, iPhone 13, Galaxy S23
- Repairs: Front Screen, Battery, Back Panel
- Parts: OEM, Premium, Standard

**Step 2**: Generate combinations (3 × 3 × 3 = 27 combinations)

**Step 3**: Get AI pricing (processes sequentially to avoid rate limits)

**Step 4**: Review results and save/export

### Export Format

CSV columns:
```
Brand, Device, Repair, Part Quality, Suggested Price, Min Price, Max Price, Confidence
```

---

## Bi-directional Lightspeed Sync

### Overview

Completed repair orders can now be synced to Lightspeed POS as sales transactions, closing the integration loop.

### Features

- ✅ Converts repair orders to Lightspeed sales
- ✅ Automatically creates products for repair line items
- ✅ Tracks sync status to prevent duplicates
- ✅ Links customer records between systems
- ✅ Generates SKUs for repair items

### How It Works

**1. Sync Trigger**

```bash
curl -X POST http://localhost:3000/api/integrations/lightspeed/sales \
  -H "Content-Type: application/json" \
  -d '{"repairOrderId": 123}'
```

**2. Process Flow**

1. Validates repair order exists and is not already synced
2. Retrieves repair details with customer, device, and repair items
3. Creates line items from repair items:
   - Format: `{Brand} {Model} - {Repair Type} ({Part Quality})`
   - SKU: `REPAIR-{deviceModelId}-{repairTypeId}-{partTypeId}`
   - Searches for existing products by SKU or creates new ones
4. Creates sale in Lightspeed with:
   - Customer linkage (if customer has Lightspeed ID)
   - Complete line items with quantities and prices
   - Payment record (default: cash)
   - Order notes with repair order reference
5. Updates repair order with:
   - `lightspeedSaleId`: Lightspeed sale ID
   - `syncedToLightspeed`: true
   - `syncedAt`: timestamp

**3. Example Response**

```json
{
  "success": true,
  "saleId": "12345",
  "message": "Repair order successfully synced to Lightspeed POS"
}
```

### Database Schema Changes

New fields in `RepairOrder` model:

```prisma
model RepairOrder {
  // ... existing fields
  lightspeedSaleId     String?   // Lightspeed sale ID
  syncedToLightspeed   Boolean   @default(false)
  syncedAt             DateTime? // When sync occurred
}
```

### Error Handling

- **404**: Repair order not found
- **400**: Already synced (returns existing sale ID)
- **400**: Lightspeed not configured
- **500**: Sync failed (returns error details)

---

## Notification System

### Overview

Foundation for automated customer notifications via email and SMS.

### Configuration

**Environment Variables** (`.env`):
```bash
# Email (Resend)
RESEND_API_KEY="re_..."
NOTIFICATION_FROM_EMAIL="repairs@metrowireless.com.au"
NOTIFICATION_FROM_NAME="Metro Wireless"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+61..."
```

### Notification Events

The system supports 6 repair lifecycle events:

1. **repair_created** - When repair order is first created
2. **repair_approved** - When customer approves the quote
3. **repair_in_progress** - When technician starts work
4. **repair_completed** - When repair work is finished
5. **repair_ready_pickup** - When device is ready for customer pickup
6. **payment_received** - When final payment is processed

### Usage

```typescript
import { notificationService } from '@/lib/notifications'

// Check if configured
if (notificationService.isEmailConfigured()) {
  console.log('Email notifications ready')
}

if (notificationService.isSMSConfigured()) {
  console.log('SMS notifications ready')
}

// Send notification (implementation pending)
await notificationService.sendRepairNotification(
  repairOrderId,
  'repair_completed'
)
```

### Implementation Status

- ✅ Service class architecture
- ✅ Configuration management
- ✅ Event type definitions
- ✅ Provider abstraction (Resend, Twilio)
- ⏳ Email template rendering
- ⏳ SMS message formatting
- ⏳ Automatic trigger on status changes

---

## Analytics Dashboard

### Overview

Comprehensive business intelligence dashboard at `/dashboard/analytics`.

### Metrics Tracked

**Revenue Analytics**
- Daily revenue
- Weekly revenue (last 7 days)
- Monthly revenue (current month)
- All-time total revenue
- Average order value

**Repair Operations**
- Total repair count
- Recent repairs (last 30 days)
- Completion rate percentage
- Active orders count
- Repairs by status breakdown

**Customer Metrics**
- Total customer count
- New customers this month
- Active customers count

**Business Intelligence**
- Top 5 most popular repair types
- Revenue distribution by order status
- Recent activity feed

### Access

URL: `http://31.97.222.218:3000/dashboard/analytics`

---

## Device Catalog

### Overview

Comprehensive device database with 64+ models across major brands.

### Seeding Script

Run the device seeding script to populate or update the catalog:

```bash
npx tsx scripts/seed-devices.ts
```

**Features:**
- ✅ Checks for existing devices (won't create duplicates)
- ✅ Comprehensive device specs (model numbers, release years, screen sizes)
- ✅ Organized by brand and device type

### Device Coverage

**Apple (30 models)**
- iPhone: 15 series, 14 series, 13 series, 12 series, 11 series, SE, X/XS/XR
- iPad: Pro 12.9"/11", Air, standard iPad, mini

**Samsung (16 models)**
- Galaxy S: S24, S23, S22, S21, S20 series
- Galaxy A: A54, A34, A24, A14
- Galaxy Z: Z Flip 5/4, Z Fold 5/4

**Google Pixel (8 models)**
- Flagship: 8 Pro, 8, 7 Pro, 7, 6 Pro, 6
- Mid-range: 7a, 6a

### Adding Custom Devices

Add devices to `scripts/seed-devices.ts`:

```typescript
const devices = [
  {
    brandName: 'Apple',
    name: 'iPhone 16 Pro',
    modelNumber: 'A3294',
    releaseYear: 2024,
    screenSize: 6.3,
    deviceType: 'phone'
  },
  // ... more devices
]
```

---

## API Endpoints

### Lightspeed Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/lightspeed/customers?action=sync` | Sync customers from Lightspeed |
| POST | `/api/integrations/lightspeed/sales` | Sync completed repair to Lightspeed as sale |

### Gemini AI Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/integrations/gemini/pricing` | Get AI pricing for a repair |
| GET | `/api/integrations/gemini/pricing?category=X` | Get market insights for category |

### Internal APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create new customer |
| GET | `/api/devices` | List all devices |
| GET | `/api/repair-types` | List repair types |
| GET | `/api/part-types` | List part quality types |
| POST | `/api/pricing` | Save pricing entry |
| POST | `/api/repairs` | Create repair order |

---

## Troubleshooting

### Lightspeed Connection Issues

**Problem**: `access token is not valid`

**Solution**:
1. Verify token in `.env`: `LIGHTSPEED_PERSONAL_TOKEN`
2. Check domain prefix: `LIGHTSPEED_DOMAIN_PREFIX="metrowireless"` (no hyphens)
3. Test manually:
   ```bash
   curl "https://metrowireless.retail.lightspeed.app/api/2.0/customers" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Gemini AI Issues

**Problem**: `Gemini AI request timed out`

**Solution**:
- Request has 30-second timeout
- Reduce `maxOutputTokens` if timeouts persist
- Check API key is valid (39 characters, starts with `AIza`)
- Verify API quota: https://aistudio.google.com/apikey

**Problem**: Model not found

**Solution**:
- Ensure using `gemini-2.5-flash` model
- Check `GEMINI_API_URL` is correct
- Verify API key has access to beta models

### Sync Service Issues

**Problem**: Service won't start

**Solutions**:
```bash
# Check Next.js is running
curl http://localhost:3000/api/devices

# Test manual sync
npx tsx scripts/sync-lightspeed-customers.ts --once

# Check environment variables
cat .env | grep -E "LIGHTSPEED|GEMINI"

# View logs
tail -50 logs/sync-error.log
```

**Problem**: No customers syncing

**Reasons**:
- Customers must have phone numbers in Lightspeed
- Phone numbers must be unique
- Check Lightspeed has customers in the system

### Database Issues

**Problem**: Unique constraint errors

**Solution**:
- Phone numbers must be unique
- Sync automatically skips duplicates
- Check logs for `skipped_duplicate` entries

---

## Performance Notes

### Sync Performance

- **923 customers**: ~7 seconds
- **Rate limiting**: No limits observed on Lightspeed X Series API
- **Database**: SQLite handles 1000+ customers easily
- **Memory**: Sync service uses < 200MB RAM

### AI Pricing Performance

- **Single request**: 2-5 seconds
- **Timeout**: 30 seconds
- **Rate limiting**: 1 request/second to avoid overwhelming API
- **Bulk processing**: Sequential to prevent rate limits

---

## Next Steps

### ✅ Recently Completed (v1.1.0 - 2025-11-10)

1. **✅ Bi-directional Sync** (Phase 2.1)
   - Push completed repairs to Lightspeed as sales
   - Sync tracking with `lightspeedSaleId`, `syncedToLightspeed`, `syncedAt` fields
   - Automatic product creation for repair line items
   - API endpoint: `POST /api/integrations/lightspeed/sales`

2. **✅ Notification System Foundation** (Phase 3.1)
   - NotificationService class with Resend (email) and Twilio (SMS) support
   - 6 notification events: repair_created, repair_approved, repair_in_progress, repair_completed, repair_ready_pickup, payment_received
   - Configuration-driven with environment variable detection
   - Ready for provider API key integration

3. **✅ Analytics Dashboard** (Phase 4.1)
   - Revenue metrics (daily/weekly/monthly/total)
   - Repair volume tracking by status
   - Customer acquisition metrics
   - Popular repair types ranking
   - Average order value calculation
   - Recent activity feed
   - Access: `/dashboard/analytics`

4. **✅ Device Catalog Expansion** (Phase 1.3)
   - 64 device models (up from 10)
   - Comprehensive Apple lineup: iPhone 14/13/12/11/SE/X series, iPad Pro/Air/mini
   - Samsung Galaxy: S24/S23/S22/S21/S20, A-series, Z Flip/Fold
   - Google Pixel: 8/7/6 series
   - Seeding script: `scripts/seed-devices.ts`

### Recommended Future Enhancements

1. **Enhanced AI Features**
   - Price trend analysis over time
   - Competitor price monitoring
   - Seasonal pricing adjustments
   - Market demand forecasting

2. **Advanced Notifications**
   - Automated customer notifications on status changes
   - Email templates for each repair event
   - SMS reminders for pickup
   - Low confidence pricing alerts

3. **Workflow Automation**
   - Auto-approve low-value repairs
   - Smart technician assignment based on workload
   - Automated parts ordering
   - Warranty claim processing

4. **Customer & Technician Portals**
   - Customer self-service portal for tracking repairs
   - Technician mobile app for job management
   - Photo upload and documentation
   - Digital signatures for pickup

---

## Support

For questions or issues:

1. **Check logs**: `logs/` directory
2. **Test manually**: Use `--once` flag
3. **Verify environment**: Check `.env` file
4. **API status**: Test endpoints with curl
5. **Documentation**: Review this guide

## Version History

- **v1.1.0** (2025-11-10)
  - ✅ Bi-directional Lightspeed sync (repairs → sales)
  - ✅ Notification system foundation (Resend + Twilio ready)
  - ✅ Analytics dashboard with comprehensive metrics
  - ✅ Device catalog expansion to 64 models
  - ✅ 4 major phases completed

- **v1.0.0** (2025-11-10)
  - ✅ Lightspeed X Series integration
  - ✅ Gemini AI 2.5-flash integration
  - ✅ Automated sync service
  - ✅ Bulk AI pricing tool
  - ✅ 923 customers synced
  - ✅ Production-ready
