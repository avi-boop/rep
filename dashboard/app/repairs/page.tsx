'use client'

import { useEffect, useState } from 'react'

interface Repair {
  id: number
  repairNumber: string
  status: string
  priority: string
  totalCost: number
  createdAt: string
  customer: {
    firstName: string
    lastName: string
  }
  deviceModel: {
    name: string
    variant: string | null
    brand: {
      name: string
    }
  }
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      const response = await fetch('/api/repairs')
      const data = await response.json()
      if (data.success) {
        setRepairs(data.data)
      }
    } catch (error) {
      console.error('Error fetching repairs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-gray-100 text-gray-800',
      diagnosed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      testing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-600',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') return '🔴'
    if (priority === 'express') return '⚡'
    return ''
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Repairs</h1>
            <p className="mt-1 text-gray-600">Manage all device repairs</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-sm">
            + New Repair
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['all', 'new', 'in_progress', 'testing', 'ready', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Repairs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading repairs...</p>
        </div>
      ) : repairs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No repairs yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first repair to get started
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
            + New Repair
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repairs.map((repair) => (
            <div
              key={repair.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-500">
                        {repair.repairNumber}
                      </span>
                      {getPriorityBadge(repair.priority) && (
                        <span>{getPriorityBadge(repair.priority)}</span>
                      )}
                    </div>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        repair.status
                      )}`}
                    >
                      {repair.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">
                    {repair.customer.firstName} {repair.customer.lastName}
                  </p>
                </div>

                {/* Device */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Device</p>
                  <p className="font-medium text-gray-900">
                    {repair.deviceModel.brand.name} {repair.deviceModel.name}
                    {repair.deviceModel.variant && ` ${repair.deviceModel.variant}`}
                  </p>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${repair.totalCost}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
