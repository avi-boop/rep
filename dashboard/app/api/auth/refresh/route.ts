/**
 * Refresh Token API Route
 * Generates new access token using refresh token
 */

import { NextRequest } from 'next/server'
import { refreshAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const result = await refreshAccessToken(request)
  return result.response
}
