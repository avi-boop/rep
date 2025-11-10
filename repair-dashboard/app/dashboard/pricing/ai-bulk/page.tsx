'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Device {
  id: number
  name: string
  brand: { id: number; name: string }
}

interface RepairType {
  id: number
  name: string
  category: string
}

interface PartType {
  id: number
  name: string
  qualityLevel: number
}

interface PricingCombination {
  id: string
  deviceId: number
  deviceName: string
  brandName: string
  repairTypeId: number
  repairTypeName: string
  partTypeId: number
  partTypeName: string
  status: 'pending' | 'loading' | 'success' | 'error'
  suggestedPrice?: number
  minPrice?: number
  maxPrice?: number
  confidence?: number
  reasoning?: string
  error?: string
}

export default function BulkAIPricingPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [repairTypes, setRepairTypes] = useState<RepairType[]>([])
  const [partTypes, setPartTypes] = useState<PartType[]>([])
  const [combinations, setCombinations] = useState<PricingCombination[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Selection state
  const [selectedDevices, setSelectedDevices] = useState<number[]>([])
  const [selectedRepairTypes, setSelectedRepairTypes] = useState<number[]>([])
  const [selectedPartTypes, setSelectedPartTypes] = useState<number[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [devicesRes, repairTypesRes, partTypesRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/repair-types'),
        fetch('/api/part-types'),
      ])

      const devicesData = await devicesRes.json()
      const repairTypesData = await repairTypesRes.json()
      const partTypesData = await partTypesRes.json()

      setDevices(devicesData.data || [])
      setRepairTypes(repairTypesData || [])
      setPartTypes(partTypesData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const generateCombinations = () => {
    const newCombinations: PricingCombination[] = []

    selectedDevices.forEach(deviceId => {
      const device = devices.find(d => d.id === deviceId)
      if (!device) return

      selectedRepairTypes.forEach(repairTypeId => {
        const repairType = repairTypes.find(r => r.id === repairTypeId)
        if (!repairType) return

        selectedPartTypes.forEach(partTypeId => {
          const partType = partTypes.find(p => p.id === partTypeId)
          if (!partType) return

          const id = `${deviceId}-${repairTypeId}-${partTypeId}`
          newCombinations.push({
            id,
            deviceId,
            deviceName: device.name,
            brandName: device.brand.name,
            repairTypeId,
            repairTypeName: repairType.name,
            partTypeId,
            partTypeName: partType.name,
            status: 'pending',
          })
        })
      })
    })

    setCombinations(newCombinations)
  }

  const getAIPricing = async () => {
    if (combinations.length === 0) return

    setProcessing(true)

    // Process combinations one at a time to avoid rate limiting
    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i]

      // Update status to loading
      setCombinations(prev =>
        prev.map((c, idx) =>
          idx === i ? { ...c, status: 'loading' as const } : c
        )
      )

      try {
        const response = await fetch('/api/integrations/gemini/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceBrand: combination.brandName,
            deviceModel: combination.deviceName,
            repairType: combination.repairTypeName,
            partQuality: combination.partTypeName,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setCombinations(prev =>
            prev.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    status: 'success' as const,
                    suggestedPrice: data.recommendation.suggestedPrice,
                    minPrice: data.recommendation.minPrice,
                    maxPrice: data.recommendation.maxPrice,
                    confidence: data.recommendation.confidence,
                    reasoning: data.recommendation.reasoning,
                  }
                : c
            )
          )
        } else {
          setCombinations(prev =>
            prev.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    status: 'error' as const,
                    error: data.error || 'Failed to get pricing',
                  }
                : c
            )
          )
        }
      } catch (error) {
        setCombinations(prev =>
          prev.map((c, idx) =>
            idx === i
              ? {
                  ...c,
                  status: 'error' as const,
                  error: 'Network error',
                }
              : c
          )
        )
      }

      // Small delay between requests to avoid overwhelming the API
      if (i < combinations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setProcessing(false)
  }

  const savePricing = async () => {
    const successfulCombinations = combinations.filter(c => c.status === 'success')

    if (successfulCombinations.length === 0) {
      alert('No successful pricing recommendations to save')
      return
    }

    try {
      const promises = successfulCombinations.map(combination =>
        fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceModelId: combination.deviceId,
            repairTypeId: combination.repairTypeId,
            partTypeId: combination.partTypeId,
            price: combination.suggestedPrice,
            cost: Math.round((combination.suggestedPrice || 0) * 0.5), // Estimate 50% cost
            isActive: true,
            source: 'ai',
            notes: `AI-generated pricing. Confidence: ${combination.confidence}%. Range: $${combination.minPrice}-$${combination.maxPrice}`,
          }),
        })
      )

      await Promise.all(promises)
      alert(`Successfully saved ${successfulCombinations.length} pricing entries!`)
      router.push('/dashboard/pricing')
    } catch (error) {
      console.error('Error saving pricing:', error)
      alert('Failed to save some pricing entries')
    }
  }

  const exportToCSV = () => {
    const successfulCombinations = combinations.filter(c => c.status === 'success')

    if (successfulCombinations.length === 0) {
      alert('No successful pricing recommendations to export')
      return
    }

    const headers = ['Brand', 'Device', 'Repair', 'Part Quality', 'Suggested Price', 'Min Price', 'Max Price', 'Confidence']
    const rows = successfulCombinations.map(c => [
      c.brandName,
      c.deviceName,
      c.repairTypeName,
      c.partTypeName,
      c.suggestedPrice,
      c.minPrice,
      c.maxPrice,
      `${c.confidence}%`,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-pricing-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  const stats = {
    total: combinations.length,
    pending: combinations.filter(c => c.status === 'pending').length,
    loading: combinations.filter(c => c.status === 'loading').length,
    success: combinations.filter(c => c.status === 'success').length,
    error: combinations.filter(c => c.status === 'error').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Bulk AI Pricing Generator</h1>
        <p className="text-gray-600">
          Generate AI-powered pricing recommendations for multiple repair combinations at once
        </p>
      </div>

      {/* Selection Panel */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Combinations</h2>

        <div className="grid md:grid-cols-3 gap-6 mb-4">
          {/* Devices */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Devices ({selectedDevices.length} selected)
            </label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {devices.map(device => (
                <label key={device.id} className="flex items-center py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDevices([...selectedDevices, device.id])
                      } else {
                        setSelectedDevices(selectedDevices.filter(id => id !== device.id))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{device.brand.name} {device.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Repair Types */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Repair Types ({selectedRepairTypes.length} selected)
            </label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {repairTypes.map(repairType => (
                <label key={repairType.id} className="flex items-center py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRepairTypes.includes(repairType.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRepairTypes([...selectedRepairTypes, repairType.id])
                      } else {
                        setSelectedRepairTypes(selectedRepairTypes.filter(id => id !== repairType.id))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{repairType.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Part Types */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Part Quality ({selectedPartTypes.length} selected)
            </label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {partTypes.map(partType => (
                <label key={partType.id} className="flex items-center py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPartTypes.includes(partType.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPartTypes([...selectedPartTypes, partType.id])
                      } else {
                        setSelectedPartTypes(selectedPartTypes.filter(id => id !== partType.id))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{partType.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateCombinations}
            disabled={selectedDevices.length === 0 || selectedRepairTypes.length === 0 || selectedPartTypes.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Combinations ({selectedDevices.length * selectedRepairTypes.length * selectedPartTypes.length})
          </button>

          {combinations.length > 0 && (
            <>
              <button
                onClick={getAIPricing}
                disabled={processing || stats.success === stats.total}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Getting AI Pricing...' : 'Get AI Pricing'}
              </button>

              <button
                onClick={() => setCombinations([])}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {combinations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <div>Total: <span className="font-semibold">{stats.total}</span></div>
              <div className="text-yellow-600">Pending: <span className="font-semibold">{stats.pending}</span></div>
              <div className="text-blue-600">Processing: <span className="font-semibold">{stats.loading}</span></div>
              <div className="text-green-600">Success: <span className="font-semibold">{stats.success}</span></div>
              <div className="text-red-600">Error: <span className="font-semibold">{stats.error}</span></div>
            </div>

            {stats.success > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={savePricing}
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save to Database ({stats.success})
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Table */}
      {combinations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repair</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Quality</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Suggested</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Range</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Confidence</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {combinations.map((combination) => (
                  <tr key={combination.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{combination.brandName} {combination.deviceName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{combination.repairTypeName}</td>
                    <td className="px-4 py-3 text-sm">{combination.partTypeName}</td>
                    <td className="px-4 py-3 text-sm">
                      {combination.status === 'pending' && <span className="text-yellow-600">Pending</span>}
                      {combination.status === 'loading' && <span className="text-blue-600">Loading...</span>}
                      {combination.status === 'success' && <span className="text-green-600">✓ Success</span>}
                      {combination.status === 'error' && <span className="text-red-600">✗ Error</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {combination.suggestedPrice ? `$${combination.suggestedPrice}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {combination.minPrice && combination.maxPrice
                        ? `$${combination.minPrice}-$${combination.maxPrice}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {combination.confidence ? `${combination.confidence}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {combinations.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            Select devices, repair types, and part qualities above, then click "Generate Combinations" to begin.
          </p>
        </div>
      )}
    </div>
  )
}
