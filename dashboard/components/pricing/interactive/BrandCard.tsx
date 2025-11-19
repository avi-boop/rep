'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Smartphone, Package } from 'lucide-react'

interface BrandCardProps {
  id: number
  name: string
  logoUrl: string | null
  modelCount: number
  pricingCount: number
  onClick: () => void
}

export const BrandCard = memo(function BrandCard({ name, logoUrl, modelCount, pricingCount, onClick }: BrandCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      {/* Brand Icon/Logo */}
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
        {logoUrl ? (
          <div className="relative w-12 h-12">
            <Image
              src={logoUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
        ) : (
          <Smartphone className="w-8 h-8 text-blue-600" />
        )}
      </div>

      {/* Brand Name */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {name}
      </h3>

      {/* Stats */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Smartphone className="w-4 h-4" />
          <span className="font-medium">{modelCount}</span>
          <span>{modelCount === 1 ? 'model' : 'models'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span className="font-medium">{pricingCount}</span>
          <span>{pricingCount === 1 ? 'price' : 'prices'}</span>
        </div>
      </div>

      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
})
