import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create Brands
  console.log('Creating brands...')
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'Apple' },
      update: {},
      create: { name: 'Apple', isPrimary: true },
    }),
    prisma.brand.upsert({
      where: { name: 'Samsung' },
      update: {},
      create: { name: 'Samsung', isPrimary: true },
    }),
    prisma.brand.upsert({
      where: { name: 'Google' },
      update: {},
      create: { name: 'Google', isPrimary: false },
    }),
    prisma.brand.upsert({
      where: { name: 'OnePlus' },
      update: {},
      create: { name: 'OnePlus', isPrimary: false },
    }),
  ])
  
  console.log(`✓ Created ${brands.length} brands`)

  // Create Device Models
  console.log('Creating device models...')
  const appleBrand = brands.find(b => b.name === 'Apple')!
  const samsungBrand = brands.find(b => b.name === 'Samsung')!

  const deviceModels = await Promise.all([
    // iPhone models
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 15 Pro Max' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 15 Pro Max',
        modelNumber: 'A2849',
        releaseYear: 2023,
        deviceType: 'phone',
        screenSize: 6.7,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 15 Pro' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 15 Pro',
        modelNumber: 'A2848',
        releaseYear: 2023,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 15' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 15',
        modelNumber: 'A2846',
        releaseYear: 2023,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 14 Pro Max' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 14 Pro Max',
        modelNumber: 'A2651',
        releaseYear: 2022,
        deviceType: 'phone',
        screenSize: 6.7,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 14' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 14',
        modelNumber: 'A2649',
        releaseYear: 2022,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 13' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 13',
        modelNumber: 'A2482',
        releaseYear: 2021,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 12' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 12',
        modelNumber: 'A2172',
        releaseYear: 2020,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
    // Samsung models
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: samsungBrand.id, name: 'Galaxy S24 Ultra' } },
      update: {},
      create: {
        brandId: samsungBrand.id,
        name: 'Galaxy S24 Ultra',
        modelNumber: 'SM-S928',
        releaseYear: 2024,
        deviceType: 'phone',
        screenSize: 6.8,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: samsungBrand.id, name: 'Galaxy S23' } },
      update: {},
      create: {
        brandId: samsungBrand.id,
        name: 'Galaxy S23',
        modelNumber: 'SM-S911',
        releaseYear: 2023,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
    prisma.deviceModel.upsert({
      where: { brandId_name: { brandId: samsungBrand.id, name: 'Galaxy S22' } },
      update: {},
      create: {
        brandId: samsungBrand.id,
        name: 'Galaxy S22',
        modelNumber: 'SM-S901',
        releaseYear: 2022,
        deviceType: 'phone',
        screenSize: 6.1,
      },
    }),
  ])
  
  console.log(`✓ Created ${deviceModels.length} device models`)

  // Create Repair Types
  console.log('Creating repair types...')
  const repairTypes = await Promise.all([
    prisma.repairType.upsert({
      where: { name: 'Front Screen' },
      update: {},
      create: {
        name: 'Front Screen',
        category: 'screen',
        estimatedDuration: 45,
      },
    }),
    prisma.repairType.upsert({
      where: { name: 'Back Panel' },
      update: {},
      create: {
        name: 'Back Panel',
        category: 'body',
        estimatedDuration: 30,
      },
    }),
    prisma.repairType.upsert({
      where: { name: 'Battery' },
      update: {},
      create: {
        name: 'Battery',
        category: 'battery',
        estimatedDuration: 30,
      },
    }),
    prisma.repairType.upsert({
      where: { name: 'Charging Port' },
      update: {},
      create: {
        name: 'Charging Port',
        category: 'port',
        estimatedDuration: 60,
      },
    }),
    prisma.repairType.upsert({
      where: { name: 'Camera - Rear' },
      update: {},
      create: {
        name: 'Camera - Rear',
        category: 'camera',
        estimatedDuration: 40,
      },
    }),
  ])
  
  console.log(`✓ Created ${repairTypes.length} repair types`)

  // Create Part Types
  console.log('Creating part types...')
  const partTypes = await Promise.all([
    prisma.partType.upsert({
      where: { name: 'Original (OEM)' },
      update: {},
      create: {
        name: 'Original (OEM)',
        qualityLevel: 5,
        warrantyMonths: 12,
        description: 'Original equipment manufacturer parts',
      },
    }),
    prisma.partType.upsert({
      where: { name: 'Aftermarket Premium' },
      update: {},
      create: {
        name: 'Aftermarket Premium',
        qualityLevel: 4,
        warrantyMonths: 6,
        description: 'High-quality aftermarket parts',
      },
    }),
    prisma.partType.upsert({
      where: { name: 'Aftermarket Standard' },
      update: {},
      create: {
        name: 'Aftermarket Standard',
        qualityLevel: 3,
        warrantyMonths: 3,
        description: 'Standard aftermarket parts',
      },
    }),
  ])
  
  console.log(`✓ Created ${partTypes.length} part types`)

  // Create Sample Pricing
  console.log('Creating sample pricing...')
  const iphone15Pro = deviceModels.find(d => d.name === 'iPhone 15 Pro')!
  const iphone14 = deviceModels.find(d => d.name === 'iPhone 14')!
  const screenRepair = repairTypes.find(r => r.name === 'Front Screen')!
  const batteryRepair = repairTypes.find(r => r.name === 'Battery')!
  const oemParts = partTypes.find(p => p.name === 'Original (OEM)')!
  const premiumParts = partTypes.find(p => p.name === 'Aftermarket Premium')!

  await Promise.all([
    prisma.pricing.upsert({
      where: {
        deviceModelId_repairTypeId_partTypeId: {
          deviceModelId: iphone15Pro.id,
          repairTypeId: screenRepair.id,
          partTypeId: oemParts.id,
        },
      },
      update: {},
      create: {
        deviceModelId: iphone15Pro.id,
        repairTypeId: screenRepair.id,
        partTypeId: oemParts.id,
        price: 349.99,
        cost: 180.00,
        isEstimated: false,
      },
    }),
    prisma.pricing.upsert({
      where: {
        deviceModelId_repairTypeId_partTypeId: {
          deviceModelId: iphone14.id,
          repairTypeId: screenRepair.id,
          partTypeId: oemParts.id,
        },
      },
      update: {},
      create: {
        deviceModelId: iphone14.id,
        repairTypeId: screenRepair.id,
        partTypeId: oemParts.id,
        price: 279.99,
        cost: 150.00,
        isEstimated: false,
      },
    }),
    prisma.pricing.upsert({
      where: {
        deviceModelId_repairTypeId_partTypeId: {
          deviceModelId: iphone15Pro.id,
          repairTypeId: batteryRepair.id,
          partTypeId: premiumParts.id,
        },
      },
      update: {},
      create: {
        deviceModelId: iphone15Pro.id,
        repairTypeId: batteryRepair.id,
        partTypeId: premiumParts.id,
        price: 99.99,
        cost: 35.00,
        isEstimated: false,
      },
    }),
  ])
  
  console.log('✓ Created sample pricing')

  // Create Sample Customer
  console.log('Creating sample customer...')
  const customer = await prisma.customer.upsert({
    where: { phone: '555-0100' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0100',
    },
  })
  
  console.log('✓ Created sample customer')

  console.log('✅ Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
