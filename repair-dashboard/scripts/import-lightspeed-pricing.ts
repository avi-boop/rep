/**
 * Intelligent Lightspeed Pricing Import System
 *
 * Features:
 * - Imports all repair pricing from Lightspeed
 * - Keeps newest prices (prefers latest updatedAt)
 * - Intelligently fills missing prices using pattern analysis
 * - Creates DeviceModel, RepairType, PartType records as needed
 * - Tracks price history
 * - Provides confidence scores for estimated prices
 */

import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import {
  applyPsychologicalPricing,
  estimatePriceFromSimilarModels
} from '../lib/pricing-utils.js'

dotenv.config()

const prisma = new PrismaClient()

const LIGHTSPEED_DOMAIN = process.env.LIGHTSPEED_DOMAIN_PREFIX || 'metrowireless'
const LIGHTSPEED_TOKEN = process.env.LIGHTSPEED_PERSONAL_TOKEN || ''
const BASE_URL = `https://${LIGHTSPEED_DOMAIN}.retail.lightspeed.app/api/2.0`

interface LightspeedProduct {
  id: string
  name: string
  sku?: string
  retail_price?: number
  supply_price?: number
  variant_name?: string
  variant_options?: Array<{ name: string; value: string }>
  updated_at?: string
  created_at?: string
}

interface ParsedRepair {
  model: string
  repairType: string
  price?: number
  cost?: number
  lightspeedSku: string
  updatedAt: Date
  isEstimated: boolean
}

interface PricePrediction {
  price: number
  confidence: number
  reason: string
}

// Fetch from Lightspeed API
async function fetchFromLightspeed(endpoint: string): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${LIGHTSPEED_TOKEN}`,
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { headers })
  if (!response.ok) {
    throw new Error(`Lightspeed API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

// Parse Lightspeed variant into structured repair data
function parseRepairVariant(product: LightspeedProduct): ParsedRepair | null {
  // Only process "iPhone Repair" products
  if (product.name !== 'iPhone Repair' || !product.variant_options) {
    return null
  }

  const modelOption = product.variant_options.find(opt => opt.name === 'Model')
  const typeOption = product.variant_options.find(opt => opt.name === 'Type')

  if (!modelOption || !typeOption) {
    return null
  }

  return {
    model: modelOption.value,
    repairType: typeOption.value,
    price: product.retail_price || undefined,
    cost: product.supply_price || undefined,
    lightspeedSku: product.sku || product.id,
    updatedAt: product.updated_at ? new Date(product.updated_at) : new Date(),
    isEstimated: !product.retail_price // Mark as estimated if no price set
  }
}

