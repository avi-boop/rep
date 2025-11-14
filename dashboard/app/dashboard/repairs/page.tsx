import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { RepairStatusBoard } from '@/components/repairs/RepairStatusBoard'
import Link from 'next/link'
import { Plus, Filter } from 'lucide-react'

async function getRepairs() {
  return prisma.repairOrder.findMany({
    where: {
      status: {
        notIn: ['completed', 'cancelled', 'delivered']
      }
    },
    include: {
      customer: true,
      deviceModel: {
        include: {
          brand: true
        }
      },
      repairOrderItems: {
        include: {
          repairType: true,
          partType: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export default async function RepairsPage() {
  const repairs = await getRepairs()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Repair Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage all repair orders with drag & drop</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 smooth-transition font-medium shadow-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <Link
            href="/dashboard/repairs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg smooth-transition font-semibold shadow-md hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Repair
          </Link>
        </div>
      </div>

      <RepairStatusBoard repairs={repairs} />
    </div>
  )
}
