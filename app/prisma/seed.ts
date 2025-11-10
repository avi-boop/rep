import { PrismaClient, PartsQuality } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Create Brands
  console.log('Creating brands...')
  const apple = await prisma.brand.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Apple',
      isPrimary: true,
    },
  })

  const samsung = await prisma.brand.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Samsung',
      isPrimary: true,
    },
  })

  const google = await prisma.brand.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Google',
      isPrimary: false,
    },
  })

  const oneplus = await prisma.brand.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'OnePlus',
      isPrimary: false,
    },
  })

  // 2. Create iPhone Models
  console.log('Creating iPhone models...')
  const iPhoneModels = [
    { name: 'iPhone 15', variant: 'Pro Max', year: 2023, month: 9, tier: 1 },
    { name: 'iPhone 15', variant: 'Pro', year: 2023, month: 9, tier: 1 },
    { name: 'iPhone 15', variant: 'Plus', year: 2023, month: 9, tier: 2 },
    { name: 'iPhone 15', variant: 'Standard', year: 2023, month: 9, tier: 2 },
    { name: 'iPhone 14', variant: 'Pro Max', year: 2022, month: 9, tier: 1 },
    { name: 'iPhone 14', variant: 'Pro', year: 2022, month: 9, tier: 1 },
    { name: 'iPhone 14', variant: 'Plus', year: 2022, month: 9, tier: 2 },
    { name: 'iPhone 14', variant: 'Standard', year: 2022, month: 9, tier: 2 },
    { name: 'iPhone 13', variant: 'Pro Max', year: 2021, month: 9, tier: 1 },
    { name: 'iPhone 13', variant: 'Pro', year: 2021, month: 9, tier: 1 },
    { name: 'iPhone 13', variant: 'Mini', year: 2021, month: 9, tier: 3 },
    { name: 'iPhone 13', variant: 'Standard', year: 2021, month: 9, tier: 2 },
    { name: 'iPhone 12', variant: 'Pro Max', year: 2020, month: 10, tier: 1 },
    { name: 'iPhone 12', variant: 'Pro', year: 2020, month: 10, tier: 1 },
    { name: 'iPhone 12', variant: 'Mini', year: 2020, month: 10, tier: 3 },
    { name: 'iPhone 12', variant: 'Standard', year: 2020, month: 10, tier: 2 },
    { name: 'iPhone 11', variant: 'Pro Max', year: 2019, month: 9, tier: 1 },
    { name: 'iPhone 11', variant: 'Pro', year: 2019, month: 9, tier: 1 },
    { name: 'iPhone 11', variant: 'Standard', year: 2019, month: 9, tier: 2 },
    { name: 'iPhone SE', variant: '3rd Gen', year: 2022, month: 3, tier: 3 },
    { name: 'iPhone XS', variant: 'Max', year: 2018, month: 9, tier: 1 },
    { name: 'iPhone XS', variant: 'Standard', year: 2018, month: 9, tier: 2 },
    { name: 'iPhone XR', variant: 'Standard', year: 2018, month: 10, tier: 2 },
    { name: 'iPhone X', variant: 'Standard', year: 2017, month: 11, tier: 1 },
  ]

  for (const model of iPhoneModels) {
    await prisma.deviceModel.create({
      data: {
        brandId: apple.id,
        name: model.name,
        variant: model.variant,
        releaseYear: model.year,
        releaseMonth: model.month,
        tierLevel: model.tier,
        isPhone: true,
        isTablet: false,
      },
    })
  }

  // 3. Create iPad Models
  console.log('Creating iPad models...')
  const iPadModels = [
    { name: 'iPad Pro', variant: '12.9" 6th Gen', year: 2022, month: 10, tier: 1 },
    { name: 'iPad Pro', variant: '11" 4th Gen', year: 2022, month: 10, tier: 1 },
    { name: 'iPad Air', variant: '5th Gen', year: 2022, month: 3, tier: 2 },
    { name: 'iPad', variant: '10th Gen', year: 2022, month: 10, tier: 2 },
    { name: 'iPad Mini', variant: '6th Gen', year: 2021, month: 9, tier: 2 },
  ]

  for (const model of iPadModels) {
    await prisma.deviceModel.create({
      data: {
        brandId: apple.id,
        name: model.name,
        variant: model.variant,
        releaseYear: model.year,
        releaseMonth: model.month,
        tierLevel: model.tier,
        isPhone: false,
        isTablet: true,
      },
    })
  }

  // 4. Create Samsung Models
  console.log('Creating Samsung models...')
  const samsungModels = [
    { name: 'Galaxy S24', variant: 'Ultra', year: 2024, month: 1, tier: 1, isPhone: true },
    { name: 'Galaxy S24', variant: 'Plus', year: 2024, month: 1, tier: 2, isPhone: true },
    { name: 'Galaxy S24', variant: 'Standard', year: 2024, month: 1, tier: 2, isPhone: true },
    { name: 'Galaxy S23', variant: 'Ultra', year: 2023, month: 2, tier: 1, isPhone: true },
    { name: 'Galaxy S23', variant: 'Plus', year: 2023, month: 2, tier: 2, isPhone: true },
    { name: 'Galaxy S23', variant: 'Standard', year: 2023, month: 2, tier: 2, isPhone: true },
    { name: 'Galaxy S22', variant: 'Ultra', year: 2022, month: 2, tier: 1, isPhone: true },
    { name: 'Galaxy S21', variant: 'Ultra', year: 2021, month: 1, tier: 1, isPhone: true },
    { name: 'Galaxy Z Fold', variant: '5', year: 2023, month: 8, tier: 1, isPhone: true },
    { name: 'Galaxy Z Flip', variant: '5', year: 2023, month: 8, tier: 1, isPhone: true },
    { name: 'Galaxy A54', variant: '5G', year: 2023, month: 3, tier: 3, isPhone: true },
    { name: 'Galaxy Tab S9', variant: 'Ultra', year: 2023, month: 8, tier: 1, isPhone: false },
  ]

  for (const model of samsungModels) {
    await prisma.deviceModel.create({
      data: {
        brandId: samsung.id,
        name: model.name,
        variant: model.variant,
        releaseYear: model.year,
        releaseMonth: model.month,
        tierLevel: model.tier,
        isPhone: model.isPhone,
        isTablet: !model.isPhone,
      },
    })
  }

  // 5. Create Repair Types
  console.log('Creating repair types...')
  const repairTypes = [
    { name: 'Screen Replacement', category: 'display', complexity: 3, time: 45 },
    { name: 'Battery Replacement', category: 'battery', complexity: 2, time: 30 },
    { name: 'Back Glass Replacement', category: 'housing', complexity: 4, time: 60 },
    { name: 'Charging Port Repair', category: 'port', complexity: 3, time: 45 },
    { name: 'Camera Replacement (Rear)', category: 'camera', complexity: 3, time: 40 },
    { name: 'Camera Replacement (Front)', category: 'camera', complexity: 2, time: 30 },
    { name: 'Speaker Repair', category: 'audio', complexity: 3, time: 35 },
    { name: 'Microphone Repair', category: 'audio', complexity: 3, time: 35 },
    { name: 'Earpiece Repair', category: 'audio', complexity: 2, time: 30 },
    { name: 'Water Damage Repair', category: 'other', complexity: 5, time: 120 },
    { name: 'Motherboard Repair', category: 'logic', complexity: 5, time: 180 },
    { name: 'Data Recovery', category: 'other', complexity: 4, time: 90 },
  ]

  const createdRepairTypes = []
  for (const type of repairTypes) {
    const created = await prisma.repairType.create({
      data: {
        name: type.name,
        category: type.category,
        complexityLevel: type.complexity,
        avgTimeMinutes: type.time,
      },
    })
    createdRepairTypes.push(created)
  }

  // 6. Create Sample Prices for iPhone models
  console.log('Creating sample prices...')
  
  // Get screen replacement repair type
  const screenRepair = createdRepairTypes[0]
  const batteryRepair = createdRepairTypes[1]
  const backGlassRepair = createdRepairTypes[2]
  const chargingPortRepair = createdRepairTypes[3]

  // Get iPhone 15 Pro Max
  const iphone15ProMax = await prisma.deviceModel.findFirst({
    where: { name: 'iPhone 15', variant: 'Pro Max' },
  })

  // Get iPhone 14 Pro Max
  const iphone14ProMax = await prisma.deviceModel.findFirst({
    where: { name: 'iPhone 14', variant: 'Pro Max' },
  })

  // Get iPhone 13 Pro
  const iphone13Pro = await prisma.deviceModel.findFirst({
    where: { name: 'iPhone 13', variant: 'Pro' },
  })

  // Get iPhone 11
  const iphone11 = await prisma.deviceModel.findFirst({
    where: { name: 'iPhone 11', variant: 'Standard' },
  })

  if (iphone15ProMax && iphone14ProMax && iphone13Pro && iphone11) {
    // iPhone 15 Pro Max prices
    await prisma.price.createMany({
      data: [
        {
          deviceModelId: iphone15ProMax.id,
          repairTypeId: screenRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 200,
          laborCost: 149,
          totalPrice: 349,
          isEstimated: false,
        },
        {
          deviceModelId: iphone15ProMax.id,
          repairTypeId: batteryRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 50,
          laborCost: 49,
          totalPrice: 99,
          isEstimated: false,
        },
        {
          deviceModelId: iphone15ProMax.id,
          repairTypeId: backGlassRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 100,
          laborCost: 99,
          totalPrice: 199,
          isEstimated: false,
        },
      ],
    })

    // iPhone 14 Pro Max prices
    await prisma.price.createMany({
      data: [
        {
          deviceModelId: iphone14ProMax.id,
          repairTypeId: screenRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 180,
          laborCost: 139,
          totalPrice: 319,
          isEstimated: false,
        },
        {
          deviceModelId: iphone14ProMax.id,
          repairTypeId: batteryRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 45,
          laborCost: 44,
          totalPrice: 89,
          isEstimated: false,
        },
      ],
    })

    // iPhone 13 Pro prices
    await prisma.price.createMany({
      data: [
        {
          deviceModelId: iphone13Pro.id,
          repairTypeId: screenRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 150,
          laborCost: 119,
          totalPrice: 269,
          isEstimated: false,
        },
        {
          deviceModelId: iphone13Pro.id,
          repairTypeId: batteryRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 40,
          laborCost: 39,
          totalPrice: 79,
          isEstimated: false,
        },
        {
          deviceModelId: iphone13Pro.id,
          repairTypeId: chargingPortRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 35,
          laborCost: 34,
          totalPrice: 69,
          isEstimated: false,
        },
      ],
    })

    // iPhone 11 prices
    await prisma.price.createMany({
      data: [
        {
          deviceModelId: iphone11.id,
          repairTypeId: screenRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 80,
          laborCost: 79,
          totalPrice: 159,
          isEstimated: false,
        },
        {
          deviceModelId: iphone11.id,
          repairTypeId: batteryRepair.id,
          partsQuality: PartsQuality.original,
          partsCost: 30,
          laborCost: 29,
          totalPrice: 59,
          isEstimated: false,
        },
      ],
    })
  }

  // 7. Create a sample customer
  console.log('Creating sample customer...')
  const customer = await prisma.customer.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      notificationPreference: 'sms',
    },
  })

  // 8. Create a sample user (admin)
  console.log('Creating admin user...')
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@repairhub.com',
      passwordHash,
      name: 'Admin User',
      role: 'admin',
      isActive: true,
    },
  })

  console.log('✅ Database seed completed!')
  console.log(`
  📊 Summary:
  - Brands: 4 (Apple, Samsung, Google, OnePlus)
  - Device Models: ${iPhoneModels.length + iPadModels.length + samsungModels.length}
  - Repair Types: ${repairTypes.length}
  - Sample Prices: 10+
  - Sample Customer: 1
  - Admin User: admin@repairhub.com (password: admin123)
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
