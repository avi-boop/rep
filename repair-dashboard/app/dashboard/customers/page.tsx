import { prisma } from '@/lib/prisma'
import { CustomerList } from '@/components/customers/CustomerList'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getCustomers() {
  return prisma.customer.findMany({
    include: {
      _count: {
        select: { repairOrders: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer information and history</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </Link>
      </div>

      <CustomerList customers={customers} />
    </div>
  )
}
