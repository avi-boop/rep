'use client'

import { useState } from 'react'
import { Search, Mail, Phone, User, Eye, Edit, Trash2, Filter, X, SlidersHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

interface Props {
  customers: Customer[]
  onUpdate?: () => void
}

export function CustomerList({ customers, onUpdate }: Props) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    minRepairs: '',
    maxRepairs: '',
    hasEmail: 'all'
  })

  const filteredCustomers = customers.filter(c => {
    // Text search
    const matchesSearch = `${c.firstName} ${c.lastName} ${c.phone} ${c.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    // Filter by repair count
    const repairCount = c._count.repairOrders
    const matchesMinRepairs = !filters.minRepairs || repairCount >= parseInt(filters.minRepairs)
    const matchesMaxRepairs = !filters.maxRepairs || repairCount <= parseInt(filters.maxRepairs)

    // Filter by email
    const matchesEmail =
      filters.hasEmail === 'all' ||
      (filters.hasEmail === 'yes' && c.email) ||
      (filters.hasEmail === 'no' && !c.email)

    return matchesSearch && matchesMinRepairs && matchesMaxRepairs && matchesEmail
  })

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete customer')
      }

      // Refresh the customer list
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Failed to delete customer')
    } finally {
      setShowDeleteConfirm(null)
    }
  }

  const clearFilters = () => {
    setFilters({
      minRepairs: '',
      maxRepairs: '',
      hasEmail: 'all'
    })
  }

  const hasActiveFilters = filters.minRepairs || filters.maxRepairs || filters.hasEmail !== 'all'

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search & Filters */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Min Repairs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Repairs
                </label>
                <input
                  type="number"
                  value={filters.minRepairs}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRepairs: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Max Repairs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Repairs
                </label>
                <input
                  type="number"
                  value={filters.maxRepairs}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRepairs: e.target.value }))}
                  placeholder="999"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Has Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <select
                  value={filters.hasEmail}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Customers</option>
                  <option value="yes">Has Email</option>
                  <option value="no">No Email</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>
        </div>
      </div>

      {/* Customer List */}
      <div className="divide-y divide-gray-200">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    {customer.lightspeedId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                        </svg>
                        Lightspeed
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-gray-900">
                      {customer._count.repairOrders} repair{customer._count.repairOrders !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Since {formatDate(customer.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/customers/${customer.id}?edit=true`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Customer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(customer.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
