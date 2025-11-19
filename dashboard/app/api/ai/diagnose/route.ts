import { NextRequest, NextResponse } from 'next/server';
import { diagnoseRepair } from '@/lib/gemini-client';
import { z } from 'zod';

// Input validation schema
const DiagnoseRequestSchema = z.object({
  image_base64: z.string().min(100, 'Image data too small'),
  device_type: z.string().min(1, 'Device type required'),
  repair_order_id: z.string().optional(),
});

// Rate limiting helper (simple in-memory for now)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 20; // requests
  const window = 60 * 1000; // per minute

  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again in a minute.',
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const validation = DiagnoseRequestSchema.safeParse(body);

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

    const { image_base64, device_type, repair_order_id } = validation.data;

    // Validate image size (max 10MB base64 ~= 7.5MB actual)
    if (image_base64.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image too large. Maximum size is 10MB.',
        },
        { status: 413 }
      );
    }

    // Call Gemini AI for diagnosis
    const diagnosis = await diagnoseRepair(image_base64, device_type);

    const responseTime = Date.now() - startTime;

    if (!diagnosis.success) {
      // Log error analytics
      console.error('AI Diagnosis failed:', diagnosis.error);

      return NextResponse.json(
        {
          success: false,
          error: diagnosis.error || 'Failed to analyze image',
        },
        { status: 500 }
      );
    }

    // Map damages to repair suggestions
    const suggestedRepairs = diagnosis.data!.damages.map(damage => {
      const repairMap: Record<string, string> = {
        screen_crack: 'Screen Replacement',
        water_damage: 'Water Damage Repair',
        port_damage: 'Charging Port Repair',
        button_damage: 'Button Repair',
        dent: 'Housing Replacement',
        scratch: 'Housing Replacement',
        other: 'General Repair',
      };

      return {
        type: repairMap[damage.type] || 'General Repair',
        priority: damage.severity === 'severe' ? 'high' : damage.severity === 'moderate' ? 'medium' : 'low',
        description: damage.description,
        location: damage.location,
      };
    });

    // Log analytics (TODO: save to database when migrations are run)
    console.log('AI Diagnosis Analytics:', {
      endpoint: '/api/ai/diagnose',
      model: diagnosis.metadata?.model,
      responseTime,
      success: true,
      deviceType: device_type,
      damagesFound: diagnosis.data!.damages.length,
      confidence: diagnosis.data!.confidence,
    });

    return NextResponse.json({
      success: true,
      diagnosis: diagnosis.data,
      suggested_repairs: suggestedRepairs,
      device_type,
      metadata: {
        ...diagnosis.metadata,
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('AI Diagnosis API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    endpoint: '/api/ai/diagnose',
    model: 'gemini-2.0-flash-exp',
    features: ['vision', 'damage_detection', 'repair_suggestions'],
    rateLimit: '20 requests per minute',
  });
}
