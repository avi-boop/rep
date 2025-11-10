import { PrismaClient, PartsQuality } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data
  console.log('Cleaning existing data...')
  await prisma.notification.deleteMany()
  await prisma.repairItem.deleteMany()
  await prisma.repair.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.price.deleteMany()
  await prisma.repairType.deleteMany()
  await prisma.deviceModel.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.user.deleteMany()

  // Create Brands
  console.log('Creating brands...')
  const apple = await prisma.brand.create({
    data: { name: 'Apple', isPrimary: true },
  })
  const samsung = await prisma.brand.create({
    data: { name: 'Samsung', isPrimary: true },
  })
  const google = await prisma.brand.create({
    data: { name: 'Google', isPrimary: false },
  })
  const oneplus = await prisma.brand.create({
    data: { name: 'OnePlus', isPrimary: false },
  })

  // Create iPhone Models
  console.log('Creating iPhone models...')
  const iphone15ProMax = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 15',
      variant: 'Pro Max',
      releaseYear: 2023,
      releaseMonth: 9,
      tierLevel: 1,
      isPhone: true,
    },
  })
  const iphone15Pro = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 15',
      variant: 'Pro',
      releaseYear: 2023,
      releaseMonth: 9,
      tierLevel: 1,
      isPhone: true,
    },
  })
  const iphone15 = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 15',
      variant: 'Standard',
      releaseYear: 2023,
      releaseMonth: 9,
      tierLevel: 2,
      isPhone: true,
    },
  })
  const iphone14Pro = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 14',
      variant: 'Pro',
      releaseYear: 2022,
      releaseMonth: 9,
      tierLevel: 1,
      isPhone: true,
    },
  })
  const iphone14 = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 14',
      variant: 'Standard',
      releaseYear: 2022,
      releaseMonth: 9,
      tierLevel: 2,
      isPhone: true,
    },
  })
  const iphone13Pro = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 13',
      variant: 'Pro',
      releaseYear: 2021,
      releaseMonth: 9,
      tierLevel: 1,
      isPhone: true,
    },
  })
  const iphone13 = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 13',
      variant: 'Standard',
      releaseYear: 2021,
      releaseMonth: 9,
      tierLevel: 2,
      isPhone: true,
    },
  })
  const iphone12 = await prisma.deviceModel.create({
    data: {
      brandId: apple.id,
      name: 'iPhone 12',
      variant: 'Standard',
      releaseYear: 2020,
      releaseMonth: 10,
      tierLevel: 2,
      isPhone: true,
    },
  })

  // Create Samsung Models
  console.log('Creating Samsung models...')
  const galaxyS24Ultra = await prisma.deviceModel.create({
    data: {
      brandId: samsung.id,
      name: 'Galaxy S24',
      variant: 'Ultra',
      releaseYear: 2024,
      releaseMonth: 1,
      tierLevel: 1,
      isPhone: true,
    },
  })
  const galaxyS23 = await prisma.deviceModel.create({
    data: {
      brandId: samsung.id,
      name: 'Galaxy S23',
      variant: 'Standard',
      releaseYear: 2023,
      releaseMonth: 2,
      tierLevel: 2,
      isPhone: true,
    },
  })

  // Create Repair Types
  console.log('Creating repair types...')
  const screenRepair = await prisma.repairType.create({
    data: {
      name: 'Screen Replacement',
      category: 'display',
      complexityLevel: 3,
      avgTimeMinutes: 45,
    },
  })
  const batteryRepair = await prisma.repairType.create({
    data: {
      name: 'Battery Replacement',
      category: 'battery',
      complexityLevel: 2,
      avgTimeMinutes: 30,
    },
  })
  const backGlass = await prisma.repairType.create({
    data: {
      name: 'Back Glass Replacement',
      category: 'housing',
      complexityLevel: 4,
      avgTimeMinutes: 60,
    },
  })
  const chargingPort = await prisma.repairType.create({
    data: {
      name: 'Charging Port',
      category: 'port',
      complexityLevel: 3,
      avgTimeMinutes: 45,
    },
  })
  const camera = await prisma.repairType.create({
    data: {
      name: 'Camera Replacement',
      category: 'camera',
      complexityLevel: 3,
      avgTimeMinutes: 40,
    },
  })

  // Create Prices
  console.log('Creating prices...')
  // iPhone 15 Pro Max
  await prisma.price.create({
    data: {
      deviceModelId: iphone15ProMax.id,
      repairTypeId: screenRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 200,
      laborCost: 79,
      totalPrice: 329,
    },
  })
  await prisma.price.create({
    data: {
      deviceModelId: iphone15ProMax.id,
      repairTypeId: batteryRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 60,
      laborCost: 39,
      totalPrice: 99,
    },
  })

  // iPhone 15 Pro
  await prisma.price.create({
    data: {
      deviceModelId: iphone15Pro.id,
      repairTypeId: screenRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 180,
      laborCost: 69,
      totalPrice: 299,
    },
  })

  // iPhone 14 Pro
  await prisma.price.create({
    data: {
      deviceModelId: iphone14Pro.id,
      repairTypeId: screenRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 160,
      laborCost: 69,
      totalPrice: 279,
    },
  })
  await prisma.price.create({
    data: {
      deviceModelId: iphone14Pro.id,
      repairTypeId: batteryRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 50,
      laborCost: 39,
      totalPrice: 89,
    },
  })

  // iPhone 13 Pro
  await prisma.price.create({
    data: {
      deviceModelId: iphone13Pro.id,
      repairTypeId: screenRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 140,
      laborCost: 69,
      totalPrice: 249,
    },
  })
  await prisma.price.create({
    data: {
      deviceModelId: iphone13Pro.id,
      repairTypeId: batteryRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 50,
      laborCost: 29,
      totalPrice: 79,
    },
  })

  // iPhone 12
  await prisma.price.create({
    data: {
      deviceModelId: iphone12.id,
      repairTypeId: screenRepair.id,
      partsQuality: PartsQuality.original,
      partsCost: 120,
      laborCost: 59,
      totalPrice: 199,
    },
  })

  // Create Sample Customers
  console.log('Creating sample customers...')
  const customer1 = await prisma.customer.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      notificationPreference: 'sms',
    },
  })
  const customer2 = await prisma.customer.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567891',
      email: 'jane.smith@example.com',
      notificationPreference: 'email',
    },
  })
  const customer3 = await prisma.customer.create({
    data: {
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+1234567892',
      email: 'mike.johnson@example.com',
      notificationPreference: 'sms',
    },
  })

  // Create Sample Users
  console.log('Creating sample users...')
  await prisma.user.create({
    data: {
      email: 'admin@repairhub.com',
      passwordHash: '$2b$10$YourHashedPasswordHere', // Change this!
      name: 'Admin User',
      role: 'admin',
    },
  })
  await prisma.user.create({
    data: {
      email: 'tech@repairhub.com',
      passwordHash: '$2b$10$YourHashedPasswordHere', // Change this!
      name: 'Technician User',
      role: 'technician',
    },
  })

  // Create Sample Repair
  console.log('Creating sample repair...')
  const repair1 = await prisma.repair.create({
    data: {
      repairNumber: 'RR231110-0001',
      customerId: customer1.id,
      deviceModelId: iphone14Pro.id,
      deviceImei: '123456789012345',
      deviceCondition: 'Cracked screen, otherwise good condition',
      status: 'in_progress',
      priority: 'standard',
      totalCost: 279,
      estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      repairItems: {
        create: [
          {
            repairTypeId: screenRepair.id,
            partsQuality: PartsQuality.original,
            finalPrice: 279,
          },
        ],
      },
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\nSummary:')
  console.log(`- ${await prisma.brand.count()} brands`)
  console.log(`- ${await prisma.deviceModel.count()} device models`)
  console.log(`- ${await prisma.repairType.count()} repair types`)
  console.log(`- ${await prisma.price.count()} prices`)
  console.log(`- ${await prisma.customer.count()} customers`)
  console.log(`- ${await prisma.user.count()} users`)
  console.log(`- ${await prisma.repair.count()} repairs`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
