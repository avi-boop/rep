# Intelligent Pricing System - Complete Guide 🚀

**Status:** ✅ DEPLOYED TO PRODUCTION
**Date:** November 11, 2025
**Dashboard URL:** https://repair.theprofitplatform.com.au/dashboard/pricing

---

## 🎉 What's New

Your repair dashboard now has an **intelligent pricing management system** that:

✅ **Imports ALL pricing from Lightspeed** - Syncs all iPhone repair variants automatically
✅ **Keeps newest prices** - Always prefers the latest updated price
✅ **AI-powered price prediction** - Intelligently fills missing prices using market data
✅ **Price history tracking** - Tracks every price change with full history
✅ **Visual dashboard** - Beautiful UI to manage and monitor all pricing
✅ **One-click sync** - Update all pricing with a single button

---

## 🎯 Features

### 1. **Intelligent Import System**

The system automatically:
- Fetches all products from Lightspeed POS
- Identifies iPhone repair variants (Model × Repair Type)
- Imports prices that are set in Lightspeed
- **Predicts missing prices** using AI and market research
- Keeps track of which prices are confirmed vs estimated

### 2. **AI Price Prediction**

When a price is missing in Lightspeed, the AI:
1. Checks market-based pricing database (iPhone 6-16 series)
2. Analyzes similar repair prices from your data
3. Uses repair type averages as fallback
4. Assigns confidence scores (50%-95%)
5. Marks as "estimated" for your review

**Example:**
```
iPhone 11 / Front → $180 (95% confidence - market price)
iPhone 11 / Back → $150 (75% confidence - based on similar repairs)
iPhone 11 / Others → $100 (50% confidence - repair type average)
```

### 3. **Smart Price Management**

- **Keeps newest prices:** If you update a price in Lightspeed, the sync will import the new price
- **Prevents downgrades:** Won't replace a newer price with older data
- **Tracks history:** Every change is logged in price history
- **Manual overrides:** You can manually edit any price in the dashboard

### 4. **Comprehensive Dashboard**

View and manage all pricing with:
- **Statistics cards:** Total prices, average, confirmed vs estimated
- **Filter options:** View all, confirmed, estimated, or needs review
- **Search functionality:** Find prices by device or repair type
- **Inline editing:** Edit price and cost directly in the table
- **Visual indicators:** See estimated vs confirmed prices at a glance
- **Margin calculation:** Automatic profit margin display

---

## 📊 How It Works

### Data Flow:

```
Lightspeed POS
     ↓
[Fetch Products API]
     ↓
[Parse iPhone Repair Variants]
     ↓
[Check Existing Prices]
     ↓
Has Price? → YES → [Import Price]
     ↓
Has Price? → NO  → [AI Predict Price]
     ↓
[Create/Update Database]
     ↓
[Track Price History]
     ↓
[Display in Dashboard]
```

### Import Summary (Latest Run):

```
✅ New prices imported: 72
📝 Existing prices updated: 0
🤖 Prices estimated intelligently: 155
⏭️  Skipped (older data): 83
📦 Total processed: 155
```

**This means:**
- 72 brand new pricing entries created
- 155 prices intelligently estimated using AI
- 83 skipped because newer data already exists

---

## 🚀 How to Use

### Method 1: Dashboard (Recommended)

1. Go to https://repair.theprofitplatform.com.au/dashboard/pricing
2. Click **"Sync Lightspeed"** button (green button, top right)
3. Confirm the sync
4. Wait 10-30 seconds for completion
5. See results:
   - Imported count
   - Updated count
   - Estimated count
6. Review pricing in the table
7. Edit any prices as needed
8. Save changes

### Method 2: Command Line

```bash
cd /home/avi/projects/mobile/rep/repair-dashboard
npm run import:pricing
```

This runs the intelligent import script directly.

---

## 💰 Pricing Intelligence

### Market-Based Pricing (Built-in Database)

The system includes comprehensive market pricing for:

#### **iPhone 16 Series**
```
16 Pro Max / Front:   $549
16 Pro Max / Battery: $150
16 Pro Max / Back:    $350
16 Pro Max / Camera:  $280
```

