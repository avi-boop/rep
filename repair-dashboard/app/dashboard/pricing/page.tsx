'use client'

import { useEffect, useState } from 'react'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'
import { PricingSyncButton } from '@/components/pricing/PricingSyncButton'
import { PricingStats } from '@/components/pricing/PricingStats'
import { AddPricingModal } from '@/components/pricing/AddPricingModal'
import { Plus } from 'lucide-react'
import Link from 'next/link'

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
  deviceModel: {
    id: number
    name: string
    brand: Brand
  }
  repairType: RepairType
  partType: PartType
  priceHistory?: Array<{
    id: number
    oldPrice: number | null
    newPrice: number | null
    changedAt: string
    reason: string | null
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
        fetch('/api/repair-types'),
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pricing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600 mt-1">Manage repair pricing and sync from Lightspeed</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PricingSyncButton />
          <Link href="/dashboard/pricing/ai-bulk" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Bulk Pricing
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"
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

      <PricingMatrix
        brands={data.brands}
        repairTypes={data.repairTypes}
        partTypes={data.partTypes}
        pricing={data.pricing}
        onPricingUpdated={refetch}
      />

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
