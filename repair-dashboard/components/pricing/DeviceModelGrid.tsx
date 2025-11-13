'use client'

import { useState, useMemo } from 'react'
import { Search, Smartphone, ChevronDown } from 'lucide-react'

interface DeviceModel {
  id: number
  name: string
  releaseYear: number | null
  deviceType: string
}

interface Pricing {
  deviceModelId: number
  price: number
}

interface Props {
  models: DeviceModel[]
  pricing: Pricing[]
  selectedModelId: number | null
  onSelectModel: (modelId: number) => void
  brandName: string
}

type SortOption = 'name' | 'year-desc' | 'year-asc' | 'completeness'

export function DeviceModelGrid({ models, pricing, selectedModelId, onSelectModel, brandName }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')

  // Calculate pricing completeness for each model
  const modelCompleteness = useMemo(() => {
    const completenessMap = new Map<number, { total: number; filled: number }>()
    
    models.forEach(model => {
      const modelPrices = pricing.filter(p => p.deviceModelId === model.id)
      completenessMap.set(model.id, {
        total: modelPrices.length,
        filled: modelPrices.filter(p => p.price > 0).length
      })
    })
    
    return completenessMap
  }, [models, pricing])

  // Filter and sort models
  const filteredAndSortedModels = useMemo(() => {
    let filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'year-desc':
          return (b.releaseYear || 0) - (a.releaseYear || 0)
        case 'year-asc':
          return (a.releaseYear || 0) - (b.releaseYear || 0)
        case 'completeness': {
          const aComp = modelCompleteness.get(a.id)
          const bComp = modelCompleteness.get(b.id)
          const aPercent = aComp ? (aComp.filled / aComp.total) : 0
          const bPercent = bComp ? (bComp.filled / bComp.total) : 0
          return bPercent - aPercent
        }
        default:
          return 0
      }
    })

    return filtered
  }, [models, searchTerm, sortBy, modelCompleteness])

  const getCompletenessStatus = (modelId: number) => {
    const comp = modelCompleteness.get(modelId)
    if (!comp || comp.total === 0) {
      return { text: 'No pricing', color: 'bg-gray-100 text-gray-600', percent: 0 }
    }

    const percent = (comp.filled / comp.total) * 100
    const missing = comp.total - comp.filled

    if (percent === 100) {
      return { text: 'Complete', color: 'bg-green-100 text-green-700', percent }
    } else if (missing === 1) {
      return { text: 'Missing 1', color: 'bg-yellow-100 text-yellow-700', percent }
    } else {
      return { text: `Missing ${missing}`, color: 'bg-orange-100 text-orange-700', percent }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Search ${brandName} models...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="name">Name A-Z</option>
            <option value="year-desc">Newest First</option>
            <option value="year-asc">Oldest First</option>
            <option value="completeness">Most Complete</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedModels.length} of {models.length} models
      </div>

      {/* Model Grid */}
      {filteredAndSortedModels.length === 0 ? (
        <div className="text-center py-12">
          <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No models found</p>
          <p className="text-gray-400 text-sm mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedModels.map((model) => {
            const isSelected = model.id === selectedModelId
            const status = getCompletenessStatus(model.id)

            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:scale-102'
                  }
                `}
              >
                {/* Device Icon */}
                <div className={`mb-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Smartphone size={32} />
                </div>

                {/* Model Name */}
                <h4 className={`font-semibold mb-1 line-clamp-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {model.name}
                </h4>

                {/* Release Year */}
                {model.releaseYear && (
                  <p className="text-xs text-gray-500 mb-2">
                    {model.releaseYear}
                  </p>
                )}

                {/* Completeness Badge */}
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                  {status.text}
                </div>

                {/* Progress Bar */}
                {status.percent > 0 && status.percent < 100 && (
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-green-500"
                      style={{ width: `${status.percent}%` }}
                    />
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
