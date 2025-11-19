'use client'

import { memo, useState } from 'react'
import { Edit2, Clock, CheckCircle, HelpCircle, AlertCircle, TrendingUp, Calendar, Eye, EyeOff, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { RepairTypeIcon } from '../RepairTypeIcon'
import { useFavorites } from '@/lib/hooks/useFavorites'

interface RepairCardProps {
  repairType: {
    id: number
    name: string
    category: string | null
    description: string | null
    estimatedDuration: number | null
  }
  pricing: {
    id: number
    price: number
    cost: number | null
    margin: number | null
    isEstimated: boolean
    confidenceScore: number | null
    notes: string | null
    updatedAt: Date
  } | null
  partType: {
    id: number
    name: string
    qualityLevel: number
    warrantyMonths: number
  }
  modelId?: number
  modelName?: string
  brandName?: string
  onEdit?: () => void
  onAdd?: () => void
  onBookRepair?: () => void
}

export const RepairCard = memo(function RepairCard({ repairType, pricing, partType, modelId, modelName, brandName, onEdit, onAdd, onBookRepair }: RepairCardProps) {
  const hasPricing = pricing !== null
  const [showDetails, setShowDetails] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites('repair')
  const favorite = isFavorite(repairType.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(repairType.id)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:border-blue-300 hover:shadow-sm transition-all relative">
      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className={`absolute top-1.5 right-1.5 z-10 p-1 rounded-full transition-all ${
          favorite
            ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
        }`}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`w-3 h-3 ${favorite ? 'fill-current' : ''}`} />
      </button>

      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5 pr-6">
        <h3 className="text-xs font-semibold text-gray-900 truncate flex-1">{repairType.name}</h3>

        {/* Action Icons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {hasPricing && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title={showDetails ? "Hide details" : "Show details"}
              >
                {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                title="Edit pricing"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onBookRepair}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-medium"
                title="Book this repair"
              >
                <Calendar className="w-3 h-3" />
                <span>Book</span>
              </button>
            </>
          )}
        </div>
      </div>

      {hasPricing ? (
        <>
          {/* Price - Always Visible */}
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-green-600">
                {formatCurrency(pricing.price)}
              </span>
              {pricing.isEstimated ? (
                <span title="AI Estimated">
                  <HelpCircle className="w-3 h-3 text-yellow-500" />
                </span>
              ) : (
                <span title="Confirmed">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </span>
              )}
            </div>
          </div>

          {/* Expandable Details */}
          {showDetails && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {/* Cost & Margin */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {pricing.cost !== null && (
                  <div>
                    <span className="text-gray-500">Cost: </span>
                    <span className="font-semibold text-red-600">{formatCurrency(pricing.cost)}</span>
                  </div>
                )}
                {pricing.margin !== null && (
                  <div>
                    <span className="text-gray-500">Margin: </span>
                    <span className={`font-semibold ${
                      pricing.margin >= 40 ? 'text-green-600' :
                      pricing.margin >= 25 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {pricing.margin.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {repairType.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{repairType.estimatedDuration} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{partType.name}</span>
                </div>
                <span className="text-gray-500">{partType.warrantyMonths} mo</span>
              </div>

              {/* Notes */}
              {pricing.notes && (
                <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <span className="font-medium">Note:</span> {pricing.notes}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* No Pricing State */
        <div className="py-3 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-2">No pricing</p>
          <button
            onClick={onAdd}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Add Price
          </button>
        </div>
      )}
    </div>
  )
})
