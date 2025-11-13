/**
 * Validation Schemas using Zod
 * Centralized validation for API routes to prevent SQL injection and invalid data
 */

import { z } from 'zod'

// ============================================================================
// PRICING VALIDATION
// ============================================================================

export const createPricingSchema = z.object({
  deviceModelId: z.number().int().positive('Device model ID must be a positive integer'),
  repairTypeId: z.number().int().positive('Repair type ID must be a positive integer'),
  price: z.number().positive('Price must be positive').max(999999, 'Price too large'),
  laborCost: z.number().positive().optional(),
  partsCost: z.number().positive().optional(),
  estimatedTime: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const updatePricingSchema = createPricingSchema.partial().extend({
  id: z.number().int().positive('Pricing ID must be a positive integer'),
})

export const pricingQuerySchema = z.object({
  deviceModelId: z.string().regex(/^\d+$/, 'Invalid device model ID').optional(),
  repairTypeId: z.string().regex(/^\d+$/, 'Invalid repair type ID').optional(),
  minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional(),
  page: z.string().regex(/^\d+$/, 'Invalid page number').optional(),
  pageSize: z.string().regex(/^\d+$/, 'Invalid page size').optional(),
})

// ============================================================================
// REPAIR VALIDATION
// ============================================================================

export const createRepairSchema = z.object({
  customerId: z.number().int().positive('Customer ID must be a positive integer'),
  deviceModelId: z.number().int().positive('Device model ID must be a positive integer'),
  repairTypeId: z.number().int().positive('Repair type ID must be a positive integer'),
  description: z.string().min(10, 'Description too short').max(2000, 'Description too long'),
  issues: z.string().max(1000, 'Issues description too long').optional(),
  deviceCondition: z.string().max(500, 'Condition description too long').optional(),
  password: z.string().max(100, 'Password too long').optional(),
  imei: z.string().regex(/^\d{15}$/, 'Invalid IMEI format').optional(),
  serialNumber: z.string().max(100, 'Serial number too long').optional(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  estimatedCompletionDate: z.string().datetime().optional(),
})

export const updateRepairSchema = z.object({
  id: z.number().int().positive('Repair ID must be a positive integer'),
  status: z.enum(['pending', 'diagnosed', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled']).optional(),
  technicianNotes: z.string().max(2000, 'Notes too long').optional(),
  actualPrice: z.number().positive('Price must be positive').max(999999, 'Price too large').optional(),
  completedDate: z.string().datetime().optional(),
})

export const repairQuerySchema = z.object({
  status: z.enum(['pending', 'diagnosed', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled']).optional(),
  customerId: z.string().regex(/^\d+$/, 'Invalid customer ID').optional(),
  technicianId: z.string().regex(/^\d+$/, 'Invalid technician ID').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/, 'Invalid page number').optional(),
  pageSize: z.string().regex(/^\d+$/, 'Invalid page size').optional(),
})

// ============================================================================
// CUSTOMER VALIDATION
// ============================================================================

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name required').max(100, 'Last name too long'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format').min(10, 'Phone too short').max(20, 'Phone too long'),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(100, 'State name too long').optional(),
  zipCode: z.string().regex(/^\d{4,6}$/, 'Invalid zip code').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.number().int().positive('Customer ID must be a positive integer'),
})

export const customerQuerySchema = z.object({
  search: z.string().max(200, 'Search query too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20, 'Phone too long').optional(),
  page: z.string().regex(/^\d+$/, 'Invalid page number').optional(),
  pageSize: z.string().regex(/^\d+$/, 'Invalid page size').optional(),
})

// ============================================================================
// AUTHENTICATION VALIDATION
// ============================================================================

export const loginSchema = z.object({
  username: z.string().min(3, 'Username too short').max(50, 'Username too long'),
  password: z.string().min(6, 'Password too short').max(100, 'Password too long'),
})

export const registerSchema = z.object({
  username: z.string().min(3, 'Username too short').max(50, 'Username too long'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  firstName: z.string().min(1, 'First name required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name required').max(100, 'Last name too long'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Confirm password required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// ============================================================================
// DEVICE & BRAND VALIDATION
// ============================================================================

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name required').max(100, 'Brand name too long'),
  logoUrl: z.string().url('Invalid URL').optional(),
  websiteUrl: z.string().url('Invalid URL').optional(),
  isActive: z.boolean().optional(),
})

export const createDeviceModelSchema = z.object({
  brandId: z.number().int().positive('Brand ID must be a positive integer'),
  name: z.string().min(1, 'Model name required').max(100, 'Model name too long'),
  releaseYear: z.number().int().min(2000, 'Invalid year').max(2030, 'Invalid year').optional(),
  imageUrl: z.string().url('Invalid URL').optional(),
  isActive: z.boolean().optional(),
})

// ============================================================================
// SETTINGS VALIDATION
// ============================================================================

export const updateSettingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name required').max(200, 'Shop name too long').optional(),
  shopEmail: z.string().email('Invalid email format').optional(),
  shopPhone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format').optional(),
  shopAddress: z.string().max(500, 'Address too long').optional(),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate too high').optional(),
  currency: z.string().length(3, 'Currency must be 3 letters').optional(),
  timezone: z.string().max(50, 'Timezone string too long').optional(),
  notificationsEnabled: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely parse and validate request body
 * Returns either validated data or throws error with details
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      throw new ValidationError('Validation failed', formattedErrors)
    }
    throw error
  }
}

/**
 * Safely parse and validate query parameters
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: URLSearchParams): T {
  const data = Object.fromEntries(params.entries())
  return validateRequestBody(schema, data)
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreatePricing = z.infer<typeof createPricingSchema>
export type UpdatePricing = z.infer<typeof updatePricingSchema>
export type CreateRepair = z.infer<typeof createRepairSchema>
export type UpdateRepair = z.infer<typeof updateRepairSchema>
export type CreateCustomer = z.infer<typeof createCustomerSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
export type LoginRequest = z.infer<typeof loginSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
