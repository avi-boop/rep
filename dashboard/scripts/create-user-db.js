#!/usr/bin/env node

/**
 * Direct Database User Creation Script
 * Creates admin user directly in the database
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@theprofitplatform.com.au'
  const password = process.argv[2] || 'fQqCW3RM7hYcXe1wJNmU' // Use the generated password from earlier
  
  console.log('\n🔐 Creating Admin User...\n')
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  }).catch(() => null)
  
  if (existingUser) {
    console.log('ℹ️  User already exists. Updating password...')
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Create or update user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      updatedAt: new Date()
    },
    create: {
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    }
  })
  
  console.log('✅ User created/updated successfully!\n')
  console.log('📧 Login Credentials:')
  console.log('─'.repeat(50))
  console.log(`Email:    ${email}`)
  console.log(`Password: ${password}`)
  console.log('─'.repeat(50))
  console.log('\n🔗 Login at: http://localhost:3000/login')
  console.log('\nUser details:', user)
  console.log('\n⚠️  IMPORTANT: Save these credentials securely!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
