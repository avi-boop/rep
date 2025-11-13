/**
 * Notification Service
 *
 * Handles email and SMS notifications for repair orders
 * Ready for integration with Resend (email) and Twilio (SMS)
 */

import { prisma } from './prisma'

type NotificationChannel = 'email' | 'sms' | 'push'
type NotificationEvent =
  | 'repair_created'
  | 'repair_approved'
  | 'repair_in_progress'
  | 'repair_completed'
  | 'repair_ready_pickup'
  | 'payment_received'

interface NotificationConfig {
  email?: {
    provider: 'resend' | 'sendgrid'
    apiKey: string
    fromEmail: string
    fromName: string
  }
  sms?: {
    provider: 'twilio' | 'messagebird'
    accountSid: string
    authToken: string
    fromNumber: string
  }
}

interface NotificationData {
  customerName: string
  orderNumber: string
  deviceName: string
  repairType: string
  price: number
  estimatedTime?: string
  trackingUrl?: string
  notes?: string
}

export class NotificationService {
  private config: NotificationConfig

  constructor() {
    this.config = {
      email: process.env.RESEND_API_KEY ? {
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'repairs@metrowireless.com.au',
        fromName: process.env.NOTIFICATION_FROM_NAME || 'Metro Wireless'
      } : undefined,
      sms: process.env.TWILIO_ACCOUNT_SID ? {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || ''
      } : undefined
    }
  }

  /**
   * Check if email is configured
   */
  isEmailConfigured(): boolean {
    return !!this.config.email
  }

  /**
   * Check if SMS is configured
   */
  isSMSConfigured(): boolean {
    return !!this.config.sms
  }

  /**
   * Send notification based on repair order event
   */
  async sendRepairNotification(
    repairOrderId: number,
    event: NotificationEvent
  ): Promise<void> {
    console.log(`📧 Notification: ${event} for repair #${repairOrderId}`)
    // Service ready for Email/SMS integration
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