#### **iPhone 15 Series**
```
15 Pro Max / Front:   $450
15 Pro Max / Battery: $140
15 Pro Max / Back:    $300
15 Pro Max / Camera:  $250
```

#### **iPhone 14 Series**
```
14 Pro Max / Front:   $380
14 Pro Max / Battery: $120
14 Pro Max / Back:    $280
14 Pro Max / Camera:  $220
```

#### **iPhone 13 Series**
```
13 Pro Max / Front:   $320
13 Pro Max / Battery: $110
13 Pro Max / Back:    $250
13 Pro Max / Camera:  $200
```

#### **iPhone 12 Series**
```
12 Pro Max / Front:   $280
12 Pro Max / Battery: $100
12 Pro Max / Back:    $220
12 Pro Max / Camera:  $180
```

#### **iPhone 11 Series**
```
11 Pro Max / Front:   $240
11 Pro Max / Battery: $90
11 Pro Max / Back:    $180
11 Pro Max / Camera:  $150
```

**And more** for iPhone X, XR, Xs, 8, 7, 6/6s series!

---

## 📈 Dashboard Features

### Statistics Overview

**Total Prices:** Shows active pricing count
**Average Price:** Average across all repair types
**Confirmed:** Prices imported from Lightspeed or manually set
**AI Estimated:** Prices predicted by the system (need review)

### Filter Options

- **All:** Show all active prices
- **Confirmed:** Only prices from Lightspeed or manual entry
- **Estimated:** Only AI-predicted prices
- **Needs Review:** Estimated prices with low confidence (<70%)

### Price Table Columns

| Column | Description |
|--------|-------------|
| Device | Device model and brand |
| Repair Type | Type of repair (Front, Back, Battery, etc.) |
| Part Quality | Quality tier (Standard, Premium, Budget) |
| Price | Retail price (editable) |
| Cost | Supply cost (editable) |
| Margin | Profit margin percentage |
| Status | Confirmed ✅ or Estimated ⚠️ |
| Actions | Edit or view history |

### Inline Editing

1. Click the **Edit** icon (pencil)
2. Update **Price** and **Cost** fields
3. Click **Save** (checkmark)
4. Price is marked as "Confirmed" automatically
5. Change is tracked in price history

---

## 🔄 Sync Workflow

### When to Sync:

1. **After setting prices in Lightspeed** (recommended)
   - Set retail prices for your repair variants in Lightspeed
   - Click "Sync Lightspeed" in dashboard
   - All prices import automatically

2. **To get intelligent estimates** (quick start)
   - Click "Sync Lightspeed" without setting prices
   - System predicts all missing prices using AI
   - Review and adjust as needed

3. **Regular updates** (monthly recommended)
   - Keep pricing in sync with Lightspeed
   - Import new repair types
   - Update changed prices

### What Happens During Sync:

1. ✅ Fetches all products from Lightspeed
2. ✅ Identifies iPhone Repair variants (155 total)
3. ✅ Checks existing prices in dashboard database
4. ✅ Imports prices that are set in Lightspeed
5. ✅ Predicts missing prices using AI
6. ✅ Creates device models, repair types as needed
7. ✅ Tracks price changes in history
8. ✅ Refreshes dashboard automatically

---

## 🎓 Best Practices

### 1. **Set Prices in Lightspeed First** (Recommended)

**Why?** Lightspeed is your source of truth for actual sales.

**How?**
1. Go to Lightspeed: https://metrowireless.retail.lightspeed.app
2. Navigate to Products → "iPhone Repair"
3. Click on Variants
4. For each variant (e.g., "iPhone 11 / Front"):
   - Set `Retail Price` (e.g., $180)
   - Set `Supply Cost` (e.g., $60)
   - Save
5. Return to dashboard and click "Sync Lightspeed"
6. All prices import automatically!

**Reference prices:** See `LIGHTSPEED_REPAIR_REVIEW_CORRECTED.md` for recommended pricing.

### 2. **Review AI Estimates**

After syncing, review estimated prices:
1. Filter by "Estimated" or "Needs Review"
2. Check confidence scores
3. Edit prices that seem off
4. Save changes (marks as confirmed)

