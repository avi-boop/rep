import { NextRequest, NextResponse } from 'next/server';
import { forecastInventory } from '@/lib/gemini-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Fetch historical repair data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const repairs = await prisma.repairOrder.findMany({
      where: {
        createdAt: {
          gte: ninetyDaysAgo,
        },
        status: {
          in: ['completed', 'delivered'],
        },
      },
      include: {
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true,
          },
        },
        deviceModel: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (repairs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient historical data. Need at least 30 days of repair history.',
      }, { status: 400 });
    }

    // Aggregate parts usage data
    const partsUsage: Record<string, any[]> = {};

    repairs.forEach(repair => {
      repair.repairOrderItems.forEach(item => {
        const partKey = item.partType.name;

        if (!partsUsage[partKey]) {
          partsUsage[partKey] = [];
        }

        partsUsage[partKey].push({
          part_name: item.partType.name,
          part_type_id: item.partType.id,
          quality_level: item.partType.qualityLevel,
          warranty_months: item.partType.warrantyMonths,
          quantity: item.quantity,
          date: repair.createdAt,
          device_type: `${repair.deviceModel.brand.name} ${repair.deviceModel.name}`,
          repair_type: item.repairType.name,
        });
      });
    });

    // Calculate current stock levels (TODO: implement actual inventory tracking)
    const partStockLevels: Record<string, number> = {};
    Object.keys(partsUsage).forEach(partName => {
      // Placeholder: assume 20 units average stock
      partStockLevels[partName] = Math.floor(Math.random() * 40) + 10;
    });

    // Prepare data for AI analysis
    const historicalData = Object.entries(partsUsage).map(([partName, usage]) => ({
      part_name: partName,
      part_type_id: usage[0]?.part_type_id,
      quality_level: usage[0]?.quality_level,
      current_stock: partStockLevels[partName] || 0,
      usage_history: usage.map(u => ({
        date: u.date,
        quantity: u.quantity,
        device_type: u.device_type,
        repair_type: u.repair_type,
      })),
      total_used: usage.reduce((sum, u) => sum + u.quantity, 0),
      days_tracked: Math.floor((Date.now() - usage[0].date.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    // Call Gemini AI for forecasting
    const forecast = await forecastInventory(historicalData);

    const responseTime = Date.now() - startTime;

    if (!forecast.success) {
      console.error('AI Forecast failed:', forecast.error);

      return NextResponse.json(
        {
          success: false,
          error: forecast.error || 'Failed to generate forecast',
        },
        { status: 500 }
      );
    }

    // Save forecasts to database (TODO: uncomment when migrations run)
    /*
    const forecastRecords = forecast.data!.forecasts.map(f => ({
      partName: f.part_name,
      partTypeId: f.part_id ? parseInt(f.part_id) : null,
      forecastDate: new Date(),
      currentStock: f.current_stock,
      weeklyUsage: f.weekly_usage,
      trend: f.trend,
      predicted30DayDemand: f.predicted_30day_demand,
      recommendedOrder: f.recommended_order,
      confidence: f.confidence,
      reasoning: f.reasoning,
      metadata: {
        model: forecast.metadata?.model,
        responseTime,
      },
    }));

    await prisma.inventoryForecast.createMany({
      data: forecastRecords,
    });
    */

    // Log analytics
    console.log('AI Inventory Forecast Analytics:', {
      endpoint: '/api/ai/forecast',
      model: forecast.metadata?.model,
      responseTime,
      success: true,
      partsAnalyzed: forecast.data!.forecasts.length,
      highPriorityParts: forecast.data!.summary.high_priority.length,
      totalInvestmentNeeded: forecast.data!.summary.total_investment_needed,
    });

    return NextResponse.json({
      success: true,
      forecast: forecast.data,
      historical_data_summary: {
        parts_tracked: Object.keys(partsUsage).length,
        total_repairs: repairs.length,
        date_range: {
          from: repairs[0]?.createdAt,
          to: repairs[repairs.length - 1]?.createdAt,
        },
      },
      metadata: {
        ...forecast.metadata,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('AI Forecast API Error:', error);

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

// Get historical forecasts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const part_name = searchParams.get('part_name');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // TODO: Uncomment when migrations run
    /*
    const forecasts = await prisma.inventoryForecast.findMany({
      where: {
        ...(part_name && { partName: part_name }),
        forecastDate: {
          gte: startDate,
        },
      },
      orderBy: {
        forecastDate: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      forecasts,
    });
    */

    return NextResponse.json({
      success: true,
      forecasts: [],
      message: 'Forecast history will be available after database migration',
    });

  } catch (error: any) {
    console.error('Get Forecast History Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch forecast history',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
