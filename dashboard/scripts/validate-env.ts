#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * Validates all required environment variables are present and properly formatted
 */

import { z } from 'zod'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') })

// Define environment variable schema
const envSchema = z.object({
  // Database (Required)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid PostgreSQL connection string').optional(),

  // NextAuth (Required for authentication)
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),

  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Encryption (Required for device passwords)
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),

  // Twilio (Optional - for SMS notifications)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // SendGrid (Optional - for email notifications)
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email('FROM_EMAIL must be a valid email').optional(),

  // Lightspeed POS (Optional - for integration)
  LIGHTSPEED_API_KEY: z.string().optional(),
  LIGHTSPEED_ACCOUNT_ID: z.string().optional(),
  LIGHTSPEED_API_URL: z.string().url('LIGHTSPEED_API_URL must be a valid URL').optional(),
  LIGHTSPEED_DOMAIN_PREFIX: z.string().optional(),
  LIGHTSPEED_API_TOKEN: z.string().optional(),

  // Gemini AI (Optional - for pricing estimation)
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_URL: z.string().url('GEMINI_API_URL must be a valid URL').optional(),

  // Redis (Optional - for caching and rate limiting)
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string').optional(),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Monitoring (Optional - for error tracking)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('NEXT_PUBLIC_SENTRY_DSN must be a valid URL').optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

function print(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function printSuccess(message: string) {
  print('green', `✓ ${message}`)
}

function printError(message: string) {
  print('red', `✗ ${message}`)
}

function printWarning(message: string) {
  print('yellow', `⚠ ${message}`)
}

function printInfo(message: string) {
  print('blue', `ℹ ${message}`)
}

console.log('')
printInfo('Mobile Repair Dashboard - Environment Validation')
console.log('='.repeat(55))
console.log('')

try {
  // Validate environment variables
  const env = envSchema.parse(process.env)

  printSuccess('Required environment variables validated')
  console.log('')

  // Check optional features
  printInfo('Optional Features Status:')
  console.log('')

  const features = {
    'Authentication': !!env.NEXTAUTH_SECRET,
    'Password Encryption': !!env.ENCRYPTION_KEY,
    'SMS Notifications': !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
    'Email Notifications': !!env.SENDGRID_API_KEY,
    'Lightspeed Integration': !!(env.LIGHTSPEED_API_KEY || env.LIGHTSPEED_API_TOKEN),
    'AI Pricing': !!env.GEMINI_API_KEY,
    'Caching (Redis)': !!(env.REDIS_URL || env.UPSTASH_REDIS_REST_URL),
    'Error Monitoring': !!env.NEXT_PUBLIC_SENTRY_DSN,
  }

  for (const [feature, enabled] of Object.entries(features)) {
    const status = enabled ? '✓ Enabled' : '✗ Disabled'
    const color = enabled ? 'green' : 'yellow'
    print(color, `  ${status.padEnd(12)} ${feature}`)
  }

  console.log('')

  // Warnings
  const warnings: string[] = []

  if (env.NODE_ENV === 'production') {
    if (!env.NEXTAUTH_SECRET) {
      warnings.push('NEXTAUTH_SECRET is missing - Authentication will not work!')
    }
    if (!env.ENCRYPTION_KEY) {
      warnings.push('ENCRYPTION_KEY is missing - Device passwords will be stored in plaintext!')
    }
    if (env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('NEXTAUTH_SECRET should be at least 32 characters for security')
    }
    if (!env.NEXT_PUBLIC_SENTRY_DSN) {
      warnings.push('Sentry monitoring not configured - errors will not be tracked')
    }
  }

  if (warnings.length > 0) {
    console.log('')
    printWarning('Warnings:')
    warnings.forEach(warning => printWarning(`  - ${warning}`))
  }

  console.log('')
  printSuccess('Environment validation passed! 🎉')
  console.log('')

  process.exit(0)
} catch (error) {
  if (error instanceof z.ZodError) {
    printError('Environment validation failed!')
    console.log('')
    printError('Missing or invalid environment variables:')
    console.log('')

    error.errors.forEach(err => {
      printError(`  ${err.path.join('.')}: ${err.message}`)
    })

    console.log('')
    printInfo('Please check your .env file and ensure all required variables are set.')
    printInfo('See .env.example for a template.')
    console.log('')

    process.exit(1)
  }

  printError('Unexpected error during validation:')
  console.error(error)
  process.exit(1)
}
