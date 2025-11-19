import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

/**
 * GET /api/customers/duplicates/[groupId]
 * Get details of a specific duplicate group
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const params = await context.params
    const groupId = decodeURIComponent(params.groupId)

    // Load report from file
    const reportPath = path.join(process.cwd(), 'reports/customer-duplicates-report.json')

    if (!fs.existsSync(reportPath)) {
      return NextResponse.json(
        { error: 'No duplicate analysis report found. Run analysis first.' },
        { status: 404 }
      )
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
    const group = report.duplicateGroups.find((g: any) => g.id === groupId)

    if (!group) {
      return NextResponse.json(
        { error: `Duplicate group "${groupId}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching duplicate group:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch duplicate group'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
