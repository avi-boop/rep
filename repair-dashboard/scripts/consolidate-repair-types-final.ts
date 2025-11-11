/**
 * Final Repair Type Consolidation Script
 *
 * This script:
 * 1. Merges "Back Camera" → "Camera - Rear"
 * 2. Merges "Front" → "Front Screen"
 * 3. Merges "Back" → "Back Panel"
 * 4. Deletes "Others" repair type (moves to Front Screen as default)
 * 5. Reorders repair types by priority
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting final repair type consolidation...\n')

  // Get all repair types
  const repairTypes = await prisma.repairType.findMany()
  console.log('Current repair types:', repairTypes.map(rt => `${rt.id}: ${rt.name}`).join(', '))

  let totalUpdated = 0

  // 1. Merge "Back Camera" (id 7) → "Camera - Rear" (id 4)
  const backCamera = repairTypes.find(rt => rt.name === 'Back Camera')
  const cameraRear = repairTypes.find(rt => rt.name === 'Camera - Rear')

  if (backCamera && cameraRear) {
    console.log(`\n📸 Merging "${backCamera.name}" → "${cameraRear.name}"`)
    const updated = await prisma.pricing.updateMany({
      where: { repairTypeId: backCamera.id },
      data: { repairTypeId: cameraRear.id }
    })
    console.log(`   ✓ Updated ${updated.count} pricing records`)
    totalUpdated += updated.count

    await prisma.repairType.delete({ where: { id: backCamera.id } })
    console.log(`   ✓ Deleted "${backCamera.name}" repair type`)
  }

  // 2. Merge "Front" (id 9) → "Front Screen" (id 1)
  const front = repairTypes.find(rt => rt.name === 'Front')
  const frontScreen = repairTypes.find(rt => rt.name === 'Front Screen')

  if (front && frontScreen) {
    console.log(`\n📱 Merging "${front.name}" → "${frontScreen.name}"`)
    const updated = await prisma.pricing.updateMany({
      where: { repairTypeId: front.id },
      data: { repairTypeId: frontScreen.id }
    })
    console.log(`   ✓ Updated ${updated.count} pricing records`)
    totalUpdated += updated.count

    await prisma.repairType.delete({ where: { id: front.id } })
    console.log(`   ✓ Deleted "${front.name}" repair type`)
  }

  // 3. Merge "Back" (id 8) → "Back Panel" (id 2)
  const back = repairTypes.find(rt => rt.name === 'Back')
  const backPanel = repairTypes.find(rt => rt.name === 'Back Panel')

  if (back && backPanel) {
    console.log(`\n🔧 Merging "${back.name}" → "${backPanel.name}"`)
    const updated = await prisma.pricing.updateMany({
      where: { repairTypeId: back.id },
      data: { repairTypeId: backPanel.id }
    })
    console.log(`   ✓ Updated ${updated.count} pricing records`)
    totalUpdated += updated.count

    await prisma.repairType.delete({ where: { id: back.id } })
    console.log(`   ✓ Deleted "${back.name}" repair type`)
  }

  // 4. Remove "Others" (id 6) - delete pricing records as they're too generic
  const others = repairTypes.find(rt => rt.name === 'Others')

  if (others) {
    console.log(`\n🗑️  Removing "${others.name}" repair type and its pricing records`)

    // Delete all pricing records for "Others" since they're too generic to migrate
    const deleted = await prisma.pricing.deleteMany({
      where: { repairTypeId: others.id }
    })
    console.log(`   ✓ Deleted ${deleted.count} pricing records`)

    await prisma.repairType.delete({ where: { id: others.id } })
    console.log(`   ✓ Deleted "${others.name}" repair type`)
  }

  // 5. Update display order for remaining types (most popular first)
  const displayOrders = [
    { name: 'Front Screen', order: 1 },
    { name: 'Back Panel', order: 2 },
    { name: 'Battery', order: 3 },
    { name: 'Camera - Rear', order: 4 },
    { name: 'Charging Port', order: 5 }
  ]

  console.log('\n📊 Setting display order by popularity...')
  for (const { name, order } of displayOrders) {
    await prisma.repairType.updateMany({
      where: { name },
      data: { displayOrder: order }
    })
    console.log(`   ✓ ${name}: position ${order}`)
  }

  // Show final state
  console.log('\n✅ Final repair types:')
  const finalTypes = await prisma.repairType.findMany({
    orderBy: { displayOrder: 'asc' }
  })
  finalTypes.forEach(rt => {
    console.log(`   ${rt.displayOrder}. ${rt.name} (${rt.category})`)
  })

  console.log(`\n📈 Total pricing records updated: ${totalUpdated}`)
  console.log('✨ Consolidation complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
