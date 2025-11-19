import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Check if Supabase is configured
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey)

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const BUCKET_NAME = 'repair-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface PhotoMetadata {
  repairOrderId: number
  type: 'before' | 'after' | 'during' | 'damage'
  description?: string
  uploadedBy?: string
}

/**
 * Initialize storage bucket if it doesn't exist
 */
export async function initializeBucket() {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      })

      if (error) throw error
      return { success: true, message: 'Bucket created successfully' }
    }

    return { success: true, message: 'Bucket already exists' }
  } catch (error: any) {
    console.error('Error initializing bucket:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Generate unique file path
 */
function generateFilePath(metadata: PhotoMetadata, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${metadata.repairOrderId}/${metadata.type}/${timestamp}-${sanitizedFilename}`
}

/**
 * Upload photo to Supabase Storage
 */
export async function uploadPhoto(
  file: File,
  metadata: PhotoMetadata
): Promise<UploadResult> {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase Storage is not configured',
      }
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    // Generate file path
    const filePath = generateFilePath(metadata, file.name)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload photo',
    }
  }
}

/**
 * Upload multiple photos
 */
export async function uploadMultiplePhotos(
  files: File[],
  metadata: PhotoMetadata
): Promise<UploadResult[]> {
  return Promise.all(files.map(file => uploadPhoto(file, metadata)))
}

/**
 * Delete photo from Supabase Storage
 */
export async function deletePhoto(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase Storage is not configured',
      }
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting photo:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete photo',
    }
  }
}

/**
 * List all photos for a repair order
 */
export async function listPhotos(repairOrderId: number): Promise<{
  success: boolean
  photos?: Array<{ name: string; url: string; path: string }>
  error?: string
}> {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase Storage is not configured',
      }
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${repairOrderId}/`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      throw error
    }

    // Get public URLs for all photos
    const photos = data
      .filter(item => !item.name.endsWith('/')) // Exclude folders
      .map(item => {
        const path = `${repairOrderId}/${item.name}`
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path)

        return {
          name: item.name,
          path,
          url: urlData.publicUrl,
        }
      })

    return {
      success: true,
      photos,
    }
  } catch (error: any) {
    console.error('Error listing photos:', error)
    return {
      success: false,
      error: error.message || 'Failed to list photos',
    }
  }
}

/**
 * Check if storage service is available
 */
export function isStorageAvailable(): boolean {
  return isSupabaseConfigured
}

/**
 * Get storage configuration
 */
export function getStorageConfig() {
  return {
    available: isStorageAvailable(),
    provider: 'Supabase Storage',
    bucketName: BUCKET_NAME,
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
  }
}
