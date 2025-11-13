# Repair Dashboard - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Access Your Dashboard

**Live URL**: http://31.97.222.218:3000

**Local URL**: http://localhost:3000

### 2. Key Features

#### ✅ Customer Management
- **923 customers** synced from Lightspeed POS
- View, search, and manage customer database
- Auto-sync every 6 hours

#### ✅ AI-Powered Pricing
- Get intelligent pricing recommendations
- Sydney market data (2025)
- 80-90% confidence ratings

#### ✅ Repair Orders
- Create quotes with AI pricing
- Track repair status
- Customer notifications

#### ✅ Bulk Operations
- Generate pricing for multiple repairs
- Export to CSV
- Save to database

---

## 📍 Navigation

| Section | URL | Purpose |
|---------|-----|---------|
| Dashboard | /dashboard | Overview and stats |
| Repairs | /dashboard/repairs | Manage repair orders |
| Customers | /dashboard/customers | Customer database |
| Pricing | /dashboard/pricing | Price management |
| **AI Bulk Pricing** | /dashboard/pricing/ai-bulk | Generate multiple AI prices |
| Settings | /dashboard/settings | Configure integrations |

---

## 🤖 Quick Actions

### Get AI Pricing

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

### Sync Customers Manually

```bash
# One-time sync
npx tsx scripts/sync-lightspeed-customers.ts --once

# Or via API
curl "http://localhost:3000/api/integrations/lightspeed/customers?action=sync&limit=1000"
```

---

## 🔧 Service Management

### Using PM2 (Recommended)

```bash
# Start everything
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs
```

---

## 📊 Current Stats

- **Customers**: 923 synced from Lightspeed
- **Devices**: 10 models configured (Apple, Samsung)
- **Repair Types**: 5 (Screen, Battery, Back Panel, Camera, Charging Port)
- **Part Types**: 3 quality levels (OEM, Premium, Standard)
- **AI Pricing**: 5 verified recommendations

---

## 🎯 Quick Wins Completed

✅ Synced 923 Lightspeed customers
✅ Got AI pricing for top 5 repairs
✅ Created test repair order with AI pricing
✅ Built bulk AI pricing tool
✅ Automated sync service (every 6 hours)

**Happy Repairing! 📱🔧**
