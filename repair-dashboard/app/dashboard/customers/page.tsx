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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCustomers = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const response = await fetch('/api/customers')
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

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer information and history</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            title="Refresh customer list"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </Link>
        </div>
      </div>

      <CustomerList customers={customers} onUpdate={() => fetchCustomers()} />
    </div>
  )
}
