'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, StorageReference, deleteObject } from 'firebase/storage'
import { updatePassword, deleteUser } from 'firebase/auth'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import {
  validateImageFile,
  generateUniqueFileName,
  getStoragePath,
  createFileMetadata,
  cleanupOldFile
} from '@/utils/fileUtils'

interface UserProfile {
  name: string
  email: string
  role: string
  bio?: string
  company?: string
  website?: string
  location?: string
  createdAt: string
  profilePicture?: string
  // Developer specific fields
  skills?: string[]
  portfolio?: string
  // Admin specific fields
  department?: string
  permissions?: string[]
}

// Add type for metadata
interface FileMetadata {
  [key: string]: string;
  uploadedBy: string;
  uploadedAt: string;
  purpose: string;
  fileName: string;
  fileType: string;
  fileSize: string;
}

// Add this CSS class at the top of the file, after the imports
const inputStyles = `
  block w-full rounded-md border-gray-300 shadow-sm
  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  transition duration-150 ease-in-out
  disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  placeholder-gray-400
  sm:text-sm
`

const labelStyles = `
  block text-sm font-medium text-gray-700 mb-1
`

export default function ProfilePage() {
  const { user, userRole, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    role: '',
    bio: '',
    company: '',
    website: '',
    location: '',
    createdAt: '',
    profilePicture: '',
    skills: [],
    portfolio: '',
    department: '',
    permissions: []
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    try {
      setUploadingImage(true)
      
      // Generate unique filename and storage path
      const fileName = generateUniqueFileName(user.uid, file.name, 'profile_picture')
      const storagePath = getStoragePath(user.uid, 'profile_picture', fileName)
      const storageRef = ref(storage, storagePath)
      
      // Clean up old profile picture
      if (profile.profilePicture) {
        const oldPictureRef = ref(storage, profile.profilePicture) as StorageReference
        await cleanupOldFile(oldPictureRef)
      }

      // Create metadata
      const metadata = createFileMetadata(file, user.uid, 'profile_picture', {
        purpose: 'profile_picture'
      })

      // Upload new profile picture
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: metadata
      })
      const downloadURL = await getDownloadURL(storageRef)

      // Update profile in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        profilePicture: downloadURL,
        profilePictureMetadata: metadata,
        updatedAt: new Date().toISOString()
      })

      setProfile(prev => ({ ...prev, profilePicture: downloadURL }))
      toast.success('Profile picture updated successfully')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      await updateDoc(doc(db, 'users', user.uid), {
        name: profile.name,
        bio: profile.bio,
        company: profile.company,
        website: profile.website,
        location: profile.location,
        ...(userRole === 'developer' && {
          skills: profile.skills,
          portfolio: profile.portfolio
        }),
        ...(userRole === 'admin' && {
          department: profile.department,
          permissions: profile.permissions
        }),
        updatedAt: new Date().toISOString()
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setSaving(true)
      await updatePassword(user, passwordData.newPassword)
      toast.success('Password updated successfully')
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      setSaving(true)
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid))
      
      // Delete profile picture from Storage
      if (profile.profilePicture) {
        await deleteObject(ref(storage, profile.profilePicture))
      }

      // Delete user account
      await deleteUser(user)
      
      await logout()
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setSaving(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="animated-background">
          <div className="floating-shapes">
            <div className="shape"></div>
            <div className="shape"></div>
            <div className="shape"></div>
          </div>
        </div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Picture and Basic Info */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-lg hover-lift">
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg hover-lift"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl border-4 border-white shadow-lg hover-lift">
                        {profile.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <label
                      htmlFor="profile-picture"
                      className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors hover-lift"
                    >
                      <svg
                        className="h-6 w-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </label>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                      disabled={uploadingImage}
                    />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">{profile.name}</h2>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 pulse">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover-lift"
                    >
                      <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 hover-lift"
                    >
                      <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Information */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-lg">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className={labelStyles}>
                          Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={profile.name}
                            onChange={handleInputChange}
                            className={inputStyles}
                            placeholder="Enter your name"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="email" className={labelStyles}>
                          Email
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={profile.email}
                            disabled
                            className={`${inputStyles} bg-gray-50`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="company" className={labelStyles}>
                          Company
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="text"
                            name="company"
                            id="company"
                            value={profile.company}
                            onChange={handleInputChange}
                            className={inputStyles}
                            placeholder="Enter your company name"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="website" className={labelStyles}>
                          Website
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">https://</span>
                          </div>
                          <input
                            type="url"
                            name="website"
                            id="website"
                            value={profile.website}
                            onChange={handleInputChange}
                            className={`${inputStyles} pl-16`}
                            placeholder="example.com"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="location" className={labelStyles}>
                          Location
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="location"
                            id="location"
                            value={profile.location}
                            onChange={handleInputChange}
                            className={`${inputStyles} pl-10`}
                            placeholder="Enter your location"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="bio" className={labelStyles}>
                          Bio
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="bio"
                            name="bio"
                            rows={3}
                            value={profile.bio}
                            onChange={handleInputChange}
                            className={`${inputStyles} resize-none`}
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Brief description for your profile.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role-Specific Information Section */}
                  {userRole === 'developer' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Developer Information</h3>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="portfolio" className={labelStyles}>
                            Portfolio URL
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">https://</span>
                            </div>
                            <input
                              type="url"
                              name="portfolio"
                              id="portfolio"
                              value={profile.portfolio}
                              onChange={handleInputChange}
                              className={`${inputStyles} pl-16`}
                              placeholder="your-portfolio.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {userRole === 'admin' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Administrator Information</h3>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="department" className={labelStyles}>
                            Department
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              name="department"
                              id="department"
                              value={profile.department}
                              onChange={handleInputChange}
                              className={`${inputStyles} pl-10`}
                              placeholder="Enter your department"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="glass-effect rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className={labelStyles}>
                  Current Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className={`${inputStyles} pl-10`}
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className={labelStyles}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className={inputStyles}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelStyles}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className={inputStyles}
                  placeholder="Enter confirm password"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="glass-effect rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-red-900 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover-lift"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 hover-lift"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 