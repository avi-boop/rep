'use client'

import { useEffect, useState } from 'react'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'
import { InteractivePricingSelector } from '@/components/pricing/InteractivePricingSelector'
import { PricingSyncButton } from '@/components/pricing/PricingSyncButton'
import { PricingStats } from '@/components/pricing/PricingStats'
import { AddPricingModal } from '@/components/pricing/AddPricingModal'
import { Plus, LayoutGrid, Table } from 'lucide-react'
import Link from 'next/link'

type ViewMode = 'table' | 'interactive'

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

interface DeviceModel {
  id: number
  name: string
  brandId: number
  releaseYear: number | null
  deviceType: string
  brand: Brand
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
  deviceModel: DeviceModel
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

function usePricingData() {
  const [data, setData] = useState<{
    brands: Brand[]
    repairTypes: RepairType[]
    partTypes: PartType[]
    pricing: Pricing[]
    stats: { total: number; active: number; estimated: number; avgPrice: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [brandsRes, repairTypesRes, partTypesRes, pricingRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/repair-types?mainOnly=true'),
        fetch('/api/part-types'),
        fetch('/api/pricing')
      ])

      const brands = await brandsRes.json()
      const repairTypes = await repairTypesRes.json()
      const partTypes = await partTypesRes.json()
      const pricing = await pricingRes.json()

      const total = pricing.length
      const active = pricing.filter((p: Pricing) => p.price > 0).length
      const estimated = pricing.filter((p: Pricing) => p.isEstimated).length
      const avgPrice = pricing.reduce((sum: number, p: Pricing) => sum + p.price, 0) / (pricing.length || 1)

      setData({
        brands,
        repairTypes,
        partTypes,
        pricing,
        stats: { total, active, estimated, avgPrice }
      })
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, refetch: fetchData }
}

export default function PricingPage() {
  const { data, loading, refetch } = usePricingData()
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pricingViewMode') as ViewMode) || 'table'
    }
    return 'table'
  })

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pricingViewMode', mode)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading pricing data...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your pricing information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pricing Management</h1>
          <p className="text-gray-600 mt-1">Manage repair pricing and sync from Lightspeed</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <PricingSyncButton />
          <Link
            href="/dashboard/pricing/ai-bulk"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg smooth-transition font-semibold shadow-md hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Bulk Pricing
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg smooth-transition font-semibold shadow-md hover:scale-105"
          >
            <Plus size={18} />
            Add Pricing
          </button>
        </div>
      </div>

      {/* Pricing Statistics */}
      <PricingStats
        total={data.stats.total}
        active={data.stats.active}
        estimated={data.stats.estimated}
        avgPrice={data.stats.avgPrice}
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-200 shadow-soft">
        <div>
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary-600" />
            Pricing View
          </h3>
          <p className="text-sm text-gray-600">
            {viewMode === 'table'
              ? 'View all prices in a comprehensive table format'
              : 'Browse by brand and model for focused pricing'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleViewModeChange('table')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium smooth-transition
              ${viewMode === 'table'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <Table size={18} />
            Table View
          </button>
          <button
            onClick={() => handleViewModeChange('interactive')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium smooth-transition
              ${viewMode === 'interactive'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <LayoutGrid size={18} />
            Interactive View
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {viewMode === 'table' ? (
        <PricingMatrix
          brands={data.brands}
          repairTypes={data.repairTypes}
          partTypes={data.partTypes}
          pricing={data.pricing}
          onPricingUpdated={refetch}
        />
      ) : (
        <InteractivePricingSelector
          brands={data.brands}
          repairTypes={data.repairTypes}
          partTypes={data.partTypes}
          pricing={data.pricing}
          onPricingUpdated={refetch}
        />
      )}

      {/* Add Pricing Modal */}
      <AddPricingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch()
          setShowAddModal(false)
        }}
        brands={data.brands}
        repairTypes={data.repairTypes}
        partTypes={data.partTypes}
      />
    </div>
  )
}
