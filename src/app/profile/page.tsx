'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadToBucket, getPublicUrl } from '@/utils/supabaseStorage'

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
  skills?: string[]
  portfolio?: string
  department?: string
  permissions?: string[]
}

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
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Try to read the profile; don't error if missing
        const { data, error } = await supabase
          .from('users')
          .select('email, name, role, profile_picture, created_at')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Supabase error loading profile:', error)
        }

        let row = data

        // If no row, create one now
        if (!row) {
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert({ id: user.id, email: user.email, role: userRole || 'developer', name: null })
            .select('email, name, role, profile_picture, created_at')
            .maybeSingle()
          if (insertError) {
            console.error('Insert user row failed:', insertError)
            throw insertError
          }
          row = inserted || null
        }

        setProfile({
          name: row?.name || '',
          email: row?.email || user.email || '',
          role: row?.role || userRole || '',
          createdAt: row?.created_at || '',
          profilePicture: row?.profile_picture || ''
        } as UserProfile)
      } catch (error: any) {
        console.error('Error loading profile from Supabase:', error?.message || error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, userRole])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploadingImage(true)
      const timestamp = Date.now()
      const path = `users/${user.id}/profile_pictures/${timestamp}_${file.name}`
      await uploadToBucket('namapps', path, file, file.type)
      const downloadURL = getPublicUrl('namapps', path)

      const { error } = await supabase
        .from('users')
        .update({ profile_picture: downloadURL })
        .eq('id', user.id)
      if (error) throw error

      setProfile(prev => ({ ...prev, profilePicture: downloadURL }))
      toast.success('Profile picture updated successfully')
    } catch (error: any) {
      console.error('Error uploading profile picture:', error?.message || error)
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
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          // Optional: add fields if you extend the users table
        })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Error updating profile:', error?.message || error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-lg">
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt="Profile" className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl border-4 border-white shadow-lg">
                        {profile.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50">
                      <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                    <input type="file" id="profile-picture" accept="image/*" className="hidden" onChange={handleProfilePictureChange} disabled={uploadingImage} />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">{profile.name}</h2>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-effect rounded-lg">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className={labelStyles}>Name</label>
                        <input type="text" name="name" id="name" value={profile.name} onChange={handleInputChange} className={inputStyles} />
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="email" className={labelStyles}>Email</label>
                        <input type="email" name="email" id="email" value={profile.email} disabled className={`${inputStyles} bg-gray-50`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 