export interface App {
  id: string
  name: string
  description: string
  category: string
  version: string
  apkUrl: string
  screenshotUrls: string[]
  developerEmail: string
  downloads: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt?: string
} 