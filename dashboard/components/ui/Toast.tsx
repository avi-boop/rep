'use client'

import { Toaster as SonnerToaster } from 'sonner'

/**
 * Toast notification component using Sonner
 *
 * Usage:
 * import { toast } from 'sonner'
 *
 * toast.success('Order created successfully!')
 * toast.error('Failed to save changes')
 * toast.info('Processing your request...')
 * toast.loading('Saving...', { id: 'save-op' })
 * toast.success('Saved!', { id: 'save-op' })
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
        },
        className: 'font-sans',
        duration: 4000,
      }}
    />
  )
}
