# Frontend Components - React/Next.js Implementation

## Complete UI Components with Tailwind CSS

### 1. New Repair Form - `components/NewRepairForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CustomerSearchDialog } from './CustomerSearchDialog'
import { DeviceSelector } from './DeviceSelector'
import { RepairTypeSelector } from './RepairTypeSelector'
import { PriceCalculator } from './PriceCalculator'

const repairSchema = z.object({
  customerId: z.number(),
  deviceModelId: z.number(),
  deviceImei: z.string().optional(),
  deviceCondition: z.string().optional(),
  priority: z.enum(['standard', 'urgent', 'express']),
  repairItems: z.array(z.object({
    repairTypeId: z.number(),
    partsQuality: z.enum(['original', 'aftermarket_premium', 'aftermarket_standard', 'aftermarket_economy']),
    manualPrice: z.number().optional()
  })).min(1, 'Select at least one repair type'),
  notes: z.string().optional(),
  depositPaid: z.number().min(0).default(0)
})

type RepairFormData = z.infer<typeof repairSchema>

export function NewRepairForm({ onSuccess }: { onSuccess: (repair: any) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RepairFormData>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      priority: 'standard',
      repairItems: [],
      depositPaid: 0
    }
  })
  
  const repairItems = watch('repairItems')
  const deviceModelId = watch('deviceModelId')
  
  const onSubmit = async (data: RepairFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create repair')
      
      const result = await response.json()
      onSuccess(result.data)
    } catch (error) {
      console.error('Create repair error:', error)
      alert('Failed to create repair. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* Customer Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">1. Customer Information</h3>
        
        {selectedCustomer ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded">
            <div>
              <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
              <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              {selectedCustomer.email && (
                <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Change
            </button>
          </div>
        ) : (
          <CustomerSearchDialog
            onSelect={(customer) => {
              setSelectedCustomer(customer)
              setValue('customerId', customer.id)
            }}
          />
        )}
        
        {errors.customerId && (
          <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
        )}
      </div>
      
      {/* Device Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">2. Device Information</h3>
        
        <DeviceSelector
          onSelect={(deviceId) => setValue('deviceModelId', deviceId)}
          error={errors.deviceModelId?.message}
        />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IMEI/Serial (Optional)
            </label>
            <input
              {...register('deviceImei')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IMEI or serial number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard (3-5 days)</option>
              <option value="urgent">Urgent (1-2 days)</option>
              <option value="express">Express (Same day)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Device Condition Notes
          </label>
          <textarea
            {...register('deviceCondition')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Describe visible damage, scratches, water damage, etc."
          />
        </div>
      </div>
      
      {/* Repair Type Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">3. Select Repairs Needed</h3>
        
        <RepairTypeSelector
          deviceModelId={deviceModelId}
          selectedItems={repairItems}
          onChange={(items) => {
            setValue('repairItems', items)
            // Recalculate total price
            const total = items.reduce((sum, item) => sum + (item.calculatedPrice || 0), 0)
            setCalculatedPrice(total)
          }}
        />
        
        {errors.repairItems && (
          <p className="text-red-500 text-sm mt-2">{errors.repairItems.message}</p>
        )}
      </div>
      
      {/* Price Summary */}
      {repairItems.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">4. Price Summary</h3>
          
          <PriceCalculator
            items={repairItems}
            onTotalChange={setCalculatedPrice}
          />
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium">Total Cost:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${calculatedPrice.toFixed(2)}
              </span>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Paid (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  {...register('depositPaid', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  max={calculatedPrice}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Additional Notes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">5. Additional Notes</h3>
        
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional information, customer requests, or special instructions..."
        />
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Repair'}
        </button>
      </div>
    </form>
  )
}
```

### 2. Device Selector - `components/DeviceSelector.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'

interface Brand {
  id: number
  name: string
  isPrimary: boolean
}

interface DeviceModel {
  id: number
  name: string
  variant: string | null
  releaseYear: number
}

export function DeviceSelector({ 
  onSelect, 
  error 
}: { 
  onSelect: (deviceId: number) => void
  error?: string 
}) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<DeviceModel[]>([])
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [selectedModel, setSelectedModel] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Load brands on mount
  useEffect(() => {
    fetchBrands()
  }, [])
  
  // Load models when brand selected
  useEffect(() => {
    if (selectedBrand) {
      fetchModels(selectedBrand)
    }
  }, [selectedBrand])
  
  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      setBrands(data.data)
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    }
  }
  
  const fetchModels = async (brandId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/devices?brandId=${brandId}`)
      const data = await response.json()
      setModels(data.data)
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleModelSelect = (modelId: number) => {
    setSelectedModel(modelId)
    onSelect(modelId)
  }
  
  // Group primary brands at top
  const primaryBrands = brands.filter(b => b.isPrimary)
  const otherBrands = brands.filter(b => !b.isPrimary)
  
  return (
    <div className="space-y-4">
      {/* Brand Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Brand *
        </label>
        
        {/* Primary brands as buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {primaryBrands.map(brand => (
            <button
              key={brand.id}
              type="button"
              onClick={() => setSelectedBrand(brand.id)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedBrand === brand.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
        
        {/* Other brands dropdown */}
        {otherBrands.length > 0 && (
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Other brands...</option>
            {otherBrands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Model Selection */}
      {selectedBrand && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model *
          </label>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading models...</p>
            </div>
          ) : models.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {models.map(model => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelSelect(model.id)}
                  className={`px-3 py-2 text-left rounded-md border transition-colors ${
                    selectedModel === model.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{model.name}</div>
                  {model.variant && (
                    <div className="text-xs text-gray-500">{model.variant}</div>
                  )}
                  <div className="text-xs text-gray-400">({model.releaseYear})</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4">No models found</p>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
```

### 3. Repair Type Selector - `components/RepairTypeSelector.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Wrench, Battery, Smartphone, Speaker, Plug, Camera } from 'lucide-react'

const REPAIR_ICONS: Record<string, any> = {
  display: Smartphone,
  battery: Battery,
  port: Plug,
  audio: Speaker,
  camera: Camera,
  default: Wrench
}

interface RepairType {
  id: number
  name: string
  category: string
  complexityLevel: number
  avgTimeMinutes: number
}

interface RepairItem {
  repairTypeId: number
  partsQuality: 'original' | 'aftermarket_premium' | 'aftermarket_standard' | 'aftermarket_economy'
  calculatedPrice?: number
  confidenceScore?: number
}

export function RepairTypeSelector({
  deviceModelId,
  selectedItems,
  onChange
}: {
  deviceModelId: number | undefined
  selectedItems: RepairItem[]
  onChange: (items: RepairItem[]) => void
}) {
  const [repairTypes, setRepairTypes] = useState<RepairType[]>([])
  const [estimating, setEstimating] = useState<number | null>(null)
  
  useEffect(() => {
    fetchRepairTypes()
  }, [])
  
  const fetchRepairTypes = async () => {
    try {
      const response = await fetch('/api/repair-types')
      const data = await response.json()
      setRepairTypes(data.data)
    } catch (error) {
      console.error('Failed to fetch repair types:', error)
    }
  }
  
  const handleToggleRepair = async (repairType: RepairType) => {
    const existing = selectedItems.find(item => item.repairTypeId === repairType.id)
    
    if (existing) {
      // Remove
      onChange(selectedItems.filter(item => item.repairTypeId !== repairType.id))
    } else {
      // Add with default quality
      const newItem: RepairItem = {
        repairTypeId: repairType.id,
        partsQuality: 'aftermarket_premium'
      }
      
      // Estimate price if device selected
      if (deviceModelId) {
        setEstimating(repairType.id)
        try {
          const estimate = await estimatePrice(deviceModelId, repairType.id, 'aftermarket_premium')
          newItem.calculatedPrice = estimate.price
          newItem.confidenceScore = estimate.confidence
        } catch (error) {
          console.error('Price estimation failed:', error)
        } finally {
          setEstimating(null)
        }
      }
      
      onChange([...selectedItems, newItem])
    }
  }
  
  const handleQualityChange = async (repairTypeId: number, quality: RepairItem['partsQuality']) => {
    const updated = selectedItems.map(item => {
      if (item.repairTypeId === repairTypeId) {
        return { ...item, partsQuality: quality }
      }
      return item
    })
    
    // Re-estimate price with new quality
    if (deviceModelId) {
      const item = updated.find(i => i.repairTypeId === repairTypeId)
      if (item) {
        try {
          const estimate = await estimatePrice(deviceModelId, repairTypeId, quality)
          item.calculatedPrice = estimate.price
          item.confidenceScore = estimate.confidence
        } catch (error) {
          console.error('Price estimation failed:', error)
        }
      }
    }
    
    onChange(updated)
  }
  
  const estimatePrice = async (deviceId: number, repairTypeId: number, quality: string) => {
    const response = await fetch('/api/pricing/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceModelId: deviceId,
        repairTypeId,
        partsQuality: quality
      })
    })
    
    if (!response.ok) throw new Error('Estimation failed')
    
    const data = await response.json()
    return data.data
  }
  
  const isSelected = (repairTypeId: number) => {
    return selectedItems.some(item => item.repairTypeId === repairTypeId)
  }
  
  const getSelectedItem = (repairTypeId: number) => {
    return selectedItems.find(item => item.repairTypeId === repairTypeId)
  }
  
  return (
    <div className="space-y-3">
      {repairTypes.map(repairType => {
        const Icon = REPAIR_ICONS[repairType.category] || REPAIR_ICONS.default
        const selected = isSelected(repairType.id)
        const item = getSelectedItem(repairType.id)
        const isEstimating = estimating === repairType.id
        
        return (
          <div
            key={repairType.id}
            className={`border rounded-lg p-4 transition-all ${
              selected
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleRepair(repairType)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{repairType.name}</span>
                    <span className="text-xs text-gray-500">
                      (~{repairType.avgTimeMinutes} min)
                    </span>
                  </div>
                  
                  {/* Quality selector (shown when selected) */}
                  {selected && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parts Quality
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'original', label: 'Original OEM', badge: '⭐' },
                          { value: 'aftermarket_premium', label: 'Premium', badge: '✓✓' },
                          { value: 'aftermarket_standard', label: 'Standard', badge: '✓' },
                          { value: 'aftermarket_economy', label: 'Economy', badge: '$' }
                        ].map(quality => (
                          <button
                            key={quality.value}
                            type="button"
                            onClick={() => handleQualityChange(repairType.id, quality.value as any)}
                            className={`px-3 py-2 text-sm rounded border ${
                              item?.partsQuality === quality.value
                                ? 'border-blue-600 bg-blue-100 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <span className="mr-1">{quality.badge}</span>
                            {quality.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Price display */}
              {selected && (
                <div className="ml-4 text-right">
                  {isEstimating ? (
                    <div className="text-sm text-gray-500">Calculating...</div>
                  ) : item?.calculatedPrice ? (
                    <>
                      <div className="text-xl font-bold text-blue-600">
                        ${item.calculatedPrice.toFixed(2)}
                      </div>
                      {item.confidenceScore && item.confidenceScore < 0.9 && (
                        <div className="text-xs text-amber-600">
                          {item.confidenceScore >= 0.75 ? '⚠️ Estimated' : '⚠️ Low confidence'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">Select device first</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 4. Repair Card (for Kanban Board) - `components/RepairCard.tsx`

```tsx
'use client'

import { Clock, User, Smartphone, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RepairCardProps {
  repair: {
    id: number
    repairNumber: string
    status: string
    priority: string
    totalCost: number
    createdAt: string
    estimatedCompletion: string | null
    customer: {
      firstName: string
      lastName: string
      phone: string
    }
    deviceModel: {
      name: string
      variant: string | null
      brand: {
        name: string
      }
    }
    repairItems: Array<{
      repairType: {
        name: string
      }
    }>
  }
}

const PRIORITY_COLORS = {
  standard: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-700',
  express: 'bg-red-100 text-red-700'
}

export function RepairCard({ repair }: RepairCardProps) {
  const deviceName = `${repair.deviceModel.brand.name} ${repair.deviceModel.name}`
  const timeInStatus = formatDistanceToNow(new Date(repair.createdAt), { addSuffix: true })
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border-2 border-gray-200 hover:border-blue-400 cursor-pointer mb-3 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono text-sm text-gray-600">{repair.repairNumber}</div>
          <div className="font-semibold text-gray-900">
            {repair.customer.firstName} {repair.customer.lastName}
          </div>
        </div>
        
        <span className={`px-2 py-1 text-xs font-medium rounded ${PRIORITY_COLORS[repair.priority as keyof typeof PRIORITY_COLORS]}`}>
          {repair.priority}
        </span>
      </div>
      
      {/* Device */}
      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
        <Smartphone className="w-4 h-4" />
        <span>{deviceName}</span>
        {repair.deviceModel.variant && (
          <span className="text-gray-500">({repair.deviceModel.variant})</span>
        )}
      </div>
      
      {/* Repair Types */}
      <div className="flex flex-wrap gap-1 mb-3">
        {repair.repairItems.map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
          >
            {item.repairType.name}
          </span>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{timeInStatus}</span>
        </div>
        
        <div className="font-semibold text-gray-900">
          ${Number(repair.totalCost).toFixed(2)}
        </div>
      </div>
      
      {/* Overdue warning */}
      {repair.estimatedCompletion && new Date(repair.estimatedCompletion) < new Date() && repair.status !== 'completed' && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>Overdue</span>
        </div>
      )}
    </div>
  )
}
```

### 5. Customer Search Dialog - `components/CustomerSearchDialog.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'

export function CustomerSearchDialog({ 
  onSelect 
}: { 
  onSelect: (customer: any) => void 
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  
  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}&sync=true`)
      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateNew = async (formData: any) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to create customer')
      
      const data = await response.json()
      onSelect(data.data)
    } catch (error) {
      console.error('Create customer error:', error)
      alert('Failed to create customer')
    }
  }
  
  return (
    <div>
      {!showNewForm ? (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Results */}
          {loading && (
            <div className="mt-2 text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="mt-2 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {results.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelect(customer)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                >
                  <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                  {customer.email && (
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="mt-2 text-center py-4 text-gray-500">
              No customers found
            </div>
          )}
          
          {/* Create New Button */}
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="mt-3 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create New Customer</span>
          </button>
        </>
      ) : (
        <NewCustomerForm
          onSubmit={handleCreateNew}
          onCancel={() => setShowNewForm(false)}
        />
      )}
    </div>
  )
}

function NewCustomerForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notificationPreference: 'sms'
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="+1 (234) 567-8900"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (Optional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notification Preference
        </label>
        <select
          value={formData.notificationPreference}
          onChange={(e) => setFormData({ ...formData, notificationPreference: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="sms">SMS Only</option>
          <option value="email">Email Only</option>
          <option value="both">Both SMS & Email</option>
        </select>
      </div>
      
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Customer
        </button>
      </div>
    </form>
  )
}
```

---

These are production-ready React components with full TypeScript support, error handling, and beautiful UI using Tailwind CSS!
