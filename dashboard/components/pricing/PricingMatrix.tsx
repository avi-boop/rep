'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, AlertCircle, HelpCircle, Edit2, Search, Sparkles, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { RepairTypeIcon } from './RepairTypeIcon'
import { EditPricingModal } from './EditPricingModal'
import { applyPsychologicalPricing } from '@/lib/pricing-utils'

interface Brand {
  id: number
  name: string
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
  deviceModel: {
    id: number
    name: string
    brand: Brand
  }
  repairType: RepairType
  partType: PartType
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

interface Props {
  brands: Brand[]
  repairTypes: RepairType[]
  partTypes: PartType[]
  pricing: Pricing[]
  onPricingUpdated?: () => void
}

export function PricingMatrix({ brands, repairTypes, partTypes, pricing, onPricingUpdated }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<number | null>(brands[0]?.id || null)
  // Default to Standard part type (qualityLevel: 2)
  const standardPartType = partTypes.find(pt => pt.name === 'Standard') || partTypes[0]
  const [selectedPartType, setSelectedPartType] = useState<number | null>(standardPartType?.id || null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'confirmed' | 'estimated' | 'needsPsych'>('all')
  const [analyzing, setAnalyzing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null)

  // Get devices for selected brand with enhanced search filter
  const devices = pricing
    .filter(p => p.deviceModel.brand.id === selectedBrand)
    .map(p => p.deviceModel)
    .filter((device, index, self) =>
      index === self.findIndex(d => d.id === device.id)
    )
    .filter(device => {
      if (!searchTerm) return true

      const search = searchTerm.toLowerCase()

      // Search across multiple fields
      return (
        device.name.toLowerCase().includes(search) ||
        device.brand.name.toLowerCase().includes(search) ||
        device.deviceType.toLowerCase().includes(search) ||
        (device.modelNumber && device.modelNumber.toLowerCase().includes(search))
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Get price for specific combination
  const getPrice = (deviceId: number, repairTypeId: number) => {
    const price = pricing.find(
      p => p.deviceModelId === deviceId &&
           p.repairTypeId === repairTypeId &&
           p.partTypeId === selectedPartType
    )

    // Apply filter
    if (!price) return null

    if (filterType === 'confirmed' && price.isEstimated) return null
    if (filterType === 'estimated' && !price.isEstimated) return null
    if (filterType === 'needsPsych') {
      const psychPrice = applyPsychologicalPricing(price.price)
      if (psychPrice === price.price) return null
    }

    return price
  }

  // Run AI analysis
  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/pricing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (result.success) {
        // Show analysis results (you can create a modal for this)
        const summary = result.summary
        alert(
          `🤖 AI Pricing Analysis Complete!\n\n` +
          `📊 Total Analyzed: ${summary.totalAnalyzed}\n` +
          `🔴 High Priority: ${summary.highPriority}\n` +
          `🟡 Medium Priority: ${summary.mediumPriority}\n` +
          `💰 Potential Revenue: $${summary.potentialRevenue.toFixed(0)}\n` +
          `📈 Avg Current: $${summary.averageCurrentPrice.toFixed(0)}\n` +
          `💡 Avg Suggested: $${summary.averageSuggestedPrice.toFixed(0)}\n\n` +
          `Check console for detailed recommendations.`
        )
        console.log('AI Pricing Analysis:', result)
      } else {
        alert(`❌ Analysis failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to run analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  // Handle edit pricing
  const handleEditPricing = (price: Pricing) => {
    setSelectedPricing(price)
    setShowEditModal(true)
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Enhanced Filters */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Top Row: Search and AI Analyzer */}
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by model, brand, device type, or model number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* AI Analyzer Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
          >
            <Sparkles size={18} className={analyzing ? 'animate-spin' : ''} />
            {analyzing ? 'Analyzing...' : 'AI Pricing'}
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter size={18} />
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>

        {/* Filter Options (collapsible) */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={selectedBrand || ''}
                onChange={(e) => setSelectedBrand(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Part Quality Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Quality
              </label>
              <select
                value={selectedPartType || ''}
                onChange={(e) => setSelectedPartType(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {partTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} {pt.name === 'Standard' ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Status
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="confirmed">✅ Confirmed Only</option>
                <option value="estimated">⚠️ Estimated Only</option>
                <option value="needsPsych">💡 Needs Psych Pricing</option>
              </select>
            </div>
          </div>
        )}

        {/* Quick Filter Chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('confirmed')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✅ Confirmed
          </button>
          <button
            onClick={() => setFilterType('estimated')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === 'estimated'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚠️ Estimated
          </button>
          <button
            onClick={() => setFilterType('needsPsych')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === 'needsPsych'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💡 Psych Pricing
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Set Price</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-yellow-500" />
          <span>Estimated</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Missing</span>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Device Model
              </th>
              {repairTypes.map(rt => (
                <th key={rt.id} className="px-4 py-3 text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <RepairTypeIcon repairType={rt.name} size={20} />
                    <span className="text-xs font-medium text-gray-700">{rt.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={repairTypes.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No devices found for this brand
                </td>
              </tr>
            ) : (
              devices.map(device => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    {device.name}
                  </td>
                  {repairTypes.map(rt => {
                    const price = getPrice(device.id, rt.id)
                    return (
                      <td key={rt.id} className="px-4 py-3 text-center">
                        {price ? (
                          <PriceCell price={price} onEdit={() => handleEditPricing(price)} />
                        ) : (
                          <button className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Pricing Modal */}
      <EditPricingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          if (onPricingUpdated) {
            onPricingUpdated()
          }
          setShowEditModal(false)
        }}
        pricing={selectedPricing}
      />
    </div>
  )
}

function PriceCell({ price, onEdit }: { price: Pricing; onEdit: () => void }) {
  const psychPrice = applyPsychologicalPricing(price.price)
  const needsPsychAdjustment = psychPrice !== price.price

  // Calculate margin
  const hasMargin = price.cost !== null && price.cost > 0
  const margin = hasMargin ? price.price - price.cost : 0
  const marginPercent = hasMargin ? ((margin / price.price) * 100) : 0
  const isLowMargin = marginPercent < 30
  const isGoodMargin = marginPercent >= 50

  return (
    <div className="flex flex-col items-center gap-1 p-2">
      {/* Status Icon */}
      <div className="flex items-center gap-2">
        <div title={price.isEstimated ? "AI Estimated" : "Confirmed"}>
          {price.isEstimated ? (
            <HelpCircle className="w-4 h-4 text-yellow-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>

        {/* Current Price */}
        <span className={`font-semibold text-base ${needsPsychAdjustment ? 'text-orange-600' : 'text-gray-900'}`}>
          {formatCurrency(price.price)}
        </span>

        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="Edit price"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      {/* Margin Display */}
      {hasMargin && (
        <div
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
            isGoodMargin ? 'bg-green-50 text-green-700' :
            isLowMargin ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}
          title={`Cost: ${formatCurrency(price.cost)}, Margin: ${formatCurrency(margin)}`}
        >
          <DollarSign className="w-3 h-3" />
          <span className="font-medium">{marginPercent.toFixed(0)}%</span>
          <span className="text-xs opacity-75">margin</span>
        </div>
      )}

      {/* Psychological Pricing Suggestion */}
      {needsPsychAdjustment && (
        <div className="flex items-center gap-1 text-xs">
          <TrendingDown className="w-3 h-3 text-purple-600" />
          <span className="text-purple-600 font-medium">
            ${psychPrice}
          </span>
          <span className="text-gray-500">psych</span>
        </div>
      )}

      {/* Confidence Score for Estimated Prices */}
      {price.isEstimated && price.confidenceScore && (
        <div className="text-xs text-gray-500">
          <span className={`px-1.5 py-0.5 rounded ${
            price.confidenceScore >= 0.8 ? 'bg-green-100 text-green-700' :
            price.confidenceScore >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {Math.round(price.confidenceScore * 100)}% confidence
          </span>
        </div>
      )}
    </div>
  )
}
