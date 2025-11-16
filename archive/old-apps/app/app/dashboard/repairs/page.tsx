'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'

const STATUS_COLUMNS = [
  { id: 'new', title: 'New', color: 'bg-gray-100', count: 5 },
  { id: 'diagnosed', title: 'Diagnosed', color: 'bg-blue-100', count: 3 },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100', count: 7 },
  { id: 'testing', title: 'Testing', color: 'bg-purple-100', count: 4 },
  { id: 'ready', title: 'Ready', color: 'bg-green-100', count: 3 },
  { id: 'completed', title: 'Completed', color: 'bg-gray-50', count: 12 },
]

const SAMPLE_REPAIRS = [
  {
    id: 'RR-20250110-001',
    device: 'iPhone 15 Pro Max',
    customer: 'John Doe',
    issue: 'Screen Replacement',
    priority: 'standard',
    status: 'new',
    amount: 349,
    createdAt: '2 hours ago',
  },
  {
    id: 'RR-20250110-002',
    device: 'Samsung Galaxy S24',
    customer: 'Jane Smith',
    issue: 'Battery + Screen',
    priority: 'urgent',
    status: 'diagnosed',
    amount: 450,
    createdAt: '4 hours ago',
  },
  {
    id: 'RR-20250110-003',
    device: 'iPhone 13',
    customer: 'Bob Johnson',
    issue: 'Charging Port',
    priority: 'standard',
    status: 'in_progress',
    amount: 69,
    createdAt: '5 hours ago',
  },
  {
    id: 'RR-20250109-015',
    device: 'iPad Pro 12.9"',
    customer: 'Alice Brown',
    issue: 'Screen Replacement',
    priority: 'express',
    status: 'testing',
    amount: 449,
    createdAt: 'Yesterday',
  },
  {
    id: 'RR-20250109-012',
    device: 'iPhone 14 Pro',
    customer: 'Charlie Wilson',
    issue: 'Back Glass',
    priority: 'standard',
    status: 'ready',
    amount: 199,
    createdAt: 'Yesterday',
  },
]

export default function RepairsPage() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repairs</h1>
          <p className="text-gray-600 mt-1">Manage and track all repairs</p>
        </div>
        <Link
          href="/dashboard/repairs/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Repair
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by repair #, customer, device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>

          {/* Filter Button */}
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-5 w-5 mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {STATUS_COLUMNS.map((column) => (
              <div key={column.id} className="w-80 flex-shrink-0">
                <div className={`${column.color} rounded-t-lg px-4 py-3`}>
                  <h3 className="font-semibold text-gray-900">
                    {column.title}{' '}
                    <span className="text-gray-600">({column.count})</span>
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-b-lg border-2 border-gray-200 border-t-0 p-3 min-h-[500px] space-y-3">
                  {SAMPLE_REPAIRS.filter((r) => r.status === column.id).map(
                    (repair) => (
                      <RepairCard key={repair.id} repair={repair} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repair #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {SAMPLE_REPAIRS.map((repair) => (
                <tr key={repair.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    <Link href={`/dashboard/repairs/${repair.id}`}>
                      {repair.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {repair.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {repair.device}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {repair.issue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        repair.status
                      )}`}
                    >
                      {repair.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${repair.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {repair.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RepairCard({ repair }: { repair: (typeof SAMPLE_REPAIRS)[0] }) {
  const priorityColors = {
    standard: 'border-gray-300',
    urgent: 'border-orange-400',
    express: 'border-red-400',
  }

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
        priorityColors[repair.priority as keyof typeof priorityColors]
      } hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/dashboard/repairs/${repair.id}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {repair.id}
        </Link>
        {repair.priority !== 'standard' && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              repair.priority === 'urgent'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {repair.priority}
          </span>
        )}
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">{repair.device}</h4>
      <p className="text-sm text-gray-600 mb-2">{repair.customer}</p>
      <p className="text-xs text-gray-600 mb-3">{repair.issue}</p>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-600">{repair.createdAt}</span>
        <span className="text-sm font-semibold text-gray-900">
          ${repair.amount}
        </span>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-800',
    diagnosed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    testing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
