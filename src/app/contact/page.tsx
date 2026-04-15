"use client"

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageLoader from '@/components/ui/PageLoader'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ChatBubbleLeftRightIcon, 
  CommandLineIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.error('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      subject: subject || null,
      message,
    })
    setLoading(false)
    if (error) {
      toast.error('Failed to send message. Please try again.')
      return
    }
    toast.success('Message sent successfully!')
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
  }

  if (loading) {
    return (
      <PageLoader 
        icon={<EnvelopeIcon className="w-8 h-8" />}
        message="Dispatching Message..."
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Contact Hero */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-20 fade-in-up">
            <div className="max-w-2xl text-left">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#5a9ef5] mb-6 block">Get in Touch</span>
              <h1 className="hero-title !text-5xl md:!text-7xl">Contact <span className="gradient-text">Us</span></h1>
              <p className="mt-8 text-[#8baed4] text-xl leading-relaxed">
                Have questions or need assistance? Reach out to our team and we will get back to you as soon as possible.
              </p>
            </div>
            
            <div className="glass-card flex items-center gap-6 !p-6 border-[rgba(0,85,204,0.1)]">
               <div className="w-12 h-12 rounded-xl bg-[rgba(0,53,128,0.1)] flex items-center justify-center">
                  <PhoneIcon className="w-6 h-6 text-[#5a9ef5]" />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Direct Line</p>
                  <p className="text-sm font-bold text-white">+264 81 785 4573</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
            
            {/* Contact Channels Sidebar */}
            <div className="space-y-8 fade-in-up md:sticky md:top-32">
              <div className="glass-card !p-8 border-[rgba(26,114,240,0.15)] bg-gradient-to-br from-[rgba(2,11,26,0.5)] to-transparent">
                 <h3 className="text-xs font-bold text-[#5a9ef5] uppercase tracking-widest mb-8 border-b border-[rgba(0,85,204,0.1)] pb-4">Our Channels</h3>
                 
                 <div className="space-y-10">
                    {[
                      { 
                        title: 'Technical Support', 
                        info: '24/7 Priority Access', 
                        icon: CommandLineIcon, 
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10'
                      },
                      { 
                        title: 'General Inquiry', 
                        info: 'Sales & Media', 
                        icon: ChatBubbleLeftRightIcon, 
                        color: 'text-[#5a9ef5]',
                        bg: 'bg-[#1a72f0]/10'
                      },
                      { 
                        title: 'Office Location', 
                        info: 'Windhoek, Namibia', 
                        icon: MapPinIcon, 
                        color: 'text-yellow-400',
                        bg: 'bg-yellow-500/10'
                      }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                         <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 border border-white/5`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                         </div>
                         <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4a6a90] mb-0.5">{item.title}</h4>
                            <p className="text-sm font-bold text-white">{item.info}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="p-8 rounded-[24px] bg-[rgba(0,53,128,0.1)] border border-[rgba(0,85,204,0.1)]">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-[#5a9ef5] mb-2">Privacy Assurance</p>
                 <p className="text-xs text-[#8baed4] leading-relaxed">
                    Your correspondence is protected and will only be shared with the relevant departments.
                 </p>
              </div>
            </div>

            {/* Clean Professional Contact Form */}
            <div className="lg:col-span-3 fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] p-10 md:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                   <EnvelopeIcon className="w-64 h-64 text-black" />
                 </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="w-16 h-16 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                        <EnvelopeIcon className="w-8 h-8 text-black" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Send us a message</h2>
                        <p className="text-sm text-gray-500 mt-1">We typically respond within 2-4 business hours.</p>
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
                          className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/10 transition-all duration-300 placeholder:text-gray-300"
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
                          className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/10 transition-all duration-300 placeholder:text-gray-300"
                          style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Purpose of inquiry"
                        className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[16px] !px-6 !py-4 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/10 transition-all duration-300 placeholder:text-gray-300"
                        style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Your Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="How can we help you?"
                        required
                        className="w-full !bg-gray-50 !border-gray-200 !text-gray-900 !rounded-[20px] !px-6 !py-5 focus:!border-[#1a72f0] focus:!ring-4 focus:!ring-[#1a72f0]/10 transition-all duration-300 placeholder:text-gray-300"
                        style={{ background: '#f9fafb', color: '#111827', borderColor: '#e5e7eb' }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-4">
                       <p className="text-[10px] text-gray-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Encrypted Message SSL Secured
                       </p>
                       <button
                         type="submit"
                         disabled={loading}
                         className="w-full sm:w-auto bg-[#1a72f0] hover:bg-black text-white px-12 py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#1a72f0]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                       >
                         {loading ? 'Sending...' : 'Send Message'}
                         <ChevronRightIcon className="w-5 h-5" />
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
