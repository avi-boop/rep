'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Plus, X, Search, UserPlus } from 'lucide-react'
import { NewCustomerModal } from '@/components/customers/NewCustomerModal'
import AIPhotoDiagnostics from '@/components/ai/AIPhotoDiagnostics'
import { toastHelpers } from '@/lib/toast'

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
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null)
  const [repairItems, setRepairItems] = useState<RepairItem[]>([])
  const [deviceImei, setDeviceImei] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [allCustomers, setAllCustomers] = useState<Customer[]>(customers)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const selectedBrandData = brands.find(b => b.id === selectedBrand)

  // Filter customers based on search
  const filteredCustomers = allCustomers.filter(c => {
    if (!customerSearch) return true
    const searchLower = customerSearch.toLowerCase()
    return (
      c.firstName.toLowerCase().includes(searchLower) ||
      c.lastName.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchLower) ||
      (c.email && c.email.toLowerCase().includes(searchLower))
    )
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false)
      }
    }

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCustomerDropdown])

  // Pre-fill form from URL parameters (when coming from pricing page)
  useEffect(() => {
    const modelId = searchParams.get('modelId')
    const repairTypeId = searchParams.get('repairTypeId')
    const partTypeId = searchParams.get('partTypeId')
    const price = searchParams.get('price')
    const brandName = searchParams.get('brandName')

    if (modelId && repairTypeId && partTypeId) {
      // Find the brand that contains this model
      const brand = brands.find(b =>
        b.deviceModels.some(m => m.id === parseInt(modelId))
      )

      if (brand) {
        setSelectedBrand(brand.id)
        setSelectedDevice(parseInt(modelId))

        // Add the repair item
        const newItem: RepairItem = {
          repairTypeId: parseInt(repairTypeId),
          partTypeId: parseInt(partTypeId),
          price: price ? parseFloat(price) : 0
        }
        setRepairItems([newItem])

        // Show a toast to inform the user
        toastHelpers.success('Repair pre-filled from pricing', 'You can now select a customer and add more repairs if needed')
      }
    }
  }, [searchParams, brands])

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
    if (!selectedDevice) {
      toastHelpers.error('Please select a device first')
      return
    }

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

      if (res.ok) {
        const data = await res.json()
        if (data.price && data.price > 0) {
          updateRepairItem(index, 'price', data.price)
          toastHelpers.priceFetched(data.price)
        } else {
          toastHelpers.priceNotFound()
        }
      } else {
        toastHelpers.priceNotFound()
      }
    } catch (error) {
      console.error('Failed to fetch price:', error)
      toastHelpers.error('Failed to fetch price', 'Please enter manually')
    }
  }

  const totalPrice = repairItems.reduce((sum, item) => sum + item.price, 0)

  const handleCustomerCreated = (newCustomer: Customer) => {
    // Add new customer to the list
    setAllCustomers(prev => [newCustomer, ...prev])
    // Automatically select the newly created customer
    setSelectedCustomer(newCustomer)
    // Clear search and hide dropdown
    setCustomerSearch('')
    setShowCustomerDropdown(false)
    // Show success message
    toastHelpers.customerCreated(`${newCustomer.firstName} ${newCustomer.lastName}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedDevice || repairItems.length === 0) {
      toastHelpers.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    const loadingToast = toastHelpers.loading('Creating repair order...')

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
        const data = await res.json()
        const { repair, notifications } = data

        // Show success toast with notification status
        toastHelpers.repairCreated(
          repair.orderNumber,
          {
            sms: notifications?.sms?.success || false,
            email: notifications?.email?.success || false
          }
        )

        router.push('/dashboard/repairs')
        router.refresh()
      } else {
        throw new Error('Failed to create repair')
      }
    } catch (error) {
      console.error('Error creating repair:', error)
      toastHelpers.error('Failed to create repair', 'Please try again or contact support')
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
            <div className="flex gap-2">
              <div className="relative flex-1 customer-search-container">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} - ${selectedCustomer.phone}` : customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setSelectedCustomer(null)
                    setShowCustomerDropdown(true)
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Type to search customers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!selectedCustomer}
                />
                {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.slice(0, 50).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch('')
                          setShowCustomerDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {c.firstName} {c.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {c.phone}{c.email && ` • ${c.email}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showCustomerDropdown && customerSearch && filteredCustomers.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No customers found. Click &ldquo;Add New&rdquo; to create one.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                title="Add New Customer"
              >
                <UserPlus className="w-5 h-5" />
                Add New
              </button>
            </div>
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Selected:</span> {selectedCustomer.firstName} {selectedCustomer.lastName}
                  {selectedCustomer.email && <span className="text-gray-500"> • {selectedCustomer.email}</span>}
                </p>
              </div>
            )}
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

      {/* AI Diagnostics (Optional) */}
      {selectedDevice && selectedBrandData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">AI-Powered Diagnostics (Optional)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a photo of the device for instant AI analysis. Suggested repairs will be automatically added below.
          </p>
          <AIPhotoDiagnostics
            deviceType={`${selectedBrandData.name} ${selectedBrandData.deviceModels.find(d => d.id === selectedDevice)?.name || ''}`}
            onDiagnosisComplete={(diagnosis, repairs) => {
              // Auto-populate issue description
              const description = `AI Analysis: ${diagnosis.overall_condition}\n\nDetected Issues:\n${
                diagnosis.damages.map(d => `- ${d.type.replace(/_/g, ' ')}: ${d.description} (${d.severity})`).join('\n')
              }`;
              setIssueDescription(description);

              // Auto-add repair items based on suggestions
              const newRepairItems = repairs.map(repair => {
                const repairType = repairTypes.find(rt =>
                  rt.name.toLowerCase().includes(repair.type.toLowerCase().split(' ')[0])
                );
                return {
                  repairTypeId: repairType?.id || repairTypes[0].id,
                  partTypeId: partTypes[2]?.id || partTypes[0].id, // Default to mid-tier quality
                  price: 0
                };
              });

              setRepairItems(prev => [...prev, ...newRepairItems]);

              // Set priority based on urgency
              if (diagnosis.urgency === 'high') {
                setPriority('urgent');
              } else if (diagnosis.urgency === 'medium') {
                setPriority('normal');
              }

              toastHelpers.success('AI analysis complete! Repairs added automatically');
            }}
            onError={(error) => {
              toastHelpers.error('AI diagnosis failed', error);
            }}
          />
        </div>
      )}

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
          <p className="text-gray-500 text-center py-8">No repairs added yet. Click &quot;Add Repair&quot; to get started.</p>
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

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </form>
  )
}
