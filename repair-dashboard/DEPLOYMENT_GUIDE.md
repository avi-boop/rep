# Deployment Guide - Repair Dashboard v1.1.0

Complete guide for deploying and managing the repair dashboard with all v1.1.0 features.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Deployment Status](#deployment-status)
3. [Feature Verification](#feature-verification)
4. [Service Management](#service-management)
5. [Monitoring & Logs](#monitoring--logs)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## 🎯 System Overview

**Version**: v1.1.0
**Deployed**: 2025-11-10
**Server**: 31.97.222.218:3000
**Process Manager**: PM2

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PM2 Process Manager                   │
├──────────────────────┬──────────────────────────────────┤
│  repair-dashboard    │  lightspeed-sync                 │
│  (Next.js 15.5.6)    │  (Customer Sync Service)         │
│  Port: 3000          │  Interval: 6 hours               │
│  Memory: ~66MB       │  Memory: ~78MB                   │
└──────────────────────┴──────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   SQLite Database    │
              │   - 64 device models │
              │   - 924 customers    │
              │   - Pricing data     │
              └──────────────────────┘
```

---

## ✅ Deployment Status

### Services Running

| Service | Status | PID | Uptime | Memory | Purpose |
|---------|--------|-----|--------|--------|---------|
| repair-dashboard | ✅ Online | Auto | Running | 66MB | Next.js application |
| lightspeed-sync | ✅ Online | Auto | Running | 78MB | Customer sync (6hr) |
| pm2-logrotate | ✅ Online | Auto | Running | 68MB | Log management |

### Features Deployed

| Feature | Status | Details |
|---------|--------|---------|
| Device Catalog | ✅ Live | 64 devices (Apple, Samsung, Google) |
| Analytics Dashboard | ✅ Live | Revenue, repairs, customers |
| Bi-directional Sync | ✅ Live | Repairs → Lightspeed sales |
| Notification System | ✅ Ready | Resend + Twilio support |
| Database Schema | ✅ Updated | Sync tracking fields added |

---

## 🔍 Feature Verification

### 1. Device Catalog (64 Devices)

**Test Command:**
```bash
curl -s http://localhost:3000/api/devices | jq '.count'
# Expected output: 64
```

**Brands & Coverage:**
- **Apple (34 models)**: iPhone 15→11, SE, X/XS/XR, iPad Pro/Air/mini
- **Samsung (22 models)**: Galaxy S24→S20, A-series, Z Flip/Fold
- **Google (8 models)**: Pixel 8/7/6 series

**Sample New Devices:**
```bash
# Check specific devices
curl -s http://localhost:3000/api/devices | \
  jq '.data[] | select(.name | contains("Z Flip 5")) | {name, modelNumber, releaseYear}'
```

### 2. Analytics Dashboard

**Access URL:**
```
http://31.97.222.218:3000/dashboard/analytics
```

**Metrics Available:**
- ✅ Revenue Analytics (daily/weekly/monthly/total)
- ✅ Repair Operations (volume, completion rate, avg order value)
- ✅ Customer Metrics (total, new this month, active)
- ✅ Popular Repair Types (top 5)
- ✅ Recent Activity Feed

**Test Command:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/analytics
# Expected output: 200
```

### 3. Bi-directional Lightspeed Sync

**API Endpoint:**
```
POST /api/integrations/lightspeed/sales
```

**Usage Example:**
```bash
curl -X POST http://localhost:3000/api/integrations/lightspeed/sales \
  -H "Content-Type: application/json" \
  -d '{"repairOrderId": 123}'
```

**Features:**
- ✅ Validates repair order exists
- ✅ Checks if already synced (prevents duplicates)
- ✅ Creates products in Lightspeed automatically
- ✅ Links customer records
- ✅ Tracks sync with `lightspeedSaleId`, `syncedToLightspeed`, `syncedAt`

**Response:**
```json
{
  "success": true,
  "saleId": "12345",
  "message": "Repair order successfully synced to Lightspeed POS"
}
```

### 4. Notification System

**Location:** `lib/notifications.ts`

**Status:** Foundation ready, awaiting API keys

**Configuration (Add to .env):**
```bash
# Email via Resend
RESEND_API_KEY="re_..."
NOTIFICATION_FROM_EMAIL="repairs@metrowireless.com.au"
NOTIFICATION_FROM_NAME="Metro Wireless"

# SMS via Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+61..."
```

**Events Supported:**
1. `repair_created` - When repair order is created
2. `repair_approved` - When customer approves quote
3. `repair_in_progress` - When technician starts work
4. `repair_completed` - When repair is finished
5. `repair_ready_pickup` - When device is ready
6. `payment_received` - When payment is processed

**Test Configuration:**
```bash
# Check if email is configured
node -e "require('./lib/notifications').notificationService.isEmailConfigured()"

# Check if SMS is configured
node -e "require('./lib/notifications').notificationService.isSMSConfigured()"
```

---

## ⚙️ Service Management

### PM2 Commands

**View Status:**
```bash
pm2 status
pm2 list
```

**View Logs:**
```bash
# Real-time logs
pm2 logs repair-dashboard
pm2 logs lightspeed-sync

# Last 100 lines
pm2 logs repair-dashboard --lines 100
pm2 logs repair-dashboard --err  # Errors only
```

**Restart Services:**
```bash
# Restart all
pm2 restart ecosystem.config.js

# Restart specific service
pm2 restart repair-dashboard
pm2 restart lightspeed-sync
```

**Stop/Start Services:**
```bash
# Stop
pm2 stop repair-dashboard
pm2 stop lightspeed-sync

# Start
pm2 start ecosystem.config.js
```

**Save Configuration:**
```bash
# Save current process list
pm2 save

# Setup auto-start on reboot (already configured)
pm2 startup
```

### Manual Next.js Commands

**Build (after code changes):**
```bash
cd /home/avi/projects/mobile/rep/repair-dashboard
npm run build
pm2 restart repair-dashboard
```

**Database Migrations:**
```bash
# Apply schema changes
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Seed devices
npx tsx scripts/seed-devices.ts
```

---

## 📊 Monitoring & Logs

### PM2 Dashboard

**Web Interface (Optional):**
```bash
pm2 plus  # Cloud monitoring (requires account)
```

**CLI Monitoring:**
```bash
# Real-time monitoring
pm2 monit

# Process info
pm2 show repair-dashboard
pm2 show lightspeed-sync
```

### Log Files

**Locations:**
```
/home/avi/projects/mobile/rep/repair-dashboard/logs/
  ├── dashboard-out-*.log      # Next.js stdout
  ├── dashboard-error-*.log    # Next.js stderr
  ├── sync-out.log             # Sync service stdout
  └── sync-error.log           # Sync service stderr
```

**View Logs:**
```bash
# Next.js logs
tail -f logs/dashboard-out-*.log

# Sync service logs
tail -f logs/sync-out.log
tail -f logs/sync-error.log

# All logs
pm2 logs
```

### Health Checks

**API Health Check:**
```bash
# Devices API
curl -s http://localhost:3000/api/devices | jq '.count'

# Customers API
curl -s http://localhost:3000/api/customers | jq 'length'

# Repair Types API
curl -s http://localhost:3000/api/repair-types | jq 'length'
```

**Dashboard Health Check:**
```bash
# Check HTTP status codes
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard/analytics
```

---

## 🔧 Troubleshooting

### Service Won't Start

**Problem:** `pm2 status` shows service as "errored"

**Solution:**
```bash
# View error logs
pm2 logs repair-dashboard --err --lines 50

# Check if port is in use
ss -tulpn | grep :3000

# Kill conflicting process
kill <PID>

# Restart service
pm2 restart repair-dashboard
```

### Database Errors

**Problem:** "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
pm2 restart repair-dashboard
```

**Problem:** Schema changes not applied

**Solution:**
```bash
npx prisma db push
npx prisma generate
pm2 restart repair-dashboard
```

### Build Errors

**Problem:** Next.js build fails

**Solution:**
```bash
# Clean and rebuild
rm -rf .next
npm run build

# If still fails, check Node version
node --version  # Should be 18.x or higher

# Check dependencies
npm install
```

### API Returning 500 Errors

**Problem:** Internal Server Error on API calls

**Solution:**
```bash
# Check logs
pm2 logs repair-dashboard --err

# Common causes:
# 1. Database connection issue
ls prisma/prisma/dev.db  # Check if database exists

# 2. Prisma client issue
npx prisma generate

# 3. Environment variables missing
cat .env | grep -E "LIGHTSPEED|GEMINI"

# Restart after fixes
pm2 restart repair-dashboard
```

### Lightspeed Sync Not Working

**Problem:** Customers not syncing from Lightspeed

**Solution:**
```bash
# Check Lightspeed configuration
cat .env | grep LIGHTSPEED

# Test manual sync
npx tsx scripts/sync-lightspeed-customers.ts --once

# Check sync service logs
pm2 logs lightspeed-sync --lines 50

# Verify Lightspeed credentials
curl "https://metrowireless.retail.lightspeed.app/api/2.0/customers" \
  -H "Authorization: Bearer $LIGHTSPEED_PERSONAL_TOKEN"
```

---

## 🚀 Next Steps

### Immediate Actions

1. **Enable Notifications** (Optional)
   - Obtain Resend API key: https://resend.com
   - Obtain Twilio credentials: https://twilio.com
   - Add keys to `.env`
   - Restart services

2. **Test Bi-directional Sync**
   - Create a test repair order
   - Mark it as completed
   - Sync to Lightspeed
   - Verify sale appears in Lightspeed POS

3. **Monitor Analytics**
   - Visit analytics dashboard daily
   - Track key metrics
   - Adjust business strategy based on data

### Future Enhancements

**Phase 5: Advanced Features** (Next Sprint)
- [ ] Automated notifications on status changes
- [ ] Email templates for each repair event
- [ ] SMS reminders for pickup
- [ ] Customer portal for self-service tracking

**Phase 6: Workflow Automation**
- [ ] Auto-approve low-value repairs
- [ ] Smart technician assignment
- [ ] Automated parts ordering
- [ ] Warranty claim processing

**Phase 7: Mobile & Portal**
- [ ] Customer self-service portal
- [ ] Technician mobile app
- [ ] Photo upload and documentation
- [ ] Digital signatures for pickup

### Recommended Monitoring

**Daily:**
- Check PM2 service status
- Review error logs
- Verify Lightspeed sync completed

**Weekly:**
- Review analytics dashboard
- Check database size
- Rotate old logs

**Monthly:**
- Update dependencies (`npm update`)
- Backup database
- Review and optimize pricing

---

## 📞 Support & Documentation

### Documentation Files
- `INTEGRATIONS.md` - Complete integration guide
- `IMPLEMENTATION_PLAN.md` - Original 24-day roadmap
- `PHASE_1_CHECKLIST.md` - Phase 1 implementation checklist
- `README.md` - Project overview

### Quick Links
- **Dashboard**: http://31.97.222.218:3000/dashboard
- **Analytics**: http://31.97.222.218:3000/dashboard/analytics
- **Pricing**: http://31.97.222.218:3000/dashboard/pricing
- **AI Bulk Pricing**: http://31.97.222.218:3000/dashboard/pricing/ai-bulk

### Git Repository
```bash
cd /home/avi/projects/mobile/rep/repair-dashboard
git log --oneline -5  # View recent commits
git status            # Check current status
```

---

## 📝 Changelog

### v1.1.0 (2025-11-10)

**New Features:**
- ✅ Device catalog expanded to 64 models
- ✅ Bi-directional Lightspeed sync (repairs → sales)
- ✅ Notification system foundation (Resend + Twilio)
- ✅ Analytics dashboard with comprehensive metrics
- ✅ Database schema updated with sync tracking

**Technical:**
- Updated Prisma schema with `lightspeedSaleId`, `syncedToLightspeed`, `syncedAt`
- Created `POST /api/integrations/lightspeed/sales` endpoint
- Added `NotificationService` class with event-driven architecture
- Built analytics page with real-time metrics
- Created device seeding script for easy catalog updates

**Commits:**
```
b3b70ac fix: escape quotes in ai-bulk page to resolve ESLint error
259cf66 docs: update INTEGRATIONS.md with v1.1.0 features
3ef1449 feat: complete Phase 1-4 implementation
```

### v1.0.0 (2025-11-10)
- Initial production deployment
- Lightspeed X Series integration
- Gemini AI 2.5-flash integration
- Automated sync service
- Bulk AI pricing tool
- 924 customers synced

---

**Last Updated**: 2025-11-10
**Deployed By**: Claude Code
**Status**: ✅ Production Ready
