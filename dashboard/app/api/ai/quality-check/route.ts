import { NextRequest, NextResponse } from 'next/server';
import { qualityCheckRepair } from '@/lib/gemini-client';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Input validation schema
const QualityCheckRequestSchema = z.object({
  repair_order_id: z.number().int().positive(),
  photos: z.array(z.string().min(100)).min(1).max(5),
  repair_type: z.string().optional(),
  check_type: z.enum(['pre_delivery', 'in_process', 'final']).default('final'),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await req.json();
    const validation = QualityCheckRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { repair_order_id, photos, repair_type, check_type } = validation.data;

    // Fetch repair order details
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id: repair_order_id },
      include: {
        repairOrderItems: {
          include: {
            repairType: true,
          },
        },
        deviceModel: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (!repairOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Repair order not found',
        },
        { status: 404 }
      );
    }

    // Determine repair type for context
    const repairTypes = repairOrder.repairOrderItems
      .map(item => item.repairType.name)
      .join(', ');

    const effectiveRepairType = repair_type || repairTypes || 'General Repair';

    // Analyze each photo
    const photoAnalyses = await Promise.all(
      photos.map(async (photo, index) => {
        const analysis = await qualityCheckRepair(photo, effectiveRepairType);

        return {
          photo_index: index + 1,
          success: analysis.success,
          result: analysis.data,
          error: analysis.error,
        };
      })
    );

    // Aggregate results
    const successfulAnalyses = photoAnalyses.filter(a => a.success && a.result);
    const failedAnalyses = photoAnalyses.filter(a => !a.success);

    if (successfulAnalyses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All photo analyses failed',
          details: failedAnalyses.map(a => a.error),
        },
        { status: 500 }
      );
    }

    // Calculate overall metrics
    const avgScore = successfulAnalyses.reduce((sum, a) => sum + (a.result!.score || 0), 0) / successfulAnalyses.length;
    const overallPassed = successfulAnalyses.every(a => a.result!.passed);

    // Collect all issues
    const allIssues = successfulAnalyses.flatMap(a => a.result!.issues || []);

    // Collect all recommendations
    const allRecommendations = [
      ...new Set(successfulAnalyses.flatMap(a => a.result!.recommendations || []))
    ];

    // Categorize issues by severity
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const moderateIssues = allIssues.filter(i => i.severity === 'moderate');
    const minorIssues = allIssues.filter(i => i.severity === 'minor');

    const responseTime = Date.now() - startTime;

    // Save quality check result (TODO: uncomment when migrations run)
    /*
    await prisma.aIQualityCheck.create({
      data: {
        repairOrderId: repair_order_id,
        checkType: check_type,
        passed: overallPassed,
        score: avgScore,
        issues: allIssues,
        recommendations: allRecommendations,
        metadata: {
          photosAnalyzed: successfulAnalyses.length,
          photosFailed: failedAnalyses.length,
          model: 'gemini-2.0-flash-exp',
          responseTime,
        },
      },
    });
    */

    // Log analytics
    console.log('AI Quality Check Analytics:', {
      endpoint: '/api/ai/quality-check',
      model: 'gemini-2.0-flash-exp',
      responseTime,
      success: true,
      repairOrderId: repair_order_id,
      photosAnalyzed: successfulAnalyses.length,
      overallPassed,
      avgScore,
      criticalIssues: criticalIssues.length,
    });

    return NextResponse.json({
      success: true,
      overall_result: {
        passed: overallPassed,
        score: avgScore,
        total_issues: allIssues.length,
        critical_issues: criticalIssues.length,
        moderate_issues: moderateIssues.length,
        minor_issues: minorIssues.length,
      },
      photo_analyses: successfulAnalyses.map(a => ({
        photo_index: a.photo_index,
        passed: a.result!.passed,
        score: a.result!.score,
        issues: a.result!.issues,
      })),
      recommendations: allRecommendations,
      repair_order: {
        id: repairOrder.id,
        order_number: repairOrder.orderNumber,
        device: `${repairOrder.deviceModel.brand.name} ${repairOrder.deviceModel.name}`,
        repair_types: repairTypes,
      },
      metadata: {
        check_type,
        photos_analyzed: successfulAnalyses.length,
        photos_failed: failedAnalyses.length,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('AI Quality Check API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get quality check history for a repair order
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repair_order_id = searchParams.get('repair_order_id');

    if (!repair_order_id) {
      return NextResponse.json(
        { error: 'repair_order_id required' },
        { status: 400 }
      );
    }

    // TODO: Uncomment when migrations run
    /*
    const qcHistory = await prisma.aIQualityCheck.findMany({
      where: {
        repairOrderId: parseInt(repair_order_id),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      quality_checks: qcHistory,
    });
    */

    return NextResponse.json({
      success: true,
      quality_checks: [],
      message: 'Quality check history will be available after database migration',
    });

  } catch (error: any) {
    console.error('Get QC History Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quality check history',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
