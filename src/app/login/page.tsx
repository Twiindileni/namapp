'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import PageLoader from '@/components/ui/PageLoader'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const searchParams = useSearchParams()
  const redirectTo = useMemo(() => {
    const r = searchParams.get('redirect') || '/dashboard'
    return r.startsWith('/') && !r.startsWith('//') ? r : '/dashboard'
  }, [searchParams])
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard')
    }
  }, [user, router, redirectTo])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      await login(formData.email, formData.password)
      toast.success('Login successful!')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLoader 
        icon={<LockClosedIcon className="w-8 h-8" />}
        message="Authenticating Access..."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6">
        <div className="w-full max-w-lg fade-in-up">
          
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
              Purpose <span className="gradient-text">Account</span>
            </h1>
            <p className="mt-3 text-[#8baed4] text-sm font-medium">Log in to manage your digital assets and services.</p>
          </div>

          {/* Clean Professional Login Card (White) */}
          <div className="bg-white rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.7)] p-10 md:p-14 relative overflow-hidden">
             
             {/* Decorative subtle accent */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#003580] via-[#1a72f0] to-[#003580]" />

             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
                   <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <ArrowRightOnRectangleIcon className="w-6 h-6 text-black" />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Welcome Back</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Secure Authentication Portal</p>
                   </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                       <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Password</label>
                       <Link href="/forgot-password" title="Recover Password" className="text-[10px] font-bold text-[#1a72f0] hover:text-black transition-colors uppercase tracking-widest">
                         Forgot?
                       </Link>
                    </div>
                    <div className="relative group">
                       <input
                         id="password"
                         name="password"
                         type="password"
                         autoComplete="current-password"
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
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ChevronRightIcon className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="pt-8 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      New to Purpose Technology?{' '}
                      <Link href="/register" className="font-bold text-[#1a72f0] hover:text-black hover:underline transition-all">
                        Create an account
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

export default function LoginPage() {
  return (
    <Suspense fallback={
       <PageLoader 
         icon={<LockClosedIcon className="w-8 h-8" />}
         message="Initializing Portal..."
       />
    }>
      <LoginForm />
    </Suspense>
  )
}