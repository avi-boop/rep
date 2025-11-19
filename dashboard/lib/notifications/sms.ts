import twilio from 'twilio'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Check if Twilio is configured
const isTwilioConfigured = Boolean(accountSid && authToken && twilioPhoneNumber)

const twilioClient = isTwilioConfigured
  ? twilio(accountSid, authToken)
  : null

// SMS Template Types
export type SMSTemplate =
  | 'repair_created'
  | 'repair_in_progress'
  | 'repair_completed'
  | 'repair_ready_for_pickup'
  | 'repair_delayed'
  | 'payment_received'

interface SMSParams {
  customerName: string
  orderNumber: string
  deviceModel?: string
  estimatedCompletion?: string
  totalPrice?: number
  notes?: string
}

// SMS Templates
const templates: Record<SMSTemplate, (params: SMSParams) => string> = {
  repair_created: (params) =>
    `Hi ${params.customerName}! Your repair order #${params.orderNumber} for ${params.deviceModel} has been created. We'll keep you updated on the progress. - The Profit Platform`,

  repair_in_progress: (params) =>
    `Hi ${params.customerName}! Your repair #${params.orderNumber} is now being worked on by our technicians. ${params.estimatedCompletion ? `Estimated completion: ${params.estimatedCompletion}.` : ''} - The Profit Platform`,

  repair_completed: (params) =>
    `Great news ${params.customerName}! Your repair #${params.orderNumber} is complete and ready for pickup. ${params.totalPrice ? `Total: $${params.totalPrice.toFixed(2)}.` : ''} - The Profit Platform`,

  repair_ready_for_pickup: (params) =>
    `Hi ${params.customerName}! Your device #${params.orderNumber} is ready for pickup at our store. Please bring your ID and payment if not already made. - The Profit Platform`,

  repair_delayed: (params) =>
    `Hi ${params.customerName}, we wanted to update you that repair #${params.orderNumber} is taking longer than expected. ${params.notes || 'We\'ll notify you as soon as it\'s complete.'} - The Profit Platform`,

  payment_received: (params) =>
    `Thank you ${params.customerName}! Payment of $${params.totalPrice?.toFixed(2)} for repair #${params.orderNumber} has been received. - The Profit Platform`,
}

/**
 * Send SMS notification
 */
export async function sendSMS(
  to: string,
  template: SMSTemplate,
  params: SMSParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if Twilio is configured
    if (!isTwilioConfigured) {
      console.warn('Twilio is not configured. SMS not sent.')
      return {
        success: false,
        error: 'Twilio is not configured',
      }
    }

    if (!twilioClient) {
      throw new Error('Twilio client not initialized')
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = to.startsWith('+') ? to : `+${to.replace(/[^\d]/g, '')}`

    // Get message from template
    const message = templates[template](params)

    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    })

    console.log(`SMS sent successfully: ${result.sid}`)

    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error: any) {
    console.error('Failed to send SMS:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}

/**
 * Send bulk SMS notifications
 */
export async function sendBulkSMS(
  recipients: Array<{ phone: string; template: SMSTemplate; params: SMSParams }>
): Promise<Array<{ phone: string; success: boolean; messageId?: string; error?: string }>> {
  const results = await Promise.all(
    recipients.map(async (recipient) => {
      const result = await sendSMS(recipient.phone, recipient.template, recipient.params)
      return {
        phone: recipient.phone,
        ...result,
      }
    })
  )

  return results
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic E.164 format validation
  const e164Regex = /^\+?[1-9]\d{1,14}$/
  const cleanedPhone = phone.replace(/[^\d+]/g, '')
  return e164Regex.test(cleanedPhone)
}

/**
 * Check if SMS service is available
 */
export function isSMSAvailable(): boolean {
  return isTwilioConfigured
}
