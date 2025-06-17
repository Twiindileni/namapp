'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

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
      const apkFileName = `app_${user.uid}_${timestamp}.apk`
      const apkRef = ref(storage, `apps/${user.uid}/apks/${apkFileName}`)

      console.log('Starting APK upload...')

      // Upload APK with metadata
      const apkMetadata = {
        contentType: 'application/vnd.android.package-archive',
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          appName: formData.name,
          version: formData.version
        }
      }

      try {
        // Use retry logic for APK upload
        await retryOperation(async () => {
          await uploadBytes(apkRef, formData.apkFile!, apkMetadata)
        })
        console.log('APK upload completed')
        
        const apkUrl = await retryOperation(async () => {
          return await getDownloadURL(apkRef)
        })
        console.log('APK URL obtained:', apkUrl)

        // Upload screenshots with metadata
        console.log('Starting screenshots upload...')
        const screenshotUrls = await Promise.all(
          formData.screenshots.map(async (screenshot, index) => {
            const screenshotFileName = `screenshot_${user.uid}_${timestamp}_${index}.${screenshot.name.split('.').pop()}`
            const screenshotRef = ref(storage, `apps/${user.uid}/screenshots/${screenshotFileName}`)
            
            const screenshotMetadata = {
              contentType: screenshot.type,
              customMetadata: {
                uploadedBy: user.uid,
                uploadedAt: new Date().toISOString(),
                appName: formData.name,
                screenshotIndex: index.toString()
              }
            }

            await retryOperation(async () => {
              await uploadBytes(screenshotRef, screenshot, screenshotMetadata)
            })
            return retryOperation(async () => {
              return await getDownloadURL(screenshotRef)
            })
          })
        )
        console.log('Screenshots upload completed')

        // Save app data to Firestore
        console.log('Saving app data to Firestore...')
        const appData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          version: formData.version,
          apkUrl,
          apkMetadata: {
            fileName: apkFileName,
            fileSize: formData.apkFile!.size,
            uploadedAt: new Date().toISOString()
          },
          screenshotUrls,
          screenshotMetadata: formData.screenshots.map((screenshot, index) => ({
            fileName: `screenshot_${user.uid}_${timestamp}_${index}.${screenshot.name.split('.').pop()}`,
            fileSize: screenshot.size,
            fileType: screenshot.type,
            uploadedAt: new Date().toISOString()
          })),
          developerId: user.uid,
          developerEmail: user.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          downloads: 0,
          status: 'pending',
          lastDownloadedAt: null,
          downloadHistory: []
        }

        const appRef = await retryOperation(async () => {
          return await addDoc(collection(db, 'apps'), appData)
        })
        console.log('App data saved to Firestore')
        
        // Update user's apps list
        await retryOperation(async () => {
          await updateDoc(doc(db, 'users', user.uid), {
            apps: arrayUnion(appRef.id),
            updatedAt: new Date().toISOString()
          })
        })
        console.log('User apps list updated')

        toast.success('App uploaded successfully!')
        router.push('/dashboard')
      } catch (uploadError) {
        console.error('Error during upload process:', uploadError)
        toast.error('Failed to upload files. Please check your internet connection and try again.')
        throw uploadError
      }
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
        <label htmlFor="apkFile" className="block text-sm font-medium text-gray-700">
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