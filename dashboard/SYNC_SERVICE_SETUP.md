# Lightspeed Customer Sync Service Setup

This automated service syncs customers from Lightspeed POS to your repair dashboard every 6 hours.

## Quick Start

### Option 1: Manual One-Time Sync

```bash
cd /home/avi/projects/mobile/rep/repair-dashboard
npx tsx scripts/sync-lightspeed-customers.ts --once
```

### Option 2: PM2 (Recommended for VPS)

```bash
# Create logs directory
mkdir -p logs

# Start both dashboard and sync service
pm2 start ecosystem.config.js

# View status
pm2 status

# View sync logs
pm2 logs lightspeed-sync

# Save PM2 configuration to restart on reboot
pm2 save
pm2 startup
```

### Option 3: Systemd Service

```bash
# Create logs directory
mkdir -p /home/avi/projects/mobile/rep/repair-dashboard/logs

# Copy service file
sudo cp lightspeed-sync.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable lightspeed-sync
sudo systemctl start lightspeed-sync

# Check status
sudo systemctl status lightspeed-sync

# View logs
sudo journalctl -u lightspeed-sync -f
```

### Option 4: Cron Job

Add to your crontab (`crontab -e`):

```bash
# Sync customers every 6 hours
0 */6 * * * cd /home/avi/projects/mobile/rep/repair-dashboard && npx tsx scripts/sync-lightspeed-customers.ts --once >> logs/sync-cron.log 2>&1
```

## Sync Schedule

The automated service syncs:
- **Every 6 hours**: Full customer sync from Lightspeed
- **On startup**: Initial sync when service starts

## Monitoring

### PM2 Monitoring
```bash
pm2 logs lightspeed-sync    # View live logs
pm2 monit                    # Real-time monitoring
```

### Systemd Monitoring
```bash
sudo systemctl status lightspeed-sync         # Service status
sudo journalctl -u lightspeed-sync -f         # Live logs
sudo journalctl -u lightspeed-sync --since "1 hour ago"  # Recent logs
```

### Manual Check
```bash
# View sync logs
tail -f logs/sync-out.log
tail -f logs/sync-error.log
```

## Sync Statistics

The service tracks:
- Total customers synced
- Customers created vs updated
- Customers skipped (no phone, duplicates)
- Success rate over last 10 syncs
- Last sync timestamp

## Troubleshooting

### Service won't start
```bash
# Check if Next.js server is running
curl http://localhost:3000/api/devices

# Check environment variables
cat .env | grep LIGHTSPEED

# Test manual sync
npx tsx scripts/sync-lightspeed-customers.ts --once
```

### No customers syncing
- Verify Lightspeed credentials in `.env`
- Check Lightspeed domain prefix is correct
- Ensure customers have phone numbers in Lightspeed

### Duplicate errors
- Database enforces unique phone numbers
- Customers without valid phone numbers are skipped
- Check sync logs for skipped customer details

## Uninstall

### Stop PM2
```bash
pm2 stop lightspeed-sync
pm2 delete lightspeed-sync
```

### Stop Systemd
```bash
sudo systemctl stop lightspeed-sync
sudo systemctl disable lightspeed-sync
sudo rm /etc/systemd/system/lightspeed-sync.service
sudo systemctl daemon-reload
```

## Configuration

Edit `scripts/sync-lightspeed-customers.ts` to change:
- Sync frequency (default: every 6 hours)
- Customer limit per sync (default: 1000)
- Statistics reporting interval (default: every hour)

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Run manual sync with `--once` flag to test
3. Verify Lightspeed API connectivity
4. Ensure database is accessible