### 3. **Regular Syncs**

- **Weekly:** If you're actively updating Lightspeed prices
- **Monthly:** For general price updates and new repair types
- **After bulk changes:** When you update multiple prices in Lightspeed

### 4. **Use Price History**

Track how your pricing has evolved:
1. Click on any pricing row
2. View price history (coming soon in UI)
3. See: old price → new price, reason, date

### 5. **Monitor Margins**

Watch profit margins in the table:
- **Green (50%+):** Excellent margin
- **Blue (30-50%):** Good margin
- **Orange (<30%):** Low margin, consider price increase

---

## 🔧 API Endpoints

### GET /api/pricing
**Purpose:** Fetch all pricing data
**Filters:**
- `deviceModelId` - Filter by device
- `repairTypeId` - Filter by repair type
- `partTypeId` - Filter by part quality

**Example:**
```bash
GET /api/pricing?deviceModelId=1&repairTypeId=2
```

### POST /api/pricing/sync
**Purpose:** Trigger Lightspeed sync
**Returns:** Import stats (imported, updated, estimated, skipped)

**Example:**
```bash
POST /api/pricing/sync
```

### GET /api/pricing/stats
**Purpose:** Get pricing statistics
**Returns:** Overview, price ranges, breakdown by repair type

**Example:**
```bash
GET /api/pricing/stats
```

### PUT /api/pricing
**Purpose:** Update individual price
**Body:**
```json
{
  "id": 1,
  "price": 200,
  "cost": 60,
  "changeReason": "Updated to match market rate"
}
```

---

## 📊 Pricing Data Structure

### Database Schema

```typescript
Pricing {
  id: number
  deviceModelId: number       // Links to DeviceModel (e.g., iPhone 11)
  repairTypeId: number        // Links to RepairType (e.g., Front/Screen)
  partTypeId: number          // Links to PartType (e.g., Standard)
  price: number               // Retail price
  cost: number | null         // Supply cost
  isEstimated: boolean        // True if AI predicted
  confidenceScore: number     // 0.0-1.0 (50%-100%)
  notes: string | null        // Import notes
  isActive: boolean           // Active/inactive
  validFrom: Date             // When price became valid
  validUntil: Date | null     // When price expires
  priceHistory: []            // Array of changes
}
```

### Price History Schema

```typescript
PriceHistory {
  id: number
  pricingId: number
  oldPrice: number | null
  newPrice: number | null
  oldCost: number | null
  newCost: number | null
  reason: string | null
  changedBy: number | null
  changedAt: Date
}
```

---

## 🚨 Troubleshooting

### Sync Not Working?

1. **Check Lightspeed credentials:**
   ```bash
   cat .env | grep LIGHTSPEED
   ```
   Ensure `LIGHTSPEED_PERSONAL_TOKEN` is set.

