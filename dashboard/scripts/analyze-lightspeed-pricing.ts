/**
 * Lightspeed Pricing Analysis Script
 * Fetches all sales and product data from Lightspeed POS
 * Analyzes repair pricing patterns, especially for iPhones
 * Generates insights for pricing updates
 */

import dotenv from 'dotenv'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config()

const LIGHTSPEED_DOMAIN = process.env.LIGHTSPEED_DOMAIN_PREFIX || 'metrowireless'
const LIGHTSPEED_TOKEN = process.env.LIGHTSPEED_PERSONAL_TOKEN || ''
const BASE_URL = `https://${LIGHTSPEED_DOMAIN}.retail.lightspeed.app/api/2.0`

interface LightspeedProduct {
  id: string
  name: string
  description?: string
  sku?: string
  supply_price?: number
  retail_price?: number
  variant_parent_id?: string
  variant_name?: string
  created_at?: string
  updated_at?: string
}

interface LightspeedSale {
  id: string
  customer_id?: string
  sale_date: string
  status: string
  note?: string
  line_items?: Array<{
    id: string
    product_id: string
    variant_id?: string
    quantity: number
    price: number
    tax: number
    discount: number
    note?: string
  }>
  total_price?: number
  total_tax?: number
}

interface PricingAnalysis {
  totalProducts: number
  totalSales: number
  repairProducts: LightspeedProduct[]
  iphoneRepairs: LightspeedProduct[]
  salesData: LightspeedSale[]
  pricingInsights: {
    averageRepairPrice: number
    averageIPhoneRepairPrice: number
    priceRange: { min: number; max: number }
    mostCommonRepairs: Array<{ name: string; count: number; avgPrice: number }>
    recentPricing: Array<{ name: string; price: number; date: string }>
  }
}

