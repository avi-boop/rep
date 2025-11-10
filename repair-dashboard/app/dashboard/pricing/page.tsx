import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600 mt-1">Manage repair pricing and view smart estimates</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Import CSV
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Pricing
          </button>
        </div>
      </div>

      <PricingMatrix 
        brands={data.brands}
        repairTypes={data.repairTypes}
        partTypes={data.partTypes}
        pricing={data.pricing}
      />
    </div>
  )
}
