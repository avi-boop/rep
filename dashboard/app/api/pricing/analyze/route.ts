import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  applyPsychologicalPricing,
  getCompetitivePriceRange,
  estimatePriceFromSimilarModels,
  formatPriceDifference
} from '@/lib/pricing-utils'
import { requireAuth } from '@/lib/auth'

/**
 * POST /api/pricing/analyze
 *
 * AI-powered pricing analysis and optimization
 * Returns suggestions for:
 * - Psychological pricing adjustments
 * - Competitive pricing ranges (low, competitive, premium)
 * - Similar model comparisons
 * - Price outliers that need review
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request)
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()
    const { deviceModelId, repairTypeId } = body

    // Fetch all active pricing
    const allPricing = await prisma.pricing.findMany({
      where: { isActive: true },
      include: {
        deviceModel: { include: { brand: true } },
        repairType: true,
        partType: true
      }
    })

    if (allPricing.length === 0) {
      return NextResponse.json({
        error: 'No pricing data found. Please sync from Lightspeed first.'
      }, { status: 404 })
    }

    // Filter to specific device/repair if provided
    const targetPricing = deviceModelId && repairTypeId
      ? allPricing.filter(p => p.deviceModelId === deviceModelId && p.repairTypeId === repairTypeId)
      : allPricing

    const analyses: any[] = []

    for (const pricing of targetPricing) {
      const currentPrice = pricing.price
      const model = pricing.deviceModel.name.replace('iPhone ', '')
      const repairType = pricing.repairType.name

      // 1. Psychological Pricing Analysis
      const psychPrice = applyPsychologicalPricing(currentPrice)
      const needsPsychAdjustment = psychPrice !== currentPrice

      // 2. Competitive Price Range
      const competitive = getCompetitivePriceRange(currentPrice)

      // 3. Similar Model Comparison
      const existingPrices = allPricing
        .filter(p => p.id !== pricing.id && !p.isEstimated)
        .map(p => ({
          model: p.deviceModel.name.replace('iPhone ', ''),
          repairType: p.repairType.name,
          price: p.price
        }))

      const similarEstimate = estimatePriceFromSimilarModels(
        model,
        repairType,
        existingPrices
      )

      // 4. Calculate variance from similar models
      let variance = 0
      let varianceStatus: 'low' | 'normal' | 'high' = 'normal'

      if (similarEstimate) {
        variance = ((currentPrice - similarEstimate.price) / similarEstimate.price) * 100

        if (Math.abs(variance) > 20) {
          varianceStatus = 'high'
        } else if (Math.abs(variance) < 5) {
          varianceStatus = 'low'
        }
      }

      // 5. Generate recommendation
      let recommendation = 'No change needed'
      let suggestedPrice = currentPrice
      let priority: 'low' | 'medium' | 'high' = 'low'

      if (needsPsychAdjustment) {
        recommendation = 'Apply psychological pricing (end in 9)'
        suggestedPrice = psychPrice
        priority = 'medium'
      }

      if (varianceStatus === 'high' && similarEstimate) {
        recommendation = `Price differs significantly from similar models. Consider ${variance > 0 ? 'decreasing' : 'increasing'} to match market.`
        suggestedPrice = similarEstimate.price
        priority = 'high'
      }

      if (pricing.isEstimated && pricing.confidenceScore && pricing.confidenceScore < 0.7) {
        recommendation = 'Low confidence estimate - verify with market research'
        priority = 'high'
      }

      analyses.push({
        id: pricing.id,
        device: pricing.deviceModel.name,
        repairType: pricing.repairType.name,
        partType: pricing.partType?.name || 'N/A',
        currentPrice,
        suggestedPrice,
        priceChange: formatPriceDifference(currentPrice, suggestedPrice),
        psychologicalPrice: psychPrice,
        needsPsychAdjustment,
        competitivePricing: {
          lowest: competitive.lowest,
          competitive: competitive.competitive,
          premium: competitive.premium
        },
        similarModels: similarEstimate ? {
          estimatedPrice: similarEstimate.price,
          confidence: similarEstimate.confidence,
          reason: similarEstimate.reason,
          variance: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`,
          varianceStatus
        } : null,
        recommendation,
        priority,
        isEstimated: pricing.isEstimated,
        confidenceScore: pricing.confidenceScore
      })
    }

    // Sort by priority
    const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 }
    analyses.sort((a, b) => priorityOrder[a.priority as 'high' | 'medium' | 'low'] - priorityOrder[b.priority as 'high' | 'medium' | 'low'])

    // Generate summary stats
    const summary = {
      totalAnalyzed: analyses.length,
      highPriority: analyses.filter(a => a.priority === 'high').length,
      mediumPriority: analyses.filter(a => a.priority === 'medium').length,
      needsPsychAdjustment: analyses.filter(a => a.needsPsychAdjustment).length,
      averageCurrentPrice: analyses.reduce((sum, a) => sum + a.currentPrice, 0) / analyses.length,
      averageSuggestedPrice: analyses.reduce((sum, a) => sum + a.suggestedPrice, 0) / analyses.length,
      potentialRevenue: analyses.reduce((sum, a) => sum + (a.suggestedPrice - a.currentPrice), 0),
      recommendations: {
        high: analyses.filter(a => a.priority === 'high'),
        medium: analyses.filter(a => a.priority === 'medium'),
        low: analyses.filter(a => a.priority === 'low')
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      analyses,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Pricing analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze pricing',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/pricing/analyze
 *
 * Get pricing analysis summary
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request)
  if (!auth.authorized) {
    return auth.response
  }

  try {
    // Quick analysis on all pricing
    const allPricing = await prisma.pricing.findMany({
      where: { isActive: true },
      select: {
        price: true,
        isEstimated: true,
        confidenceScore: true
      }
    })

    const needsPsychAdjustment = allPricing.filter(p => {
      const psychPrice = applyPsychologicalPricing(p.price)
      return psychPrice !== p.price
    }).length

    const lowConfidence = allPricing.filter(p =>
      p.isEstimated && p.confidenceScore && p.confidenceScore < 0.7
    ).length

    return NextResponse.json({
      totalPricing: allPricing.length,
      needsPsychAdjustment,
      lowConfidence,
      averagePrice: allPricing.reduce((sum, p) => sum + p.price, 0) / allPricing.length
    })

  } catch (error: any) {
    console.error('Error fetching analysis summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