async function fetchFromLightspeed(endpoint: string): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${LIGHTSPEED_TOKEN}`,
    'Content-Type': 'application/json',
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lightspeed API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.data || data
  } catch (error: any) {
    console.error(`Error fetching ${endpoint}:`, error.message)
    throw error
  }
}

async function fetchAllProducts(): Promise<LightspeedProduct[]> {
  console.log('📦 Fetching all products from Lightspeed...')

  try {
    const products = await fetchFromLightspeed('/products')
    console.log(`✅ Fetched ${products.length} products`)
    return products
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    return []
  }
}

async function fetchAllSales(limit = 100): Promise<LightspeedSale[]> {
  console.log('💰 Fetching sales data from Lightspeed...')

  try {
    // Fetch recent sales (last 90 days for pricing analysis)
    const sales = await fetchFromLightspeed(`/sales?limit=${limit}`)
    console.log(`✅ Fetched ${sales.length} sales`)
    return sales
  } catch (error) {
    console.error('❌ Error fetching sales:', error)
    return []
  }
}

function analyzeProducts(products: LightspeedProduct[]): {
  repairProducts: LightspeedProduct[]
  iphoneRepairs: LightspeedProduct[]
} {
  console.log('\n🔍 Analyzing products for repairs...')

  // Keywords that indicate repair products
  const repairKeywords = [
    'repair',
    'fix',
    'replacement',
    'screen',
    'battery',
    'charging',
    'port',
    'camera',
    'back glass',
    'lcd',
    'digitizer',
    'display',
    'speaker',
    'microphone',
    'button',
    'antenna',
    'vibrator',
    'flex',
    'connector'
  ]

  const iphoneKeywords = ['iphone', 'ip ', 'apple']

  const repairProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase()
    const desc = (p.description || '').toLowerCase()
    const text = `${name} ${desc}`

    return repairKeywords.some(keyword => text.includes(keyword))
  })

  const iphoneRepairs = repairProducts.filter(p => {
    const name = (p.name || '').toLowerCase()
    const desc = (p.description || '').toLowerCase()
    const text = `${name} ${desc}`

    return iphoneKeywords.some(keyword => text.includes(keyword))
  })

  console.log(`✅ Found ${repairProducts.length} repair-related products`)
  console.log(`✅ Found ${iphoneRepairs.length} iPhone repair products`)

  return { repairProducts, iphoneRepairs }
}

function analyzePricing(
  products: LightspeedProduct[],
  sales: LightspeedSale[]
): PricingAnalysis['pricingInsights'] {
  console.log('\n💡 Analyzing pricing patterns...')

  // Filter products with prices
  const pricedProducts = products.filter(p => p.retail_price && p.retail_price > 0)

  // Calculate average repair price
  const totalPrice = pricedProducts.reduce((sum, p) => sum + (p.retail_price || 0), 0)
  const averageRepairPrice = pricedProducts.length > 0 ? totalPrice / pricedProducts.length : 0

  // Calculate iPhone repair average
  const iphoneProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase()
    return name.includes('iphone') && p.retail_price && p.retail_price > 0
  })
  const iphoneTotalPrice = iphoneProducts.reduce((sum, p) => sum + (p.retail_price || 0), 0)
  const averageIPhoneRepairPrice = iphoneProducts.length > 0 ? iphoneTotalPrice / iphoneProducts.length : 0

  // Find price range
  const prices = pricedProducts.map(p => p.retail_price || 0)
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }

  // Find most common repairs from sales data
  const repairCounts: Map<string, { count: number; totalPrice: number }> = new Map()

  sales.forEach(sale => {
    sale.line_items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id)
      if (product && product.name) {
        const existing = repairCounts.get(product.name) || { count: 0, totalPrice: 0 }
        repairCounts.set(product.name, {
          count: existing.count + item.quantity,
          totalPrice: existing.totalPrice + (item.price * item.quantity)
        })
      }
    })
  })

  const mostCommonRepairs = Array.from(repairCounts.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgPrice: data.totalPrice / data.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Get recent pricing (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentPricing = products
    .filter(p => {
      if (!p.updated_at || !p.retail_price) return false
      const updateDate = new Date(p.updated_at)
      return updateDate >= thirtyDaysAgo
    })
    .map(p => ({
      name: p.name || 'Unknown',
      price: p.retail_price || 0,
      date: p.updated_at || ''
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)

  console.log(`✅ Average repair price: $${averageRepairPrice.toFixed(2)}`)
  console.log(`✅ Average iPhone repair: $${averageIPhoneRepairPrice.toFixed(2)}`)
  console.log(`✅ Price range: $${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)}`)
  console.log(`✅ Found ${mostCommonRepairs.length} popular repairs`)
  console.log(`✅ Found ${recentPricing.length} recent price updates`)

  return {
    averageRepairPrice,
    averageIPhoneRepairPrice,
    priceRange,
    mostCommonRepairs,
    recentPricing
  }
}

async function main() {
  console.log('🚀 Starting Lightspeed Pricing Analysis...\n')
  console.log(`Domain: ${LIGHTSPEED_DOMAIN}`)
  console.log(`API: ${BASE_URL}\n`)

  if (!LIGHTSPEED_TOKEN) {
    console.error('❌ LIGHTSPEED_PERSONAL_TOKEN not configured')
    process.exit(1)
  }

  try {
    // Fetch all data
    const [products, sales] = await Promise.all([
      fetchAllProducts(),
      fetchAllSales(200) // Fetch last 200 sales
    ])

    // Analyze products
    const { repairProducts, iphoneRepairs } = analyzeProducts(products)

    // Analyze pricing
    const pricingInsights = analyzePricing(repairProducts, sales)

    // Create analysis report
    const analysis: PricingAnalysis = {
      totalProducts: products.length,
      totalSales: sales.length,
      repairProducts,
      iphoneRepairs,
      salesData: sales,
      pricingInsights
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const outputDir = join(process.cwd(), 'lightspeed-analysis')

    // Create directory if it doesn't exist
    try {
      const { mkdirSync } = await import('fs')
      mkdirSync(outputDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }

    const filename = `pricing-analysis-${timestamp}.json`
    const filepath = join(outputDir, filename)

    writeFileSync(filepath, JSON.stringify(analysis, null, 2))

    console.log(`\n✅ Analysis complete!`)
    console.log(`📄 Report saved to: ${filepath}`)

    // Generate summary
    console.log('\n📊 SUMMARY REPORT')
    console.log('=' .repeat(50))
    console.log(`Total Products: ${analysis.totalProducts}`)
    console.log(`Repair Products: ${analysis.repairProducts.length}`)
    console.log(`iPhone Repairs: ${analysis.iphoneRepairs.length}`)
    console.log(`Total Sales Analyzed: ${analysis.totalSales}`)
    console.log('\n💰 PRICING INSIGHTS')
    console.log('='.repeat(50))
    console.log(`Average Repair Price: $${analysis.pricingInsights.averageRepairPrice.toFixed(2)}`)
    console.log(`Average iPhone Repair: $${analysis.pricingInsights.averageIPhoneRepairPrice.toFixed(2)}`)
    console.log(`Price Range: $${analysis.pricingInsights.priceRange.min.toFixed(2)} - $${analysis.pricingInsights.priceRange.max.toFixed(2)}`)

    console.log('\n🔥 TOP 10 MOST COMMON REPAIRS')
    console.log('='.repeat(50))
    analysis.pricingInsights.mostCommonRepairs.slice(0, 10).forEach((repair, i) => {
      console.log(`${i + 1}. ${repair.name}`)
      console.log(`   Count: ${repair.count} | Avg Price: $${repair.avgPrice.toFixed(2)}`)
    })

    console.log('\n📅 RECENT PRICE UPDATES (Last 30 Days)')
    console.log('='.repeat(50))
    analysis.pricingInsights.recentPricing.slice(0, 10).forEach((item, i) => {
      const date = new Date(item.date).toLocaleDateString()
      console.log(`${i + 1}. ${item.name}`)
      console.log(`   Price: $${item.price.toFixed(2)} | Updated: ${date}`)
    })

    console.log('\n✅ Analysis complete!')
    console.log(`📄 Full report: ${filepath}\n`)

  } catch (error: any) {
    console.error('\n❌ Error during analysis:', error.message)
    process.exit(1)
  }
}

// Run the analysis
main()
