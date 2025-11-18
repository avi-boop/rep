'use client'

import { useState, useEffect } from 'react'
import { RepairCard } from './RepairCard'
import { EditPricingModal } from '../EditPricingModal'
import { AddPricingModal } from '../AddPricingModal'
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Package, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

  useEffect(() => {
    fetchPartTypes()
    fetchBrandsAndRepairTypes()
  }, [])

  useEffect(() => {
    if (selectedPartTypeId) {
      fetchRepairs()
    }
  }, [modelId, selectedPartTypeId])

  const fetchPartTypes = async () => {
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
  }

  const fetchBrandsAndRepairTypes = async () => {
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
  }

  const fetchRepairs = async () => {
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
  }

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
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to {brandName} Models</span>
        </button>
      </div>

      {/* Model Info Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{modelName}</h2>
            <p className="text-gray-600">
              {brandName} {modelInfo?.deviceType}
              {modelInfo?.modelNumber && ` • ${modelInfo.modelNumber}`}
              {modelInfo?.releaseYear && ` • ${modelInfo.releaseYear}`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm">Total Repairs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRepairs}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">With Pricing</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.priceCount}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.completionRate}% complete</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Avg Price</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.priceCount > 0 ? formatCurrency(stats.averagePrice) : '-'}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Avg Margin</span>
            </div>
            <p className={`text-2xl font-bold ${
              stats.averageMargin >= 40 ? 'text-green-600' :
              stats.averageMargin >= 25 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats.priceCount > 0 ? `${stats.averageMargin.toFixed(1)}%` : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Part Quality Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Part Quality:</label>
        <select
          value={selectedPartTypeId || ''}
          onChange={(e) => setSelectedPartTypeId(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {partTypes.map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.name} {pt.name === 'Standard' && '(Default)'}
            </option>
          ))}
        </select>
      </div>

      {/* Repair Options List */}
      <div className="space-y-4">
        {repairs.map((repair) => (
          <RepairCard
            key={repair.repairType.id}
            {...repair}
            onEdit={() => handleEditPricing(repair)}
            onAdd={() => handleAddPricing(repair)}
          />
        ))}
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
      {showAddModal && (
        <AddPricingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleModalSuccess}
          brands={allBrands}
          repairTypes={allRepairTypes}
          partTypes={partTypes}
        />
      )}
    </div>
  )
}
