'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { uploadToBucket, getPublicUrl } from '@/utils/supabaseStorage'
import { supabase } from '@/lib/supabase'

const categories = [
  'Education',
  'Games',
  'Business',
  'Entertainment',
  'Social',
  'Utilities',
  'Health & Fitness',
  'Travel',
  'Food & Drink',
  'Other'
]

// Add retry utility function
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

export default function AppUploadForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    version: '',
    apkFile: null as File | null,
    screenshots: [] as File[]
  })
  const { user } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files) {
      if (name === 'screenshots') {
        setFormData(prev => ({ ...prev, screenshots: Array.from(files) }))
      } else {
        setFormData(prev => ({ ...prev, [name]: files[0] }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      console.log('Starting upload process...')

      // Validate APK file
      if (!formData.apkFile) {
        toast.error('Please select an APK file')
        setLoading(false)
        return
      }

      console.log('APK file selected:', formData.apkFile.name, 'Size:', formData.apkFile.size)

      // Validate APK file type
      if (!formData.apkFile.name.toLowerCase().endsWith('.apk')) {
        toast.error('Please upload a valid APK file')
        setLoading(false)
        return
      }

      // Validate APK file size (max 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (formData.apkFile.size > maxSize) {
        toast.error('APK file size should be less than 100MB')
        setLoading(false)
        return
      }

      // Validate screenshots
      if (formData.screenshots.length === 0) {
        toast.error('Please upload at least one screenshot')
        setLoading(false)
        return
      }

      console.log('Screenshots selected:', formData.screenshots.length)

      // Validate screenshot types and sizes
      const allowedImageTypes = ['image/jpeg', 'image/png']
      const maxScreenshotSize = 5 * 1024 * 1024 // 5MB

      for (const screenshot of formData.screenshots) {
        if (!allowedImageTypes.includes(screenshot.type)) {
          toast.error('Screenshots must be JPEG or PNG files')
          setLoading(false)
          return
        }
        if (screenshot.size > maxScreenshotSize) {
          toast.error('Each screenshot should be less than 5MB')
          setLoading(false)
          return
        }
      }

      // Create unique filenames with timestamps
      const timestamp = new Date().getTime()
      const userId = user.id
      const apkFileName = `app_${userId}_${timestamp}.apk`
      const apkPath = `apps/${userId}/apks/${apkFileName}`

      console.log('Starting APK upload...')

      // Upload APK to Supabase Storage
      await retryOperation(async () => {
        await uploadToBucket('namapps', apkPath, formData.apkFile!, 'application/vnd.android.package-archive')
      })
      console.log('APK upload completed')

      const apkUrl = getPublicUrl('namapps', apkPath)
      console.log('APK URL obtained:', apkUrl)

      // Upload screenshots to Supabase Storage
      console.log('Starting screenshots upload...')
      const screenshotUrls = await Promise.all(
        formData.screenshots.map(async (screenshot, index) => {
          const screenshotFileName = `screenshot_${userId}_${timestamp}_${index}.${screenshot.name.split('.').pop()}`
          const screenshotPath = `apps/${userId}/screenshots/${screenshotFileName}`

          await retryOperation(async () => {
            await uploadToBucket('namapps', screenshotPath, screenshot, screenshot.type)
          })
          return getPublicUrl('namapps', screenshotPath)
        })
      )
      console.log('Screenshots upload completed')

      // Save app data to Supabase
      console.log('Saving app data to Supabase...')
      const appInsert = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        version: formData.version,
        apk_url: apkUrl,
        developer_id: userId,
        developer_email: user.email,
        downloads: 0,
        status: 'pending'
      }

      const { data: appRow, error: appError } = await supabase
        .from('apps')
        .insert(appInsert)
        .select('id')
        .single()
      if (appError) throw appError

      const appId = appRow.id

      // Insert screenshots metadata
      const screenshotsInsert = formData.screenshots.map((screenshot, index) => ({
        app_id: appId,
        url: screenshotUrls[index],
        file_name: `screenshot_${userId}_${timestamp}_${index}.${screenshot.name.split('.').pop()}`,
        file_size: screenshot.size,
        file_type: screenshot.type
      }))

      const { error: ssError } = await supabase
        .from('app_screenshots')
        .insert(screenshotsInsert)
      if (ssError) throw ssError

      toast.success('App uploaded successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error uploading app:', error)
      toast.error('Failed to upload app. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          App Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          value={formData.name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          required
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          name="category"
          id="category"
          required
          value={formData.category}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="version" className="block text-sm font-medium text-gray-700">
          Version
        </label>
        <input
          type="text"
          name="version"
          id="version"
          required
          value={formData.version}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="apkFile" className="block text sm font-medium text-gray-700">
          APK File
        </label>
        <input
          type="file"
          name="apkFile"
          id="apkFile"
          accept=".apk"
          required
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div>
        <label htmlFor="screenshots" className="block text-sm font-medium text-gray-700">
          Screenshots
        </label>
        <input
          type="file"
          name="screenshots"
          id="screenshots"
          accept="image/*"
          multiple
          required
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload App'}
        </button>
      </div>
    </form>
  )
} 