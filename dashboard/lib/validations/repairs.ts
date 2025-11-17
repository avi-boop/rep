/**
 * Repair Order Validation Schemas
 */

import { z } from 'zod'

// Repair status enum
export const repairStatusSchema = z.enum([
  'pending',
  'in_progress',
  'waiting_parts',
  'completed',
  'ready_pickup',
  'delivered',
  'cancelled'
])

// Repair priority enum
export const repairPrioritySchema = z.enum(['normal', 'urgent', 'express'])

// Repair order item schema
export const repairOrderItemSchema = z.object({
  repairTypeId: z.number().int().positive(),
  partTypeId: z.number().int().positive(),
  pricingId: z.number().int().positive().optional(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  totalPrice: z.number().min(0),
  technicianNotes: z.string().max(1000).optional()
})

// Create repair order schema
export const createRepairOrderSchema = z.object({
  customerId: z.number().int().positive(),
  deviceModelId: z.number().int().positive(),
  deviceImei: z.string().max(50).optional(),
  deviceSerial: z.string().max(50).optional(),
  devicePassword: z.string().max(100).optional(),
  status: repairStatusSchema.default('pending'),
  priority: repairPrioritySchema.default('normal'),
  issueDescription: z.string().max(2000).optional(),
  cosmeticCondition: z.string().max(500).optional(),
  estimatedCompletion: z.string().datetime().optional(),
  depositPaid: z.number().min(0).default(0),
  assignedTechnicianId: z.number().int().positive().optional(),
  repairItems: z.array(repairOrderItemSchema).min(1)
})

// Update repair order schema
export const updateRepairOrderSchema = z.object({
  status: repairStatusSchema.optional(),
  priority: repairPrioritySchema.optional(),
  issueDescription: z.string().max(2000).optional(),
  cosmeticCondition: z.string().max(500).optional(),
  estimatedCompletion: z.string().datetime().optional(),
  actualCompletion: z.string().datetime().optional(),
  depositPaid: z.number().min(0).optional(),
  assignedTechnicianId: z.number().int().positive().nullable().optional()
})

// Update repair status schema
export const updateRepairStatusSchema = z.object({
  status: repairStatusSchema,
  notes: z.string().max(500).optional()
})

// Query filters schema
export const repairQuerySchema = z.object({
  status: repairStatusSchema.optional(),
  priority: repairPrioritySchema.optional(),
  customerId: z.coerce.number().int().positive().optional(),
  assignedTechnicianId: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export type RepairStatus = z.infer<typeof repairStatusSchema>
export type RepairPriority = z.infer<typeof repairPrioritySchema>
export type RepairOrderItem = z.infer<typeof repairOrderItemSchema>
export type CreateRepairOrder = z.infer<typeof createRepairOrderSchema>
export type UpdateRepairOrder = z.infer<typeof updateRepairOrderSchema>
export type UpdateRepairStatus = z.infer<typeof updateRepairStatusSchema>
export type RepairQuery = z.infer<typeof repairQuerySchema>
