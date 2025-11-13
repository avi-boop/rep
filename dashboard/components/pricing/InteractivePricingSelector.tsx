'use client'

import { useState, useEffect } from 'react'
import { BrandGrid } from './BrandGrid'
import { DeviceModelGrid } from './DeviceModelGrid'
import { RepairPricingPanel } from './RepairPricingPanel'
import { ChevronLeft } from 'lucide-react'

interface Brand {
  id: number
  name: string
  _count?: {
    deviceModels: number
  }
}

interface DeviceModel {
  id: number
  name: string
  brandId: number
  releaseYear: number | null
  deviceType: string
  brand: {
    id: number
    name: string
  }
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
  deviceModel: DeviceModel
  repairType: RepairType
  partType: PartType
}

interface Props {
  brands: Brand[]
  repairTypes: RepairType[]
  partTypes: PartType[]
  pricing: Pricing[]
  onPricingUpdated: () => void
}

export function InteractivePricingSelector({ brands, repairTypes, partTypes, pricing, onPricingUpdated }: Props) {
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // Fetch device models when brand is selected
  useEffect(() => {
    if (!selectedBrandId) {
      setDeviceModels([])
      return
    }

    setLoadingModels(true)
    fetch(`/api/device-models?brandId=${selectedBrandId}`)
      .then(res => res.json())
      .then(data => {
        setDeviceModels(data)
        setLoadingModels(false)
      })
      .catch(error => {
        console.error('Error fetching device models:', error)
        setLoadingModels(false)
      })
  }, [selectedBrandId])

  const handleBrandSelect = (brandId: number) => {
    setSelectedBrandId(brandId)
    setSelectedModelId(null)
  }

  const handleModelSelect = (modelId: number) => {
    setSelectedModelId(modelId)
  }

  const handleBackToBrands = () => {
    setSelectedBrandId(null)
    setSelectedModelId(null)
    setDeviceModels([])
  }

  const handleClosePanel = () => {
    setSelectedModelId(null)
  }

  const selectedBrand = brands.find(b => b.id === selectedBrandId)
  const selectedModel = deviceModels.find(m => m.id === selectedModelId)

  return (
    <div className="space-y-6">
      {/* Step 1: Brand Selection */}
      {!selectedBrandId && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Brand</h2>
          <BrandGrid
            brands={brands}
            selectedBrandId={selectedBrandId}
            onSelectBrand={handleBrandSelect}
          />
        </div>
      )}

      {/* Step 2: Device Model Selection */}
      {selectedBrandId && !selectedModelId && (
        <div>
          {/* Back Button */}
          <button
            onClick={handleBackToBrands}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Brands
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedBrand?.name} Models
          </h2>
          <p className="text-gray-600 mb-6">
            Select a device model to view its repair pricing
          </p>

          {loadingModels ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <DeviceModelGrid
              models={deviceModels}
              pricing={pricing}
              selectedModelId={selectedModelId}
              onSelectModel={handleModelSelect}
              brandName={selectedBrand?.name || ''}
            />
          )}
        </div>
      )}

      {/* Step 3: Repair Pricing Panel (Slide-in) */}
      {selectedModelId && selectedModel && (
        <RepairPricingPanel
          deviceModel={selectedModel}
          repairTypes={repairTypes}
          partTypes={partTypes}
          pricing={pricing.filter(p => p.deviceModelId === selectedModelId)}
          onClose={handleClosePanel}
          onPricingUpdated={onPricingUpdated}
        />
      )}
    </div>
  )
}
