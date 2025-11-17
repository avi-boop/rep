/**
 * Centralized Error Handler
 * Handles all API errors consistently with proper status codes
 */

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import * as Errors from './errors'

export interface ApiErrorResponse {
  error: string
  details?: unknown
  field?: string
  code?: string
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Log error (will be replaced with proper logging later)
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
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

  // Custom validation errors
  if (error instanceof Errors.ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details
      },
      { status: 400 }
    )
  }

  // Bad request errors
  if (error instanceof Errors.BadRequestError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details
      },
      { status: 400 }
    )
  }

  // Not found errors
  if (error instanceof Errors.NotFoundError) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 404 }
    )
  }

  // Unauthorized errors
  if (error instanceof Errors.UnauthorizedError) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 401 }
    )
  }

  // Forbidden errors
  if (error instanceof Errors.ForbiddenError) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 403 }
    )
  }

  // Conflict errors
  if (error instanceof Errors.ConflictError) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 409 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Resource not found',
          code: error.code
        },
        { status: 404 }
      )
    }

    // Unique constraint violation
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined
      return NextResponse.json(
        {
          error: 'Duplicate entry',
          field: target?.join(', '),
          code: error.code
        },
        { status: 409 }
      )
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Invalid reference',
          field: error.meta?.field_name as string | undefined,
          code: error.code
        },
        { status: 400 }
      )
    }

    // Record required but not found
    if (error.code === 'P2018') {
      return NextResponse.json(
        {
          error: 'Required record not found',
          code: error.code
        },
        { status: 400 }
      )
    }

    // Generic Prisma error
    return NextResponse.json(
      {
        error: 'Database error',
        code: error.code
      },
      { status: 500 }
    )
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Invalid data provided'
      },
      { status: 400 }
    )
  }

  // Default server error
  return NextResponse.json(
    {
      error: 'Internal server error'
    },
    { status: 500 }
  )
}

/**
 * Helper to parse integer safely
 */
export function parseIntSafe(value: string, fieldName: string = 'id'): number {
  const parsed = parseInt(value)
  if (isNaN(parsed)) {
    throw new Errors.BadRequestError(`Invalid ${fieldName}: must be a number`)
  }
  return parsed
}

/**
 * Helper to parse float safely
 */
export function parseFloatSafe(value: string | number, fieldName: string = 'value'): number {
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(parsed)) {
    throw new Errors.BadRequestError(`Invalid ${fieldName}: must be a number`)
  }
  return parsed
}
