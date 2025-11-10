// =============================================================================
// DATABASE SEED SCRIPT
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - be careful!)
  // await prisma.notification.deleteMany();
  // await prisma.repairOrderItem.deleteMany();
  // await prisma.repairOrder.deleteMany();
  // await prisma.customer.deleteMany();
  // await prisma.pricing.deleteMany();
  // await prisma.deviceModel.deleteMany();
  // await prisma.brand.deleteMany();
  // await prisma.repairType.deleteMany();
  // await prisma.partType.deleteMany();
  // await prisma.user.deleteMany();

  // 1. Create admin user
  console.log('Creating admin user...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@repairshop.com',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // 2. Create brands
  console.log('Creating brands...');
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
  ]);
  console.log('✅ Brands created:', brands.length);

  // 3. Create repair types
  console.log('Creating repair types...');
  const repairTypes = await Promise.all([
    prisma.repairType.upsert({
      where: { name: 'Front Screen' },
      update: {},
      create: { name: 'Front Screen', category: 'screen', estimatedDuration: 45 },
    }),
    prisma.repairType.upsert({
      where: { name: 'Back Panel' },
      update: {},
      create: { name: 'Back Panel', category: 'body', estimatedDuration: 30 },
    }),
    prisma.repairType.upsert({
      where: { name: 'Battery' },
      update: {},
      create: { name: 'Battery', category: 'battery', estimatedDuration: 30 },
    }),
    prisma.repairType.upsert({
      where: { name: 'Charging Port' },
      update: {},
      create: { name: 'Charging Port', category: 'port', estimatedDuration: 60 },
    }),
    prisma.repairType.upsert({
      where: { name: 'Camera - Rear' },
      update: {},
      create: { name: 'Camera - Rear', category: 'camera', estimatedDuration: 40 },
    }),
  ]);
  console.log('✅ Repair types created:', repairTypes.length);

  // 4. Create part types
  console.log('Creating part types...');
  const partTypes = await Promise.all([
    prisma.partType.upsert({
      where: { name: 'Original (OEM)' },
      update: {},
      create: { name: 'Original (OEM)', qualityLevel: 5, warrantyMonths: 12 },
    }),
    prisma.partType.upsert({
      where: { name: 'Aftermarket Premium' },
      update: {},
      create: { name: 'Aftermarket Premium', qualityLevel: 4, warrantyMonths: 6 },
    }),
    prisma.partType.upsert({
      where: { name: 'Aftermarket Standard' },
      update: {},
      create: { name: 'Aftermarket Standard', qualityLevel: 3, warrantyMonths: 3 },
    }),
  ]);
  console.log('✅ Part types created:', partTypes.length);

  // 5. Create device models
  console.log('Creating device models...');
  const appleBrand = brands.find(b => b.name === 'Apple');
  const samsungBrand = brands.find(b => b.name === 'Samsung');

  const devices = await Promise.all([
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
      where: { brandId_name: { brandId: appleBrand.id, name: 'iPhone 14 Pro' } },
      update: {},
      create: {
        brandId: appleBrand.id,
        name: 'iPhone 14 Pro',
        modelNumber: 'A2650',
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
  ]);
  console.log('✅ Device models created:', devices.length);

  // 6. Create sample pricing
  console.log('Creating sample pricing...');
  const screenRepair = repairTypes.find(r => r.name === 'Front Screen');
  const batteryRepair = repairTypes.find(r => r.name === 'Battery');
  const originalPart = partTypes.find(p => p.name === 'Original (OEM)');
  const premiumPart = partTypes.find(p => p.name === 'Aftermarket Premium');

  const pricing = [];
  for (const device of devices.slice(0, 4)) {
    // Add screen repair prices
    pricing.push(
      prisma.pricing.upsert({
        where: {
          deviceModelId_repairTypeId_partTypeId_validFrom: {
            deviceModelId: device.id,
            repairTypeId: screenRepair.id,
            partTypeId: originalPart.id,
            validFrom: new Date(),
          },
        },
        update: {},
        create: {
          deviceModelId: device.id,
          repairTypeId: screenRepair.id,
          partTypeId: originalPart.id,
          price: device.releaseYear === 2023 ? 299 : device.releaseYear === 2022 ? 249 : 199,
          cost: device.releaseYear === 2023 ? 150 : device.releaseYear === 2022 ? 120 : 100,
          isEstimated: false,
        },
      })
    );

    // Add battery repair prices
    pricing.push(
      prisma.pricing.upsert({
        where: {
          deviceModelId_repairTypeId_partTypeId_validFrom: {
            deviceModelId: device.id,
            repairTypeId: batteryRepair.id,
            partTypeId: premiumPart.id,
            validFrom: new Date(),
          },
        },
        update: {},
        create: {
          deviceModelId: device.id,
          repairTypeId: batteryRepair.id,
          partTypeId: premiumPart.id,
          price: 89,
          cost: 40,
          isEstimated: false,
        },
      })
    );
  }
  await Promise.all(pricing);
  console.log('✅ Sample pricing created:', pricing.length);

  // 7. Create sample customer
  console.log('Creating sample customers...');
  const customer = await prisma.customer.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      notificationPreferences: { sms: true, email: true, push: false },
    },
  });
  console.log('✅ Sample customer created:', customer.firstName);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('\n⚠️  IMPORTANT: Change the admin password in production!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
