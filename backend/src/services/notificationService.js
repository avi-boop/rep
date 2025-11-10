// =============================================================================
// NOTIFICATION SERVICE
// =============================================================================
// Handles SMS, Email, and Push notifications

/**
 * Send SMS via Twilio
 */
async function sendSMS(phoneNumber, message) {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio not configured, skipping SMS');
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send Email via SendGrid
 */
async function sendEmail(to, subject, htmlContent) {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid not configured, skipping email');
      return {
        success: false,
        error: 'SendGrid not configured'
      };
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME || 'Repair Shop'
      },
      subject,
      html: htmlContent
    };

    const result = await sgMail.send(msg);

    return {
      success: true,
      messageId: result[0].headers['x-message-id']
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification based on event type
 */
async function sendNotificationForEvent(eventType, repairOrder, customer) {
  const messages = {
    order_created: `Hi ${customer.firstName}, we received your ${repairOrder.deviceModel.brand.name} ${repairOrder.deviceModel.name} for repair. Order #${repairOrder.orderNumber}. We'll keep you updated!`,
    status_in_progress: `Update for Order #${repairOrder.orderNumber}: Your device repair is now in progress. We'll notify you when it's ready!`,
    status_completed: `Great news ${customer.firstName}! Your ${repairOrder.deviceModel.brand.name} ${repairOrder.deviceModel.name} is ready for pickup. Order #${repairOrder.orderNumber}. Total: $${repairOrder.totalPrice}`,
    status_ready_pickup: `Reminder: Your device (Order #${repairOrder.orderNumber}) is ready for pickup at your convenience.`
  };

  const message = messages[eventType] || `Update for Order #${repairOrder.orderNumber}`;

  // Send via preferred channel
  const prefs = customer.notificationPreferences || {};
  
  if (prefs.sms && customer.phone) {
    await sendSMS(customer.phone, message);
  }
  
  if (prefs.email && customer.email) {
    await sendEmail(customer.email, `Repair Order Update - #${repairOrder.orderNumber}`, `<p>${message}</p>`);
  }

  return { success: true };
}

module.exports = {
  sendSMS,
  sendEmail,
  sendNotificationForEvent
};
