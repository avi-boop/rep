#!/usr/bin/env tsx

/**
 * Automated Lightspeed Customer Sync Script
 *
 * This script syncs customers from Lightspeed POS to the local database.
 * Can be run manually or scheduled via cron/systemd timer.
 *
 * Usage:
 *   tsx scripts/sync-lightspeed-customers.ts [--once]
 *
 * Options:
 *   --once    Run sync once and exit (default: run on schedule)
 */

import cron from 'node-cron'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env') })

interface SyncResult {
  success: boolean
  synced?: number
  created?: number
  updated?: number
  skipped?: number
  error?: string
  timestamp: string
}

class LightspeedCustomerSync {
  private apiUrl: string
  private isRunning = false
  private lastSync: Date | null = null
  private syncHistory: SyncResult[] = []

  constructor() {
    const domainPrefix = process.env.LIGHTSPEED_DOMAIN_PREFIX
    if (!domainPrefix) {
      throw new Error('LIGHTSPEED_DOMAIN_PREFIX not configured')
    }
    this.apiUrl = `http://localhost:${process.env.PORT || 3000}/api/integrations/lightspeed/customers`
  }

  async sync(): Promise<SyncResult> {
    if (this.isRunning) {
      console.log('⏭️  Sync already in progress, skipping...')
      return {
        success: false,
        error: 'Sync already in progress',
        timestamp: new Date().toISOString(),
      }
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      console.log(`\n🔄 Starting Lightspeed customer sync at ${new Date().toLocaleString()}`)

      const response = await fetch(`${this.apiUrl}?action=sync&limit=1000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      // Count results
      const created = data.customers?.filter((c: any) => c.action === 'created').length || 0
      const updated = data.customers?.filter((c: any) => c.action === 'updated').length || 0
      const skipped = data.customers?.filter((c: any) =>
        c.action === 'skipped_no_phone' || c.action === 'skipped_duplicate'
      ).length || 0

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      const result: SyncResult = {
        success: true,
        synced: data.synced,
        created,
        updated,
        skipped,
        timestamp: new Date().toISOString(),
      }

      this.lastSync = new Date()
      this.syncHistory.push(result)

      // Keep only last 100 sync results
      if (this.syncHistory.length > 100) {
        this.syncHistory = this.syncHistory.slice(-100)
      }

      console.log(`✅ Sync completed successfully in ${duration}s`)
      console.log(`   📊 Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Total: ${data.synced}`)

      return result
    } catch (error: any) {
      console.error('❌ Sync failed:', error.message)

      const result: SyncResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }

      this.syncHistory.push(result)
      return result
    } finally {
      this.isRunning = false
    }
  }

  getStats() {
    const recentSyncs = this.syncHistory.slice(-10)
    const successRate = recentSyncs.length > 0
      ? (recentSyncs.filter(s => s.success).length / recentSyncs.length) * 100
      : 0

    return {
      lastSync: this.lastSync?.toLocaleString() || 'Never',
      totalSyncs: this.syncHistory.length,
      recentSuccessRate: `${successRate.toFixed(1)}%`,
      isRunning: this.isRunning,
    }
  }

  printStats() {
    const stats = this.getStats()
    console.log('\n📈 Sync Statistics:')
    console.log(`   Last sync: ${stats.lastSync}`)
    console.log(`   Total syncs: ${stats.totalSyncs}`)
    console.log(`   Success rate (last 10): ${stats.recentSuccessRate}`)
    console.log(`   Currently running: ${stats.isRunning ? 'Yes' : 'No'}`)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const runOnce = args.includes('--once')

  console.log('🚀 Lightspeed Customer Sync Service')
  console.log('   Version: 1.0.0')
  console.log(`   Mode: ${runOnce ? 'One-time' : 'Scheduled'}`)
  console.log(`   API URL: http://localhost:${process.env.PORT || 3000}`)

  const syncService = new LightspeedCustomerSync()

  if (runOnce) {
    // Run once and exit
    await syncService.sync()
    syncService.printStats()
    process.exit(0)
  } else {
    // Run on schedule
    console.log('\n⏰ Scheduling automatic syncs:')
    console.log('   • Every 6 hours: Full customer sync')
    console.log('   • On startup: Initial sync')
    console.log('\n💡 Press Ctrl+C to stop\n')

    // Run initial sync
    await syncService.sync()

    // Schedule syncs every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await syncService.sync()
    })

    // Print stats every hour
    cron.schedule('0 * * * *', () => {
      syncService.printStats()
    })

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down sync service...')
      syncService.printStats()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n\n👋 Shutting down sync service...')
      syncService.printStats()
      process.exit(0)
    })

    // Keep process alive
    await new Promise(() => {})
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
