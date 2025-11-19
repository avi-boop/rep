// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { PricingPageClient } from '@/components/pricing/PricingPageClient'

async function getPricingData() {
  const [brands, repairTypes, partTypes, pricing] = await Promise.all([
    prisma.brand.findMany({
      where: { isPrimary: true },
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
    prisma.pricing.findMany({
      include: {
        deviceModel: {
          include: { brand: true }
        },
        repairType: true,
        partType: true
      }
    })
  ])

  return { brands, repairTypes, partTypes, pricing }
}

export default async function PricingPage() {
  const data = await getPricingData()

  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
            <p className="text-gray-600 mt-1">Loading pricing data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <PricingPageClient
        brands={data.brands}
        repairTypes={data.repairTypes}
        partTypes={data.partTypes}
        pricing={data.pricing}
      />
    </Suspense>
  )
}
