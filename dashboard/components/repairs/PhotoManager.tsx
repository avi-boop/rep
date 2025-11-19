'use client'

import { useState } from 'react'
import { PhotoUpload } from './PhotoUpload'
import { PhotoGallery } from './PhotoGallery'
import { Camera } from 'lucide-react'

interface PhotoManagerProps {
  repairOrderId: number
}

export function PhotoManager({ repairOrderId }: PhotoManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showUpload, setShowUpload] = useState(false)

  const handleUploadComplete = () => {
    // Trigger gallery refresh
    setRefreshTrigger(prev => prev + 1)
    // Close upload section after successful upload
    setTimeout(() => setShowUpload(false), 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Repair Photos</h3>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showUpload ? 'Hide Upload' : 'Upload Photos'}
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <PhotoUpload
            repairOrderId={repairOrderId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* Gallery Section */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <PhotoGallery
          repairOrderId={repairOrderId}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  )
}
