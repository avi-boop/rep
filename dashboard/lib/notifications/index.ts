import { sendSMS, SMSTemplate, isSMSAvailable } from './sms'
import { sendEmail, EmailTemplate, isEmailAvailable } from './email'

export { sendSMS, sendEmail, isSMSAvailable, isEmailAvailable }
export type { SMSTemplate, EmailTemplate }

interface NotificationParams {
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  orderNumber: string
  deviceModel?: string
  deviceBrand?: string
  estimatedCompletion?: string
  actualCompletion?: string
  totalPrice?: number
  paidAmount?: number
  remainingAmount?: number
  repairItems?: string[]
  notes?: string
  trackingUrl?: string
}

type NotificationTemplate =
  | 'repair_created'
  | 'repair_in_progress'
  | 'repair_completed'
  | 'repair_ready_for_pickup'
  | 'repair_delayed'
  | 'payment_received'
  | 'payment_reminder'

interface NotificationResult {
  sms: {
    sent: boolean
    success?: boolean
    messageId?: string
    error?: string
  }
  email: {
    sent: boolean
    success?: boolean
    messageId?: string
    error?: string
  }
}

/**
 * Send notification via both SMS and Email
 * Will use whichever channels are configured and customer has opted in for
 */
export async function sendNotification(
  template: NotificationTemplate,
  params: NotificationParams,
  options: {
    sendSMS?: boolean
    sendEmail?: boolean
  } = {
    sendSMS: true,
    sendEmail: true,
  }
): Promise<NotificationResult> {
  const result: NotificationResult = {
    sms: { sent: false },
    email: { sent: false },
  }

  // Send SMS if enabled and available
  if (options.sendSMS && isSMSAvailable() && params.customerPhone) {
    try {
      const smsResult = await sendSMS(
        params.customerPhone,
        template as SMSTemplate,
        {
          customerName: params.customerName,
          orderNumber: params.orderNumber,
          deviceModel: params.deviceModel,
          estimatedCompletion: params.estimatedCompletion,
          totalPrice: params.totalPrice,
          notes: params.notes,
        }
      )

      result.sms = {
        sent: true,
        ...smsResult,
      }
    } catch (error: any) {
      result.sms = {
        sent: true,
        success: false,
        error: error.message,
      }
    }
  }

  // Send Email if enabled and available
  if (options.sendEmail && isEmailAvailable() && params.customerEmail) {
    try {
      const emailResult = await sendEmail(
        params.customerEmail,
        template as EmailTemplate,
        {
          customerName: params.customerName,
          orderNumber: params.orderNumber,
          deviceModel: params.deviceModel,
          deviceBrand: params.deviceBrand,
          estimatedCompletion: params.estimatedCompletion,
          actualCompletion: params.actualCompletion,
          totalPrice: params.totalPrice,
          paidAmount: params.paidAmount,
          remainingAmount: params.remainingAmount,
          repairItems: params.repairItems,
          notes: params.notes,
          trackingUrl: params.trackingUrl,
        }
      )

      result.email = {
        sent: true,
        ...emailResult,
      }
    } catch (error: any) {
      result.email = {
        sent: true,
        success: false,
        error: error.message,
      }
    }
  }

  return result
}

/**
 * Check notification service availability
 */
export function getNotificationStatus() {
  return {
    sms: {
      available: isSMSAvailable(),
      provider: 'Twilio',
    },
    email: {
      available: isEmailAvailable(),
      provider: 'SendGrid',
    },
  }
}

/**
 * Helper function to send repair status notifications
 */
export async function notifyRepairStatus(
  customerId: number,
  customerData: {
    firstName: string
    lastName: string
    email: string | null
    phone: string
    notificationPreferences?: string | null
  },
  repairData: {
    orderNumber: string
    deviceModel?: string
    deviceBrand?: string
    status: string
    totalPrice?: number
    estimatedCompletion?: string
    actualCompletion?: string
  },
  status: 'created' | 'in_progress' | 'completed' | 'ready_for_pickup' | 'delayed'
) {
  // Parse notification preferences
  const prefs = customerData.notificationPreferences
    ? JSON.parse(customerData.notificationPreferences)
    : { sms: true, email: true }

  const template = `repair_${status}` as NotificationTemplate

  const trackingUrl = `${process.env.NEXTAUTH_URL || 'https://repair.theprofitplatform.com.au'}/track/${repairData.orderNumber}`

  return await sendNotification(
    template,
    {
      customerName: `${customerData.firstName} ${customerData.lastName}`,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      orderNumber: repairData.orderNumber,
      deviceModel: repairData.deviceModel,
      deviceBrand: repairData.deviceBrand,
      estimatedCompletion: repairData.estimatedCompletion,
      actualCompletion: repairData.actualCompletion,
      totalPrice: repairData.totalPrice,
      trackingUrl,
    },
    {
      sendSMS: prefs.sms !== false,
      sendEmail: prefs.email !== false,
    }
  )
}
