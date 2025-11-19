'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Smartphone, Package, Star } from 'lucide-react'
import { useFavorites } from '@/lib/hooks/useFavorites'

interface BrandCardProps {
  id: number
  name: string
  logoUrl: string | null
  modelCount: number
  pricingCount: number
  onClick: () => void
}

export const BrandCard = memo(function BrandCard({ id, name, logoUrl, modelCount, pricingCount, onClick }: BrandCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites('brand')
  const favorite = isFavorite(id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(id)
  }

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left w-full"
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
        <Star className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
      </button>

      {/* Brand Icon/Logo */}
      <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
        {logoUrl ? (
          <div className="relative w-9 h-9">
            <Image
              src={logoUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="36px"
            />
          </div>
        ) : (
          <Smartphone className="w-6 h-6 text-blue-600" />
        )}
      </div>

      {/* Brand Name */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors truncate pr-8">
        {name}
      </h3>

      {/* Stats */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Smartphone className="w-3.5 h-3.5" />
          <span className="font-medium">{modelCount}</span>
          <span>{modelCount === 1 ? 'model' : 'models'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Package className="w-3.5 h-3.5" />
          <span className="font-medium">{pricingCount}</span>
          <span>{pricingCount === 1 ? 'price' : 'prices'}</span>
        </div>
      </div>
    </button>
  )
})
