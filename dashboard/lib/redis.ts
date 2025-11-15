/**
 * Redis client for distributed rate limiting and caching
 * Replaces in-memory storage for production scalability
 */

import { createClient } from 'redis'

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null

/**
 * Get or create Redis client
 */
export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  // Create new client
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Max reconnection attempts reached')
          return new Error('Max reconnection attempts reached')
        }
        return Math.min(retries * 100, 3000)
      },
    },
  })

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  redisClient.on('connect', () => {
    console.log('Redis: Connected successfully')
  })

  redisClient.on('reconnecting', () => {
    console.log('Redis: Reconnecting...')
  })

  await redisClient.connect()

  return redisClient
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit()
    redisClient = null
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = await getRedisClient()
    await client.ping()
    return true
  } catch (error) {
    console.error('Redis not available:', error)
    return false
  }
}
