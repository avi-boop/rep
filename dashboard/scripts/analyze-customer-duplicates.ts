#!/usr/bin/env ts-node

/**
 * Customer Duplicate Analysis Script
 *
 * Detects potential duplicate customers using multiple strategies:
 * - Exact phone number matches (normalized)
 * - Exact email matches
 * - Fuzzy name matching
 *
 * Generates a comprehensive report with confidence scores
 *
 * Usage:
 *   npx ts-node scripts/analyze-customer-duplicates.ts
 *   npx ts-node scripts/analyze-customer-duplicates.ts --output report.json
 */

import { PrismaClient } from '@prisma/client'
import { normalizePhone } from '../lib/utils/phone.js'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface DuplicateGroup {
  id: string
  detectionMethod: 'phone' | 'email' | 'name' | 'multi'
  confidence: number
  customers: CustomerWithScore[]
  primaryCustomerId?: number
  reason: string
}

interface CustomerWithScore {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string
  repairCount: number
  hasEmail: boolean
  hasNotes: boolean
  createdAt: Date
  updatedAt: Date
  score: number
  scoreBreakdown: {
    dataCompleteness: number
    activityLevel: number
    dataQuality: number
    recency: number
  }
}

/**
 * Calculate Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity score between two names (0-1)
 */
function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()

  if (n1 === n2) return 1.0
  if (!n1 || !n2) return 0.0

  const maxLen = Math.max(n1.length, n2.length)
  const distance = levenshteinDistance(n1, n2)

  return 1 - (distance / maxLen)
}

/**
 * Calculate customer quality score (0-100)
 */
