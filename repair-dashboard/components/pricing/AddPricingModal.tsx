'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Save, AlertCircle, Sparkles } from 'lucide-react'
import { applyPsychologicalPricing } from '@/lib/pricing-utils'

interface AddPricingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  brands: Array<{ id: number; name: string }>
  repairTypes: Array<{ id: number; name: string }>
  standardPartTypeId: number  // Hard-coded to Standard part type
}

export function AddPricingModal({
  isOpen,
  onClose,
  onSuccess,
  brands,
  repairTypes,
  standardPartTypeId
}: AddPricingModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deviceModels, setDeviceModels] = useState<Array<{ id: number; name: string }>>([])

  const [formData, setFormData] = useState({
    brandId: brands[0]?.id || 0,
    deviceModelId: 0,
    repairTypeId: repairTypes[0]?.id || 0,
    price: '',
    cost: '',
    notes: ''
  })

  // Fetch device models when brand changes
  useEffect(() => {
    if (formData.brandId && isOpen) {
      fetchDeviceModels(formData.brandId)
    }
  }, [formData.brandId, isOpen])

  const fetchDeviceModels = async (brandId: number) => {
    try {
      const response = await fetch(`/api/device-models?brandId=${brandId}`)
      const data = await response.json()
      setDeviceModels(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, deviceModelId: data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching device models:', error)
    }
  }

  const handleApplyPsychPricing = () => {
    if (formData.price) {
      const currentPrice = parseFloat(formData.price)
      const psychPrice = applyPsychologicalPricing(currentPrice)
      setFormData(prev => ({ ...prev, price: psychPrice.toString() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceModelId: parseInt(formData.deviceModelId.toString()),
          repairTypeId: parseInt(formData.repairTypeId.toString()),
          partTypeId: standardPartTypeId,  // Always use Standard part type
          price: parseFloat(formData.price),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          isEstimated: false,
          confidenceScore: 1.0,
          notes: formData.notes || 'Manually added via dashboard'
        })
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        setError(result.error || 'Failed to add pricing')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add pricing')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      brandId: brands[0]?.id || 0,
      deviceModelId: 0,
      repairTypeId: repairTypes[0]?.id || 0,
      price: '',
      cost: '',
      notes: ''
    })
    setError('')
  }

  if (!isOpen) return null

  const suggestedPsychPrice = formData.price
    ? applyPsychologicalPricing(parseFloat(formData.price))
    : null

  const needsPsychAdjustment = suggestedPsychPrice && parseFloat(formData.price) !== suggestedPsychPrice

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Pricing</h2>
              <p className="text-sm text-gray-600">Create a new repair price entry</p>
            </div>
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

          {/* Device Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData(prev => ({ ...prev, brandId: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Model
              </label>
              <select
                value={formData.deviceModelId}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceModelId: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value={0}>Select device...</option>
                {deviceModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Repair Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repair Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repair Type
              </label>
              <select
                value={formData.repairTypeId}
                onChange={(e) => setFormData(prev => ({ ...prev, repairTypeId: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {repairTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Part Quality (Fixed - Standard) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Quality
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
                Standard Quality
              </div>
              <p className="mt-1 text-xs text-gray-500">All pricing uses Standard quality parts</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retail Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retail Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Psychological Pricing Suggestion */}
              {needsPsychAdjustment && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyPsychPricing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                  >
                    <Sparkles size={14} />
                    Use ${suggestedPsychPrice} (psych pricing)
                  </button>
                </div>
              )}
            </div>

            {/* Supply Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supply Cost (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {formData.price && formData.cost && (
                <p className="mt-1 text-sm text-gray-600">
                  Margin: {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add any additional notes about this pricing..."
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm transition-colors"
            >
              <Save size={18} />
              {loading ? 'Adding...' : 'Add Pricing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
