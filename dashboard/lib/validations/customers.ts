/**
 * Customer Validation Schemas
 */

import { z } from 'zod'

// Phone number regex (simple validation)
const phoneRegex = /^\+?[1-9]\d{1,14}$/

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  sms: z.boolean().default(true),
  email: z.boolean().default(true),
  push: z.boolean().default(false)
})

// Create customer schema
export const createCustomerSchema = z.object({
  lightspeedId: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
  notificationPreferences: notificationPreferencesSchema.optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true)
})

// Update customer schema
export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional()
})

// Query filters schema
export const customerQuerySchema = z.object({
  search: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  lightspeedId: z.string().max(50).optional()
})

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
export type CreateCustomer = z.infer<typeof createCustomerSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
export type CustomerQuery = z.infer<typeof customerQuerySchema>
