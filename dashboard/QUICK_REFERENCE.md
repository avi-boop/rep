# Quick Reference - Repair Dashboard v1.1.0

## 🚀 Quick Access URLs

```
Dashboard:       http://31.97.222.218:3000/dashboard
Analytics:       http://31.97.222.218:3000/dashboard/analytics
Pricing:         http://31.97.222.218:3000/dashboard/pricing
AI Bulk Pricing: http://31.97.222.218:3000/dashboard/pricing/ai-bulk
```

## ⚡ Essential Commands

### Service Management
```bash
pm2 status                        # View service status
pm2 logs repair-dashboard         # View live logs
pm2 restart repair-dashboard      # Restart Next.js app
pm2 restart lightspeed-sync       # Restart sync service
```

### Database Operations
```bash
npx prisma db push               # Apply schema changes
npx prisma generate              # Regenerate Prisma client
npx tsx scripts/seed-devices.ts  # Seed device catalog
```

### Build & Deploy
```bash
npm run build                    # Build Next.js
pm2 restart ecosystem.config.js  # Restart all services
pm2 save                         # Save PM2 configuration
```

## 📊 API Endpoints

### Device Catalog
```bash
GET http://localhost:3000/api/devices
# Returns: { success: true, data: [...], count: 64 }
```

### Bi-directional Lightspeed Sync
```bash
POST http://localhost:3000/api/integrations/lightspeed/sales
Content-Type: application/json

{ "repairOrderId": 123 }

# Returns: { success: true, saleId: "...", message: "..." }
```

### Customer Sync (Manual Trigger)
```bash
GET http://localhost:3000/api/integrations/lightspeed/customers?action=sync&limit=1000
```

## 🔍 Health Checks

```bash
# Quick health check
curl -s http://localhost:3000/api/devices | jq '.count'
# Expected: 64

# Analytics dashboard
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/analytics
# Expected: 200

# Lightspeed sync endpoint
curl -s -X POST http://localhost:3000/api/integrations/lightspeed/sales \
  -H "Content-Type: application/json" -d '{"repairOrderId": 999}'
# Expected: 404 (repair not found) or 400 (validation error)
```

## 🐛 Common Issues

### Service Not Responding
```bash
pm2 logs repair-dashboard --err  # Check error logs
pm2 restart repair-dashboard     # Restart service
```

### Database Error
```bash
npx prisma generate              # Regenerate Prisma client
pm2 restart repair-dashboard     # Restart
```

### Port Already in Use
```bash
ss -tulpn | grep :3000           # Find process on port 3000
kill <PID>                       # Kill the process
pm2 restart repair-dashboard     # Restart
```

### Build Fails
```bash
rm -rf .next                     # Clean build directory
npm run build                    # Rebuild
pm2 restart repair-dashboard     # Restart
```

## 📈 Current Stats

- **Devices**: 64 models (Apple, Samsung, Google)
- **Customers**: 924 synced from Lightspeed
- **Services**: 2 running (repair-dashboard, lightspeed-sync)
- **Sync Interval**: Every 6 hours
- **Version**: v1.1.0

## 📚 Documentation

- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `INTEGRATIONS.md` - Integration documentation
- `IMPLEMENTATION_PLAN.md` - Project roadmap
- `README.md` - Project overview

## 🔐 Environment Variables

### Required
```bash
DATABASE_URL="file:./prisma/dev.db"
LIGHTSPEED_DOMAIN_PREFIX="metrowireless"
LIGHTSPEED_PERSONAL_TOKEN="..."
GEMINI_API_KEY="AIzaSyC..."
```

### Optional (Notifications)
```bash
RESEND_API_KEY="re_..."
NOTIFICATION_FROM_EMAIL="repairs@metrowireless.com.au"
NOTIFICATION_FROM_NAME="Metro Wireless"

TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+61..."
```

## ⏰ Automated Tasks

- **Lightspeed Customer Sync**: Every 6 hours (PM2 managed)
- **PM2 Log Rotation**: Automatic (pm2-logrotate module)
- **Service Auto-restart**: On crash or reboot

## 🎯 Next Actions

1. **Visit Analytics Dashboard**
   ```
   http://31.97.222.218:3000/dashboard/analytics
   ```

2. **Test Bi-directional Sync**
   - Create a repair order
   - Mark as completed
   - Sync to Lightspeed

3. **Enable Notifications** (Optional)
   - Add Resend API key to `.env`
   - Add Twilio credentials to `.env`
   - Restart services

---

**Last Updated**: 2025-11-10
**Version**: v1.1.0
**Status**: ✅ Production
