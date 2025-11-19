/**
 * Phone number utilities for normalization and formatting
 */

/**
 * Normalizes a phone number to digits only for storage
 * Removes all non-digit characters
 * @param phone - Raw phone number input
 * @returns Normalized phone string with digits only
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Formats a phone number for display
 * Converts digits-only format to a readable format
 * @param phone - Normalized phone number (digits only)
 * @returns Formatted phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''

  const digits = normalizePhone(phone)

  // Format as (XXX) XXX-XXXX for 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Format as +X (XXX) XXX-XXXX for 11-digit numbers (with country code)
  if (digits.length === 11) {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // For other lengths, just return the digits
  return digits
}

/**
 * Validates if a phone number has enough digits
 * @param phone - Phone number to validate
 * @returns true if phone has 10-15 digits
 */
export function isValidPhoneLength(phone: string | null | undefined): boolean {
  if (!phone) return false
  const digits = normalizePhone(phone)
  return digits.length >= 10 && digits.length <= 15
}
