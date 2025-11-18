'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, User, Phone, Mail, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: number
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onCustomerCreated: (customer: Customer) => void
}

export function NewCustomerModal({ isOpen, onClose, onCustomerCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle close modal - using useCallback to stabilize the function reference
  const handleClose = useCallback(() => {
    if (!loading) {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        notes: ''
      })
      setErrors({})
      onClose()
    }
  }, [loading, onClose])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, handleClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Debounce phone number check
  useEffect(() => {
    if (!isOpen || !formData.phone) {
      setExistingCustomer(null)
      return
    }

    const timer = setTimeout(async () => {
      const phone = formData.phone
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        setExistingCustomer(null)
        return
      }

      setCheckingPhone(true)
      try {
        const response = await fetch(`/api/customers?search=${encodeURIComponent(phone)}`)
        if (response.ok) {
          const customers = await response.json()
          const match = customers.find((c: Customer) => c.phone === phone.trim())
          setExistingCustomer(match || null)
        }
      } catch (error) {
        console.error('Error checking for duplicate phone:', error)
      } finally {
        setCheckingPhone(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.phone, isOpen])

  // Don't render portal until mounted (client-side only)
  if (!mounted) return null

  // Don't render content if modal is closed
  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // All fields are now optional, just validate format if provided
    if (formData.firstName && formData.firstName.trim().length > 100) {
      newErrors.firstName = 'First name must be less than 100 characters'
    }

    if (formData.lastName && formData.lastName.trim().length > 100) {
      newErrors.lastName = 'Last name must be less than 100 characters'
    }

    if (formData.phone && formData.phone.trim()) {
      // Remove all non-digit characters for validation
      const digitsOnly = formData.phone.replace(/\D/g, '')
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        newErrors.phone = 'Phone number must contain 10-15 digits'
      } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Phone number contains invalid characters'
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Invalid email format'
      } else if (formData.email.length > 255) {
        newErrors.email = 'Email must be less than 255 characters'
      }
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    const loadingToast = toast.loading('Creating customer...')

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          notes: formData.notes.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors from server
        if (data.details) {
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((detail: { field: string; message: string }) => {
            fieldErrors[detail.field] = detail.message
          })
          setErrors(fieldErrors)
          toast.error(data.error || 'Validation failed', { id: loadingToast })
        } else {
          throw new Error(data.error || 'Failed to create customer')
        }
        return
      }

      const customer = data

      // Show success message
      toast.success(
        `Customer ${customer.firstName} ${customer.lastName} created successfully!`,
        { id: loadingToast }
      )

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        notes: ''
      })
      setErrors({})

      // Notify parent and close modal
      onCustomerCreated(customer)
      onClose()
    } catch (error: any) {
      console.error('Error creating customer:', error)
      toast.error(error.message || 'Failed to create customer. Please try again.', {
        id: loadingToast
      })
      setErrors({ submit: error.message || 'Failed to create customer. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleClose()
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Customer</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
                disabled={loading}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
                disabled={loading}
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
            {checkingPhone && (
              <p className="mt-1 text-sm text-gray-500">Checking for existing customer...</p>
            )}
            {existingCustomer && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Customer Already Exists</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-700 mb-3">
                  <p><span className="font-medium">Name:</span> {existingCustomer.firstName} {existingCustomer.lastName}</p>
                  <p><span className="font-medium">Phone:</span> {existingCustomer.phone}</p>
                  {existingCustomer.email && (
                    <p><span className="font-medium">Email:</span> {existingCustomer.email}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCustomerCreated(existingCustomer)
                    onClose()
                    toast.success('Existing customer selected')
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use This Customer
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional notes..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
