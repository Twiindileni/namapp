"use client"

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageLoader from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  BanknotesIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  ChevronRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function BorrowPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !amount || !reason) {
      toast.error('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('loans').insert({
      name,
      email,
      amount: parseFloat(amount),
      reason,
    })
    setLoading(false)
    if (error) {
      toast.error('Application failed. Please try again.')
      return
    }
    toast.success('Loan application submitted for review.')
    setName('')
    setEmail('')
    setAmount('')
    setReason('')
  }

  if (loading) {
    return (
      <PageLoader 
        icon={<BanknotesIcon className="w-8 h-8" />}
        message="Validating Request..."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-20 fade-in-up">
            <div className="max-w-2xl text-left">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#5a9ef5] mb-6 block">Financial Services</span>
              <h1 className="hero-title !text-5xl md:!text-7xl">Micro <span className="gradient-text">Loans</span></h1>
              <p className="mt-8 text-[#8baed4] text-xl leading-relaxed">
                Empowering your digital journey with accessible financing. Apply for a micro loan today and get a response within 24 hours.
              </p>
            </div>
            
            <div className="glass-card flex items-center gap-6 !p-6 border-[rgba(0,85,204,0.1)]">
               <div className="w-12 h-12 rounded-xl bg-[rgba(0,53,128,0.1)] flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-[#5a9ef5]" />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Security Tier</p>
                  <p className="text-sm font-bold text-white">Advanced Verified</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
            
            {/* Requirements Sidebar */}
            <div className="space-y-8 fade-in-up md:sticky md:top-32">
              <div className="glass-card !p-8 border-[rgba(26,114,240,0.15)] bg-gradient-to-br from-[rgba(2,11,26,0.5)] to-transparent">
                 <h3 className="text-xs font-bold text-[#5a9ef5] uppercase tracking-widest mb-8 border-b border-[rgba(0,85,204,0.1)] pb-4">Protocol</h3>
                 
                 <div className="space-y-10">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-white/5">
                          <ClockIcon className="w-5 h-5 text-indigo-400" />
                       </div>
                       <div>
                          <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4a6a90] mb-0.5">Processing</h4>
                          <p className="text-sm font-bold text-white">24h Turnaround</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-white/5">
                          <DocumentTextIcon className="w-5 h-5 text-orange-400" />
                       </div>
                       <div>
                          <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4a6a90] mb-0.5">Documentation</h4>
                          <p className="text-sm font-bold text-white">Minimal Required</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-white/5">
                          <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div>
                          <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4a6a90] mb-0.5">Status</h4>
                          <p className="text-sm font-bold text-white">Secure Encrypted</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 rounded-[24px] bg-[rgba(0,53,128,0.1)] border border-[rgba(0,85,204,0.1)]">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-[#5a9ef5] mb-2">Transparency Notice</p>
                 <p className="text-xs text-[#8baed4] leading-relaxed">
                    All applications undergo automatic and manual identity verification before approval.
                 </p>
              </div>
            </div>

            {/* Clean Professional Application Form */}
            <div className="lg:col-span-3 fade-in-up" style={{ animationDelay: '200ms' }}>
               <div className="bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] p-10 md:p-16 relative overflow-hidden">
                 
                 <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                   <BanknotesIcon className="w-64 h-64 text-black" />
                 </div>

                 <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                          <BanknotesIcon className="w-8 h-8 text-black" />
                       </div>
                       <div>
                          <h2 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Loan Application</h2>
                          <p className="text-sm text-gray-500 mt-1">Manual approval required for all requests.</p>
                       </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                             <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                required
                                className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-6 !py-4 focus:!border-[#1a72f0] transition-all outline-none font-medium"
                                style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                             />
                          </div>
                          <div className="space-y-3">
                             <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                             <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@domain.com"
                                required
                                className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-6 !py-4 focus:!border-[#1a72f0] transition-all outline-none font-medium"
                                style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Requested Amount (NAD)</label>
                          <div className="relative">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">N$</span>
                             <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !pl-14 !pr-6 !py-4 focus:!border-[#1a72f0] transition-all outline-none font-bold text-xl"
                                style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Reason for Loan</label>
                          <textarea
                             value={reason}
                             onChange={(e) => setReason(e.target.value)}
                             rows={4}
                             placeholder="Briefly describe the purpose of this financing..."
                             required
                             className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[20px] !px-6 !py-5 focus:!border-[#1a72f0] transition-all outline-none font-medium"
                             style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                          />
                       </div>

                       <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
                             </div>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-snug">
                                Secure Identity<br/>Verification
                             </p>
                          </div>
                          <button
                             type="submit"
                             disabled={loading}
                             className="w-full sm:w-auto bg-[#1a72f0] hover:bg-black text-white px-12 py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#1a72f0]/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                             {loading ? 'Verifying...' : 'Submit Request'}
                             <ArrowRightIcon className="w-5 h-5" />
                          </button>
                       </div>
                    </form>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
