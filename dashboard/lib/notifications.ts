// Notification service for SMS and Email
// This is a placeholder - implement with actual Twilio and SendGrid when ready

interface NotificationData {
  customerId: number
  repairOrderId?: number
  type: 'sms' | 'email'
  eventType: string
  message: string
  subject?: string
}

export async function sendNotification(data: NotificationData): Promise<boolean> {
  try {
    // Log notification (implement actual sending when credentials are available)
    console.log('Notification queued:', data)

    // TODO: Implement actual sending
    // if (data.type === 'sms') {
    //   await sendSMS(phone, data.message)
    // } else {
    //   await sendEmail(email, data.subject, data.message)
    // }

    return true
  } catch (error) {
    console.error('Failed to send notification:', error)
    return false
  }
}

// SMS Templates
export const smsTemplates = {
  repair_received: (orderNumber: string, deviceName: string) =>
    `Hi! We've received your ${deviceName}. Repair #${orderNumber}. We'll diagnose it shortly and send you a quote.`,
  
  quote_ready: (orderNumber: string, price: number) =>
    `Your repair quote is ready! Repair #${orderNumber} - Total: $${price.toFixed(2)}. Reply YES to approve.`,
  
  in_progress: (orderNumber: string) =>
    `Good news! We've started working on your repair #${orderNumber}.`,
  
  ready_pickup: (orderNumber: string, balance: number) =>
    `Great news! Your device is ready for pickup! Repair #${orderNumber}. Balance: $${balance.toFixed(2)}.`,
  
  completed: (orderNumber: string) =>
    `Your repair #${orderNumber} is complete! Thank you for choosing us.`
}

// Email Templates
export const emailTemplates = {
  repair_received: (orderNumber: string, customerName: string, deviceName: string) => ({
    subject: `Repair Order Received - ${orderNumber}`,
    html: `
      <h2>Hello ${customerName}!</h2>
      <p>We've received your <strong>${deviceName}</strong> for repair.</p>
      <p>Order Number: <strong>${orderNumber}</strong></p>
      <p>We'll diagnose the issue and send you a detailed quote shortly.</p>
      <p>You can track your repair status anytime by visiting our website.</p>
      <p>Thank you for choosing us!</p>
    `
  }),
  
  quote_ready: (orderNumber: string, customerName: string, price: number, items: string[]) => ({
    subject: `Repair Quote Ready - ${orderNumber}`,
    html: `
      <h2>Hello ${customerName}!</h2>
      <p>We've completed the diagnosis for your repair <strong>${orderNumber}</strong>.</p>
      <h3>Repairs Needed:</h3>
      <ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>
      <p><strong>Total Cost: $${price.toFixed(2)}</strong></p>
      <p>Please reply to this email or call us to approve the repair.</p>
    `
  }),
  
  ready_pickup: (orderNumber: string, customerName: string, balance: number) => ({
    subject: `Device Ready for Pickup - ${orderNumber}`,
    html: `
      <h2>Great News ${customerName}!</h2>
      <p>Your device repair is complete and ready for pickup!</p>
      <p>Order Number: <strong>${orderNumber}</strong></p>
      <p>Balance Due: <strong>$${balance.toFixed(2)}</strong></p>
      <p>Visit us during business hours to collect your device.</p>
      <p>Thank you for your business!</p>
    `
  })
}

// Helper to send notifications on status change
export async function sendStatusChangeNotification(
  repairOrderId: number,
  newStatus: string,
  customerPhone: string,
  customerEmail: string | null,
  orderNumber: string,
  deviceName: string
): Promise<void> {
  const statusNotifications: Record<string, { sms: string; email?: any }> = {
    pending: {
      sms: smsTemplates.repair_received(orderNumber, deviceName)
    },
    in_progress: {
      sms: smsTemplates.in_progress(orderNumber)
    },
    ready_pickup: {
      sms: smsTemplates.ready_pickup(orderNumber, 0) // Calculate actual balance
    }
  }

  const notification = statusNotifications[newStatus]
  if (!notification) return

  // Send SMS
  await sendNotification({
    customerId: 0, // Get from repair order
    repairOrderId,
    type: 'sms',
    eventType: `status_${newStatus}`,
    message: notification.sms
  })

  // Send Email if available
  if (customerEmail && notification.email) {
    await sendNotification({
      customerId: 0,
      repairOrderId,
      type: 'email',
      eventType: `status_${newStatus}`,
      message: notification.email.html,
      subject: notification.email.subject
    })
  }
}
