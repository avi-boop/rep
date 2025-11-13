/**
 * Secure Login API Route
 * Uses httpOnly cookies instead of localStorage for XSS protection
 * Includes rate limiting to prevent brute force attacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  comparePassword,
  checkRateLimit,
  clearRateLimit,
} from '@/lib/auth'

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)

    // Rate limiting - max 5 attempts per 15 minutes per IP/email
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `login:${validatedData.email}:${clientIp}`
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)

    if (!rateLimit.allowed) {
      const resetInMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { 
          error: 'Too many login attempts',
          message: `Please try again in ${resetInMinutes} minutes`,
          retryAfter: rateLimit.resetAt
        },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    // Check if user exists and account is active
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(validatedData.password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Clear rate limit on successful login
    clearRateLimit(rateLimitKey)

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Create response with user data (without password)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })

    // Set httpOnly cookies
    setAuthCookies(response, accessToken, refreshToken)

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
