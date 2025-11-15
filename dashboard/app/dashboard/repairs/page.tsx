// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { RepairStatusBoard } from '@/components/repairs/RepairStatusBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repair Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage all repair orders</p>
        </div>
        <Link
          href="/dashboard/repairs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Repair
        </Link>
      </div>

      <RepairStatusBoard repairs={repairs} />
    </div>
  )
}
