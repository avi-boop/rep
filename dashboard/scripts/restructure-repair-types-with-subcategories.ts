/**
 * Restructure Repair Types with Subcategories
 *
 * Main categories: Front Screen, Back Panel, Battery, Other
 * Subcategories under "Other": Camera, Speaker, Charging Port, etc.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Restructuring repair types with subcategories...\n')

  // Define the new structure
  const mainCategories = [
    { name: 'Front Screen', displayOrder: 1, category: 'Display' },
    { name: 'Back Panel', displayOrder: 2, category: 'Body' },
    { name: 'Battery', displayOrder: 3, category: 'Power' },
    { name: 'Other', displayOrder: 4, category: 'Miscellaneous' }
  ]

  const subcategories = [
    { name: 'Camera - Rear', subcategory: 'Camera', category: 'Camera' },
    { name: 'Camera - Front', subcategory: 'Camera', category: 'Camera' },
    { name: 'Camera Lens - Rear', subcategory: 'Camera', category: 'Camera' },
    { name: 'Camera Lens - Front', subcategory: 'Camera', category: 'Camera' },
    { name: 'Top Speaker', subcategory: 'Audio', category: 'Audio' },
    { name: 'Bottom Speaker', subcategory: 'Audio', category: 'Audio' },
    { name: 'Earpiece', subcategory: 'Audio', category: 'Audio' },
    { name: 'Microphone', subcategory: 'Audio', category: 'Audio' },
    { name: 'Charging Port', subcategory: 'Port', category: 'Port' },
    { name: 'Headphone Jack', subcategory: 'Port', category: 'Port' },
    { name: 'SIM Tray', subcategory: 'Port', category: 'Port' },
    { name: 'Power Button', subcategory: 'Button', category: 'Button' },
    { name: 'Volume Button', subcategory: 'Button', category: 'Button' },
    { name: 'Home Button', subcategory: 'Button', category: 'Button' },
    { name: 'Water Damage', subcategory: 'Repair', category: 'Repair' },
    { name: 'Logic Board', subcategory: 'Repair', category: 'Repair' }
  ]

  // Step 1: Update existing main categories
  console.log('📋 Step 1: Updating main categories...')
  for (const cat of mainCategories) {
    await prisma.repairType.upsert({
      where: { name: cat.name },
      create: {
        ...cat,
        isMainCategory: true,
        isActive: true
      },
      update: {
        displayOrder: cat.displayOrder,
        category: cat.category,
        isMainCategory: true,
        isActive: true
      }
    })
    console.log(`   ✓ ${cat.name}`)
  }

  // Step 2: Get or create "Other" category
  const otherCategory = await prisma.repairType.findUnique({
    where: { name: 'Other' }
  })

  if (!otherCategory) {
    console.log('\n❌ Error: "Other" category not found')
    return
  }

  // Step 3: Migrate existing "Camera - Rear" and "Charging Port" pricing to "Other"
  console.log('\n📋 Step 2: Migrating existing repair types to "Other"...')

  const cameraRear = await prisma.repairType.findUnique({ where: { name: 'Camera - Rear' } })
  const chargingPort = await prisma.repairType.findUnique({ where: { name: 'Charging Port' } })

  if (cameraRear) {
    console.log(`   Migrating ${cameraRear.name} pricing to Other...`)
    const updated = await prisma.pricing.updateMany({
      where: { repairTypeId: cameraRear.id },
      data: { repairTypeId: otherCategory.id }
    })
    console.log(`   ✓ Migrated ${updated.count} pricing records`)

    await prisma.repairType.delete({ where: { id: cameraRear.id } })
    console.log(`   ✓ Deleted "${cameraRear.name}" repair type`)
  }

  if (chargingPort) {
    console.log(`   Migrating ${chargingPort.name} pricing to Other...`)
    const updated = await prisma.pricing.updateMany({
      where: { repairTypeId: chargingPort.id },
      data: { repairTypeId: otherCategory.id }
    })
    console.log(`   ✓ Migrated ${updated.count} pricing records`)

    await prisma.repairType.delete({ where: { id: chargingPort.id } })
    console.log(`   ✓ Deleted "${chargingPort.name}" repair type`)
  }

  // Step 4: Create all subcategories under "Other"
  console.log('\n📋 Step 3: Creating subcategory options...')
  let displayOrder = 10  // Start subcategories at 10

  for (const subcat of subcategories) {
    try {
      await prisma.repairType.upsert({
        where: { name: subcat.name },
        create: {
          ...subcat,
          displayOrder: displayOrder++,
          isMainCategory: false,
          isActive: true
        },
        update: {
          subcategory: subcat.subcategory,
          category: subcat.category,
          displayOrder: displayOrder++,
          isMainCategory: false,
          isActive: true
        }
      })
      console.log(`   ✓ ${subcat.name} (${subcat.subcategory})`)
    } catch (error) {
      console.log(`   ⚠ ${subcat.name} already exists`)
    }
  }

  // Step 5: Show final structure
  console.log('\n✅ Final Repair Type Structure:')

  const allTypes = await prisma.repairType.findMany({
    orderBy: { displayOrder: 'asc' }
  })

  console.log('\nMain Categories:')
  allTypes
    .filter(t => t.isMainCategory)
    .forEach(t => {
      console.log(`   ${t.displayOrder}. ${t.name} (${t.category})`)
    })

  console.log('\nSubcategories (under "Other"):')
  const subcatGroups = allTypes
    .filter(t => !t.isMainCategory)
    .reduce((acc, t) => {
      const group = t.subcategory || 'Ungrouped'
      if (!acc[group]) acc[group] = []
      acc[group].push(t)
      return acc
    }, {} as Record<string, any[]>)

  Object.entries(subcatGroups).forEach(([group, items]) => {
    console.log(`\n   ${group}:`)
    items.forEach(item => console.log(`      - ${item.name}`))
  })

  console.log('\n✨ Restructuring complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
