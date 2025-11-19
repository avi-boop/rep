import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // First, let's see all repair types
  const repairTypes = await prisma.repairType.findMany({
    orderBy: { name: 'asc' }
  })

  console.log('\n=== Current Repair Types ===')
  repairTypes.forEach((rt) => {
    console.log(`${rt.id}: ${rt.name} (${rt.category || 'No category'}) - Active: ${rt.isActive}`)
  })

  // Define duplicates to merge and items to remove
  const duplicatesToMerge = [
    { keep: 'Front Screen', remove: 'Front' },
    { keep: 'Back Panel', remove: 'Back' },
    { keep: 'Other', remove: 'Others' },
  ]

  const itemsToRemove = ['SIM Tray', 'SIM tray', 'Sim Tray']

  console.log('\n=== Cleanup Plan ===')
  console.log('Duplicates to merge:')
  duplicatesToMerge.forEach(({ keep, remove }) => {
    console.log(`  - Merge "${remove}" into "${keep}"`)
  })
  console.log('\nItems to deactivate:')
  itemsToRemove.forEach(item => {
    console.log(`  - ${item}`)
  })

  // Execute cleanup
  console.log('\n=== Executing Cleanup ===')

  // Deactivate items to remove
  for (const name of itemsToRemove) {
    const result = await prisma.repairType.updateMany({
      where: { name: { contains: name, mode: 'insensitive' } },
      data: { isActive: false }
    })
    if (result.count > 0) {
      console.log(`✓ Deactivated: ${name} (${result.count} records)`)
    }
  }

  // Merge duplicates
  for (const { keep, remove } of duplicatesToMerge) {
    const keepType = await prisma.repairType.findFirst({
      where: { name: keep }
    })

    const removeType = await prisma.repairType.findFirst({
      where: { name: remove }
    })

    if (keepType && removeType) {
      // Get all pricing for the "remove" type
      const removePricing = await prisma.pricing.findMany({
        where: { repairTypeId: removeType.id }
      })

      let deletedCount = 0
      let updatedCount = 0

      for (const pricing of removePricing) {
        // Check if there's already a pricing with the "keep" type for same model+part
        const existing = await prisma.pricing.findFirst({
          where: {
            deviceModelId: pricing.deviceModelId,
            repairTypeId: keepType.id,
            partTypeId: pricing.partTypeId
          }
        })

        if (existing) {
          // Conflict - delete the duplicate pricing
          await prisma.pricing.delete({
            where: { id: pricing.id }
          })
          deletedCount++
        } else {
          // No conflict - update to use the "keep" type
          await prisma.pricing.update({
            where: { id: pricing.id },
            data: { repairTypeId: keepType.id }
          })
          updatedCount++
        }
      }

      // Update all repair order items that reference the "remove" type
      const orderItemsUpdate = await prisma.repairOrderItem.updateMany({
        where: { repairTypeId: removeType.id },
        data: { repairTypeId: keepType.id }
      })

      // Deactivate the duplicate
      await prisma.repairType.update({
        where: { id: removeType.id },
        data: { isActive: false }
      })

      console.log(`✓ Merged "${remove}" into "${keep}"`)
      console.log(`  - Updated ${updatedCount} pricing records`)
      console.log(`  - Deleted ${deletedCount} conflicting pricing records`)
      console.log(`  - Updated ${orderItemsUpdate.count} order items`)
    } else {
      console.log(`⚠ Could not find both "${keep}" and "${remove}"`)
    }
  }

  // Show final state
  const finalTypes = await prisma.repairType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  console.log('\n=== Active Repair Types After Cleanup ===')
  finalTypes.forEach((rt) => {
    console.log(`${rt.id}: ${rt.name} (${rt.category || 'No category'})`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
