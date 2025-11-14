import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { requireAuth } from '@/lib/auth'

const execAsync = promisify(exec)

/**
 * POST /api/pricing/sync
 *
 * Triggers intelligent Lightspeed pricing import
 * Runs the import script and returns results
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request)
  if (!auth.authorized) {
    return auth.response
  }

  try {
    console.log('🚀 Starting Lightspeed pricing sync...')

    // Run the import script (command is hardcoded to prevent injection)
    const { stdout, stderr } = await execAsync('npm run import:pricing', {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      shell: '/bin/sh', // Explicitly set shell
      timeout: 5 * 60 * 1000 // 5 minute timeout
    })

    // Parse output for stats (if available)
    const output = stdout + stderr

    // Extract stats from output
    const importedMatch = output.match(/New prices imported: (\d+)/)
    const updatedMatch = output.match(/Existing prices updated: (\d+)/)
    const estimatedMatch = output.match(/Prices estimated intelligently: (\d+)/)
    const skippedMatch = output.match(/Skipped \(older data\): (\d+)/)

    const stats = {
      imported: importedMatch ? parseInt(importedMatch[1]) : 0,
      updated: updatedMatch ? parseInt(updatedMatch[1]) : 0,
      estimated: estimatedMatch ? parseInt(estimatedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Pricing sync completed:', stats)

    return NextResponse.json({
      success: true,
      message: 'Pricing sync completed successfully',
      stats,
      output: output.split('\n').slice(-20).join('\n') // Last 20 lines
    })

  } catch (error: any) {
    console.error('❌ Pricing sync failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Pricing sync failed',
      message: error.message,
      details: error.stderr || error.stdout
    }, { status: 500 })
  }
}

/**
 * GET /api/pricing/sync
 *
 * Check sync status / last sync time
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request)
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const { prisma } = await import('@/lib/prisma')

    // Get latest price update
    const latestUpdate = await prisma.pricing.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })

    // Count pricing records
    const total = await prisma.pricing.count()
    const estimated = await prisma.pricing.count({
      where: { isEstimated: true }
    })
    const active = await prisma.pricing.count({
      where: { isActive: true }
    })

    return NextResponse.json({
      lastSync: latestUpdate?.updatedAt || null,
      stats: {
        total,
        active,
        estimated,
        confirmed: total - estimated
      }
    })

  } catch (error: any) {
    console.error('Error getting sync status:', error)
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 })
  }
}
