import { NextRequest, NextResponse } from 'next/server';
import { geminiAIService } from '@/lib/gemini-ai';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/integrations/gemini/pricing
 * Get AI-powered pricing recommendation for a repair
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceBrand, deviceModel, repairType, partQuality } = body;

    if (!deviceBrand || !deviceModel || !repairType) {
      return NextResponse.json(
        { error: 'Device brand, model, and repair type are required' },
        { status: 400 }
      );
    }

    if (!geminiAIService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Gemini AI not configured',
          message: 'Please add your Gemini API key in settings to use AI pricing intelligence.',
          configured: false,
        },
        { status: 400 }
      );
    }

    // Get AI pricing recommendation
    const recommendation = await geminiAIService.getRepairPriceIntelligence({
      deviceBrand,
      deviceModel,
      repairType,
      partQuality: partQuality || 'OEM',
    });

    return NextResponse.json({
      success: true,
      recommendation,
      configured: true,
    });

  } catch (error: any) {
    console.error('Gemini AI pricing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI pricing recommendation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/gemini/pricing
 * Get market insights for a category
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter required' },
        { status: 400 }
      );
    }

    if (!geminiAIService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Gemini AI not configured',
          configured: false,
        },
        { status: 400 }
      );
    }

    const insights = await geminiAIService.getMarketInsights(category);

    return NextResponse.json({
      success: true,
      insights,
      configured: true,
    });

  } catch (error: any) {
    console.error('Error getting market insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get market insights' },
      { status: 500 }
    );
  }
}
