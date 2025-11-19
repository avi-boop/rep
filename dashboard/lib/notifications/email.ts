import sgMail from '@sendgrid/mail'

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.FROM_EMAIL || 'noreply@theprofitplatform.com.au'

// Check if SendGrid is configured
const isSendGridConfigured = Boolean(apiKey)

if (isSendGridConfigured && apiKey) {
  sgMail.setApiKey(apiKey)
}

// Email Template Types
export type EmailTemplate =
  | 'repair_created'
  | 'repair_in_progress'
  | 'repair_completed'
  | 'repair_ready_for_pickup'
  | 'repair_delayed'
  | 'payment_received'
  | 'payment_reminder'

interface EmailParams {
  customerName: string
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

/**
 * Generate HTML email template
 */
function generateEmailHTML(template: EmailTemplate, params: EmailParams): string {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
      .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      .highlight { color: #2563eb; font-weight: bold; }
      ul { padding-left: 20px; }
      li { margin: 8px 0; }
    </style>
  `

  const templates: Record<EmailTemplate, string> = {
    repair_created: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Repair Order Created</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>Thank you for choosing The Profit Platform for your device repair!</p>

            <div class="info-box">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> <span class="highlight">#${params.orderNumber}</span></p>
              <p><strong>Device:</strong> ${params.deviceBrand || ''} ${params.deviceModel || ''}</p>
              ${params.estimatedCompletion ? `<p><strong>Estimated Completion:</strong> ${params.estimatedCompletion}</p>` : ''}
              ${params.totalPrice ? `<p><strong>Estimated Cost:</strong> $${params.totalPrice.toFixed(2)}</p>` : ''}
            </div>

            ${params.repairItems && params.repairItems.length > 0 ? `
              <div class="info-box">
                <h3>Services</h3>
                <ul>
                  ${params.repairItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <p>We'll keep you updated on the progress of your repair.</p>
            ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="button">Track Your Repair</a>` : ''}
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
            <p>Questions? Reply to this email or call us.</p>
          </div>
        </div>
      </body>
      </html>
    `,

    repair_in_progress: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Repair In Progress</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>Great news! Our technicians have started working on your device.</p>

            <div class="info-box">
              <p><strong>Order Number:</strong> <span class="highlight">#${params.orderNumber}</span></p>
              <p><strong>Status:</strong> In Progress</p>
              ${params.estimatedCompletion ? `<p><strong>Estimated Completion:</strong> ${params.estimatedCompletion}</p>` : ''}
            </div>

            ${params.notes ? `<div class="info-box"><p><strong>Technician Notes:</strong> ${params.notes}</p></div>` : ''}

            <p>We'll notify you as soon as your repair is complete!</p>
            ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="button">Track Your Repair</a>` : ''}
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `,

    repair_completed: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Repair Complete!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>Excellent news! Your device repair has been completed successfully.</p>

            <div class="info-box">
              <p><strong>Order Number:</strong> <span class="highlight">#${params.orderNumber}</span></p>
              <p><strong>Device:</strong> ${params.deviceBrand || ''} ${params.deviceModel || ''}</p>
              ${params.actualCompletion ? `<p><strong>Completed On:</strong> ${params.actualCompletion}</p>` : ''}
              ${params.totalPrice ? `<p><strong>Total Cost:</strong> $${params.totalPrice.toFixed(2)}</p>` : ''}
            </div>

            <p>Your device is ready for pickup at our store. Please bring your ID and make payment if not already completed.</p>
            ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="button">View Receipt</a>` : ''}
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `,

    repair_ready_for_pickup: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Ready for Pickup</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>Your device is repaired and ready to be picked up!</p>

            <div class="info-box">
              <p><strong>Order Number:</strong> <span class="highlight">#${params.orderNumber}</span></p>
              ${params.totalPrice ? `<p><strong>Amount Due:</strong> $${params.totalPrice.toFixed(2)}</p>` : ''}
            </div>

            <div class="info-box">
              <h3>Pickup Instructions</h3>
              <ul>
                <li>Bring a valid ID</li>
                <li>Quote order number: #${params.orderNumber}</li>
                ${params.remainingAmount && params.remainingAmount > 0 ? `<li>Payment of $${params.remainingAmount.toFixed(2)} required</li>` : ''}
              </ul>
            </div>

            <p>We look forward to seeing you soon!</p>
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `,

    repair_delayed: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏱️ Repair Update</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>We wanted to keep you informed about your repair order #<strong>${params.orderNumber}</strong>.</p>

            <div class="info-box">
              <p>Your repair is taking longer than initially estimated.</p>
              ${params.notes ? `<p><strong>Reason:</strong> ${params.notes}</p>` : ''}
              ${params.estimatedCompletion ? `<p><strong>New Estimated Completion:</strong> ${params.estimatedCompletion}</p>` : ''}
            </div>

            <p>We apologize for the delay and appreciate your patience. We'll notify you as soon as it's ready.</p>
            ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="button">Track Your Repair</a>` : ''}
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `,

    payment_received: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Received</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>Thank you! We've received your payment.</p>

            <div class="info-box">
              <p><strong>Order Number:</strong> #${params.orderNumber}</p>
              <p><strong>Amount Paid:</strong> <span class="highlight">$${params.paidAmount?.toFixed(2)}</span></p>
              ${params.remainingAmount && params.remainingAmount > 0 ? `<p><strong>Remaining Balance:</strong> $${params.remainingAmount.toFixed(2)}</p>` : ''}
            </div>

            <p>A receipt has been generated for your records.</p>
            ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="button">View Receipt</a>` : ''}
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `,

    payment_reminder: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${params.customerName}</strong>,</p>
            <p>This is a friendly reminder about the outstanding balance for repair order #<strong>${params.orderNumber}</strong>.</p>

            <div class="info-box">
              <p><strong>Total Cost:</strong> $${params.totalPrice?.toFixed(2)}</p>
              <p><strong>Amount Paid:</strong> $${params.paidAmount?.toFixed(2)}</p>
              <p><strong>Amount Due:</strong> <span class="highlight">$${params.remainingAmount?.toFixed(2)}</span></p>
            </div>

            <p>Please arrange payment at your earliest convenience to collect your device.</p>
          </div>
          <div class="footer">
            <p>The Profit Platform | repair.theprofitplatform.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  return templates[template]
}

/**
 * Get email subject line
 */
function getSubject(template: EmailTemplate, orderNumber: string): string {
  const subjects: Record<EmailTemplate, string> = {
    repair_created: `Repair Order #${orderNumber} Created`,
    repair_in_progress: `Your Repair #${orderNumber} is In Progress`,
    repair_completed: `Repair #${orderNumber} Complete - Ready for Pickup!`,
    repair_ready_for_pickup: `Your Device #${orderNumber} is Ready for Pickup`,
    repair_delayed: `Update on Repair #${orderNumber}`,
    payment_received: `Payment Received - Order #${orderNumber}`,
    payment_reminder: `Payment Reminder - Order #${orderNumber}`,
  }

  return subjects[template]
}

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  params: EmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if SendGrid is configured
    if (!isSendGridConfigured) {
      console.warn('SendGrid is not configured. Email not sent.')
      return {
        success: false,
        error: 'SendGrid is not configured',
      }
    }

    const msg = {
      to,
      from: fromEmail,
      subject: getSubject(template, params.orderNumber),
      html: generateEmailHTML(template, params),
    }

    const [response] = await sgMail.send(msg)

    console.log(`Email sent successfully: ${response.headers['x-message-id']}`)

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmail(
  recipients: Array<{ email: string; template: EmailTemplate; params: EmailParams }>
): Promise<Array<{ email: string; success: boolean; messageId?: string; error?: string }>> {
  const results = await Promise.all(
    recipients.map(async (recipient) => {
      const result = await sendEmail(recipient.email, recipient.template, recipient.params)
      return {
        email: recipient.email,
        ...result,
      }
    })
  )

  return results
}

/**
 * Check if email service is available
 */
export function isEmailAvailable(): boolean {
  return isSendGridConfigured
}
