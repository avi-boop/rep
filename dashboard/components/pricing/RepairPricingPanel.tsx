'use client'

import { useState, useEffect } from 'react'
import { X, Edit2, CheckCircle, AlertCircle, HelpCircle, Copy, TrendingDown, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { applyPsychologicalPricing } from '@/lib/pricing-utils'
import { RepairTypeIcon } from './RepairTypeIcon'
import { EditPricingModal } from './EditPricingModal'

interface DeviceModel {
  id: number
  name: string
  brand: {
    name: string
  }
}

interface RepairType {
  id: number
  name: string
}

interface PartType {
  id: number
  name: string
  qualityLevel: number
}

interface Pricing {
  id: number
  deviceModelId: number
  repairTypeId: number
  partTypeId: number
  price: number
  cost: number | null
  isEstimated: boolean
  confidenceScore: number | null
  notes: string | null
  deviceModel: DeviceModel
  repairType: RepairType
  partType: PartType
}

interface Props {
  deviceModel: DeviceModel
  repairTypes: RepairType[]
  partTypes: PartType[]
  pricing: Pricing[]
  onClose: () => void
  onPricingUpdated: () => void
}

export function RepairPricingPanel({ deviceModel, repairTypes, partTypes, pricing, onClose, onPricingUpdated }: Props) {
  const [selectedPartType, setSelectedPartType] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null)

  // Default to Standard part type
  useEffect(() => {
    const standardPart = partTypes.find(pt => pt.name === 'Standard') || partTypes[0]
    if (standardPart) {
      setSelectedPartType(standardPart.id)
    }
  }, [partTypes])

  // Get pricing for selected part type
  const relevantPricing = pricing.filter(p => 
    p.deviceModelId === deviceModel.id && 
    p.partTypeId === selectedPartType
  )

  // Calculate total package price
  const totalPrice = relevantPricing.reduce((sum, p) => sum + p.price, 0)

  // Handle copy all prices
  const handleCopyPrices = () => {
    const priceList = repairTypes.map(rt => {
      const price = relevantPricing.find(p => p.repairTypeId === rt.id)
      return `${rt.name}: ${price ? formatCurrency(price.price) : 'N/A'}`
    }).join('\n')

    const text = `${deviceModel.brand.name} ${deviceModel.name} - Repair Pricing\n\n${priceList}\n\nTotal Package: ${formatCurrency(totalPrice)}`
    
    navigator.clipboard.writeText(text)
    alert('✅ Prices copied to clipboard!')
  }

  const handleEdit = (pricing: Pricing) => {
    setSelectedPricing(pricing)
    setShowEditModal(true)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X size={24} className="text-gray-600" />
            </button>
            <button
              onClick={handleCopyPrices}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Copy size={18} />
              <span className="text-sm font-medium">Copy All</span>
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">{deviceModel.brand.name}</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{deviceModel.name}</h2>

            {/* Part Quality Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Quality
              </label>
              <div className="flex gap-2 flex-wrap">
                {partTypes.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPartType(pt.id)}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-all
                      ${pt.id === selectedPartType
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {pt.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Repair Pricing List */}
        <div className="p-6 space-y-4">
          {repairTypes.map(rt => {
            const price = relevantPricing.find(p => p.repairTypeId === rt.id)
            
            return (
              <div
                key={rt.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                {price ? (
                  <PricingCard pricing={price} onEdit={() => handleEdit(price)} />
                ) : (
                  <MissingPriceCard repairType={rt} />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Summary */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Complete Package Price</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalPrice)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {relevantPricing.length} of {repairTypes.length} repairs priced
              </p>
            </div>
            <button
              onClick={handleCopyPrices}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md flex items-center gap-2"
            >
              <Copy size={18} />
              Copy Quote
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedPricing && (
        <EditPricingModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            onPricingUpdated()
            setShowEditModal(false)
          }}
          pricing={selectedPricing}
        />
      )}
    </>
  )
}

function PricingCard({ pricing, onEdit }: { pricing: Pricing; onEdit: () => void }) {
  const psychPrice = applyPsychologicalPricing(pricing.price)
  const needsPsychAdjustment = psychPrice !== pricing.price

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <RepairTypeIcon repairType={pricing.repairType.name} size={24} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{pricing.repairType.name}</h4>
            {pricing.notes && (
              <p className="text-xs text-gray-500 mt-0.5">{pricing.notes}</p>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Edit price"
        >
          <Edit2 size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Price Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          {pricing.isEstimated ? (
            <HelpCircle className="w-5 h-5 text-yellow-500" aria-label="AI Estimated" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" aria-label="Confirmed" />
          )}
          
          {/* Price */}
          <span className={`text-2xl font-bold ${needsPsychAdjustment ? 'text-orange-600' : 'text-gray-900'}`}>
            {formatCurrency(pricing.price)}
          </span>
        </div>

        {/* Status Badge */}
        <div>
          {pricing.isEstimated ? (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
              Estimated
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              Confirmed
            </span>
          )}
        </div>
      </div>

      {/* Psychological Pricing Suggestion */}
      {needsPsychAdjustment && (
        <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
          <TrendingDown className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-900">
            <span className="font-semibold">Suggested:</span> {formatCurrency(psychPrice)} 
            <span className="text-purple-600 ml-1">(psychological pricing)</span>
          </span>
        </div>
      )}

      {/* Confidence Score */}
      {pricing.isEstimated && pricing.confidenceScore && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                pricing.confidenceScore >= 0.8 ? 'bg-green-500' :
                pricing.confidenceScore >= 0.6 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${pricing.confidenceScore * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {Math.round(pricing.confidenceScore * 100)}% confidence
          </span>
        </div>
      )}
    </div>
  )
}

function MissingPriceCard({ repairType }: { repairType: RepairType }) {
  return (
    <div className="space-y-2 opacity-60">
      <div className="flex items-center gap-3">
        <RepairTypeIcon repairType={repairType.name} size={24} />
        <h4 className="font-semibold text-gray-900">{repairType.name}</h4>
      </div>
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-gray-400" />
        <span className="text-gray-500">Not priced yet</span>
        <button className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Add Price
        </button>
      </div>
    </div>
  )
}
