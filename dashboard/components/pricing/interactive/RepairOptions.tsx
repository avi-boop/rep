'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RepairCard } from './RepairCard'
import { EditPricingModal } from '../EditPricingModal'
import { AddPricingModal } from '../AddPricingModal'
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Package, CheckCircle, GripVertical, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useFavorites } from '@/lib/hooks/useFavorites'

interface ModelInfo {
  id: number
  name: string
  modelNumber: string | null
  releaseYear: number | null
  deviceType: string
  screenSize: number | null
  brand: {
    id: number
    name: string
  }
}

interface RepairOption {
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
    priceHistory: any[]
  } | null
  partType: {
    id: number
    name: string
    qualityLevel: number
    warrantyMonths: number
  }
}

interface Stats {
  totalRepairs: number
  priceCount: number
  missingCount: number
  averagePrice: number
  averageMargin: number
  completionRate: number
}

interface RepairOptionsProps {
  modelId: number
  modelName: string
  brandName: string
  onBack: () => void
}

export function RepairOptions({ modelId, modelName, brandName, onBack }: RepairOptionsProps) {
  const router = useRouter()
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [repairs, setRepairs] = useState<RepairOption[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPartTypeId, setSelectedPartTypeId] = useState<number | null>(null)
  const [partTypes, setPartTypes] = useState<any[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPricing, setSelectedPricing] = useState<any>(null)
  const [selectedRepairType, setSelectedRepairType] = useState<any>(null)
  const [allBrands, setAllBrands] = useState<any[]>([])
  const [allRepairTypes, setAllRepairTypes] = useState<any[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [sortOption, setSortOption] = useState<'popular' | 'alphabetical'>('popular')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { favorites, isFavorite } = useFavorites('repair')

  // Sort repairs based on selected option
  const sortedRepairs = useMemo(() => {
    let repairsCopy = [...repairs]

    // Filter by favorites if enabled
    if (showFavoritesOnly) {
      repairsCopy = repairsCopy.filter(repair => isFavorite(repair.repairType.id))
    }

    if (sortOption === 'alphabetical') {
      return repairsCopy.sort((a, b) =>
        a.repairType.name.localeCompare(b.repairType.name)
      )
    } else {
      // Sort by popularity: favorites first, then repairs with pricing, then by price
      return repairsCopy.sort((a, b) => {
        const aIsFav = isFavorite(a.repairType.id)
        const bIsFav = isFavorite(b.repairType.id)

        // Favorites first
        if (aIsFav && !bIsFav) return -1
        if (!aIsFav && bIsFav) return 1

        const aHasPricing = a.pricing !== null
        const bHasPricing = b.pricing !== null

        if (aHasPricing && !bHasPricing) return -1
        if (!aHasPricing && bHasPricing) return 1

        // Both have pricing or both don't - sort by price (higher first)
        if (aHasPricing && bHasPricing) {
          return (b.pricing?.price || 0) - (a.pricing?.price || 0)
        }

        // Both don't have pricing - sort alphabetically
        return a.repairType.name.localeCompare(b.repairType.name)
      })
    }
  }, [repairs, sortOption, showFavoritesOnly, isFavorite])

  const fetchPartTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/part-types')
      if (response.ok) {
        const data = await response.json()
        setPartTypes(data)
        // Set default to Standard
        const standard = data.find((pt: any) => pt.name === 'Standard')
        if (standard) {
          setSelectedPartTypeId(standard.id)
        } else if (data.length > 0) {
          setSelectedPartTypeId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching part types:', err)
    }
  }, [])

  const fetchBrandsAndRepairTypes = useCallback(async () => {
    try {
      const [brandsRes, repairTypesRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/repair-types')
      ])
      if (brandsRes.ok) setAllBrands(await brandsRes.json())
      if (repairTypesRes.ok) setAllRepairTypes(await repairTypesRes.json())
    } catch (err) {
      console.error('Error fetching brands/repair types:', err)
    }
  }, [])

  const fetchRepairs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const url = `/api/pricing/repairs?modelId=${modelId}&partTypeId=${selectedPartTypeId}`
      const response = await fetch(url)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repairs')
      }

      setModelInfo(data.modelInfo)
      setRepairs(data.repairs)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [modelId, selectedPartTypeId])

  useEffect(() => {
    fetchPartTypes()
    fetchBrandsAndRepairTypes()
  }, [fetchPartTypes, fetchBrandsAndRepairTypes])

  useEffect(() => {
    if (selectedPartTypeId) {
      fetchRepairs()
    }
  }, [fetchRepairs, selectedPartTypeId])

  const handleEditPricing = (repair: RepairOption) => {
    if (repair.pricing) {
      // Convert to format expected by EditPricingModal
      setSelectedPricing({
        ...repair.pricing,
        deviceModel: modelInfo,
        repairType: repair.repairType,
        partType: repair.partType
      })
      setShowEditModal(true)
    }
  }

  const handleAddPricing = (repair: RepairOption) => {
    setSelectedRepairType(repair.repairType)
    setShowAddModal(true)
  }

  const handleModalSuccess = () => {
    setShowEditModal(false)
    setShowAddModal(false)
    fetchRepairs() // Refresh data
  }

  const handleBookRepair = (repair: RepairOption) => {
    if (!modelInfo) return

    // Encode repair data to pass to the repair form
    const params = new URLSearchParams({
      modelId: modelInfo.id.toString(),
      modelName: modelInfo.name,
      brandName: modelInfo.brand.name,
      repairTypeId: repair.repairType.id.toString(),
      repairTypeName: repair.repairType.name,
      partTypeId: repair.partType.id.toString(),
      price: repair.pricing?.price.toString() || '0'
    })

    // Navigate to new repair form with pre-filled data
    router.push(`/dashboard/repairs/new?${params.toString()}`)
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newRepairs = [...repairs]
    const draggedItem = newRepairs[draggedIndex]
    newRepairs.splice(draggedIndex, 1)
    newRepairs.splice(index, 0, draggedItem)

    setRepairs(newRepairs)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading repair options...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Models</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load repair options</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchRepairs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to {brandName} Models</span>
        </button>
        <h2 className="text-xl font-semibold text-gray-900">{modelName}</h2>
      </div>

      {/* Part Quality Selector, Sort Option, and Reorder Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Part Quality */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Part:</label>
            <select
              value={selectedPartTypeId || ''}
              onChange={(e) => setSelectedPartTypeId(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {partTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} {pt.name === 'Standard' && '(Default)'}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as 'popular' | 'alphabetical')}
              disabled={isReordering}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="popular">Most Popular</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Favorites Filter */}
          {favorites.size > 0 && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={showFavoritesOnly ? 'Show all repairs' : 'Show favorite repairs only'}
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current text-yellow-500' : ''}`} />
              <span className="font-medium">
                {showFavoritesOnly ? 'All' : 'Favorites'} ({favorites.size})
              </span>
            </button>
          )}
        </div>

        <button
          onClick={() => setIsReordering(!isReordering)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            isReordering
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <GripVertical className="w-4 h-4" />
          <span>{isReordering ? 'Done' : 'Reorder'}</span>
        </button>
      </div>

      {/* Repair Options List - Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
        {(isReordering ? repairs : sortedRepairs).map((repair, index) => (
          <div
            key={repair.repairType.id}
            draggable={isReordering}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`${isReordering ? 'cursor-move' : ''} ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            {isReordering && (
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                <GripVertical className="w-4 h-4" />
                <span>Drag to reorder</span>
              </div>
            )}
            <RepairCard
              {...repair}
              modelId={modelId}
              modelName={modelName}
              brandName={brandName}
              onEdit={() => handleEditPricing(repair)}
              onAdd={() => handleAddPricing(repair)}
              onBookRepair={() => handleBookRepair(repair)}
            />
          </div>
        ))}
      </div>

      {repairs.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No repair types found</p>
          <p className="text-gray-500 text-sm">Add some repair types to get started</p>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {showEditModal && selectedPricing && (
        <EditPricingModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleModalSuccess}
          pricing={selectedPricing}
        />
      )}

      {/* Add Pricing Modal */}
      {showAddModal && (
        <AddPricingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleModalSuccess}
          brands={allBrands}
          repairTypes={allRepairTypes}
          partTypes={partTypes}
        />
      )}
    </div>
  )
}
