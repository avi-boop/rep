'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clock, DollarSign, User } from 'lucide-react'

interface Repair {
  id: number
  orderNumber: string
  status: string
  priority: string
  totalPrice: number
  createdAt: Date
  customer: {
    firstName: string
    lastName: string
  }
  deviceModel: {
    name: string
    brand: {
      name: string
    }
  }
  repairOrderItems: Array<{
    repairType: {
      name: string
    }
  }>
}

interface Props {
  repairs: Repair[]
}

const STATUS_COLUMNS = [
  { id: 'pending', title: 'New', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'waiting_parts', title: 'Waiting Parts', color: 'bg-yellow-100' },
  { id: 'ready_pickup', title: 'Ready', color: 'bg-green-100' },
]

export function RepairStatusBoard({ repairs }: Props) {
  const [localRepairs, setLocalRepairs] = useState(repairs)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const getRepairsByStatus = (status: string) => {
    return localRepairs.filter(r => r.status === status)
  }

  const handleDragStart = (repairId: number) => {
    setDraggedItem(repairId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: string) => {
    if (!draggedItem) return

    // Update local state
    setLocalRepairs(prev =>
      prev.map(r =>
        r.id === draggedItem ? { ...r, status: newStatus } : r
      )
    )

    // Update on server
    try {
      await fetch(`/api/repairs/${draggedItem}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Failed to update status:', error)
      // Revert on error
      setLocalRepairs(repairs)
    }

    setDraggedItem(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <div className={`${column.color} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
            <h3 className="font-semibold text-gray-900">
              {column.title} ({getRepairsByStatus(column.id).length})
            </h3>
          </div>
          <div className="bg-gray-50 rounded-b-lg p-2 min-h-[500px] space-y-2">
            {getRepairsByStatus(column.id).map(repair => (
              <RepairCard
                key={repair.id}
                repair={repair}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RepairCard({ 
  repair, 
  onDragStart 
}: { 
  repair: Repair
  onDragStart: (id: number) => void
}) {
  const priorityColors = {
    normal: 'bg-gray-100 text-gray-800',
    urgent: 'bg-orange-100 text-orange-800',
    express: 'bg-red-100 text-red-800'
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(repair.id)}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{repair.orderNumber}</p>
          <p className="text-sm text-gray-600">
            {repair.deviceModel.brand.name} {repair.deviceModel.name}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[repair.priority as keyof typeof priorityColors]}`}>
          {repair.priority}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span>{repair.customer.firstName} {repair.customer.lastName}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>{formatCurrency(repair.totalPrice)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{formatDate(repair.createdAt)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {repair.repairOrderItems.length} repair{repair.repairOrderItems.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
