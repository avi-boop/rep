import { z } from 'zod'
import { normalizePhone } from '@/lib/utils/phone'

/**
 * Validation schema for creating a new customer
 * All individual fields are optional, but at least one identifier is required:
 * - Phone number OR
 * - Email OR
 * - Both first name AND last name
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
    .transform((val) => {
      // Normalize phone to digits only for consistent storage
      if (!val || val.trim() === '') return ''
      return normalizePhone(val)
    })
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
}).refine(
  (data) => {
    // Require at least one identifier:
    // 1. Valid phone number (10+ digits) OR
    // 2. Valid email OR
    // 3. Both first and last name
    const hasPhone = data.phone && data.phone.length >= 10
    const hasEmail = data.email && data.email.trim() !== ''
    const hasFullName = data.firstName && data.firstName.trim() !== '' &&
                       data.lastName && data.lastName.trim() !== ''

    return hasPhone || hasEmail || hasFullName
  },
  {
    message: 'Please provide at least one of: phone number, email, or full name (first and last)',
  }
)

/**
 * Validation schema for updating an existing customer
 * Same as create but without the "at least one identifier" requirement
 * since we're updating an existing customer that already has an ID
 */
export const updateCustomerSchema = z.object({
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
    .transform((val) => {
      if (!val || val.trim() === '') return ''
      return normalizePhone(val)
    })
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
}).partial()

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
