#!/usr/bin/env tsx

/**
 * Seed Device Catalog
 *
 * Adds comprehensive device models to the database
 * Run: npx tsx scripts/seed-devices.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const devices = [
  // ============ APPLE IPHONE ============

  // iPhone 15 Series (already exist - skip)

  // iPhone 14 Series
  { brandName: 'Apple', name: 'iPhone 14 Plus', modelNumber: 'A2632', releaseYear: 2022, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 14 Pro', modelNumber: 'A2650', releaseYear: 2022, screenSize: 6.1, deviceType: 'phone' },

  // iPhone 13 Series
  { brandName: 'Apple', name: 'iPhone 13 mini', modelNumber: 'A2481', releaseYear: 2021, screenSize: 5.4, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 13 Pro', modelNumber: 'A2483', releaseYear: 2021, screenSize: 6.1, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 13 Pro Max', modelNumber: 'A2484', releaseYear: 2021, screenSize: 6.7, deviceType: 'phone' },

  // iPhone 12 Series
  { brandName: 'Apple', name: 'iPhone 12 mini', modelNumber: 'A2176', releaseYear: 2020, screenSize: 5.4, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 12 Pro', modelNumber: 'A2341', releaseYear: 2020, screenSize: 6.1, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 12 Pro Max', modelNumber: 'A2342', releaseYear: 2020, screenSize: 6.7, deviceType: 'phone' },

  // iPhone 11 Series
  { brandName: 'Apple', name: 'iPhone 11', modelNumber: 'A2111', releaseYear: 2019, screenSize: 6.1, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 11 Pro', modelNumber: 'A2160', releaseYear: 2019, screenSize: 5.8, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone 11 Pro Max', modelNumber: 'A2161', releaseYear: 2019, screenSize: 6.5, deviceType: 'phone' },

  // iPhone SE & Older
  { brandName: 'Apple', name: 'iPhone SE (2022)', modelNumber: 'A2595', releaseYear: 2022, screenSize: 4.7, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone SE (2020)', modelNumber: 'A2275', releaseYear: 2020, screenSize: 4.7, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone XR', modelNumber: 'A1984', releaseYear: 2018, screenSize: 6.1, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone XS', modelNumber: 'A1920', releaseYear: 2018, screenSize: 5.8, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone XS Max', modelNumber: 'A1921', releaseYear: 2018, screenSize: 6.5, deviceType: 'phone' },
  { brandName: 'Apple', name: 'iPhone X', modelNumber: 'A1865', releaseYear: 2017, screenSize: 5.8, deviceType: 'phone' },

  // ============ SAMSUNG GALAXY S SERIES ============

  // Galaxy S24 Series
  { brandName: 'Samsung', name: 'Galaxy S24', modelNumber: 'SM-S921', releaseYear: 2024, screenSize: 6.2, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S24+', modelNumber: 'SM-S926', releaseYear: 2024, screenSize: 6.7, deviceType: 'phone' },

  // Galaxy S23 Series (already exists S23)
  { brandName: 'Samsung', name: 'Galaxy S23+', modelNumber: 'SM-S916', releaseYear: 2023, screenSize: 6.6, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S23 Ultra', modelNumber: 'SM-S918', releaseYear: 2023, screenSize: 6.8, deviceType: 'phone' },

  // Galaxy S22 Series (already exists S22)
  { brandName: 'Samsung', name: 'Galaxy S22+', modelNumber: 'SM-S906', releaseYear: 2022, screenSize: 6.6, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S22 Ultra', modelNumber: 'SM-S908', releaseYear: 2022, screenSize: 6.8, deviceType: 'phone' },

  // Galaxy S21 Series
  { brandName: 'Samsung', name: 'Galaxy S21', modelNumber: 'SM-G991', releaseYear: 2021, screenSize: 6.2, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S21+', modelNumber: 'SM-G996', releaseYear: 2021, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S21 Ultra', modelNumber: 'SM-G998', releaseYear: 2021, screenSize: 6.8, deviceType: 'phone' },

  // Galaxy S20 Series
  { brandName: 'Samsung', name: 'Galaxy S20', modelNumber: 'SM-G981', releaseYear: 2020, screenSize: 6.2, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S20+', modelNumber: 'SM-G986', releaseYear: 2020, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy S20 Ultra', modelNumber: 'SM-G988', releaseYear: 2020, screenSize: 6.9, deviceType: 'phone' },

  // ============ SAMSUNG GALAXY A SERIES ============
  { brandName: 'Samsung', name: 'Galaxy A54 5G', modelNumber: 'SM-A546', releaseYear: 2023, screenSize: 6.4, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy A34 5G', modelNumber: 'SM-A346', releaseYear: 2023, screenSize: 6.6, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy A24', modelNumber: 'SM-A245', releaseYear: 2023, screenSize: 6.5, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy A14 5G', modelNumber: 'SM-A146', releaseYear: 2023, screenSize: 6.6, deviceType: 'phone' },

  // ============ SAMSUNG GALAXY Z SERIES (Foldables) ============
  { brandName: 'Samsung', name: 'Galaxy Z Flip 5', modelNumber: 'SM-F731', releaseYear: 2023, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy Z Flip 4', modelNumber: 'SM-F721', releaseYear: 2022, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy Z Fold 5', modelNumber: 'SM-F946', releaseYear: 2023, screenSize: 7.6, deviceType: 'phone' },
  { brandName: 'Samsung', name: 'Galaxy Z Fold 4', modelNumber: 'SM-F936', releaseYear: 2022, screenSize: 7.6, deviceType: 'phone' },

  // ============ GOOGLE PIXEL ============
  { brandName: 'Google', name: 'Pixel 8 Pro', modelNumber: 'GC3VE', releaseYear: 2023, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 8', modelNumber: 'GKV4X', releaseYear: 2023, screenSize: 6.2, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 7 Pro', modelNumber: 'GP4BC', releaseYear: 2022, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 7', modelNumber: 'GVU6C', releaseYear: 2022, screenSize: 6.3, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 6 Pro', modelNumber: 'GF5KQ', releaseYear: 2021, screenSize: 6.7, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 6', modelNumber: 'GB7N6', releaseYear: 2021, screenSize: 6.4, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 7a', modelNumber: 'G0DZQ', releaseYear: 2023, screenSize: 6.1, deviceType: 'phone' },
  { brandName: 'Google', name: 'Pixel 6a', modelNumber: 'GB62Z', releaseYear: 2022, screenSize: 6.1, deviceType: 'phone' },

  // ============ APPLE IPAD ============
  { brandName: 'Apple', name: 'iPad Pro 12.9" (6th gen)', modelNumber: 'A2436', releaseYear: 2022, screenSize: 12.9, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad Pro 12.9" (5th gen)', modelNumber: 'A2378', releaseYear: 2021, screenSize: 12.9, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad Pro 11" (4th gen)', modelNumber: 'A2759', releaseYear: 2022, screenSize: 11, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad Pro 11" (3rd gen)', modelNumber: 'A2377', releaseYear: 2021, screenSize: 11, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad Air (5th gen)', modelNumber: 'A2588', releaseYear: 2022, screenSize: 10.9, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad Air (4th gen)', modelNumber: 'A2316', releaseYear: 2020, screenSize: 10.9, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad (10th gen)', modelNumber: 'A2696', releaseYear: 2022, screenSize: 10.9, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad (9th gen)', modelNumber: 'A2602', releaseYear: 2021, screenSize: 10.2, deviceType: 'tablet' },
  { brandName: 'Apple', name: 'iPad mini (6th gen)', modelNumber: 'A2567', releaseYear: 2021, screenSize: 8.3, deviceType: 'tablet' },
]

async function main() {
  console.log('🌱 Seeding device catalog...\n')

  // Ensure brands exist
  const brandNames = ['Apple', 'Samsung', 'Google']
  const brands = new Map()

  for (const brandName of brandNames) {
    let brand = await prisma.brand.findFirst({ where: { name: brandName } })
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: brandName, isPrimary: true }
      })
      console.log(`✅ Created brand: ${brandName}`)
    }
    brands.set(brandName, brand)
  }

  console.log('')

  // Add devices
  let added = 0
  let skipped = 0

  for (const device of devices) {
    const brand = brands.get(device.brandName)
    if (!brand) continue

    // Check if device already exists
    const existing = await prisma.deviceModel.findFirst({
      where: {
        name: device.name,
        brandId: brand.id
      }
    })

    if (existing) {
      console.log(`⏭️  Skipped: ${device.brandName} ${device.name} (already exists)`)
      skipped++
      continue
    }

    // Create device
    await prisma.deviceModel.create({
      data: {
        brandId: brand.id,
        name: device.name,
        modelNumber: device.modelNumber,
        releaseYear: device.releaseYear,
        deviceType: device.deviceType,
        screenSize: device.screenSize,
        isActive: true
      }
    })

    console.log(`✅ Added: ${device.brandName} ${device.name}`)
    added++
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Added: ${added} devices`)
  console.log(`   ⏭️  Skipped: ${skipped} devices (already exist)`)
  console.log(`   📱 Total devices defined: ${devices.length}`)

  // Count total in database
  const total = await prisma.deviceModel.count()
  console.log(`   💾 Total in database: ${total} devices`)

  console.log('\n✨ Device catalog seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding devices:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
