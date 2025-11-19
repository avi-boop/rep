import { NextRequest, NextResponse } from 'next/server'
import { uploadPhoto, isStorageAvailable, getStorageConfig } from '@/lib/storage/photos'
import { prisma } from '@/lib/db'

/**
 * GET /api/photos/upload
 * Check storage service status
 */
export async function GET() {
  try {
    const config = getStorageConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get storage status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/photos/upload
 * Upload photo for a repair order
 */
export async function POST(request: NextRequest) {
  try {
    // Check if storage is available
    if (!isStorageAvailable()) {
      return NextResponse.json(
        { error: 'Photo storage is not configured' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const repairOrderId = formData.get('repairOrderId') as string
    const type = formData.get('type') as 'before' | 'after' | 'during' | 'damage'
    const description = formData.get('description') as string | undefined

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!repairOrderId) {
      return NextResponse.json(
        { error: 'repairOrderId is required' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required (before, after, during, damage)' },
        { status: 400 }
      )
    }

    // Verify repair order exists
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id: parseInt(repairOrderId) },
    })

    if (!repairOrder) {
      return NextResponse.json(
        { error: 'Repair order not found' },
        { status: 404 }
      )
    }

    // Upload photo
    const result = await uploadPhoto(file, {
      repairOrderId: parseInt(repairOrderId),
      type,
      description,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Save photo record to database (optional - you can create a Photo model)
    // For now, we'll just return the upload result

    return NextResponse.json({
      success: true,
      photo: {
        url: result.url,
        path: result.path,
        type,
        description,
      },
    })
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo', details: error.message },
      { status: 500 }
    )
  }
}
