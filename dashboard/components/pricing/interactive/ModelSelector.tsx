'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ModelCard } from './ModelCard'
import { ArrowLeft, Search, Loader2, Smartphone, Tablet, Star } from 'lucide-react'
import { useFavorites } from '@/lib/hooks/useFavorites'

interface Model {
  id: number
  brandId: number
  brandName: string
  name: string
  modelNumber: string | null
  releaseYear: number | null
  deviceType: 'phone' | 'tablet'
  logoUrl?: string | null
  repairCount: number
  priceRange: { min: number; max: number }
}

interface ModelSelectorProps {
  brandId: number
  brandName: string
  onSelectModel: (model: Model) => void
  onBack: () => void
}

export function ModelSelector({ brandId, brandName, onSelectModel, onBack }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<'all' | 'phone' | 'tablet'>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { favorites, isFavorite } = useFavorites('model')

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pricing/models?brandId=${brandId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch models')
      }

      setModels(data.models)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [brandId])

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let filtered = models

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((model) =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.modelNumber && model.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Device type filter
    if (deviceTypeFilter !== 'all') {
      filtered = filtered.filter((model) => model.deviceType === deviceTypeFilter)
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((model) => isFavorite(model.id))
    }

    // Sort: favorites first, then by name
    return filtered.sort((a, b) => {
      const aIsFav = isFavorite(a.id)
      const bIsFav = isFavorite(b.id)

      if (aIsFav && !bIsFav) return -1
      if (!aIsFav && bIsFav) return 1

      return a.name.localeCompare(b.name)
    })
  }, [models, searchTerm, deviceTypeFilter, showFavoritesOnly, isFavorite])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const phoneCount = models.filter(m => m.deviceType === 'phone').length
  const tabletCount = models.filter(m => m.deviceType === 'tablet').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading {brandName} models...</p>
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
          <span>Back to Brands</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load models</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchModels}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Brands</span>
        </button>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{brandName} Models</h2>
        <p className="text-gray-600">Select a device model to view repair pricing</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Device Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setDeviceTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deviceTypeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({models.length})
            </button>
            <button
              onClick={() => setDeviceTypeFilter('phone')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                deviceTypeFilter === 'phone'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Phones ({phoneCount})
            </button>
            <button
              onClick={() => setDeviceTypeFilter('tablet')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                deviceTypeFilter === 'tablet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tablet className="w-4 h-4" />
              Tablets ({tabletCount})
            </button>
          </div>
        </div>

        {/* Favorites Filter */}
        {favorites.size > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current text-yellow-500' : ''}`} />
              <span className="font-medium">
                {showFavoritesOnly ? 'Show All' : 'Show Favorites'} ({favorites.size})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No models found</p>
          <p className="text-gray-500 text-sm">
            {searchTerm
              ? `No models match "${searchTerm}"`
              : 'No models available for this brand'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                {...model}
                onClick={() => onSelectModel(model)}
              />
            ))}
          </div>

          {/* Stats Footer */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Showing {filteredModels.length} of {models.length} {models.length === 1 ? 'model' : 'models'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
