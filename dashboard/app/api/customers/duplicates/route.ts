import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizePhone } from '@/lib/utils/phone'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * GET /api/customers/duplicates
 * List all duplicate groups with optional filtering
 *
 * Query params:
 * - minConfidence: Minimum confidence score (default: 70)
 * - method: Filter by detection method (phone, email, name)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const minConfidence = parseInt(searchParams.get('minConfidence') || '70')
    const method = searchParams.get('method')

    // Load report from file
    const reportPath = path.join(process.cwd(), 'reports/customer-duplicates-report.json')

    if (!fs.existsSync(reportPath)) {
      return NextResponse.json(
        { error: 'No duplicate analysis report found. Run analysis first.' },
        { status: 404 }
      )
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))

    let groups = report.duplicateGroups

    // Filter by confidence
    if (minConfidence) {
      groups = groups.filter((g: any) => g.confidence >= minConfidence)
    }

    // Filter by method
    if (method) {
      groups = groups.filter((g: any) => g.detectionMethod === method)
    }

    return NextResponse.json({
      timestamp: report.timestamp,
      summary: {
        ...report.summary,
        filteredGroups: groups.length
      },
      groups
    })
  } catch (error) {
    console.error('Error fetching duplicates:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch duplicates'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/customers/duplicates
 * Run duplicate analysis
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Running duplicate analysis...')

    // Run analysis script
    const scriptPath = path.join(process.cwd(), 'scripts/analyze-customer-duplicates.ts')
    const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath}`)

    if (stderr && !stderr.includes('Warning')) {
      console.error('Analysis stderr:', stderr)
    }

    console.log('Analysis output:', stdout)

    // Read the generated report
    const reportPath = path.join(process.cwd(), 'reports/customer-duplicates-report.json')
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))

    return NextResponse.json({
      message: 'Analysis completed successfully',
      summary: report.summary,
      reportPath
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error running analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run analysis' },
      { status: 500 }
    )
  }
}
