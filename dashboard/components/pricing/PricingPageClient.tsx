'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PricingMatrix } from './PricingMatrix'
import { PricingWizard } from './interactive/PricingWizard'
import { ViewModeToggle } from './ViewModeToggle'

interface PricingPageClientProps {
  brands: any[]
  repairTypes: any[]
  partTypes: any[]
  pricing: any[]
}

export function PricingPageClient({ brands, repairTypes, partTypes, pricing }: PricingPageClientProps) {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'interactive' | 'matrix'>('interactive')

  // Initialize from URL or localStorage
  useEffect(() => {
    const urlView = searchParams.get('view')
    if (urlView === 'matrix' || urlView === 'interactive') {
      setViewMode(urlView)
    }
    // Always default to interactive view, ignore localStorage for now
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save preference to localStorage when changed
  const handleViewModeChange = (mode: 'interactive' | 'matrix') => {
    setViewMode(mode)
    localStorage.setItem('pricingViewMode', mode)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600 mt-1">Manage repair pricing and view smart estimates</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* View Mode Toggle */}
          <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />

          {/* Action Buttons (only show in matrix view) */}
          {viewMode === 'matrix' && (
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Import CSV
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Export CSV
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Pricing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'interactive' ? (
        <PricingWizard />
      ) : (
        <PricingMatrix
          brands={brands}
          repairTypes={repairTypes}
          partTypes={partTypes}
          pricing={pricing}
        />
      )}
    </div>
  )
}
