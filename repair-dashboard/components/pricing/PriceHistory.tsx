'use client'

import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Clock, Minus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PriceHistoryItem {
  id: number
  oldPrice: number | null
  newPrice: number | null
  oldCost: number | null
  newCost: number | null
  reason: string | null
  changedBy: string | null
  changedAt: string
}

interface Props {
  history: PriceHistoryItem[]
  currentPrice: number
  currentCost?: number | null
}

export function PriceHistory({ history, currentPrice, currentCost }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No price history available</p>
        <p className="text-xs mt-1">Changes will be tracked here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Current Price */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Current Price</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(currentPrice)}</p>
            {currentCost && (
              <p className="text-sm text-blue-600 mt-1">
                Cost: {formatCurrency(currentCost)}
                <span className="text-xs ml-2">
                  (Margin: {formatCurrency(currentPrice - currentCost)})
                </span>
              </p>
            )}
          </div>
          <div className="text-blue-600">
            <Clock className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* History */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Price History ({history.length} {history.length === 1 ? 'change' : 'changes'})
        </h4>

        {history.map((item, index) => {
          const priceChange = (item.newPrice || 0) - (item.oldPrice || 0)
          const isIncrease = priceChange > 0
          const isDecrease = priceChange < 0
          const costChange = item.oldCost && item.newCost ? item.newCost - item.oldCost : 0

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {/* Price Change */}
                  <div className="flex items-center gap-2 mb-1">
                    {isIncrease && (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    )}
                    {isDecrease && (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    {!isIncrease && !isDecrease && (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}

                    <span className="font-semibold text-gray-900">
                      {item.oldPrice ? formatCurrency(item.oldPrice) : '—'}
                      <span className="mx-2 text-gray-400">→</span>
                      {item.newPrice ? formatCurrency(item.newPrice) : '—'}
                    </span>

                    {priceChange !== 0 && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          isIncrease
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isIncrease ? '+' : ''}{formatCurrency(priceChange)}
                      </span>
                    )}
                  </div>

                  {/* Cost Change (if available) */}
                  {item.oldCost !== null && item.newCost !== null && (
                    <div className="text-xs text-gray-600 ml-6">
                      Cost: {formatCurrency(item.oldCost)} → {formatCurrency(item.newCost)}
                      {costChange !== 0 && (
                        <span className="ml-1 text-gray-500">
                          ({costChange > 0 ? '+' : ''}{formatCurrency(costChange)})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  {item.reason && (
                    <p className="text-sm text-gray-600 mt-2 ml-6 italic">
                      &ldquo;{item.reason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })}
                  </p>
                  {item.changedBy && (
                    <p className="text-xs text-gray-400 mt-1">
                      by {item.changedBy}
                    </p>
                  )}
                </div>
              </div>

              {/* Full Date */}
              <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                {new Date(item.changedAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
