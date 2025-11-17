/**
 * API Helper Functions
 * Utilities for API routes including validation, pagination, and response formatting
 */

import { z, ZodSchema } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

// ===================================
// Request Validation
// ===================================

export interface ValidationResult<T> {
  success: true
  data: T
}

export interface ValidationError {
  success: false
  error: NextResponse
}

export type ValidatedRequest<T> = ValidationResult<T> | ValidationError

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidatedRequest<T>> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
    }
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidatedRequest<T> {
  try {
    const searchParams = request.nextUrl.searchParams
    const query: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      query[key] = value
    })
    const data = schema.parse(query)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
    }
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }
  }
}

// ===================================
// Pagination
// ===================================

export interface PaginationParams {
  page: number
  limit: number
  skip: number
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrder = (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'

  return { page, limit, skip, sortBy, sortOrder }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)
  const hasMore = params.page < totalPages

  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore,
    },
  }
}

// ===================================
// Response Helpers
// ===================================

export interface ApiSuccessResponse<T = unknown> {
  data: T
  meta?: Record<string, unknown>
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, ...(meta && { meta }) })
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const response: { error: string; details?: unknown } = { error: message }
  if (details) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

// ===================================
// Query Builders
// ===================================

/**
 * Build Prisma where clause from query parameters
 */
export function buildWhereClause<T extends Record<string, unknown>>(
  query: T
): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value
    }
  })

  return where
}

/**
 * Build Prisma orderBy clause from sort parameters
 */
export function buildOrderByClause(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Prisma.SortOrder | Record<string, Prisma.SortOrder> | undefined {
  if (!sortBy) return undefined

  return { [sortBy]: sortOrder }
}
