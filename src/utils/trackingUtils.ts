import { db } from '@/lib/firebase'
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore'

export interface DownloadRecord {
  userId: string
  downloadedAt: string
  ipAddress?: string
  userAgent?: string
}

export interface AppDownloadStats {
  totalDownloads: number
  uniqueUsers: number
  lastDownloadedAt: string | null
  downloadHistory: DownloadRecord[]
}

export const trackAppDownload = async (
  appId: string,
  userId: string,
  metadata: {
    ipAddress?: string
    userAgent?: string
  } = {}
): Promise<void> => {
  const appRef = doc(db, 'apps', appId)
  const userRef = doc(db, 'users', userId)

  const downloadRecord: DownloadRecord = {
    userId,
    downloadedAt: new Date().toISOString(),
    ...metadata
  }

  // Update app download stats
  await updateDoc(appRef, {
    downloads: increment(1),
    lastDownloadedAt: new Date().toISOString(),
    downloadHistory: arrayUnion(downloadRecord)
  })

  // Update user's downloaded apps
  await updateDoc(userRef, {
    downloadedApps: arrayUnion(appId),
    lastDownloadedAt: new Date().toISOString()
  })
}

export const getAppDownloadStats = async (appId: string): Promise<AppDownloadStats> => {
  const appRef = doc(db, 'apps', appId)
  const appDoc = await getDoc(appRef)

  if (!appDoc.exists()) {
    throw new Error('App not found')
  }

  const appData = appDoc.data()
  const downloadHistory = appData.downloadHistory || []
  const uniqueUsers = new Set(downloadHistory.map((record: DownloadRecord) => record.userId)).size

  return {
    totalDownloads: appData.downloads || 0,
    uniqueUsers,
    lastDownloadedAt: appData.lastDownloadedAt || null,
    downloadHistory
  }
}

export const getUserAppStats = async (userId: string): Promise<{
  uploadedApps: number
  downloadedApps: number
  lastUploadedAt: string | null
  lastDownloadedAt: string | null
}> => {
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error('User not found')
  }

  const userData = userDoc.data()
  return {
    uploadedApps: userData.apps?.length || 0,
    downloadedApps: userData.downloadedApps?.length || 0,
    lastUploadedAt: userData.lastUploadedAt || null,
    lastDownloadedAt: userData.lastDownloadedAt || null
  }
} 