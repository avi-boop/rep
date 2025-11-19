import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if Samsung exists
  const samsung = await prisma.brand.findFirst({
    where: { name: 'Samsung' }
  })

  if (samsung) {
    console.log('Samsung already exists:', samsung)
  } else {
    // Add Samsung
    const newSamsung = await prisma.brand.create({
      data: {
        name: 'Samsung',
        isPrimary: true,
        logoUrl: null
      }
    })
    console.log('Samsung brand added:', newSamsung)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
