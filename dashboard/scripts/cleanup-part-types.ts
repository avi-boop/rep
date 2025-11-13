/**
 * Remove Aftermarket part types, keep only Standard and Original (OEM)
 * Make Standard the default
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up part types...\n')

  // Get all part types
  const allPartTypes = await prisma.partType.findMany()
  console.log('Current part types:')
  allPartTypes.forEach(pt => console.log(`  - ${pt.name} (ID: ${pt.id})`))
  console.log()

  // Find the part types to keep and remove
  const standardPT = await prisma.partType.findFirst({ where: { name: 'Standard' } })
  const originalPT = await prisma.partType.findFirst({ where: { name: 'Original (OEM)' } })
  const aftermarketPremium = await prisma.partType.findFirst({ where: { name: 'Aftermarket Premium' } })
  const aftermarketStandard = await prisma.partType.findFirst({ where: { name: 'Aftermarket Standard' } })

  if (!standardPT) {
    console.error('❌ Standard part type not found!')
    return
  }

  console.log(`✓ Keeping: Standard (ID: ${standardPT.id})`)
  if (originalPT) {
    console.log(`✓ Keeping: Original (OEM) (ID: ${originalPT.id})`)
  }
  console.log()

  // Migrate pricing from Aftermarket Premium to Standard
  if (aftermarketPremium) {
    console.log(`📦 Migrating "Aftermarket Premium" (ID ${aftermarketPremium.id}) → "Standard" (ID ${standardPT.id})`)

    const updated1 = await prisma.pricing.updateMany({
      where: { partTypeId: aftermarketPremium.id },
      data: { partTypeId: standardPT.id }
    })
    console.log(`   ✓ Updated ${updated1.count} pricing records`)

    const updated2 = await prisma.repairOrderItem.updateMany({
      where: { partTypeId: aftermarketPremium.id },
      data: { partTypeId: standardPT.id }
    })
    console.log(`   ✓ Updated ${updated2.count} repair order items`)

    await prisma.partType.delete({ where: { id: aftermarketPremium.id } })
    console.log(`   ✓ Deleted "Aftermarket Premium" part type\n`)
  }

  // Migrate pricing from Aftermarket Standard to Standard
  if (aftermarketStandard) {
    console.log(`📦 Migrating "Aftermarket Standard" (ID ${aftermarketStandard.id}) → "Standard" (ID ${standardPT.id})`)

    const updated1 = await prisma.pricing.updateMany({
      where: { partTypeId: aftermarketStandard.id },
      data: { partTypeId: standardPT.id }
    })
    console.log(`   ✓ Updated ${updated1.count} pricing records`)

    const updated2 = await prisma.repairOrderItem.updateMany({
      where: { partTypeId: aftermarketStandard.id },
      data: { partTypeId: standardPT.id }
    })
    console.log(`   ✓ Updated ${updated2.count} repair order items`)

    await prisma.partType.delete({ where: { id: aftermarketStandard.id } })
    console.log(`   ✓ Deleted "Aftermarket Standard" part type\n`)
  }

  // Show final part types
  const finalPartTypes = await prisma.partType.findMany({
    where: { isActive: true },
    orderBy: { qualityLevel: 'asc' }
  })

  console.log('✅ Cleanup complete!\n')
  console.log('📋 Final part types:')
  finalPartTypes.forEach(pt => {
    console.log(`   - ${pt.name} (Quality Level: ${pt.qualityLevel}, Warranty: ${pt.warrantyMonths} months)`)
  })

  // Count pricing records per part type
  console.log('\n📊 Pricing distribution:')
  for (const pt of finalPartTypes) {
    const count = await prisma.pricing.count({ where: { partTypeId: pt.id } })
    console.log(`   - ${pt.name}: ${count} pricing records`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
