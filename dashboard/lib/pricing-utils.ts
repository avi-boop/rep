/**
 * Pricing Utility Functions
 * Includes psychological pricing, similar model estimation, and formatting
 */

/**
 * Apply psychological pricing (round to X9)
 * Examples:
 *   $150 -> $149
 *   $200 -> $199
 *   $449 -> $449 (already ends in 9)
 *   $455 -> $459
 */
export function applyPsychologicalPricing(price: number): number {
  if (price <= 0) return price

  // If already ends in 9, keep it
  if (price % 10 === 9) return price

  // Round to nearest 10, then subtract 1
  const rounded = Math.round(price / 10) * 10
  return rounded - 1
}

/**
 * Format price with psychological pricing
 */
export function formatPsychologicalPrice(price: number): string {
  const psychPrice = applyPsychologicalPricing(price)
  return `$${psychPrice.toFixed(0)}`
}

/**
 * Estimate price based on similar models
 * Uses iPhone generation logic to find similar devices
 */
export function estimatePriceFromSimilarModels(
  model: string,
  repairType: string,
  existingPrices: Array<{ model: string; repairType: string; price: number }>
): { price: number; confidence: number; reason: string } | null {

  // Extract model generation number
  const modelGeneration = extractModelGeneration(model)
  if (!modelGeneration) {
    return null
  }

  // Find similar models (same generation or ±1 generation)
  const similarPrices = existingPrices.filter(p => {
    const gen = extractModelGeneration(p.model)
    return (
      p.repairType === repairType &&
      gen &&
      Math.abs(gen - modelGeneration) <= 1 && // Within 1 generation
      !p.model.includes('Plus') === !model.includes('Plus') && // Same size category
      !p.model.includes('Pro') === !model.includes('Pro') // Same tier
    )
  })

  if (similarPrices.length === 0) {
    return null
  }

  // Calculate average
  const avgPrice = similarPrices.reduce((sum, p) => sum + p.price, 0) / similarPrices.length

  // Apply psychological pricing
  const finalPrice = applyPsychologicalPricing(avgPrice)

  return {
    price: finalPrice,
    confidence: Math.min(0.9, 0.6 + (similarPrices.length * 0.1)), // More similar models = higher confidence
    reason: `Based on ${similarPrices.length} similar model${similarPrices.length > 1 ? 's' : ''} (iPhone ${modelGeneration}±1 generation)`
  }
}

/**
 * Extract iPhone generation number
 * Examples: "16 Pro Max" -> 16, "Xs Max" -> 10.5, "X" -> 10
 */
function extractModelGeneration(model: string): number | null {
  const normalized = model.toLowerCase().trim()

  // Direct number match (e.g., "16", "15 Pro")
  const numberMatch = normalized.match(/(\d+)/)
  if (numberMatch) {
    return parseInt(numberMatch[1])
  }

  // Special cases
  const specialCases: Record<string, number> = {
    'xs max': 10.5,
    'xs': 10.5,
    'xr': 10.5,
    'x': 10,
    '8 plus': 8,
    '8': 8,
    '7 plus': 7,
    '7': 7,
    '6s plus': 6.5,
    '6s': 6.5,
    '6 plus': 6,
    '6': 6,
  }

  for (const [key, value] of Object.entries(specialCases)) {
    if (normalized.includes(key)) {
      return value
    }
  }

  return null
}

/**
 * Get price tier (Budget/Standard/Premium) based on iPhone model
 */
export function getPriceTier(model: string): 'budget' | 'standard' | 'premium' {
  const generation = extractModelGeneration(model)

  if (!generation) return 'standard'

  // Latest 2 generations = Premium
  if (generation >= 15) return 'premium'

  // 2-4 generations old = Standard
  if (generation >= 12) return 'standard'

  // Older = Budget
  return 'budget'
}

/**
 * Get price multiplier based on model variant
 */
export function getModelMultiplier(model: string): number {
  const normalized = model.toLowerCase()

  if (normalized.includes('pro max')) return 1.15
  if (normalized.includes('pro')) return 1.1
  if (normalized.includes('plus')) return 1.05

  return 1.0 // Base model
}

/**
 * Calculate competitive price range
 */
export function getCompetitivePriceRange(basePrice: number): {
  lowest: number
  competitive: number
  premium: number
} {
  return {
    lowest: applyPsychologicalPricing(basePrice * 0.85), // 15% below
    competitive: applyPsychologicalPricing(basePrice), // Market rate
    premium: applyPsychologicalPricing(basePrice * 1.15) // 15% above
  }
}

/**
 * Format price difference
 */
export function formatPriceDifference(current: number, suggested: number): string {
  const diff = suggested - current
  const percent = ((diff / current) * 100).toFixed(0)

  if (diff > 0) {
    return `+$${Math.abs(diff)} (+${percent}%)`
  } else if (diff < 0) {
    return `-$${Math.abs(diff)} (${percent}%)`
  }

  return 'No change'
}
