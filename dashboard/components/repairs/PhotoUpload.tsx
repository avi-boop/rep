'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react'
import { toastHelpers } from '@/lib/toast'

interface PhotoUploadProps {
  repairOrderId: number
  onUploadComplete?: (photo: { url: string; path: string; type: string }) => void
}

type PhotoType = 'before' | 'after' | 'during' | 'damage'

export function PhotoUpload({ repairOrderId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedType, setSelectedType] = useState<PhotoType>('before')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(false)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastHelpers.error('Please upload an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastHelpers.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    const typeLabels = { before: 'Before', after: 'After', during: 'During', damage: 'Damage' }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('repairOrderId', repairOrderId.toString())
      formData.append('type', selectedType)

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()

      // Show success toast
      toastHelpers.photoUploaded(typeLabels[selectedType])

      setSuccess(true)

      // Notify parent component
      if (onUploadComplete && data.photo) {
        onUploadComplete(data.photo)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      toastHelpers.error('Failed to upload photo', err.message)
    } finally {
      setUploading(false)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Photo Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['before', 'after', 'during', 'damage'] as PhotoType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Uploading photo...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-600">Photo uploaded successfully!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drop your image here, or{' '}
                  <button
                    type="button"
                    onClick={onButtonClick}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}
    </div>
  )
}
