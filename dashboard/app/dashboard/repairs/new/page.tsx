// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NewRepairForm } from '@/components/repairs/NewRepairForm'

async function getFormData() {
  const [brands, repairTypes, partTypes, customers] = await Promise.all([
    prisma.brand.findMany({
      where: { isPrimary: true },
      include: {
        deviceModels: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.repairType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    }),
    prisma.partType.findMany({
      where: { isActive: true },
      orderBy: { qualityLevel: 'desc' }
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  ])

  return { brands, repairTypes, partTypes, customers }
}

export default async function NewRepairPage() {
  const data = await getFormData()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Repair Order</h1>
        <p className="text-gray-600 mt-1">Enter repair details and select services</p>
      </div>

      <NewRepairForm {...data} />
    </div>
  )
}
