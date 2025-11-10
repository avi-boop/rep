'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, AlertCircle, HelpCircle, Edit2 } from 'lucide-react'

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
  isEstimated: boolean
  confidenceScore: number | null
  deviceModel: {
    id: number
    name: string
    brand: Brand
  }
  repairType: RepairType
  partType: PartType
}

interface Props {
  brands: Brand[]
  repairTypes: RepairType[]
  partTypes: PartType[]
  pricing: Pricing[]
}

export function PricingMatrix({ brands, repairTypes, partTypes, pricing }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<number | null>(brands[0]?.id || null)
  const [selectedPartType, setSelectedPartType] = useState<number | null>(partTypes[0]?.id || null)

  // Get devices for selected brand
  const devices = pricing
    .filter(p => p.deviceModel.brand.id === selectedBrand)
    .map(p => p.deviceModel)
    .filter((device, index, self) => 
      index === self.findIndex(d => d.id === device.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  // Get price for specific combination
  const getPrice = (deviceId: number, repairTypeId: number) => {
    return pricing.find(
      p => p.deviceModelId === deviceId && 
           p.repairTypeId === repairTypeId && 
           p.partTypeId === selectedPartType
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Part Quality
          </label>
          <select
            value={selectedPartType || ''}
            onChange={(e) => setSelectedPartType(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {partTypes.map(pt => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Set Price</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-yellow-500" />
          <span>Estimated</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Missing</span>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                Device Model
              </th>
              {repairTypes.map(rt => (
                <th key={rt.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  {rt.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={repairTypes.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No devices found for this brand
                </td>
              </tr>
            ) : (
              devices.map(device => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    {device.name}
                  </td>
                  {repairTypes.map(rt => {
                    const price = getPrice(device.id, rt.id)
                    return (
                      <td key={rt.id} className="px-4 py-3 text-center">
                        {price ? (
                          <PriceCell price={price} />
                        ) : (
                          <button className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PriceCell({ price }: { price: Pricing }) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="inline-flex items-center gap-2">
      {price.isEstimated ? (
        <HelpCircle className="w-4 h-4 text-yellow-500" />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
      <span className="font-medium">{formatCurrency(price.price)}</span>
      <button 
        onClick={() => setIsEditing(true)}
        className="text-gray-400 hover:text-blue-600"
      >
        <Edit2 className="w-3 h-3" />
      </button>
      {price.isEstimated && price.confidenceScore && (
        <span className="text-xs text-gray-500">
          {Math.round(price.confidenceScore * 100)}%
        </span>
      )}
    </div>
  )
}
