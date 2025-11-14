import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/pricing/stats
 *
 * Get comprehensive pricing statistics and insights
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request)
  if (!auth.authorized) {
    return auth.response
  }

  try {
    // Overall counts
    const totalPricing = await prisma.pricing.count()
    const activePricing = await prisma.pricing.count({ where: { isActive: true } })
    const estimatedPricing = await prisma.pricing.count({ where: { isEstimated: true } })

    // Price ranges
    const priceStats = await prisma.pricing.aggregate({
      where: { isActive: true },
      _avg: { price: true, cost: true },
      _min: { price: true, cost: true },
      _max: { price: true, cost: true }
    })

    // Pricing by repair type
    const byRepairType = await prisma.pricing.groupBy({
      by: ['repairTypeId'],
      where: { isActive: true },
      _count: true,
      _avg: { price: true }
    })

    const repairTypeDetails = await Promise.all(
      byRepairType.map(async (item) => {
        const repairType = await prisma.repairType.findUnique({
          where: { id: item.repairTypeId },
          select: { name: true, category: true }
        })
        return {
          name: repairType?.name || 'Unknown',
          category: repairType?.category || 'Other',
          count: item._count,
          avgPrice: item._avg.price || 0
        }
      })
    )

    // Pricing by device model (top 10)
    const byDevice = await prisma.pricing.groupBy({
      by: ['deviceModelId'],
      where: { isActive: true },
      _count: true,
      _avg: { price: true }
    })

    const topDevices = await Promise.all(
      byDevice
        .sort((a, b) => b._count - a._count)
        .slice(0, 10)
        .map(async (item) => {
          const device = await prisma.deviceModel.findUnique({
            where: { id: item.deviceModelId },
            include: { brand: true }
          })
          return {
            name: device?.name || 'Unknown',
            brand: device?.brand.name || 'Unknown',
            count: item._count,
            avgPrice: item._avg.price || 0
          }
        })
    )

    // Recent price changes (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentChanges = await prisma.priceHistory.count({
      where: {
        changedAt: { gte: thirtyDaysAgo }
      }
    })

    // Estimated vs Confirmed breakdown
    const estimatedBreakdown = await prisma.pricing.groupBy({
      by: ['isEstimated'],
      where: { isActive: true },
      _count: true,
      _avg: { confidenceScore: true }
    })

    const breakdown = {
      confirmed: estimatedBreakdown.find(e => !e.isEstimated)?._count || 0,
      estimated: estimatedBreakdown.find(e => e.isEstimated)?._count || 0,
      avgConfidence: estimatedBreakdown.find(e => e.isEstimated)?._avg.confidenceScore || 0
    }

    // Low confidence prices (need review)
    const lowConfidence = await prisma.pricing.count({
      where: {
        isActive: true,
        isEstimated: true,
        confidenceScore: { lt: 0.7 }
      }
    })

    // Missing cost data
    const missingCost = await prisma.pricing.count({
      where: {
        isActive: true,
        cost: null
      }
    })

    return NextResponse.json({
      overview: {
        total: totalPricing,
        active: activePricing,
        estimated: estimatedPricing,
        confirmed: totalPricing - estimatedPricing,
        needsReview: lowConfidence,
        missingCost
      },
      priceRanges: {
        avg: priceStats._avg.price || 0,
        min: priceStats._min.price || 0,
        max: priceStats._max.price || 0,
        avgCost: priceStats._avg.cost || 0
      },
      byRepairType: repairTypeDetails.sort((a, b) => b.avgPrice - a.avgPrice),
      topDevices,
      breakdown,
      recentActivity: {
        priceChangesLast30Days: recentChanges
      }
    })

  } catch (error: any) {
    console.error('Error fetching pricing stats:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing statistics' }, { status: 500 })
  }
}