// Intelligent price prediction based on patterns
function predictPrice(
  model: string,
  repairType: string,
  allPrices: ParsedRepair[]
): PricePrediction {
  // First try to estimate from similar models using the utility function
  const existingPrices = allPrices
    .filter(p => p.price && !p.isEstimated)
    .map(p => ({
      model: p.model,
      repairType: p.repairType,
      price: p.price!
    }))

  const similarEstimate = estimatePriceFromSimilarModels(model, repairType, existingPrices)
  if (similarEstimate) {
    return {
      price: applyPsychologicalPricing(similarEstimate.price),
      confidence: similarEstimate.confidence,
      reason: similarEstimate.reason
    }
  }

  // Fall back to base market prices
  const basePrices: Record<string, Record<string, number>> = {
    // iPhone 16 Series
    '16 Pro Max': { Front: 549, Back: 350, Battery: 150, 'Back Camera': 280, Others: 200 },
    '16 Pro': { Front: 499, Back: 320, Battery: 140, 'Back Camera': 250, Others: 180 },
    '16 Plus': { Front: 549, Back: 280, Battery: 140, 'Back Camera': 220, Others: 180 },
    '16': { Front: 449, Back: 250, Battery: 130, 'Back Camera': 200, Others: 160 },

    // iPhone 15 Series
    '15 Pro Max': { Front: 450, Back: 300, Battery: 140, 'Back Camera': 250, Others: 180 },
    '15 Pro': { Front: 420, Back: 280, Battery: 130, 'Back Camera': 220, Others: 170 },
    '15 Plus': { Front: 380, Back: 250, Battery: 120, 'Back Camera': 200, Others: 160 },
    '15': { Front: 340, Back: 220, Battery: 110, 'Back Camera': 180, Others: 140 },

    // iPhone 14 Series
    '14 Pro Max': { Front: 380, Back: 280, Battery: 120, 'Back Camera': 220, Others: 160 },
    '14 Pro': { Front: 350, Back: 250, Battery: 110, 'Back Camera': 200, Others: 150 },
    '14 Plus': { Front: 320, Back: 230, Battery: 110, 'Back Camera': 190, Others: 140 },
    '14': { Front: 300, Back: 220, Battery: 100, 'Back Camera': 180, Others: 130 },

    // iPhone 13 Series
    '13 Pro Max': { Front: 320, Back: 250, Battery: 110, 'Back Camera': 200, Others: 150 },
    '13 Pro': { Front: 300, Back: 230, Battery: 100, 'Back Camera': 180, Others: 140 },
    '13': { Front: 260, Back: 200, Battery: 100, 'Back Camera': 170, Others: 130 },
    '13 Mini': { Front: 240, Back: 180, Battery: 90, 'Back Camera': 160, Others: 120 },

    // iPhone 12 Series
    '12 Pro Max': { Front: 280, Back: 220, Battery: 100, 'Back Camera': 180, Others: 140 },
    '12 Pro': { Front: 260, Back: 200, Battery: 90, 'Back Camera': 170, Others: 130 },
    '12': { Front: 220, Back: 170, Battery: 90, 'Back Camera': 150, Others: 120 },
    '12 Mini': { Front: 200, Back: 150, Battery: 80, 'Back Camera': 140, Others: 110 },

    // iPhone 11 Series
    '11 Pro Max': { Front: 240, Back: 180, Battery: 90, 'Back Camera': 150, Others: 120 },
    '11 Pro': { Front: 220, Back: 170, Battery: 85, 'Back Camera': 140, Others: 110 },
    '11': { Front: 180, Back: 150, Battery: 85, 'Back Camera': 120, Others: 100 },

    // iPhone X/Xs Series
    'Xs Max': { Front: 180, Back: 150, Battery: 80, 'Back Camera': 130, Others: 100 },
    'Xs': { Front: 160, Back: 130, Battery: 80, 'Back Camera': 120, Others: 90 },
    'X': { Front: 150, Back: 120, Battery: 75, 'Back Camera': 110, Others: 90 },
    'XR': { Front: 140, Back: 110, Battery: 75, 'Back Camera': 100, Others: 85 },

    // iPhone 7/8 Series
    '8 Plus': { Front: 120, Back: 90, Battery: 65, 'Back Camera': 90, Others: 75 },
    '8': { Front: 100, Back: 80, Battery: 60, 'Back Camera': 80, Others: 70 },
    '7 Plus': { Front: 110, Back: 85, Battery: 65, 'Back Camera': 85, Others: 75 },
    '7': { Front: 90, Back: 75, Battery: 60, 'Back Camera': 75, Others: 65 },

    // iPhone 6/6s Series
    '6s Plus': { Front: 90, Back: 70, Battery: 55, 'Back Camera': 70, Others: 60 },
    '6s': { Front: 80, Back: 65, Battery: 50, 'Back Camera': 65, Others: 55 },
    '6 Plus': { Front: 85, Back: 68, Battery: 55, 'Back Camera': 68, Others: 58 },
    '6': { Front: 75, Back: 60, Battery: 50, 'Back Camera': 60, Others: 50 },
  }

  // Try exact match first
  if (basePrices[model] && basePrices[model][repairType]) {
    return {
      price: applyPsychologicalPricing(basePrices[model][repairType]),
      confidence: 0.95,
      reason: 'Market-based pricing with psychological adjustment'
    }
  }

  // Try to find similar model prices
  const similarPrices = allPrices.filter(p =>
    p.repairType === repairType && p.price && !p.isEstimated
  )

  if (similarPrices.length > 0) {
    const avgPrice = similarPrices.reduce((sum, p) => sum + (p.price || 0), 0) / similarPrices.length
    return {
      price: applyPsychologicalPricing(Math.round(avgPrice)),
      confidence: 0.75,
      reason: `Based on average of ${similarPrices.length} similar ${repairType} repairs with psychological pricing`
    }
  }

  // Fallback: use repair type average
  const repairTypeDefaults: Record<string, number> = {
    'Front': 200,
    'Back': 150,
    'Battery': 90,
    'Back Camera': 120,
    'Others': 100
  }

  return {
    price: applyPsychologicalPricing(repairTypeDefaults[repairType] || 150),
    confidence: 0.5,
    reason: `Default estimate for ${repairType} repair with psychological pricing`
  }
}

// Ensure Brand exists (Apple)
async function ensureBrand(): Promise<number> {
  const brand = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: {
      name: 'Apple',
      isPrimary: true,
      logoUrl: null
    }
  })
  return brand.id
}

// Ensure DeviceModel exists
async function ensureDeviceModel(brandId: number, modelName: string): Promise<number> {
  const fullName = `iPhone ${modelName}`

  const model = await prisma.deviceModel.upsert({
    where: {
      brandId_name: {
        brandId,
        name: fullName
      }
    },
    update: { isActive: true },
    create: {
      brandId,
      name: fullName,
      deviceType: 'phone',
      isActive: true
    }
  })
  return model.id
}

