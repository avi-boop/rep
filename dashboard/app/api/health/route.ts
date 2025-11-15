import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Coolify and monitoring
 * GET /api/health
 */
export async function GET() {
  try {
    // Basic health check - returns 200 if the app is running
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 200 }
    );
  } catch (error) {
    // Return 503 Service Unavailable if something is wrong
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
