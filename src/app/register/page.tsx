'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import PageLoader from '@/components/ui/PageLoader'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserPlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    newsletterSubscribed: true,
  })
  const { signup } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password should be at least 6 characters long')
      return
    }

    try {
      setLoading(true)
      await signup(formData.email, formData.password, formData.name, formData.newsletterSubscribed)
      toast.success('Registration successful! Please verify your email.')
      router.push('/verify-email')
    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = error.message || 'Failed to register'
      
      if (errorMessage.includes('already registered')) {
        toast.error(
          <div className="flex flex-col items-center gap-2">
            <span>{errorMessage}</span>
            <Link 
              href="/login" 
              className="text-[#1a72f0] hover:text-[#003580] font-medium"
            >
              Click here to login
            </Link>
          </div>,
          { duration: 5000 }
        )
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLoader 
        icon={<UserPlusIcon className="w-8 h-8" />}
        message="Creating Identity..."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6">
        <div className="w-full max-w-xl fade-in-up">
          
          {/* Logo / Branding */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-2xl bg-[#003580] opacity-20 blur-xl animate-pulse" />
              <Image
                src="/purpose_logo.png"
                alt="Purpose Technology"
                width={64}
                height={64}
                className="relative h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Join <span className="gradient-text">Purpose</span>
            </h1>
            <p className="mt-3 text-[#8baed4] text-sm font-medium">Create your account to access Namibia's premier tech hub.</p>
          </div>

          {/* Clean Professional Register Card (White) */}
          <div className="bg-white rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.7)] p-10 md:p-14 relative overflow-hidden">
             
             {/* Decorative subtle accent */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#003580] via-[#1a72f0] to-[#003580]" />

             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
                   <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <UserPlusIcon className="w-6 h-6 text-black" />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Create Account</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Community Registration</p>
                   </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                       <input
                         id="name"
                         name="name"
                         type="text"
                         autoComplete="name"
                         required
                         value={formData.name}
                         onChange={handleInputChange}
                         placeholder="Enter your full name"
                         className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-12 !pr-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                         style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                       />
                       <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1a72f0] transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                       <input
                         id="email"
                         name="email"
                         type="email"
                         autoComplete="email"
                         required
                         value={formData.email}
                         onChange={handleInputChange}
                         placeholder="your@email.com"
                         className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-12 !pr-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                         style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                       />
                       <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1a72f0] transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                      <div className="relative group">
                         <input
                           id="password"
                           name="password"
                           type="password"
                           autoComplete="new-password"
                           required
                           value={formData.password}
                           onChange={handleInputChange}
                           placeholder="••••••••"
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-12 !pr-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         />
                         <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1a72f0] transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                      <div className="relative group">
                         <input
                           id="confirmPassword"
                           name="confirmPassword"
                           type="password"
                           autoComplete="new-password"
                           required
                           value={formData.confirmPassword}
                           onChange={handleInputChange}
                           placeholder="••••••••"
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-12 !pr-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         />
                         <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1a72f0] transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Newsletter opt-in */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        id="newsletterSubscribed"
                        name="newsletterSubscribed"
                        type="checkbox"
                        checked={formData.newsletterSubscribed}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-[6px] border-2 border-gray-300 bg-gray-50 peer-checked:bg-[#1a72f0] peer-checked:border-[#1a72f0] transition-all flex items-center justify-center">
                        {formData.newsletterSubscribed && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed">
                      Keep me updated with <span className="font-semibold text-gray-700">new arrivals, exclusive specials</span> and product drops from Purpose Technology. You can unsubscribe anytime.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1a72f0] hover:bg-black text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-[#1a72f0]/30 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ChevronRightIcon className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="pt-8 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Already have an account?{' '}
                      <Link href="/login" className="font-bold text-[#1a72f0] hover:text-black hover:underline transition-all">
                        Sign in instead
                      </Link>
                    </p>
                  </div>
                </form>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}