import { toast } from 'sonner'

/**
 * Toast notification helpers with consistent messaging
 */

export const toastHelpers = {
  // Repair Order notifications
  repairCreated: (orderNumber: string, notificationsSent: { sms: boolean; email: boolean }) => {
    const channels = []
    if (notificationsSent.sms) channels.push('SMS')
    if (notificationsSent.email) channels.push('Email')

    const message = channels.length > 0
      ? `${orderNumber} created. Notifications sent via ${channels.join(' & ')}`
      : `${orderNumber} created successfully`

    toast.success(message, {
      description: 'Customer has been notified',
    })
  },

  repairUpdated: (orderNumber: string) => {
    toast.success(`${orderNumber} updated successfully`)
  },

  statusChanged: (status: string, notified: boolean) => {
    toast.success(`Status changed to ${status}`, {
      description: notified ? 'Customer has been notified' : undefined,
    })
  },

  // Photo upload notifications
  photoUploaded: (type: string) => {
    toast.success(`${type} photo uploaded successfully`)
  },

  photoDeleted: () => {
    toast.success('Photo deleted')
  },

  // Customer notifications
  customerCreated: (name: string) => {
    toast.success(`Customer ${name} created successfully`)
  },

  // Pricing notifications
  priceFetched: (price: number) => {
    toast.success(`Price updated: $${price.toFixed(2)}`)
  },

  priceNotFound: () => {
    toast.error('No pricing found for this combination', {
      description: 'Please enter price manually',
    })
  },

  // Generic notifications
  success: (message: string, description?: string) => {
    toast.success(message, { description })
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description })
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description })
  },

  loading: (message: string, id?: string) => {
    return toast.loading(message, { id })
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },

  // Notification service status
  notificationPartialFailure: (sent: string[], failed: string[]) => {
    toast.warning('Notifications partially sent', {
      description: `Sent: ${sent.join(', ')}. Failed: ${failed.join(', ')}`,
    })
  },

  notificationAllFailed: () => {
    toast.error('Failed to send notifications', {
      description: 'Please contact support if the issue persists',
    })
  },
}
