'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, Image as ImageIcon, X, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { toastHelpers } from '@/lib/toast'

interface Photo {
  name: string
  url: string
  path: string
}

interface PhotoGalleryProps {
  repairOrderId: number
  refreshTrigger?: number
}

export function PhotoGallery({ repairOrderId, refreshTrigger }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/photos/${repairOrderId}`)

      if (!response.ok) {
        throw new Error('Failed to load photos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
    } catch (err: any) {
      toastHelpers.error('Failed to load photos', err.message)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }, [repairOrderId])

  useEffect(() => {
    fetchPhotos()
  }, [repairOrderId, refreshTrigger, fetchPhotos])

  const handleDelete = async (path: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    setDeleting(path)

    try {
      const response = await fetch(`/api/photos/${repairOrderId}?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      // Remove from state
      setPhotos(photos.filter(p => p.path !== path))
      toastHelpers.photoDeleted()
    } catch (err: any) {
      toastHelpers.error('Failed to delete photo', err.message)
    } finally {
      setDeleting(null)
    }
  }

  const getPhotoType = (name: string): string => {
    if (name.includes('/before/')) return 'Before'
    if (name.includes('/after/')) return 'After'
    if (name.includes('/during/')) return 'During'
    if (name.includes('/damage/')) return 'Damage'
    return 'Photo'
  }

  const getPhotoTypeColor = (name: string): string => {
    if (name.includes('/before/')) return 'bg-blue-100 text-blue-700'
    if (name.includes('/after/')) return 'bg-green-100 text-green-700'
    if (name.includes('/during/')) return 'bg-yellow-100 text-yellow-700'
    if (name.includes('/damage/')) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchPhotos}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-900">No photos yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload photos to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.path}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-500 transition-colors"
          >
            {/* Photo */}
            <div className="relative w-full h-full">
              <Image
                src={photo.url}
                alt={photo.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>

            {/* Type Badge */}
            <div className="absolute top-2 left-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${getPhotoTypeColor(photo.name)}`}>
                {getPhotoType(photo.name)}
              </span>
            </div>

            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="View full size"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => handleDelete(photo.path)}
                disabled={deleting === photo.path}
                className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Delete photo"
              >
                {deleting === photo.path ? (
                  <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5 text-red-600" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
          <div
            className="relative max-w-full max-h-full"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className={`text-sm font-medium px-3 py-1.5 rounded ${getPhotoTypeColor(selectedPhoto.name)}`}>
              {getPhotoType(selectedPhoto.name)}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
