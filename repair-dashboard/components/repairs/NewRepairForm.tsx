'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Plus, X, Search } from 'lucide-react'

interface Brand {
  id: number
  name: string
  deviceModels: Array<{
    id: number
    name: string
  }>
}

interface RepairType {
  id: number
  name: string
  category: string | null
}

interface PartType {
  id: number
  name: string
  qualityLevel: number
}

interface Customer {
  id: number
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

interface Props {
  brands: Brand[]
  repairTypes: RepairType[]
  partTypes: PartType[]
  customers: Customer[]
}

interface RepairItem {
  repairTypeId: number
  partTypeId: number
  price: number
}

export function NewRepairForm({ brands, repairTypes, partTypes, customers }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null)
  const [repairItems, setRepairItems] = useState<RepairItem[]>([])
  const [deviceImei, setDeviceImei] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [priority, setPriority] = useState('normal')

  const selectedBrandData = brands.find(b => b.id === selectedBrand)

  const addRepairItem = () => {
    setRepairItems([
      ...repairItems,
      { repairTypeId: repairTypes[0].id, partTypeId: partTypes[0].id, price: 0 }
    ])
  }

  const removeRepairItem = (index: number) => {
    setRepairItems(repairItems.filter((_, i) => i !== index))
  }

  const updateRepairItem = (index: number, field: keyof RepairItem, value: any) => {
    const updated = [...repairItems]
    updated[index] = { ...updated[index], [field]: value }
    setRepairItems(updated)
  }

  const fetchPrice = async (index: number) => {
    const item = repairItems[index]
    if (!selectedDevice) return

    try {
      const res = await fetch('/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceModelId: selectedDevice,
          repairTypeId: item.repairTypeId,
          partTypeId: item.partTypeId
        })
      })
      const data = await res.json()
      updateRepairItem(index, 'price', data.price)
    } catch (error) {
      console.error('Failed to fetch price:', error)
    }
  }

  const totalPrice = repairItems.reduce((sum, item) => sum + item.price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedDevice || repairItems.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          deviceModelId: selectedDevice,
          deviceImei,
          issueDescription,
          priority,
          totalPrice,
          items: repairItems.map(item => ({
            repairTypeId: item.repairTypeId,
            partTypeId: item.partTypeId,
            quantity: 1,
            unitPrice: item.price,
            totalPrice: item.price
          }))
        })
      })

      if (res.ok) {
        router.push('/dashboard/repairs')
        router.refresh()
      } else {
        throw new Error('Failed to create repair')
      }
    } catch (error) {
      console.error('Error creating repair:', error)
      alert('Failed to create repair. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Customer *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === Number(e.target.value))
                  setSelectedCustomer(customer || null)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Search or select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} - {c.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Device Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Device Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <select
              required
              value={selectedBrand || ''}
              onChange={(e) => {
                setSelectedBrand(Number(e.target.value))
                setSelectedDevice(null)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select brand...</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <select
              required
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(Number(e.target.value))}
              disabled={!selectedBrand}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select model...</option>
              {selectedBrandData?.deviceModels.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMEI (Optional)
            </label>
            <input
              type="text"
              value={deviceImei}
              onChange={(e) => setDeviceImei(e.target.value)}
              placeholder="Enter IMEI number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="express">Express</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Description
          </label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            rows={3}
            placeholder="Describe the issue..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Repair Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Repairs & Services</h2>
          <button
            type="button"
            onClick={addRepairItem}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Repair
          </button>
        </div>

        {repairItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No repairs added yet. Click "Add Repair" to get started.</p>
        ) : (
          <div className="space-y-4">
            {repairItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 border border-gray-200 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repair Type
                    </label>
                    <select
                      value={item.repairTypeId}
                      onChange={(e) => {
                        updateRepairItem(index, 'repairTypeId', Number(e.target.value))
                        fetchPrice(index)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {repairTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Quality
                    </label>
                    <select
                      value={item.partTypeId}
                      onChange={(e) => {
                        updateRepairItem(index, 'partTypeId', Number(e.target.value))
                        fetchPrice(index)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {partTypes.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateRepairItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => fetchPrice(index)}
                        disabled={!selectedDevice}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRepairItem(index)}
                  className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary & Submit */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Price</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice)}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || repairItems.length === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Repair Order'}
          </button>
        </div>
      </div>
    </form>
  )
}
