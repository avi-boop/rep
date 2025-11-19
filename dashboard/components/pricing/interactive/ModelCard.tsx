'use client'

import { memo } from 'react'
import { Smartphone, Tablet, Wrench, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ModelCardProps {
  id: number
  name: string
  modelNumber: string | null
  releaseYear: number | null
  deviceType: 'phone' | 'tablet'
  repairCount: number
  priceRange: { min: number; max: number }
  onClick: () => void
}

export const ModelCard = memo(function ModelCard({
  name,
  modelNumber,
  releaseYear,
  deviceType,
  repairCount,
  priceRange,
  onClick
}: ModelCardProps) {
  const hasNoPricing = priceRange.min === 0 && priceRange.max === 0

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      {/* Device Icon */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-colors">
          {deviceType === 'tablet' ? (
            <Tablet className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
          ) : (
            <Smartphone className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Model Name */}
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {name}
          </h3>

          {/* Model Number */}
          {modelNumber && (
            <p className="text-xs text-gray-500 truncate">{modelNumber}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {/* Release Year */}
        {releaseYear && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{releaseYear}</span>
          </div>
        )}

        {/* Repair Count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wrench className="w-4 h-4" />
          <span className="font-medium">{repairCount}</span>
          <span>{repairCount === 1 ? 'repair' : 'repairs'}</span>
        </div>

        {/* Price Range */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-green-600" />
          {hasNoPricing ? (
            <span className="text-red-500 font-medium">No pricing</span>
          ) : priceRange.min === priceRange.max ? (
            <span className="text-green-600 font-semibold">
              {formatCurrency(priceRange.min)}
            </span>
          ) : (
            <span className="text-green-600 font-semibold">
              {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
            </span>
          )}
        </div>
      </div>

      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
})
