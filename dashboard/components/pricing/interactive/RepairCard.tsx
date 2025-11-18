'use client'

import { Edit2, Clock, CheckCircle, HelpCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { RepairTypeIcon } from '../RepairTypeIcon'

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
  onEdit?: () => void
  onAdd?: () => void
}

export function RepairCard({ repairType, pricing, partType, onEdit, onAdd }: RepairCardProps) {
  const hasPricing = pricing !== null

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Repair Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <RepairTypeIcon repairType={repairType.name} size={24} />
          </div>

          <div>
            {/* Repair Name */}
            <h3 className="text-lg font-bold text-gray-900">{repairType.name}</h3>

            {/* Category */}
            {repairType.category && (
              <p className="text-xs text-gray-500">{repairType.category}</p>
            )}
          </div>
        </div>

        {/* Edit/Add Button */}
        {hasPricing ? (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
            title="Edit pricing"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Price
          </button>
        )}
      </div>

      {hasPricing ? (
        <>
          {/* Pricing Info */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Price */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Price</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(pricing.price)}
                </span>
                {pricing.isEstimated ? (
                  <div title="AI Estimated">
                    <HelpCircle className="w-4 h-4 text-yellow-500" />
                  </div>
                ) : (
                  <div title="Confirmed">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Cost */}
            {pricing.cost !== null && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Cost</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(pricing.cost)}
                </div>
              </div>
            )}

            {/* Margin */}
            {pricing.margin !== null && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Margin</div>
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-semibold ${
                    pricing.margin >= 40 ? 'text-green-600' :
                    pricing.margin >= 25 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {pricing.margin.toFixed(1)}%
                  </span>
                  <TrendingUp className={`w-4 h-4 ${
                    pricing.margin >= 40 ? 'text-green-600' :
                    pricing.margin >= 25 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
            {/* Duration */}
            {repairType.estimatedDuration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{repairType.estimatedDuration} min</span>
              </div>
            )}

            {/* Part Quality */}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>{partType.name} Part</span>
            </div>

            {/* Warranty */}
            <div className="text-xs text-gray-500">
              {partType.warrantyMonths} mo warranty
            </div>

            {/* Confidence Score */}
            {pricing.isEstimated && pricing.confidenceScore !== null && (
              <div className="ml-auto">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pricing.confidenceScore >= 0.8 ? 'bg-green-100 text-green-700' :
                  pricing.confidenceScore >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {Math.round(pricing.confidenceScore * 100)}% confidence
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {pricing.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
              <span className="font-medium">Note:</span> {pricing.notes}
            </div>
          )}
        </>
      ) : (
        /* No Pricing State */
        <div className="py-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No pricing set for this repair</p>
          {repairType.description && (
            <p className="text-xs text-gray-400 mt-1">{repairType.description}</p>
          )}
        </div>
      )}
    </div>
  )
}
