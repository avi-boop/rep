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

## API Endpoints

### Lightspeed Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/lightspeed/customers?action=sync` | Sync customers from Lightspeed |

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

### Recommended Enhancements

1. **Bi-directional Sync**
   - Push repairs back to Lightspeed as sales
   - Sync pricing from dashboard to Lightspeed

2. **Enhanced AI Features**
   - Price trend analysis over time
   - Competitor price monitoring
   - Seasonal pricing adjustments

3. **Notifications**
   - Email/SMS when sync completes
   - Alerts for sync failures
   - Low confidence pricing warnings

4. **Analytics**
   - Customer acquisition metrics
   - Popular repair tracking
   - Revenue forecasting

---

## Support

For questions or issues:

1. **Check logs**: `logs/` directory
2. **Test manually**: Use `--once` flag
3. **Verify environment**: Check `.env` file
4. **API status**: Test endpoints with curl
5. **Documentation**: Review this guide

## Version History

- **v1.0.0** (2025-11-10)
  - ✅ Lightspeed X Series integration
  - ✅ Gemini AI 2.5-flash integration
  - ✅ Automated sync service
  - ✅ Bulk AI pricing tool
  - ✅ 923 customers synced
  - ✅ Production-ready
