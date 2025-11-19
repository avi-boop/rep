'use client'

import { useState, useEffect, useCallback } from 'react'
import { BrandCard } from './BrandCard'
import { Loader2 } from 'lucide-react'

interface Brand {
  id: number
  name: string
  logoUrl: string | null
  modelCount: number
  pricingCount: number
}

interface BrandSelectorProps {
  onSelectBrand: (brand: Brand) => void
}

export function BrandSelector({ onSelectBrand }: BrandSelectorProps) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/pricing/brands')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch brands')
      }

      setBrands(data.brands)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium mb-2">Failed to load brands</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchBrands}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600 text-lg mb-2">No brands found</p>
        <p className="text-gray-500 text-sm">Add some brands to get started with pricing</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Brand</h2>
        <p className="text-gray-600">Choose a device brand to view models and pricing</p>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <BrandCard
            key={brand.id}
            {...brand}
            onClick={() => onSelectBrand(brand)}
          />
        ))}
      </div>

      {/* Stats Footer */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-500">
          {brands.length} {brands.length === 1 ? 'brand' : 'brands'} available
        </p>
      </div>
    </div>
  )
}
