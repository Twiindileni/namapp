import { StorageReference } from 'firebase/storage'
import { deleteObject } from 'firebase/storage'

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface FileMetadata {
  [key: string]: string
  uploadedBy: string
  uploadedAt: string
  purpose: string
  fileName: string
  fileType: string
  fileSize: string
}

export const validateImageFile = (file: File): FileValidationResult => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or GIF)'
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size should be less than 5MB'
    }
  }

  return { isValid: true }
}

export const validateApkFile = (file: File): FileValidationResult => {
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (!file.name.toLowerCase().endsWith('.apk')) {
    return {
      isValid: false,
      error: 'Please upload a valid APK file'
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'APK file size should be less than 100MB'
    }
  }

  return { isValid: true }
}

export const validateScreenshots = (files: File[]): FileValidationResult => {
  if (files.length === 0) {
    return {
      isValid: false,
      error: 'Please upload at least one screenshot'
    }
  }

  const allowedTypes = ['image/jpeg', 'image/png']
  const maxSize = 5 * 1024 * 1024 // 5MB

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Screenshots must be JPEG or PNG files'
      }
    }
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Each screenshot should be less than 5MB'
      }
    }
  }

  return { isValid: true }
}

export const generateUniqueFileName = (
  userId: string,
  originalName: string,
  purpose: string
): string => {
  const timestamp = new Date().getTime()
  const fileExtension = originalName.split('.').pop()
  return `${purpose}_${userId}_${timestamp}.${fileExtension}`
}

export const getStoragePath = (
  userId: string,
  purpose: string,
  fileName: string
): string => {
  switch (purpose) {
    case 'profile_picture':
      return `users/${userId}/profile_pictures/${fileName}`
    case 'app_apk':
      return `apps/${userId}/apks/${fileName}`
    case 'app_screenshot':
      return `apps/${userId}/screenshots/${fileName}`
    default:
      return `${purpose}/${userId}/${fileName}`
  }
}

export const createFileMetadata = (
  file: File,
  userId: string,
  purpose: string,
  additionalMetadata: Record<string, any> = {}
): FileMetadata => {
  return {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size.toString(),
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
    purpose,
    ...additionalMetadata
  }
}

export const cleanupOldFile = async (fileRef: any): Promise<void> => {
  try {
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Error deleting old file:', error)
    // Don't throw error as this is cleanup
  }
} 