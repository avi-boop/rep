'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoManager } from '@/components/repairs/PhotoManager'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  Calendar,
  User,
  Smartphone,
  FileText,
  Camera,
  Clock,
  DollarSign
} from 'lucide-react'

interface RepairDetailsClientProps {
  repair: any
}

type Tab = 'details' | 'photos' | 'history'

export function RepairDetailsClient({ repair }: RepairDetailsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('details')

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    ready_for_pickup: 'bg-purple-100 text-purple-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    ready_for_pickup: 'Ready for Pickup',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Repairs
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{repair.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              {repair.deviceModel?.brand?.name} {repair.deviceModel?.name}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[repair.status]}`}>
            {statusLabels[repair.status] || repair.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Details
              </div>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'photos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                History
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{' '}
                    {repair.customer.firstName} {repair.customer.lastName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {repair.customer.phone}
                  </p>
                  {repair.customer.email && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {repair.customer.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Device Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Device Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Brand:</span> {repair.deviceModel?.brand?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Model:</span> {repair.deviceModel?.name}
                  </p>
                  {repair.deviceImei && (
                    <p className="text-sm">
                      <span className="font-medium">IMEI:</span> {repair.deviceImei}
                    </p>
                  )}
                  {repair.issueDescription && (
                    <p className="text-sm">
                      <span className="font-medium">Issue:</span> {repair.issueDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Repair Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Repair Items
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Repair Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Part Quality
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {repair.repairOrderItems.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.repairType.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.partType.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(repair.totalPrice)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Important Dates
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(repair.createdAt).toLocaleDateString()}
                  </p>
                  {repair.estimatedCompletion && (
                    <p className="text-sm">
                      <span className="font-medium">Estimated Completion:</span>{' '}
                      {new Date(repair.estimatedCompletion).toLocaleDateString()}
                    </p>
                  )}
                  {repair.actualCompletion && (
                    <p className="text-sm">
                      <span className="font-medium">Actual Completion:</span>{' '}
                      {new Date(repair.actualCompletion).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div>
              <PhotoManager repairOrderId={repair.id} />
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Status history will be displayed here</p>
              <p className="text-sm mt-2">Feature coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
