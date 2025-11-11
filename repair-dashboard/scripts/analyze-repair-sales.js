/**
 * Analyze actual repair prices from sales data
 * Extracts pricing patterns for iPhone Repair sales
 */

const fs = require('fs')
const path = require('path')

const analysisFile = path.join(__dirname, '../lightspeed-analysis/pricing-analysis-2025-11-11.json')
const data = JSON.parse(fs.readFileSync(analysisFile, 'utf8'))

// Find all "iPhone Repair" product IDs
const iphoneRepairProducts = data.repairProducts.filter(p => p.name === 'iPhone Repair')
const iphoneRepairIds = new Set(iphoneRepairProducts.map(p => p.id))

console.log(`\n📊 iPhone Repair Sales Analysis`)
console.log(`=`.repeat(60))
console.log(`Total iPhone Repair variants: ${iphoneRepairProducts.length}`)
console.log(`Total sales analyzed: ${data.salesData.length}\n`)

// Extract all line items for iPhone Repair
const repairSales = []
data.salesData.forEach(sale => {
  if (!sale.line_items) return

  sale.line_items.forEach(item => {
    if (iphoneRepairIds.has(item.product_id) && item.status !== 'VOIDED') {
      const product = iphoneRepairProducts.find(p => p.id === item.product_id)
      repairSales.push({
        date: sale.sale_date,
        variant: product?.variant_name || product?.name || 'Unknown',
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity
      })
    }
  })
})

console.log(`📱 iPhone Repair Sales Found: ${repairSales.length}\n`)

// Calculate statistics
const prices = repairSales.map(s => s.price)
const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
const minPrice = Math.min(...prices)
const maxPrice = Math.max(...prices)
const totalRevenue = repairSales.reduce((sum, s) => sum + s.totalPrice, 0)

console.log(`💰 Pricing Statistics:`)
console.log(`   Average Price: $${avgPrice.toFixed(2)}`)
console.log(`   Min Price: $${minPrice.toFixed(2)}`)
console.log(`   Max Price: $${maxPrice.toFixed(2)}`)
console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}\n`)

// Price distribution
const priceRanges = [
  { label: '$0-50', min: 0, max: 50, count: 0 },
  { label: '$50-100', min: 50, max: 100, count: 0 },
  { label: '$100-150', min: 100, max: 150, count: 0 },
  { label: '$150-200', min: 150, max: 200, count: 0 },
  { label: '$200-300', min: 200, max: 300, count: 0 },
  { label: '$300-400', min: 300, max: 400, count: 0 },
  { label: '$400+', min: 400, max: Infinity, count: 0 }
]

prices.forEach(price => {
  const range = priceRanges.find(r => price >= r.min && price < r.max)
  if (range) range.count++
})

console.log(`📊 Price Distribution:`)
priceRanges.forEach(range => {
  const bar = '█'.repeat(Math.round(range.count / 2))
  console.log(`   ${range.label.padEnd(12)} ${bar} ${range.count}`)
})

// Most recent sales
console.log(`\n📅 Recent Sales (Last 10):`)
const recentSales = repairSales
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 10)

recentSales.forEach((sale, i) => {
  const date = new Date(sale.date).toLocaleDateString()
  console.log(`   ${i + 1}. ${date} - ${sale.variant} - $${sale.price.toFixed(2)}`)
})

// Variant breakdown
console.log(`\n🔧 Sales by Variant (Top 10):`)
const variantSales = {}
repairSales.forEach(sale => {
  if (!variantSales[sale.variant]) {
    variantSales[sale.variant] = { count: 0, total: 0, prices: [] }
  }
  variantSales[sale.variant].count += sale.quantity
  variantSales[sale.variant].total += sale.totalPrice
  variantSales[sale.variant].prices.push(sale.price)
})

const topVariants = Object.entries(variantSales)
  .map(([variant, data]) => ({
    variant,
    count: data.count,
    avgPrice: data.total / data.count,
    minPrice: Math.min(...data.prices),
    maxPrice: Math.max(...data.prices)
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10)

topVariants.forEach((item, i) => {
  console.log(`   ${i + 1}. ${item.variant}`)
  console.log(`      Count: ${item.count} | Avg: $${item.avgPrice.toFixed(2)} | Range: $${item.minPrice.toFixed(2)}-$${item.maxPrice.toFixed(2)}`)
})

console.log(`\n✅ Analysis Complete!\n`)