// Ensure RepairType exists
async function ensureRepairType(repairName: string): Promise<number> {
  const categoryMap: Record<string, string> = {
    'Front': 'Screen',
    'Back': 'Glass',
    'Battery': 'Power',
    'Back Camera': 'Camera',
    'Others': 'Miscellaneous'
  }

  const repair = await prisma.repairType.upsert({
    where: { name: repairName },
    update: {},
    create: {
      name: repairName,
      category: categoryMap[repairName] || 'Other',
      description: `${repairName} repair service`,
      estimatedDuration: repairName === 'Battery' ? 30 : repairName === 'Front' ? 60 : 45,
      isActive: true
    }
  })
  return repair.id
}

// Ensure PartType exists (Standard quality by default)
async function ensurePartType(): Promise<number> {
  const partType = await prisma.partType.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      qualityLevel: 2, // 1=Budget, 2=Standard, 3=Premium
      warrantyMonths: 6,
      description: 'Standard quality replacement parts',
      isActive: true
    }
  })
  return partType.id
}

// Main import function
async function importPricing() {
  console.log('🚀 Starting Intelligent Lightspeed Pricing Import...\n')

  try {
    // Fetch all products from Lightspeed
    console.log('📦 Fetching products from Lightspeed...')
    const products = await fetchFromLightspeed('/products')
    console.log(`✅ Fetched ${products.length} products\n`)

    // Parse repair variants
    console.log('🔍 Parsing repair variants...')
    const repairs = products
      .map(parseRepairVariant)
      .filter((r: ParsedRepair | null): r is ParsedRepair => r !== null)
    console.log(`✅ Found ${repairs.length} iPhone repair variants\n`)

    // Ensure base records exist
    console.log('🔧 Ensuring base records exist...')
    const brandId = await ensureBrand()
    const partTypeId = await ensurePartType()
    console.log(`✅ Brand ID: ${brandId}, Part Type ID: ${partTypeId}\n`)

    // Process each repair
    console.log('💰 Processing pricing data...\n')

    let imported = 0
    let updated = 0
    let estimated = 0
    let skipped = 0

    for (const repair of repairs) {
      try {
        // Ensure related records exist
        const deviceModelId = await ensureDeviceModel(brandId, repair.model)
        const repairTypeId = await ensureRepairType(repair.repairType)

        // Determine final price
        let finalPrice = repair.price
        let isEstimated = repair.isEstimated
        let confidenceScore = 1.0
        let notes = `Imported from Lightspeed (SKU: ${repair.lightspeedSku})`

        if (!finalPrice) {
          // Predict missing price
          const prediction = predictPrice(repair.model, repair.repairType, repairs)
          finalPrice = prediction.price
          isEstimated = true
          confidenceScore = prediction.confidence
          notes = `${notes}. ${prediction.reason}`
          estimated++
        }

        // Check if pricing already exists
        const existing = await prisma.pricing.findUnique({
          where: {
            deviceModelId_repairTypeId_partTypeId: {
              deviceModelId,
              repairTypeId,
              partTypeId
            }
          }
        })

        if (existing) {
          // Keep newest price
          if (repair.updatedAt > existing.updatedAt || !existing.price) {
            // Create price history entry
            await prisma.priceHistory.create({
              data: {
                pricingId: existing.id,
                oldPrice: existing.price,
                newPrice: finalPrice,
                oldCost: existing.cost,
                newCost: repair.cost,
                reason: 'Updated from Lightspeed import',
                changedAt: repair.updatedAt
              }
            })

            // Update pricing
            await prisma.pricing.update({
              where: { id: existing.id },
              data: {
                price: finalPrice,
                cost: repair.cost,
                isEstimated,
                confidenceScore,
                notes,
                updatedAt: repair.updatedAt
              }
            })

            updated++
            console.log(`📝 Updated: iPhone ${repair.model} / ${repair.repairType} → $${finalPrice}`)
          } else {
            skipped++
          }
        } else {
          // Create new pricing
          await prisma.pricing.create({
            data: {
              deviceModelId,
              repairTypeId,
              partTypeId,
              price: finalPrice,
              cost: repair.cost,
              isEstimated,
              confidenceScore,
              notes,
              isActive: true,
              validFrom: new Date(),
              createdAt: repair.updatedAt,
              updatedAt: repair.updatedAt
            }
          })

          imported++
          console.log(`✅ Imported: iPhone ${repair.model} / ${repair.repairType} → $${finalPrice}${isEstimated ? ' (estimated)' : ''}`)
        }

      } catch (error: any) {
        console.error(`❌ Error processing ${repair.model}/${repair.repairType}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ New prices imported: ${imported}`)
    console.log(`📝 Existing prices updated: ${updated}`)
    console.log(`🤖 Prices estimated intelligently: ${estimated}`)
    console.log(`⏭️  Skipped (older data): ${skipped}`)
    console.log(`📦 Total processed: ${repairs.length}`)
    console.log('='.repeat(60))

    console.log('\n✅ Import complete!\n')

  } catch (error: any) {
    console.error('❌ Import failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run import
importPricing()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