function calculateCustomerScore(customer: any): { score: number; breakdown: any } {
  let dataCompleteness = 0
  let activityLevel = 0
  let dataQuality = 0
  let recency = 0

  // Data completeness (30 points max)
  if (customer.email) dataCompleteness += 10
  if (customer.notes) dataCompleteness += 5
  if (customer.notificationPreferences && customer.notificationPreferences !== '{}') dataCompleteness += 5
  if (customer.firstName && customer.firstName.trim()) dataCompleteness += 5
  if (customer.lastName && customer.lastName.trim()) dataCompleteness += 5

  // Activity level (40 points max)
  const repairCount = customer._count?.repairOrders || 0
  activityLevel = Math.min(30, repairCount * 10)
  if (repairCount > 0) activityLevel += 10 // Has at least one repair

  // Data quality (20 points max)
  if (customer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    dataQuality += 10
  }
  if (customer.phone && customer.phone.length >= 10) {
    dataQuality += 10
  }

  // Recency (10 points max)
  const daysSinceUpdate = (Date.now() - new Date(customer.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate < 30) recency = 10
  else if (daysSinceUpdate < 90) recency = 7
  else if (daysSinceUpdate < 180) recency = 4
  else recency = 2

  const totalScore = dataCompleteness + activityLevel + dataQuality + recency

  return {
    score: totalScore,
    breakdown: {
      dataCompleteness,
      activityLevel,
      dataQuality,
      recency
    }
  }
}

/**
 * Find duplicates by exact phone number match
 */
async function findPhoneDuplicates(): Promise<DuplicateGroup[]> {
  console.log('🔍 Searching for phone number duplicates...')

  const customers = await prisma.customer.findMany({
    where: {
      phone: {
        not: ''
      },
      mergedIntoId: null // Exclude already merged customers
    },
    include: {
      _count: {
        select: { repairOrders: true }
      }
    }
  })

  const phoneGroups = new Map<string, any[]>()

  for (const customer of customers) {
    const normalized = normalizePhone(customer.phone)
    if (normalized && normalized.length >= 10) {
      if (!phoneGroups.has(normalized)) {
        phoneGroups.set(normalized, [])
      }
      phoneGroups.get(normalized)!.push(customer)
    }
  }

  const duplicateGroups: DuplicateGroup[] = []

  for (const [phone, group] of phoneGroups.entries()) {
    if (group.length > 1) {
      const customersWithScores: CustomerWithScore[] = group.map(c => {
        const { score, breakdown } = calculateCustomerScore(c)
        return {
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          repairCount: c._count.repairOrders,
          hasEmail: !!c.email,
          hasNotes: !!c.notes,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          score,
          scoreBreakdown: breakdown
        }
      })

      // Sort by score descending
      customersWithScores.sort((a, b) => b.score - a.score)

      duplicateGroups.push({
        id: `phone_${phone}`,
        detectionMethod: 'phone',
        confidence: 100, // Exact phone match is 100% confidence
        customers: customersWithScores,
        primaryCustomerId: customersWithScores[0].id,
        reason: `Same phone number: ${phone}`
      })
    }
  }

  console.log(`  Found ${duplicateGroups.length} phone duplicate groups`)
  return duplicateGroups
}

/**
 * Find duplicates by exact email match
 */
async function findEmailDuplicates(): Promise<DuplicateGroup[]> {
  console.log('🔍 Searching for email duplicates...')

  const customers = await prisma.customer.findMany({
    where: {
      email: {
        not: null
      },
      mergedIntoId: null
    },
    include: {
      _count: {
        select: { repairOrders: true }
      }
    }
  })

  const emailGroups = new Map<string, any[]>()

  for (const customer of customers) {
    if (customer.email) {
      const normalizedEmail = customer.email.toLowerCase().trim()
      if (!emailGroups.has(normalizedEmail)) {
        emailGroups.set(normalizedEmail, [])
      }
      emailGroups.get(normalizedEmail)!.push(customer)
    }
  }

  const duplicateGroups: DuplicateGroup[] = []

  for (const [email, group] of emailGroups.entries()) {
    if (group.length > 1) {
      const customersWithScores: CustomerWithScore[] = group.map(c => {
        const { score, breakdown } = calculateCustomerScore(c)
        return {
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          repairCount: c._count.repairOrders,
          hasEmail: !!c.email,
          hasNotes: !!c.notes,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          score,
          scoreBreakdown: breakdown
        }
      })

      customersWithScores.sort((a, b) => b.score - a.score)

      duplicateGroups.push({
        id: `email_${email}`,
        detectionMethod: 'email',
        confidence: 100,
        customers: customersWithScores,
        primaryCustomerId: customersWithScores[0].id,
        reason: `Same email: ${email}`
      })
    }
  }

  console.log(`  Found ${duplicateGroups.length} email duplicate groups`)
  return duplicateGroups
}

/**
 * Find duplicates by fuzzy name matching
 */
async function findNameDuplicates(): Promise<DuplicateGroup[]> {
  console.log('🔍 Searching for name-based duplicates (fuzzy matching)...')

  const customers = await prisma.customer.findMany({
    where: {
      mergedIntoId: null
    },
    include: {
      _count: {
        select: { repairOrders: true }
      }
    }
  })

  const duplicateGroups: DuplicateGroup[] = []
  const processed = new Set<number>()

  for (let i = 0; i < customers.length; i++) {
    if (processed.has(customers[i].id)) continue

    const c1 = customers[i]
    const fullName1 = `${c1.firstName} ${c1.lastName}`.toLowerCase().trim()

    if (!fullName1 || fullName1.length < 3) continue

    const similarCustomers = [c1]

    for (let j = i + 1; j < customers.length; j++) {
      if (processed.has(customers[j].id)) continue

      const c2 = customers[j]
      const fullName2 = `${c2.firstName} ${c2.lastName}`.toLowerCase().trim()

      const similarity = nameSimilarity(fullName1, fullName2)

      // Consider similar if > 85% match
      if (similarity > 0.85) {
        similarCustomers.push(c2)
        processed.add(c2.id)
      }
    }

    if (similarCustomers.length > 1) {
      processed.add(c1.id)

      const customersWithScores: CustomerWithScore[] = similarCustomers.map(c => {
        const { score, breakdown } = calculateCustomerScore(c)
        return {
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          repairCount: c._count.repairOrders,
          hasEmail: !!c.email,
          hasNotes: !!c.notes,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          score,
          scoreBreakdown: breakdown
        }
      })

      customersWithScores.sort((a, b) => b.score - a.score)

      duplicateGroups.push({
        id: `name_${c1.id}`,
        detectionMethod: 'name',
        confidence: 70, // Fuzzy name matching is less confident
        customers: customersWithScores,
        primaryCustomerId: customersWithScores[0].id,
        reason: `Similar names: "${fullName1}"`
      })
    }
  }

  console.log(`  Found ${duplicateGroups.length} name-based duplicate groups`)
  return duplicateGroups
}

/**
 * Main analysis function
 */
async function analyzeCustomerDuplicates() {
  console.log('🚀 Starting Customer Duplicate Analysis...\n')

  const startTime = Date.now()

  try {
    // Run all detection methods
    const phoneDuplicates = await findPhoneDuplicates()
    const emailDuplicates = await findEmailDuplicates()
    const nameDuplicates = await findNameDuplicates()

    // Combine all results
    const allDuplicates = [
      ...phoneDuplicates,
      ...emailDuplicates,
      ...nameDuplicates
    ]

    // Calculate statistics
    const totalGroups = allDuplicates.length
    const totalDuplicateCustomers = allDuplicates.reduce((sum, group) => sum + group.customers.length, 0)
    const highConfidence = allDuplicates.filter(g => g.confidence >= 95).length
    const mediumConfidence = allDuplicates.filter(g => g.confidence >= 70 && g.confidence < 95).length
    const lowConfidence = allDuplicates.filter(g => g.confidence < 70).length

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      summary: {
        totalDuplicateGroups: totalGroups,
        totalCustomersInDuplicates: totalDuplicateCustomers,
        byConfidence: {
          high: highConfidence,
          medium: mediumConfidence,
          low: lowConfidence
        },
        byDetectionMethod: {
          phone: phoneDuplicates.length,
          email: emailDuplicates.length,
          name: nameDuplicates.length
        }
      },
      duplicateGroups: allDuplicates
    }

    // Print summary
    console.log('\n📊 Analysis Summary:')
    console.log(`   Total duplicate groups: ${totalGroups}`)
    console.log(`   Total customers in duplicates: ${totalDuplicateCustomers}`)
    console.log(`   High confidence (≥95%): ${highConfidence}`)
    console.log(`   Medium confidence (70-94%): ${mediumConfidence}`)
    console.log(`   Low confidence (<70%): ${lowConfidence}`)
    console.log('\n   By detection method:')
    console.log(`   - Phone: ${phoneDuplicates.length}`)
    console.log(`   - Email: ${emailDuplicates.length}`)
    console.log(`   - Name: ${nameDuplicates.length}`)

    // Save report to file
    const outputPath = process.argv.includes('--output')
      ? process.argv[process.argv.indexOf('--output') + 1]
      : path.join(__dirname, '../reports/customer-duplicates-report.json')

    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`\n✅ Report saved to: ${outputPath}`)
    console.log(`   Analysis completed in ${(Date.now() - startTime) / 1000}s\n`)

    return report
  } catch (error) {
    console.error('❌ Error during analysis:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  analyzeCustomerDuplicates()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { analyzeCustomerDuplicates }
