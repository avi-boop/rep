/**
 * Custom Error Classes
 * Provides specific error types for better error handling
 */

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string | number) {
    super(`${resource} not found${id ? `: ${id}` : ''}`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class BadRequestError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
    this.name = 'BadRequestError'
  }
}
