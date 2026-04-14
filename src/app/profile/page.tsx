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

interface Booking {
  id: string
  event_type: string
  event_date: string
  event_location: string | null
  preferred_package_name: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
}

interface Loan {
  id: string
  applicant_name: string
  amount: number
  repayment_amount: number
  collateral_type: string | null
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'defaulted'
  created_at: string
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
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingLoans, setLoadingLoans] = useState(true)

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
    loadBookings()
    loadLoans()
  }, [user, userRole])

  const loadBookings = async () => {
    if (!user?.email) {
      setLoadingBookings(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('photography_bookings')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoadingBookings(false)
    }
  }

  const loadLoans = async () => {
    if (!user?.email) {
      setLoadingLoans(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLoans(data || [])
    } catch (error) {
      console.error('Error loading loans:', error)
    } finally {
      setLoadingLoans(false)
    }
  }

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

        {/* Photography Bookings Section */}
        <div className="mt-6">
          <div className="glass-effect rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                My Photography Bookings
              </h3>
              
              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">No photography bookings yet</p>
                  <a href="/categories" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Book a photoshoot →
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.event_type}</div>
                            {booking.event_location && (
                              <div className="text-sm text-gray-500">{booking.event_location}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(booking.event_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.preferred_package_name || 'Not selected'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loan Applications Section */}
        <div className="mt-6">
          <div className="glass-effect rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                My Loan Applications
              </h3>
              
              {loadingLoans ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">No loan applications yet</p>
                  <a href="/loans" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Apply for a loan →
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repayment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collateral</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            N${loan.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            N${loan.repayment_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {loan.collateral_type || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                              loan.status === 'disbursed' ? 'bg-blue-100 text-blue-800' :
                              loan.status === 'repaid' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(loan.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 