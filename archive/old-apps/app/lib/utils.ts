import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique repair number
 * Format: RR-YYYYMMDD-XXX
 */
export function generateRepairNumber(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  
  return `RR-${year}${month}${day}-${random}`
}

/**
 * Format currency
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-800',
    diagnosed: 'bg-blue-100 text-blue-800',
    awaiting_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    awaiting_parts: 'bg-orange-100 text-orange-800',
    in_progress: 'bg-purple-100 text-purple-800',
    testing: 'bg-indigo-100 text-indigo-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    standard: 'bg-gray-100 text-gray-800',
    urgent: 'bg-orange-100 text-orange-800',
    express: 'bg-red-100 text-red-800',
  }
  
  return colors[priority] || 'bg-gray-100 text-gray-800'
}
