import { z } from 'zod'

/**
 * Validation schema for creating a new customer
 * All fields are optional to allow flexible data entry
 */
export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .max(100, 'First name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  lastName: z
    .string()
    .max(100, 'Last name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        // Remove all non-digit characters for validation
        const digitsOnly = val.replace(/\D/g, '')
        return digitsOnly.length >= 10 && digitsOnly.length <= 15
      },
      { message: 'Phone number must contain 10-15 digits' }
    )
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        return /^[\d\s\-\+\(\)]+$/.test(val)
      },
      { message: 'Phone number contains invalid characters' }
    )
    .transform((val) => val ? val.trim() : '')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),

  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  notificationPreferences: z
    .object({
      sms: z.boolean(),
      email: z.boolean(),
      push: z.boolean(),
    })
    .optional()
})

/**
 * Validation schema for updating an existing customer
 * Same as create but all fields are optional
 */
export const updateCustomerSchema = createCustomerSchema.partial()

/**
 * Validation schema for customer search queries
 */
export const customerSearchSchema = z.object({
  search: z
    .string()
    .min(2, 'Search term must be at least 2 characters')
    .max(100, 'Search term must be less than 100 characters')
    .trim()
    .optional(),

  hasActiveRepairs: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true')
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>
