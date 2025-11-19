import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { RepairDetailsClient } from './RepairDetailsClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RepairDetailsPage({ params }: PageProps) {
  const { id } = await params
  const repairId = parseInt(id)

  if (isNaN(repairId)) {
    notFound()
  }

  const repair = await prisma.repairOrder.findUnique({
    where: { id: repairId },
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
    }
  })

  if (!repair) {
    notFound()
  }

  return <RepairDetailsClient repair={repair} />
}
