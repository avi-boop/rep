'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PricingSyncButton() {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    if (!confirm('Sync pricing from Lightspeed? This will import all repair prices and intelligently fill missing prices.')) {
      return
    }

    setSyncing(true)

    try {
      const response = await fetch('/api/pricing/sync', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        const message = `✅ Sync Complete!\n\n` +
          `📥 New prices imported: ${result.stats.imported}\n` +
          `📝 Existing prices updated: ${result.stats.updated}\n` +
          `🤖 Prices estimated (AI): ${result.stats.estimated}\n` +
          `⏭️  Skipped (older data): ${result.stats.skipped}\n\n` +
          `Refreshing page...`

        alert(message)

        // Refresh the page to show new data
        router.refresh()
      } else {
        alert(`❌ Sync failed:\n\n${result.message}\n\n${result.details || ''}`)
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      alert(`❌ Failed to sync pricing:\n\n${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
      title="Import and update pricing from Lightspeed"
    >
      <RefreshCw className={syncing ? 'animate-spin' : ''} size={18} />
      {syncing ? 'Syncing...' : 'Sync Lightspeed'}
    </button>
  )
}
