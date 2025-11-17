/**
 * Common Validation Schemas
 * Shared schemas used across multiple entities
 */

import { z } from 'zod'

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ID parameter schema
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1).max(100)
})

export type PaginationParams = z.infer<typeof paginationSchema>
export type IdParam = z.infer<typeof idParamSchema>
export type DateRange = z.infer<typeof dateRangeSchema>
export type SearchParams = z.infer<typeof searchSchema>
