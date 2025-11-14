'use client'

import { useState, useEffect } from 'react'
import { CustomerList } from '@/components/customers/CustomerList'
import { Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-gray-600 mt-1">Search for customers with active repairs</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg smooth-transition font-semibold shadow-md hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers by name, phone, or email (min 2 characters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3.5 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 smooth-transition text-gray-900 placeholder-gray-400"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Type at least 2 characters to search
          </p>
        )}
      </div>

      {/* Customer List or Empty State */}
      {customers.length === 0 && searchTerm.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-16 text-center border border-gray-100">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Search for Customers</h3>
          <p className="text-gray-600 max-w-md mx-auto">Enter a name, phone number, or email to find customers with active repairs</p>
        </div>
      ) : customers.length === 0 && searchTerm.length >= 2 ? (
        <div className="bg-white rounded-2xl shadow-soft p-16 text-center border border-gray-100">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 max-w-md mx-auto">No customers with active repairs match your search. Try a different search term.</p>
        </div>
      ) : (
        <CustomerList customers={customers} onUpdate={() => fetchCustomers()} />
      )}
    </div>
  )
}
