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
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100">
      {/* Search & Filters */}
      <div className="p-6 border-b border-gray-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, phone, or email..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 smooth-transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border-2 smooth-transition flex items-center gap-2 font-medium ${
              showFilters || hasActiveFilters
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-2 border-primary-200 rounded-xl p-5 bg-gradient-to-r from-primary-50 to-white space-y-4 animate-slide-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                Advanced Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium smooth-transition"
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
          <div className="p-12 text-center text-gray-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">No customers found</p>
            <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="p-5 hover:bg-gray-50 smooth-transition border-l-4 border-transparent hover:border-primary-500">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate text-lg">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    {customer.lightspeedId && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                        </svg>
                        Lightspeed
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      </div>
                      <span className="font-medium">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        </div>
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right mr-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm font-bold text-gray-900">
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
                      className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl smooth-transition border-2 border-transparent hover:border-primary-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/customers/${customer.id}?edit=true`}
                      className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl smooth-transition border-2 border-transparent hover:border-gray-300"
                      title="Edit Customer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(customer.id)}
                      className="p-2.5 text-danger-600 hover:bg-danger-50 rounded-xl smooth-transition border-2 border-transparent hover:border-danger-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-large animate-scale-in">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-danger-100 mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-danger-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Confirm Delete</h3>
            <p className="text-gray-600 mb-8 text-center">
              Are you sure you want to delete this customer? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 smooth-transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-5 py-2.5 bg-gradient-to-r from-danger-600 to-danger-700 text-white rounded-xl hover:shadow-lg smooth-transition flex items-center gap-2 font-semibold shadow-md hover:scale-105"
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