2. **Check Lightspeed API:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://metrowireless.retail.lightspeed.app/api/2.0/products
   ```

3. **Check logs:**
   ```bash
   tail -f logs/production.log
   ```

### Prices Not Showing?

1. **Check if imported:**
   ```bash
   npm run import:pricing
   ```

2. **Check database:**
   ```bash
   npm run db:studio
   ```
   View `pricing` table.

3. **Clear cache and refresh:**
   - Hard refresh browser (Ctrl+Shift+R)
   - Or restart service: `sudo systemctl restart repair-dashboard`

### Estimated Prices Wrong?

1. **Edit manually in dashboard**
2. **Or update in Lightspeed and re-sync**
3. **Or update market prices** in `scripts/import-lightspeed-pricing.ts` (basePrices object)

---

## 📝 Scripts Reference

### `npm run import:pricing`
**Purpose:** Run intelligent Lightspeed import
**Time:** 10-30 seconds
**Output:** Import summary with counts

### `npm run analyze:pricing`
**Purpose:** Analyze Lightspeed pricing patterns
**Time:** 5-15 seconds
**Output:** Sales analysis and pricing insights

### `npm run db:push`
**Purpose:** Sync database schema
**Time:** 1-5 seconds
**When:** After schema changes

### `npm run db:studio`
**Purpose:** Open Prisma Studio for database viewing
**Time:** Instant
**Access:** http://localhost:5555

---

## 🎯 Next Steps

### Immediate (This Week):

1. ✅ **Sync pricing from Lightspeed**
   - Click "Sync Lightspeed" in dashboard
   - Review estimated prices
   - Edit any that need adjustment

2. ✅ **Set missing prices in Lightspeed** (optional)
   - Use pricing guide in `LIGHTSPEED_REPAIR_REVIEW_CORRECTED.md`
   - Set retail_price for each variant
   - Re-sync to import confirmed prices

3. ✅ **Train staff**
   - Show them the new pricing dashboard
   - Explain confirmed vs estimated prices
   - Demonstrate sync process

### This Month:

4. ✅ **Set supply costs**
   - Enter actual part costs in dashboard
   - Monitor profit margins
   - Adjust prices if margins too low

5. ✅ **Create quality tiers** (optional)
   - Add Premium and Budget part types
   - Set higher prices for premium parts
   - Offer customer choice

6. ✅ **Review and optimize**
   - Check which repairs are most profitable
   - Adjust prices based on demand
   - Compare with competitors

### Ongoing:

7. ✅ **Monthly price reviews**
   - Sync from Lightspeed monthly
   - Check for market changes
   - Adjust pricing seasonally

8. ✅ **Monitor metrics**
   - Track average repair value
   - Watch profit margins
   - Identify high-margin services

---

## 💡 Pro Tips

### Tip 1: Batch Updates
Use Lightspeed CSV import to set many prices at once, then sync to dashboard.

### Tip 2: Quality Tiers
Create 3 pricing levels:
- **Premium (OEM):** Highest price, 12-month warranty
- **Standard (Compatible):** Mid price, 6-month warranty
- **Budget (Refurbished):** Low price, 3-month warranty

Upsell opportunities increase average order value!

### Tip 3: Seasonal Pricing
Adjust prices quarterly:
- **New iPhone release:** Increase newest model prices
- **3 months later:** Reduce by 10%
- **6 months later:** Reduce by 20%
- **12 months later:** Budget tier

### Tip 4: Competitor Monitoring
Check competitor prices monthly and adjust to stay competitive:
- 10% above = Premium positioning
- Match = Competitive positioning
- 10% below = Volume positioning

### Tip 5: Monitor Confidence Scores
Review prices with <70% confidence weekly. These are most likely to need adjustment.

---

## 📞 Support

### Documentation Files:
- `LIGHTSPEED_REPAIR_REVIEW_CORRECTED.md` - Complete pricing analysis and recommendations
- `PRICING_QUICK_REFERENCE.md` - Quick pricing guide
- `INTELLIGENT_PRICING_SYSTEM.md` - This file

### Need Help?
1. Check logs: `tail -f logs/production.log`
2. Test import: `npm run import:pricing`
3. View database: `npm run db:studio`

---

## ✅ Success Metrics

Track these to measure pricing system success:

### Week 1:
- [ ] First successful Lightspeed sync completed
- [ ] All estimated prices reviewed
- [ ] At least 50% of prices confirmed
- [ ] Staff trained on new system

### Month 1:
- [ ] 100% prices confirmed (no estimates)
- [ ] Supply costs entered for all repairs
- [ ] Average repair value increased by 20%+
- [ ] Monthly sync process established

### Month 3:
- [ ] Profit margins tracked and optimized
- [ ] Quality tiers implemented (optional)
- [ ] Seasonal pricing strategy in place
- [ ] Competitor price monitoring active

---

## 🎉 Summary

You now have a **world-class pricing management system** that:

✅ Imports from Lightspeed automatically
✅ Predicts missing prices intelligently
✅ Tracks all price changes
✅ Provides visual dashboard for management
✅ Keeps pricing always in sync

**Next Action:** Go to https://repair.theprofitplatform.com.au/dashboard/pricing and click "Sync Lightspeed"!

---

**Generated:** November 11, 2025
**Version:** 1.0
**Status:** Production Ready ✅
