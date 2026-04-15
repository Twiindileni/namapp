'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import PageLoader from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { LockClosedIcon, EnvelopeIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Access Granted')
    router.push('/dashboard')
  }

  if (loading) {
     return (
       <PageLoader 
         icon={<LockClosedIcon className="w-8 h-8" />}
         message="Authenticating Identity..."
       />
     )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-xl fade-in-up">
          
          <div className="text-center mb-12">
             <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#5a9ef5] mb-4 block">Secure Terminal</span>
             <h1 className="hero-title !text-5xl">Welcome <span className="gradient-text">Back</span></h1>
          </div>

          <div className="bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] p-10 md:p-14 relative overflow-hidden">
             
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                <LockClosedIcon className="w-48 h-48 text-black" />
             </div>

             <form onSubmit={handleLogin} className="relative z-10 space-y-8">
                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Account Identifier</label>
                      <div className="relative">
                         <EnvelopeIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                         <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="you@domain.com"
                           required
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-16 !pr-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/10 transition-all outline-none font-medium"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                         <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Secret Key</label>
                         <Link href="/forgot-password" size="sm" className="text-[10px] font-bold text-[#1a72f0] uppercase tracking-widest hover:underline">Recover Key</Link>
                      </div>
                      <div className="relative">
                         <LockClosedIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                         <input
                           type="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="••••••••"
                           required
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-16 !pr-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/10 transition-all outline-none font-medium"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-2">
                   <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-[#1a72f0] hover:bg-black text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#1a72f0]/25 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                   >
                     {loading ? 'Authenticating...' : 'Access Hub'}
                     <ChevronRightIcon className="w-5 h-5" />
                   </button>
                </div>
             </form>

             <div className="mt-10 pt-10 border-t border-gray-50 text-center">
                <p className="text-xs text-gray-400 font-medium">
                   New to the platform?{' '}
                   <Link href="/register" className="text-[#1a72f0] font-bold uppercase tracking-widest hover:underline ml-1">Create Account</Link>
                </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}