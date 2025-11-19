'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Smartphone, Tablet, Wrench, DollarSign, Calendar, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useFavorites } from '@/lib/hooks/useFavorites'

interface ModelCardProps {
  id: number
  name: string
  modelNumber: string | null
  releaseYear: number | null
  deviceType: 'phone' | 'tablet'
  logoUrl?: string | null
  repairCount: number
  priceRange: { min: number; max: number }
  onClick: () => void
}

export const ModelCard = memo(function ModelCard({
  id,
  name,
  modelNumber,
  releaseYear,
  deviceType,
  logoUrl,
  repairCount,
  priceRange,
  onClick
}: ModelCardProps) {
  const hasNoPricing = priceRange.min === 0 && priceRange.max === 0
  const { isFavorite, toggleFavorite } = useFavorites('model')
  const favorite = isFavorite(id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(id)
  }

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-lg border-2 border-gray-200 p-3 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left w-full"
    >
      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all ${
          favorite
            ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
        }`}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`w-3.5 h-3.5 ${favorite ? 'fill-current' : ''}`} />
      </button>

      {/* Device Icon/Logo */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-colors overflow-hidden">
          {logoUrl ? (
            <div className="relative w-8 h-8">
              <Image
                src={logoUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
          ) : deviceType === 'tablet' ? (
            <Tablet className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          ) : (
            <Smartphone className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-8">
          {/* Model Name */}
          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {name}
          </h3>

          {/* Model Number */}
          {modelNumber && (
            <p className="text-xs text-gray-500 truncate">{modelNumber}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        {/* Release Year */}
        {releaseYear && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>{releaseYear}</span>
          </div>
        )}

        {/* Repair Count */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Wrench className="w-3 h-3" />
          <span className="font-medium">{repairCount}</span>
          <span>{repairCount === 1 ? 'repair' : 'repairs'}</span>
        </div>

        {/* Price Range */}
        <div className="flex items-center gap-1.5 text-xs">
          <DollarSign className="w-3 h-3 text-green-600" />
          {hasNoPricing ? (
            <span className="text-red-500 font-medium">No pricing</span>
          ) : priceRange.min === priceRange.max ? (
            <span className="text-green-600 font-semibold">
              {formatCurrency(priceRange.min)}
            </span>
          ) : (
            <span className="text-green-600 font-semibold">
              {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
})
