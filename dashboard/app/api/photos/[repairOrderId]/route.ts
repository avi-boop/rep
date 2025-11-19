import { NextRequest, NextResponse } from 'next/server'
import { listPhotos, deletePhoto } from '@/lib/storage/photos'
import { prisma } from '@/lib/db'

/**
 * GET /api/photos/[repairOrderId]
 * List all photos for a repair order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repairOrderId: string }> }
) {
  try {
    const { repairOrderId } = await params
    const id = parseInt(repairOrderId)

    // Verify repair order exists
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id },
    })

    if (!repairOrder) {
      return NextResponse.json(
        { error: 'Repair order not found' },
        { status: 404 }
      )
    }

    // List photos
    const result = await listPhotos(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photos: result.photos || [],
    })
  } catch (error: any) {
    console.error('Error listing photos:', error)
    return NextResponse.json(
      { error: 'Failed to list photos', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/photos/[repairOrderId]
 * Delete a photo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ repairOrderId: string }> }
) {
  try {
    const { repairOrderId } = await params
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Photo path is required' },
        { status: 400 }
      )
    }

    // Verify repair order exists
    const id = parseInt(repairOrderId)
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id },
    })

    if (!repairOrder) {
      return NextResponse.json(
        { error: 'Repair order not found' },
        { status: 404 }
      )
    }

    // Delete photo
    const result = await deletePhoto(path)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo', details: error.message },
      { status: 500 }
    )
  }
}
