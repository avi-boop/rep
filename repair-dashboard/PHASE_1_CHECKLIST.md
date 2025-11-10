# Phase 1: Foundation & Deployment - Action Checklist

**Timeline**: 1-2 days | **Status**: IN PROGRESS

---

## Task 1.1: Deploy Auto-Sync Service ⏰ 15 min

### Prerequisites
- [x] Sync script created (`scripts/sync-lightspeed-customers.ts`)
- [x] PM2 ecosystem config created (`ecosystem.config.js`)
- [x] Logs directory created (`logs/`)
- [x] Manual sync tested successfully

### Steps

#### 1. Start PM2 Services
```bash
cd /home/avi/projects/mobile/rep/repair-dashboard
pm2 start ecosystem.config.js
```
**Status**: ⬜ Not started

**Expected Output**:
```
[PM2] Process successfully started
┌─────┬──────────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ status  │ restart │ uptime  │ cpu      │
├─────┼──────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ repair-dashboard     │ online  │ 0       │ 0s      │ 0%       │
│ 1   │ lightspeed-sync      │ online  │ 0       │ 0s      │ 0%       │
└─────┴──────────────────────┴─────────┴─────────┴─────────┴──────────┘
```

---

#### 2. Verify Services
```bash
pm2 status
```
**Status**: ⬜ Not started

**Validation**:
- [ ] Both services show "online" status
- [ ] No "error" or "stopped" statuses
- [ ] Restart count is 0 or low

---

#### 3. Check Sync Logs
```bash
pm2 logs lightspeed-sync --lines 20
```
**Status**: ⬜ Not started

**Look for**:
- [ ] "🚀 Lightspeed Customer Sync Service" startup message
- [ ] "✅ Sync completed successfully" message
- [ ] No error messages

---

#### 4. Monitor First Sync
```bash
tail -f logs/sync-out.log
```
**Status**: ⬜ Not started

**Wait for**:
- [ ] Initial sync completes
- [ ] Shows customer counts (created, updated, skipped)
- [ ] No errors in sync process

---

#### 5. Save PM2 Configuration
```bash
pm2 save
```
**Status**: ⬜ Not started

**Expected Output**:
```
[PM2] Saving current process list...
[PM2] Successfully saved in /home/avi/.pm2/dump.pm2
```

---

#### 6. Setup Startup Script
```bash
pm2 startup
# Copy and run the command it outputs
```
**Status**: ⬜ Not started

**Expected Output**:
```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=... pm2 startup systemd -u avi --hp /home/avi
```

**Action**: Copy and run the provided command

---

#### 7. Test Restart Behavior
```bash
# Restart one service to test recovery
pm2 restart lightspeed-sync

# Check it comes back online
pm2 status
```
**Status**: ⬜ Not started

**Validation**:
- [ ] Service restarts successfully
- [ ] Status returns to "online"
- [ ] Sync continues working

---

#### 8. Test Server Reboot (Optional)
```bash
# Only do this if you can reboot the server
sudo reboot

# After reboot, check services
pm2 status
```
**Status**: ⬜ Not started (Optional)

**Validation**:
- [ ] Services auto-start after reboot
- [ ] Both show "online" status
- [ ] Logs show startup messages

---

### Final Validation

#### Check Dashboard
```bash
# Dashboard should be accessible
curl -I http://localhost:3000
```
**Status**: ⬜ Not started

**Expected**: `HTTP/1.1 200 OK`

---

#### Check Sync Endpoint
```bash
# Sync endpoint should be accessible
curl -s http://localhost:3000/api/integrations/lightspeed/customers | jq '.length'
```
**Status**: ⬜ Not started

**Expected**: Customer count (e.g., 923)

---

#### Monitor for 1 Hour
**Status**: ⬜ Not started

**Check**:
- [ ] No crashes or restarts
- [ ] Logs look healthy
- [ ] Memory usage stable
- [ ] CPU usage normal

---

### Troubleshooting

#### If services won't start:
```bash
# Check for port conflicts
sudo lsof -i :3000

# Check logs for errors
pm2 logs --err

# Try starting manually first
npm run dev
```

#### If sync fails:
```bash
# Check environment variables
cat .env | grep LIGHTSPEED

# Test manual sync
npx tsx scripts/sync-lightspeed-customers.ts --once

# Check Lightspeed connectivity
curl "https://metrowireless.retail.lightspeed.app/api/2.0/customers" \
  -H "Authorization: Bearer $LIGHTSPEED_PERSONAL_TOKEN"
```

#### If PM2 startup fails:
```bash
# Check PM2 installation
pm2 --version

# Reinstall PM2 globally
npm install -g pm2

# Try startup again
pm2 startup
```

---

### Success Criteria

- [x] Task completed when ALL boxes are checked:
  - [ ] PM2 services running (both "online")
  - [ ] Initial sync completed successfully
  - [ ] No errors in logs
  - [ ] PM2 configuration saved
  - [ ] Startup script configured
  - [ ] Services survive restart test
  - [ ] Dashboard accessible at http://31.97.222.218:3000
  - [ ] 1-hour stability test passed

