'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clock, DollarSign, User, Package, Zap, AlertCircle } from 'lucide-react'

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
  {
    id: 'pending',
    title: 'New',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-50',
    icon: AlertCircle
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    icon: Zap
  },
  {
    id: 'waiting_parts',
    title: 'Waiting Parts',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: Package
  },
  {
    id: 'ready_pickup',
    title: 'Ready',
    color: 'from-success-500 to-success-600',
    bgColor: 'bg-success-50',
    icon: Clock
  },
]

export function RepairStatusBoard({ repairs }: Props) {
  const [localRepairs, setLocalRepairs] = useState(repairs)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const getRepairsByStatus = (status: string) => {
    return localRepairs.filter(r => r.status === status)
  }

  const handleDragStart = (repairId: number) => {
    setDraggedItem(repairId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
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
    setDragOverColumn(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
      {STATUS_COLUMNS.map(column => {
        const Icon = column.icon
        const repairCount = getRepairsByStatus(column.id).length
        const isDropZone = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 animate-slide-in"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className={`bg-gradient-to-r ${column.color} rounded-t-2xl px-4 py-4 shadow-lg`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-bold text-lg">
                    {column.title}
                  </h3>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-sm font-bold">{repairCount}</span>
                </div>
              </div>
            </div>

            {/* Cards Container */}
            <div
              className={`
                ${column.bgColor} rounded-b-2xl p-3 min-h-[500px] space-y-3 shadow-lg
                ${isDropZone ? 'ring-4 ring-primary-500 ring-opacity-50' : ''}
                smooth-transition
              `}
            >
              {repairCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Icon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No repairs</p>
                </div>
              ) : (
                getRepairsByStatus(column.id).map(repair => (
                  <RepairCard
                    key={repair.id}
                    repair={repair}
                    onDragStart={handleDragStart}
                    isDragging={draggedItem === repair.id}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RepairCard({
  repair,
  onDragStart,
  isDragging
}: {
  repair: Repair
  onDragStart: (id: number) => void
  isDragging: boolean
}) {
  const priorityConfig = {
    normal: {
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: '●'
    },
    urgent: {
      bg: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: '▲'
    },
    express: {
      bg: 'bg-red-100 text-red-700 border-red-200',
      icon: '⚡'
    }
  }

  const priority = priorityConfig[repair.priority as keyof typeof priorityConfig] || priorityConfig.normal

  return (
    <div
      draggable
      onDragStart={() => onDragStart(repair.id)}
      className={`
        bg-white rounded-xl border-2 border-gray-200 p-4 cursor-move
        hover:shadow-xl hover:border-primary-300 hover:scale-105
        smooth-transition group
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900 text-lg">{repair.orderNumber}</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {repair.deviceModel.brand.name} {repair.deviceModel.name}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${priority.bg}`}>
          {priority.icon} {repair.priority}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium">{repair.customer.firstName} {repair.customer.lastName}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-success-600" />
          </div>
          <span className="font-bold text-success-700">{formatCurrency(repair.totalPrice)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-xs">{formatDate(repair.createdAt)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t-2 border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            {repair.repairOrderItems.length} repair{repair.repairOrderItems.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
