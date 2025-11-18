'use client'

// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { CustomerList } from '@/components/customers/CustomerList'
import { NewCustomerModal } from '@/components/customers/NewCustomerModal'
import { Plus, RefreshCw } from 'lucide-react'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string
  lightspeedId: string | null
  createdAt: Date
  _count: {
    repairOrders: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCustomers = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    setLoading(true)
    try {
      // Only fetch customers with active repairs
      const response = await fetch('/api/customers?hasActiveRepairs=true')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
      if (showRefreshIndicator) setRefreshing(false)
    }
  }

  // Fetch customers when search term changes (debounced)
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetchCustomers()
      }, 300)
      return () => clearTimeout(timer)
    } else if (searchTerm.trim().length === 0) {
      // Clear customers when search is empty
      setCustomers([])
    }
  }, [searchTerm])

  // Handle customer creation
  const handleCustomerCreated = (newCustomer: any) => {
    // Transform the customer data to match the expected type
    const customer: Customer = {
      ...newCustomer,
      createdAt: new Date(newCustomer.createdAt),
      _count: newCustomer._count || { repairOrders: 0 }
    }

    // Add the new customer to the list immediately for better UX
    setCustomers(prev => [customer, ...prev])

    // Also refresh from server if searching to ensure consistency
    if (searchTerm.trim().length >= 2) {
      setTimeout(() => fetchCustomers(), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Search for customers with active repairs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers by name, phone, or email (min 2 characters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </div>
        </div>
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <p className="mt-2 text-sm text-gray-500">Type at least 2 characters to search</p>
        )}
      </div>

      {/* Customer List or Empty State */}
      {customers.length === 0 && searchTerm.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for Customers</h3>
          <p className="text-gray-600">Enter a name, phone number, or email to find customers with active repairs</p>
        </div>
      ) : customers.length === 0 && searchTerm.length >= 2 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">No customers with active repairs match your search</p>
        </div>
      ) : (
        <CustomerList customers={customers} onUpdate={() => fetchCustomers()} />
      )}

      {/* Add Customer Modal */}
      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  )
}
