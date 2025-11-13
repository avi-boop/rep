/**
 * Consolidate duplicate repair types
 * - Merge "Back Camera" → "Camera - Rear"
 * - Merge "Front" → "Front Screen"
 * - Merge "Back" → "Back Panel"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting repair type consolidation...\n')

  // 1. Consolidate "Back Camera" → "Camera - Rear"
  const backCamera = await prisma.repairType.findFirst({ where: { name: 'Back Camera' } })
  const cameraRear = await prisma.repairType.findFirst({ where: { name: 'Camera - Rear' } })

  if (backCamera && cameraRear) {
    console.log(`📸 Merging "Back Camera" (ID ${backCamera.id}) → "Camera - Rear" (ID ${cameraRear.id})`)

    // Update all pricing records
    const updated1 = await prisma.pricing.updateMany({
      where: { repairTypeId: backCamera.id },
      data: { repairTypeId: cameraRear.id }
    })
    console.log(`   ✓ Updated ${updated1.count} pricing records`)

    // Update all repair order items
    const updated2 = await prisma.repairOrderItem.updateMany({
      where: { repairTypeId: backCamera.id },
      data: { repairTypeId: cameraRear.id }
    })
    console.log(`   ✓ Updated ${updated2.count} repair order items`)

    // Delete the duplicate
    await prisma.repairType.delete({ where: { id: backCamera.id } })
    console.log(`   ✓ Deleted "Back Camera" repair type\n`)
  } else {
    console.log('⚠️  "Back Camera" or "Camera - Rear" not found, skipping...\n')
  }

  // 2. Consolidate "Front" → "Front Screen"
  const front = await prisma.repairType.findFirst({ where: { name: 'Front' } })
  const frontScreen = await prisma.repairType.findFirst({ where: { name: 'Front Screen' } })

  if (front && frontScreen) {
    console.log(`📱 Merging "Front" (ID ${front.id}) → "Front Screen" (ID ${frontScreen.id})`)

    const updated1 = await prisma.pricing.updateMany({
      where: { repairTypeId: front.id },
      data: { repairTypeId: frontScreen.id }
    })
    console.log(`   ✓ Updated ${updated1.count} pricing records`)

    const updated2 = await prisma.repairOrderItem.updateMany({
      where: { repairTypeId: front.id },
      data: { repairTypeId: frontScreen.id }
    })
    console.log(`   ✓ Updated ${updated2.count} repair order items`)

    await prisma.repairType.delete({ where: { id: front.id } })
    console.log(`   ✓ Deleted "Front" repair type\n`)
  } else {
    console.log('⚠️  "Front" or "Front Screen" not found, skipping...\n')
  }

  // 3. Consolidate "Back" → "Back Panel"
  const back = await prisma.repairType.findFirst({ where: { name: 'Back' } })
  const backPanel = await prisma.repairType.findFirst({ where: { name: 'Back Panel' } })

  if (back && backPanel) {
    console.log(`🔲 Merging "Back" (ID ${back.id}) → "Back Panel" (ID ${backPanel.id})`)

    const updated1 = await prisma.pricing.updateMany({
      where: { repairTypeId: back.id },
      data: { repairTypeId: backPanel.id }
    })
    console.log(`   ✓ Updated ${updated1.count} pricing records`)

    const updated2 = await prisma.repairOrderItem.updateMany({
      where: { repairTypeId: back.id },
      data: { repairTypeId: backPanel.id }
    })
    console.log(`   ✓ Updated ${updated2.count} repair order items`)

    await prisma.repairType.delete({ where: { id: back.id } })
    console.log(`   ✓ Deleted "Back" repair type\n`)
  } else {
    console.log('⚠️  "Back" or "Back Panel" not found, skipping...\n')
  }

  // Show final repair types
  const finalRepairTypes = await prisma.repairType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  console.log('✅ Consolidation complete!\n')
  console.log('📋 Final repair types:')
  finalRepairTypes.forEach(rt => {
    console.log(`   - ${rt.name}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
