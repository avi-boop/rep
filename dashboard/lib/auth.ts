/**
 * Secure Authentication Utilities
 * Handles JWT tokens with httpOnly cookies (XSS protection)
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Environment validation
const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate environment variables
const env = authEnvSchema.parse({
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
})

// Token payload interface
export interface TokenPayload {
  userId: number
  email: string
  role?: string
}

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string | number,
  })
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as string | number,
  })
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Set authentication cookies in response
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  // Set access token cookie (24 hours)
  response.cookies.set('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24, // 24 hours in seconds
  })

  // Set refresh token cookie (7 days)
  response.cookies.set('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  })

  return response
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set('accessToken', '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })

  response.cookies.set('refreshToken', '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })

  return response
}

/**
 * Get access token from request cookies
 */
export function getAccessToken(request: NextRequest): string | null {
  return request.cookies.get('accessToken')?.value || null
}

/**
 * Get refresh token from request cookies
 */
export function getRefreshToken(request: NextRequest): string | null {
  return request.cookies.get('refreshToken')?.value || null
}

/**
 * Authenticate request and return user payload
 */
export function authenticateRequest(request: NextRequest): TokenPayload | null {
  const token = getAccessToken(request)
  
  if (!token) {
    return null
  }

  return verifyAccessToken(token)
}

/**
 * Middleware helper to require authentication
 */
export function requireAuth(request: NextRequest): { 
  authorized: false; 
  user: null; 
  response: NextResponse 
} | { 
  authorized: true; 
  user: TokenPayload; 
  response: null 
} {
  const user = authenticateRequest(request)

  if (!user) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  return {
    authorized: true,
    user,
    response: null,
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  request: NextRequest
): Promise<{ success: true; response: NextResponse } | { success: false; response: NextResponse }> {
  const refreshToken = getRefreshToken(request)

  if (!refreshToken) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      ),
    }
  }

  const payload = verifyRefreshToken(refreshToken)

  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      ),
    }
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set('accessToken', newAccessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return {
    success: true,
    response,
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 10)
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}

/**
 * Generate random token for password reset, email verification, etc.
 */
export function generateRandomToken(length: number = 32): string {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Rate limiting helper (stores in-memory, use Redis for production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  // Clean up expired records
  if (record && record.resetAt < now) {
    rateLimitStore.delete(key)
  }

  if (!record || record.resetAt < now) {
    // First attempt or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: now + windowMs,
    }
  }

  // Increment attempt count
  record.count++

  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    }
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  }
}

/**
 * Clear rate limit for a key (useful after successful login)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key)
}
