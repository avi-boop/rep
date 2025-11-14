import { Prisma } from '@prisma/client'

// Extended types with relations
export type RepairOrderWithDetails = Prisma.RepairOrderGetPayload<{
  include: {
    customer: true
    deviceModel: {
      include: {
        brand: true
      }
    }
    repairOrderItems: {
      include: {
        repairType: true
        partType: true
      }
    }
  }
}>

export type CustomerWithRepairOrders = Prisma.CustomerGetPayload<{
  include: {
    repairOrders: {
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        }
      }
    }
  }
}>

export type PricingWithDetails = Prisma.PricingGetPayload<{
  include: {
    deviceModel: {
      include: {
        brand: true
      }
    }
    repairType: true
    partType: true
  }
}>

// Form types
export interface CreateRepairForm {
  customerId: number
  deviceModelId: number
  deviceImei?: string
  deviceCondition?: string
  priority: 'standard' | 'urgent' | 'express'
  repairItems: {
    repairTypeId: number
    partsQuality: string
  }[]
  notes?: string
  estimatedCompletion?: Date
}

export interface CreateCustomerForm {
  firstName: string
  lastName: string
  phone: string
  email?: string
  notificationPreference: 'sms' | 'email' | 'both'
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard stats
export interface DashboardStats {
  todayRepairs: number
  pendingRepairs: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  completedToday: number
  urgentRepairs: number
}

// Price estimation result
export interface PriceEstimation {
  price: number
  confidence: number
  isEstimated: boolean
  source: string
}
