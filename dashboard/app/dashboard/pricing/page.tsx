// Force dynamic rendering for database access
export const dynamic = 'force-dynamic'

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
    <PricingPageClient
      brands={data.brands}
      repairTypes={data.repairTypes}
      partTypes={data.partTypes}
      pricing={data.pricing}
    />
  )
}