---

## Task 1.2: Generate Complete Pricing Catalog ⏰ 30 min

### Prerequisites
- [x] Bulk AI pricing tool built
- [x] Gemini AI configured and working
- [x] Device catalog populated (10 models)
- [x] Repair types configured (5 types)
- [x] Part types configured (3 types)

### Steps

#### 1. Access Bulk Pricing Tool
```bash
# Open in browser
open http://31.97.222.218:3000/dashboard/pricing/ai-bulk

# Or locally
open http://localhost:3000/dashboard/pricing/ai-bulk
```
**Status**: ⬜ Not started

---

#### 2. Select All Devices
**Status**: ⬜ Not started

**Devices to select**:
- [ ] iPhone 15 Pro Max
- [ ] iPhone 15 Pro
- [ ] iPhone 15
- [ ] iPhone 14
- [ ] iPhone 14 Pro Max
- [ ] iPhone 13
- [ ] iPhone 12
- [ ] Galaxy S24 Ultra
- [ ] Galaxy S23
- [ ] Galaxy S22

**Total**: 10 devices

---

#### 3. Select All Repair Types
**Status**: ⬜ Not started

**Repairs to select**:
- [ ] Front Screen
- [ ] Battery
- [ ] Back Panel
- [ ] Camera - Rear
- [ ] Charging Port

**Total**: 5 repair types

---

#### 4. Select All Part Types
**Status**: ⬜ Not started

**Parts to select**:
- [ ] Original (OEM)
- [ ] Aftermarket Premium
- [ ] Aftermarket Standard

**Total**: 3 part types

---

#### 5. Generate Combinations
**Status**: ⬜ Not started

**Click**: "Generate Combinations" button

**Expected**: 150 combinations (10 × 5 × 3)

**Validation**:
- [ ] 150 rows appear in table
- [ ] All show "Pending" status
- [ ] Device/repair/part combinations look correct

---

#### 6. Get AI Pricing
**Status**: ⬜ Not started

**Click**: "Get AI Pricing" button

**Monitor**:
- Progress indicator showing X/150 complete
- Status changing from "Pending" → "Loading" → "Success"
- Prices appearing in table

**Expected Duration**: ~3-5 minutes (150 requests × 1-2 seconds each)

**Validation**:
- [ ] All 150 requests complete
- [ ] 140+ show "Success" status (90%+ success rate)
- [ ] Prices look reasonable (e.g., iPhone screen > $300)
- [ ] Confidence scores mostly 80%+

---

#### 7. Review Pricing Results
**Status**: ⬜ Not started

**Check for**:
- [ ] No $0 prices
- [ ] Price ranges make sense
- [ ] OEM prices > Premium > Standard
- [ ] iPhone prices > Samsung for similar repairs
- [ ] Newer models priced higher than older

**Flag any suspicious prices** for manual review

---

#### 8. Save to Database
**Status**: ⬜ Not started

**Click**: "Save to Database" button

**Expected**: Success message showing number saved

**Validation**:
```bash
# Check database
curl http://localhost:3000/api/pricing | jq 'length'
```
**Expected**: 150+ pricing entries

---

#### 9. Export to CSV
**Status**: ⬜ Not started

**Click**: "Export CSV" button

**Expected**: CSV file downloads (e.g., `ai-pricing-2025-11-10.csv`)

**Validation**:
- [ ] CSV file contains all successful prices
- [ ] Columns: Brand, Device, Repair, Part Quality, Suggested Price, Min, Max, Confidence
- [ ] Data matches what's in the table

**Backup**: Save CSV to `backup/pricing-2025-11-10.csv`

---

#### 10. Verify in Pricing Dashboard
**Status**: ⬜ Not started

**Navigate**: `/dashboard/pricing`

**Check**:
- [ ] Pricing matrix shows all combinations
- [ ] Prices display correctly
- [ ] Can filter/search pricing
- [ ] Prices are marked as "AI-generated"

---

### Success Criteria

- [x] Task completed when ALL boxes are checked:
  - [ ] 150 combinations generated
  - [ ] 140+ AI pricing requests successful (90%+)
  - [ ] All prices saved to database
  - [ ] CSV export created and backed up
  - [ ] Pricing appears in dashboard
  - [ ] No obvious pricing errors
  - [ ] Confidence scores documented

---

## Task 1.3: Expand Device Catalog ⏰ 2-3 hours

### Status: ⬜ Not started

**Note**: This task is marked for future implementation. Complete Tasks 1.1 and 1.2 first.

See `IMPLEMENTATION_PLAN.md` for full details.

---

## Phase 1 Completion

### Overall Status
- [ ] Task 1.1: Deploy Auto-Sync Service
- [ ] Task 1.2: Generate Complete Pricing Catalog
- [ ] Task 1.3: Expand Device Catalog

### Phase 1 Success Metrics
- [ ] PM2 services running 24/7
- [ ] 150+ pricing entries generated
- [ ] Zero sync failures in first 24 hours
- [ ] All documentation updated

**When complete, proceed to**: `PHASE_2_CHECKLIST.md`
