'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrandSelector } from './BrandSelector'
import { ModelSelector } from './ModelSelector'
import { RepairOptions } from './RepairOptions'
import { ChevronRight } from 'lucide-react'

interface Brand {
  id: number
  name: string
  logoUrl: string | null
  modelCount: number
  pricingCount: number
}

interface Model {
  id: number
  brandId: number
  brandName: string
  name: string
  modelNumber: string | null
  releaseYear: number | null
  deviceType: 'phone' | 'tablet'
  repairCount: number
  priceRange: { min: number; max: number }
}

type Step = 1 | 2 | 3

export function PricingWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>(1)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  // Initialize from URL params
  useEffect(() => {
    const stepParam = searchParams.get('step')
    const brandId = searchParams.get('brand')
    const modelId = searchParams.get('model')

    if (stepParam) {
      const parsedStep = parseInt(stepParam) as Step
      if (parsedStep >= 1 && parsedStep <= 3) {
        setStep(parsedStep)
      }
    }

    // If we have URL params but no state, we should fetch the data
    // For now, we'll just ensure the step is correct
    // In a real implementation, you'd fetch brand/model data here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', 'interactive')
    params.set('step', step.toString())

    if (selectedBrand) {
      params.set('brand', selectedBrand.id.toString())
    }

    if (selectedModel) {
      params.set('model', selectedModel.id.toString())
    }

    router.replace(`/dashboard/pricing?${params.toString()}`, { scroll: false })
  }, [step, selectedBrand, selectedModel, router])

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setSelectedModel(null) // Reset model when brand changes
    setStep(2)
  }

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model)
    setStep(3)
  }

  const handleBackToBrands = () => {
    setSelectedBrand(null)
    setSelectedModel(null)
    setStep(1)
  }

  const handleBackToModels = () => {
    setSelectedModel(null)
    setStep(2)
  }

  return (
    <div className="space-y-6">
      {/* Progress Breadcrumb */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm">
          {/* Step 1: Brand */}
          <button
            onClick={handleBackToBrands}
            className={`font-medium transition-colors ${
              step === 1
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {selectedBrand ? selectedBrand.name : 'Select Brand'}
          </button>

          {step >= 2 && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {/* Step 2: Model */}
              <button
                onClick={handleBackToModels}
                disabled={!selectedBrand}
                className={`font-medium transition-colors ${
                  step === 2
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {selectedModel ? selectedModel.name : 'Select Model'}
              </button>
            </>
          )}

          {step >= 3 && selectedModel && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {/* Step 3: Repairs */}
              <span className="text-blue-600 font-medium">Repair Options</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-fadeIn">
        {step === 1 && (
          <BrandSelector onSelectBrand={handleSelectBrand} />
        )}

        {step === 2 && selectedBrand && (
          <ModelSelector
            brandId={selectedBrand.id}
            brandName={selectedBrand.name}
            onSelectModel={handleSelectModel}
            onBack={handleBackToBrands}
          />
        )}

        {step === 3 && selectedBrand && selectedModel && (
          <RepairOptions
            modelId={selectedModel.id}
            modelName={selectedModel.name}
            brandName={selectedBrand.name}
            onBack={handleBackToModels}
          />
        )}
      </div>
    </div>
  )
}
