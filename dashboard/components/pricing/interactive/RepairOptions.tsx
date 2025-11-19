'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RepairCard } from './RepairCard'
import { EditPricingModal } from '../EditPricingModal'
import { AddPricingModal } from '../AddPricingModal'
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Package, CheckCircle, GripVertical, Star, ChevronDown, ChevronRight, Plus } from 'lucide-react'
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['front', 'battery', 'back', 'others']))
  const [showAddCustomRepair, setShowAddCustomRepair] = useState(false)

  // Helper function to categorize a repair type
  const getCategoryForRepair = useCallback((repairName: string, category: string | null) => {
    const nameLower = repairName.toLowerCase()

    // Front category - screen and display related
    if (nameLower.includes('screen') || nameLower.includes('display') || nameLower.includes('glass') ||
        nameLower.includes('digitizer') || nameLower.includes('lcd') || nameLower.includes('oled') ||
        category?.toLowerCase() === 'front' || category?.toLowerCase() === 'screen') {
      return 'front'
    }

    // Battery category
    if (nameLower.includes('battery') || category?.toLowerCase() === 'battery') {
      return 'battery'
    }

    // Back category - back glass, housing, camera
    if (nameLower.includes('back') || nameLower.includes('rear') || nameLower.includes('housing') ||
        nameLower.includes('camera glass') || nameLower.includes('back glass') ||
        category?.toLowerCase() === 'back') {
      return 'back'
    }

    // Everything else goes to Others
    return 'others'
  }, [])

  // Group repairs by category
  const categorizedRepairs = useMemo(() => {
    let repairsCopy = [...repairs]

    // Filter by favorites if enabled
    if (showFavoritesOnly) {
      repairsCopy = repairsCopy.filter(repair => isFavorite(repair.repairType.id))
    }

    // Sort within each repair if needed
    if (sortOption === 'alphabetical') {
      repairsCopy.sort((a, b) => a.repairType.name.localeCompare(b.repairType.name))
    } else {
      repairsCopy.sort((a, b) => {
        const aIsFav = isFavorite(a.repairType.id)
        const bIsFav = isFavorite(b.repairType.id)
        if (aIsFav && !bIsFav) return -1
        if (!aIsFav && bIsFav) return 1
        const aHasPricing = a.pricing !== null
        const bHasPricing = b.pricing !== null
        if (aHasPricing && !bHasPricing) return -1
        if (!aHasPricing && bHasPricing) return 1
        if (aHasPricing && bHasPricing) {
          return (b.pricing?.price || 0) - (a.pricing?.price || 0)
        }
        return a.repairType.name.localeCompare(b.repairType.name)
      })
    }

    // Group by category
    const grouped = {
      front: [] as RepairOption[],
      battery: [] as RepairOption[],
      back: [] as RepairOption[],
      others: [] as RepairOption[]
    }

    repairsCopy.forEach(repair => {
      const category = getCategoryForRepair(repair.repairType.name, repair.repairType.category)
      grouped[category].push(repair)
    })

    return grouped
  }, [repairs, sortOption, showFavoritesOnly, isFavorite, getCategoryForRepair])

  // Legacy sorted repairs for backward compatibility
  const sortedRepairs = useMemo(() => {
    return [
      ...categorizedRepairs.front,
      ...categorizedRepairs.battery,
      ...categorizedRepairs.back,
      ...categorizedRepairs.others
    ]
  }, [categorizedRepairs])

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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'front':
        return '📱'
      case 'battery':
        return '🔋'
      case 'back':
        return '📷'
      case 'others':
        return '🔧'
      default:
        return '🔧'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'front':
        return 'Front (Screen & Display)'
      case 'battery':
        return 'Battery'
      case 'back':
        return 'Back (Housing & Camera)'
      case 'others':
        return 'Others'
      default:
        return category
    }
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

      {/* Repair Options by Category */}
      <div className="space-y-4">
        {(['front', 'battery', 'back', 'others'] as const).map((category) => {
          const categoryRepairs = categorizedRepairs[category]
          if (categoryRepairs.length === 0) return null

          const isExpanded = expandedCategories.has(category)
          const icon = getCategoryIcon(category)
          const name = getCategoryName(category)

          return (
            <div key={category} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {categoryRepairs.length} {categoryRepairs.length === 1 ? 'repair' : 'repairs'}
                      {categoryRepairs.filter(r => r.pricing !== null).length > 0 && (
                        <span className="ml-2">
                          • {categoryRepairs.filter(r => r.pricing !== null).length} priced
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {category === 'others' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddCustomRepair(true)
                      }}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Add custom repair"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  )}
                </div>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
                    {categoryRepairs.map((repair) => (
                      <RepairCard
                        key={repair.repairType.id}
                        {...repair}
                        modelId={modelId}
                        modelName={modelName}
                        brandName={brandName}
                        onEdit={() => handleEditPricing(repair)}
                        onAdd={() => handleAddPricing(repair)}
                        onBookRepair={() => handleBookRepair(repair)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
      {showAddModal && !showAddCustomRepair && (
        <AddPricingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleModalSuccess}
          brands={allBrands}
          repairTypes={allRepairTypes}
          partTypes={partTypes}
        />
      )}

      {/* Add Custom Repair Modal */}
      {showAddCustomRepair && (
        <AddPricingModal
          isOpen={showAddCustomRepair}
          onClose={() => setShowAddCustomRepair(false)}
          onSuccess={() => {
            setShowAddCustomRepair(false)
            fetchRepairs()
          }}
          brands={allBrands}
          repairTypes={allRepairTypes}
          partTypes={partTypes}
        />
      )}
    </div>
  )
}
