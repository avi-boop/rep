/**
 * Pricing Validation Schemas
 */

import { z } from 'zod'

// Create pricing schema
export const createPricingSchema = z.object({
  deviceModelId: z.number().int().positive(),
  repairTypeId: z.number().int().positive(),
  partTypeId: z.number().int().positive(),
  price: z.number().min(0),
  cost: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  isEstimated: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
})

// Update pricing schema
export const updatePricingSchema = z.object({
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isEstimated: z.boolean().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
})

// Price estimation request schema
export const priceEstimationSchema = z.object({
  deviceModelId: z.number().int().positive(),
  repairTypeId: z.number().int().positive(),
  partTypeId: z.number().int().positive()
})

// Query filters schema
export const pricingQuerySchema = z.object({
  deviceModelId: z.coerce.number().int().positive().optional(),
  repairTypeId: z.coerce.number().int().positive().optional(),
  partTypeId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  isEstimated: z.coerce.boolean().optional()
})

export type CreatePricing = z.infer<typeof createPricingSchema>
export type UpdatePricing = z.infer<typeof updatePricingSchema>
export type PriceEstimationRequest = z.infer<typeof priceEstimationSchema>
export type PricingQuery = z.infer<typeof pricingQuerySchema>
