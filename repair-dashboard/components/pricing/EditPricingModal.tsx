'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Sparkles, TrendingUp, DollarSign } from 'lucide-react'
import { applyPsychologicalPricing } from '@/lib/pricing-utils'
import { PriceHistory } from './PriceHistory'

interface Pricing {
  id: number
  price: number
  cost: number | null
  isEstimated: boolean
  confidenceScore: number | null
  notes: string | null
  deviceModel: {
    id: number
    name: string
    brand: { name: string }
  }
  repairType: {
    id: number
    name: string
  }
  partType: {
    id: number
    name: string
  }
  priceHistory?: Array<{
    id: number
    oldPrice: number | null
    newPrice: number | null
    oldCost: number | null
    newCost: number | null
    changedAt: string
    reason: string | null
    changedBy: string | null
  }>
}

interface EditPricingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  pricing: Pricing | null
}

export function EditPricingModal({
  isOpen,
  onClose,
  onSuccess,
  pricing
}: EditPricingModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    price: pricing?.price.toString() || '',
    cost: pricing?.cost?.toString() || '',
    notes: pricing?.notes || '',
    changeReason: ''
  })

  useEffect(() => {
    if (pricing) {
      setFormData({
        price: pricing.price.toString(),
        cost: pricing.cost?.toString() || '',
        notes: pricing.notes || '',
        changeReason: ''
      })
    }
  }, [pricing])

  const handleApplyPsychPricing = () => {
    if (formData.price) {
      const currentPrice = parseFloat(formData.price)
      const psychPrice = applyPsychologicalPricing(currentPrice)
      setFormData(prev => ({
        ...prev,
        price: psychPrice.toString(),
        changeReason: prev.changeReason || 'Applied psychological pricing'
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pricing) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pricing.id,
          price: parseFloat(formData.price),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          notes: formData.notes,
          isEstimated: false, // Mark as confirmed when manually edited
          confidenceScore: 1.0,
          changeReason: formData.changeReason || 'Manual update via dashboard'
        })
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to update pricing')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update pricing')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !pricing) return null

  const currentPrice = parseFloat(formData.price)
  const originalPrice = pricing.price
  const priceChanged = currentPrice !== originalPrice
  const suggestedPsychPrice = applyPsychologicalPricing(currentPrice)
  const needsPsychAdjustment = currentPrice !== suggestedPsychPrice

  const currentCost = formData.cost ? parseFloat(formData.cost) : null
  const margin = currentCost ? ((currentPrice - currentCost) / currentPrice) * 100 : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Pricing</h2>
            <p className="text-sm text-gray-600 mt-1">
              {pricing.deviceModel.name} • {pricing.repairType.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Part Quality: Standard
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Price:</span>
              <span className="text-lg font-bold text-gray-900">${originalPrice.toFixed(2)}</span>
            </div>
            {pricing.isEstimated && (
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertCircle size={16} />
                <span>AI Estimated ({pricing.confidenceScore ? `${Math.round(pricing.confidenceScore * 100)}%` : '0%'} confidence)</span>
              </div>
            )}
            {margin !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Margin:</span>
                <span className={`font-semibold ${
                  margin >= 50 ? 'text-green-600' :
                  margin >= 30 ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {margin.toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Price Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retail Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retail Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  required
                />
              </div>

              {/* Price Change Indicator */}
              {priceChanged && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <TrendingUp className={currentPrice > originalPrice ? 'text-green-600' : 'text-red-600'} size={16} />
                  <span className={currentPrice > originalPrice ? 'text-green-600' : 'text-red-600'}>
                    {currentPrice > originalPrice ? '+' : ''}${(currentPrice - originalPrice).toFixed(2)}
                    ({((currentPrice - originalPrice) / originalPrice * 100).toFixed(1)}%)
                  </span>
                </div>
              )}

              {/* Psychological Pricing Suggestion */}
              {needsPsychAdjustment && (
                <button
                  type="button"
                  onClick={handleApplyPsychPricing}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium w-full justify-center"
                >
                  <Sparkles size={14} />
                  Apply psychological pricing (${suggestedPsychPrice})
                </button>
              )}
            </div>

            {/* Supply Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supply Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>
              {formData.cost && formData.price && (
                <p className="mt-2 text-sm">
                  <span className="text-gray-600">New Margin: </span>
                  <span className={`font-semibold ${
                    margin && margin >= 50 ? 'text-green-600' :
                    margin && margin >= 30 ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {margin?.toFixed(0)}%
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Change Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change
            </label>
            <input
              type="text"
              value={formData.changeReason}
              onChange={(e) => setFormData(prev => ({ ...prev, changeReason: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Market rate adjustment, Cost increase, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Price History */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
            <PriceHistory
              history={pricing.priceHistory || []}
              currentPrice={currentPrice}
              currentCost={currentCost}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !priceChanged && !formData.changeReason}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm transition-colors"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
