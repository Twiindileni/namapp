"use client"

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageLoader from '@/components/ui/PageLoader'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  ShieldCheckIcon, 
  BanknotesIcon, 
  ClockIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function BorrowPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [collateralType, setCollateralType] = useState<'fridge' | 'phone' | 'laptop' | ''>('')
  const [collateralDescription, setCollateralDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [animateCalc, setAnimateCalc] = useState(false)

  const calculateRepayment = (amt: number) => {
    if (!amt) return 0
    return Number((amt * 1.3).toFixed(2))
  }

  useEffect(() => {
    if (amount) {
      setAnimateCalc(true)
      const timer = setTimeout(() => setAnimateCalc(false), 500)
      return () => clearTimeout(timer)
    }
  }, [amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !amount || (amount >= 500 && !collateralType)) {
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      setSubmitting(true)
      const repayment = calculateRepayment(amount as number)
      const { error } = await supabase
        .from('loans')
        .insert({
          applicant_name: name,
          phone,
          email: email || null,
          amount,
          repayment_amount: repayment,
          collateral_type: collateralType || null,
          collateral_description: collateralDescription || null,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Loan request submitted successfully. Awaiting approval.')
      setName('')
      setPhone('')
      setEmail('')
      setAmount('')
      setCollateralType('')
      setCollateralDescription('')
    } catch (err: any) {
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitting) {
    return (
      <PageLoader 
        icon={<BanknotesIcon className="w-8 h-8" />}
        message="Processing Loan Request..."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      {/* Borrow Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Summary */}
            <div className="space-y-10 fade-in-up text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#5a9ef5] mb-6 block">Leasing Platform</span>
                <h1 className="hero-title !text-5xl md:!text-7xl leading-tight">Micro <span className="gradient-text">Loans</span></h1>
                <p className="mt-8 text-[#8baed4] text-xl leading-relaxed max-w-xl">
                  Quick and transparent micro-leasing for your immediate financial needs. Request your loan in minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { title: 'Standard Loan', detail: 'N$100 – N$490', sub: 'No Collateral Required', icon: BanknotesIcon },
                  { title: 'Secured Loan', detail: 'N$500+', sub: 'Collateral Required', icon: ShieldCheckIcon }
                ].map((item, i) => (
                  <div key={i} className="glass-card !bg-[rgba(0,53,128,0.05)] border-[rgba(0,85,204,0.1)] !p-6">
                     <item.icon className="w-8 h-8 text-[#5a9ef5] mb-4" />
                     <h3 className="text-sm font-bold text-white uppercase tracking-widest">{item.title}</h3>
                     <p className="text-xl font-bold text-[#5a9ef5] mt-1">{item.detail}</p>
                     <p className="text-[10px] text-[#4a6a90] uppercase tracking-widest font-bold mt-2">{item.sub}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card flex items-center gap-6 !p-8 border-[rgba(26,114,240,0.1)] bg-[rgba(2,11,26,0.3)]">
                 <div className="w-14 h-14 rounded-2xl bg-[#020b1a] border border-[rgba(0,85,204,0.3)] flex items-center justify-center shadow-lg">
                    <CurrencyDollarIcon className="w-8 h-8 text-[#5a9ef5]" />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">30% Flat Handling Fee</h4>
                    <p className="text-sm text-[#8baed4] mt-1 leading-relaxed">No hidden costs. Example: Borrow N$100, Repay N$130.</p>
                 </div>
              </div>
            </div>

            {/* Right: Clean Professional Borrow Form (White Card) */}
            <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] p-10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-10 pb-8 border-b border-gray-100">
                     <div className="w-14 h-14 rounded-[18px] bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <BanknotesIcon className="w-7 h-7 text-black" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Loan Request Form</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Application Portal</p>
                     </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                         <input
                           type="text"
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           placeholder="Full Name"
                           required
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-5 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                         <input
                           type="tel"
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                           placeholder="0812345678"
                           required
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-5 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                       <input
                         type="email"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="your@email.com"
                         className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-5 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                         style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Loan Amount (N$)</label>
                       <input
                         type="number"
                         min={50}
                         step={10}
                         value={amount}
                         onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                         placeholder="Amount in N$"
                         required
                         className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-5 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none font-bold text-lg"
                         style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                       />
                       
                       {/* Simplified Repayment Display */}
                       <div className={`mt-3 p-4 rounded-xl border transition-all duration-300 ${amount ? 'border-[#1a72f0]/20 bg-gray-50/50' : 'border-gray-100 bg-transparent opacity-30'} ${animateCalc ? 'scale-[1.01] border-[#1a72f0]' : ''}`}>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Repayment Amount</span>
                             <span className={`text-xl font-bold ${amount ? 'text-[#1a72f0]' : 'text-gray-300'}`}>
                                N$ {amount ? calculateRepayment(amount as number).toFixed(2) : '0.00'}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Collateral Type (For N$500+)</label>
                      <div className="relative">
                         <select
                           value={collateralType}
                           onChange={(e) => setCollateralType(e.target.value as any)}
                           required={typeof amount === 'number' && amount >= 500}
                           className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-5 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all appearance-none outline-none"
                           style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                         >
                           <option value="">Select Item (If applicable)</option>
                           <option value="fridge">Fridge / Appliance</option>
                           <option value="phone">Smartphone</option>
                           <option value="laptop">Laptop / Computer</option>
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ArrowRightIcon className="w-4 h-4 rotate-90" />
                         </div>
                      </div>
                    </div>

                    {collateralType && (
                      <div className="space-y-2 fade-in-up">
                        <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Collateral Description</label>
                        <textarea
                          value={collateralDescription}
                          onChange={(e) => setCollateralDescription(e.target.value)}
                          rows={2}
                          placeholder="Brand, model, and condition..."
                          className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-5 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/5 transition-all outline-none"
                          style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#1a72f0] hover:bg-black text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-[#1a72f0]/30 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                    >
                      <span>{submitting ? 'Submitting...' : 'Request Loan'}</span>
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    
                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold mt-4">
                       Manual approval required for all requests.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 lg:px-8 bg-[rgba(2,11,26,0.3)]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Steps */}
            <div className="fade-in-up">
              <div className="flex items-center gap-4 mb-8">
                 <ClockIcon className="w-8 h-8 text-[#5a9ef5]" />
                 <h2 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>How it Works</h2>
              </div>
              
              <div className="space-y-6">
                 {[
                   { step: '01', title: 'Submit Request', desc: 'Select your loan amount and provide your contact details.' },
                   { step: '02', title: 'Collateral Check', desc: 'For loans over N$500, provide a collateral item (phone, laptop, etc.).' },
                   { step: '03', title: 'Manual Review', desc: 'Our team will review your application and contact you for verification.' },
                   { step: '04', title: 'Funds Received', desc: 'Upon approval, receive your funds and adhere to the repayment schedule.' }
                 ].map((p, i) => (
                   <div key={i} className="glass-card flex items-start gap-6 !p-6 border-[rgba(0,85,204,0.1)]">
                      <div className="text-xl font-black text-[#1a72f0] opacity-30">{p.step}</div>
                      <div>
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">{p.title}</h3>
                         <p className="text-sm text-[#8baed4] leading-relaxed">{p.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="fade-in-up delay-100">
               <div className="flex items-center gap-4 mb-8">
                  <ShieldCheckIcon className="w-8 h-8 text-[#5a9ef5]" />
                  <h2 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Requirements</h2>
               </div>

               <div className="glass-card !p-8 border-[rgba(26,114,240,0.15)] bg-gradient-to-br from-[rgba(2,11,26,0.5)] to-transparent relative overflow-hidden">
                  <div className="space-y-8 relative z-10">
                     <p className="text-[#8baed4] leading-relaxed">Ensure you meet the following requirements for a successful loan application.</p>
                     
                     <div className="space-y-4">
                        {[
                          'Working Phone Number',
                          'Identification Document',
                          'Valid Collateral (For N$500+ Loans)',
                          'Proof of Residence'
                        ].map((req, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-[#8baed4] font-bold">
                             <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                             <span className="uppercase tracking-widest text-[11px]">{req}</span>
                          </div>
                        ))}
                     </div>

                     <div className="pt-8 border-t border-[rgba(0,85,204,0.1)]">
                        <div className="flex items-center gap-3 mb-4">
                           <InformationCircleIcon className="w-5 h-5 text-[#5a9ef5]" />
                           <span className="text-[10px] uppercase font-bold tracking-widest text-[#5a9ef5]">Quick Examples</span>
                        </div>
                        <ul className="grid grid-cols-2 gap-4 text-[11px] font-mono text-white/50 uppercase">
                           <li>Borrow N$100 &rarr; Repay N$130</li>
                           <li>Borrow N$400 &rarr; Repay N$520</li>
                           <li className="col-span-2 text-emerald-400">Borrow N$1000 &rarr; Repay N$1300 (+ Collateral)</li>
                        </ul>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
