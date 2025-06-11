export interface App {
  id: string
  name: string
  description: string
  category: string
  version: string
  apkUrl: string
  iconUrl: string
  screenshotUrls: string[]
  developerId: string
  developerEmail: string
  downloads: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  updatedAt: number
} 