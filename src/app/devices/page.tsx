'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { 
  CpuChipIcon, 
  MapIcon, 
  SignalIcon, 
  PlusIcon, 
  CheckBadgeIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const TRACK_SLIDES = [
  { src: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80', alt: 'Smartphone with map', caption: 'Global Asset Monitoring' },
  { src: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80', alt: 'Mobile phone GPS', caption: 'Real-time Telemetry Processing' },
  { src: 'https://images.unsplash.com/photo-1524660988542-c440de9c0fde?w=1200&q=80', alt: 'Location tracking', caption: 'Secure Retrieval Protocol' },
]

interface Device {
  id: string
  device_name: string
  imei_number: string
  brand: string | null
  model: string | null
  color: string | null
  purchase_date: string | null
  serial_number: string | null
  status: 'active' | 'lost' | 'stolen' | 'found' | 'recovered'
  tracking_requested: boolean
  tracking_request_date: string | null
  incident_date: string | null
  incident_location: string | null
  incident_latitude: number | null
  incident_longitude: number | null
  police_report_number: string | null
  description: string | null
  admin_status: 'pending' | 'investigating' | 'resolved' | 'closed'
  admin_notes: string | null
  created_at: string
}

export default function MyDevicesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      const t = setInterval(() => setSlideIndex((i) => (i + 1) % TRACK_SLIDES.length), 5000)
      return () => clearInterval(t)
    }
    loadDevices()
  }, [user])

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_devices')
        .select('*')
        .eq('user_email', user?.email)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDevices(data || [])
    } catch (error: any) {
      console.error('Error loading devices:', error)
      toast.error('Failed to sync assets')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsFound = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('registered_devices')
        .update({
          status: 'found',
          tracking_requested: false
        })
        .eq('id', deviceId)

      if (error) throw error

      toast.success('Asset containment confirmed!')
      loadDevices()
    } catch (error: any) {
      console.error('Error updating device:', error)
      toast.error('Sync failure')
    }
  }

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Authorize permanent removal of this asset signature?')) return

    try {
      const { error } = await supabase
        .from('registered_devices')
        .delete()
        .eq('id', deviceId)

      if (error) throw error

      toast.success('Signature purged')
      loadDevices()
    } catch (error: any) {
      console.error('Error deleting device:', error)
      toast.error('Purge failed')
    }
  }

  const getStatusBadge = (status: string) => {
    const isCrisis = status === 'lost' || status === 'stolen'
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors ${
        isCrisis 
          ? 'bg-red-500/10 text-red-500 border-red-500/20' 
          : 'bg-[#1a72f0]/10 text-[#5a9ef5] border-[#1a72f0]/20'
      }`}>
        {status}
      </span>
    )
  }

  if (loading) {
     return (
        <div className="min-h-screen bg-[#020b1a] flex flex-col">
           <Navbar />
           <div className="flex-grow flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin" />
           </div>
        </div>
     )
  }

  // --- UNAUTHORIZED / PUBLIC LANDING ---
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#020b1a]">
        <Navbar />

        <main className="flex-grow">
          {/* Global Network Hero */}
          <section className="relative h-[85vh] flex items-center overflow-hidden">
             <div className="absolute inset-0">
                {TRACK_SLIDES.map((slide, i) => (
                  <div
                    key={slide.alt}
                    className={`absolute inset-0 transition-opacity duration-1000 ${i === slideIndex ? 'opacity-40 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}
                  >
                    <Image src={slide.src} alt={slide.alt} fill className="object-cover" priority sizes="100vw" />
                  </div>
                ))}
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#020b1a] via-[#020b1a]/60 to-transparent z-20" />
                <div className="absolute inset-0 z-25 pointer-events-none opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(#0055cc 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
             </div>

             <div className="relative z-30 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="max-w-2xl">
                   <span className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-[rgba(0,85,204,0.1)] border border-[rgba(0,85,204,0.25)] text-[#5a9ef5] text-xs font-semibold tracking-widest uppercase fade-in-up">
                      <GlobeAltIcon className="w-3.5 h-3.5" />
                      Global Tracking Initiative
                   </span>
                   <h1 className="hero-title mb-6 fade-in-up fade-in-up-delay-1">
                      Secure Your Digital<br />
                      <span className="gradient-text">Asset Network</span>
                   </h1>
                   <p className="text-xl mb-10 text-[#8baed4] leading-relaxed fade-in-up fade-in-up-delay-2">
                      Protect your devices with military-grade monitoring. Open signals, real-time telemetry, and secure retrieval protocols for all your assets.
                   </p>
                   <div className="flex flex-wrap gap-4 fade-in-up fade-in-up-delay-3">
                      <Link href="/login?redirect=/devices" className="btn-primary">
                         <span>Initialize Access</span>
                      </Link>
                      <Link href="/register" className="btn-outline">
                         <span>Register Network</span>
                      </Link>
                   </div>
                </div>
             </div>
          </section>

          {/* How it Works - Tech Grid */}
          <section className="py-24 px-6 lg:px-8 bg-[rgba(0,53,128,0.02)]">
             <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                   <div>
                      <h2 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Signal Protocol</h2>
                      <div className="space-y-8">
                         {[
                           { title: 'Asset Enrollment', desc: 'Register your hardware via IMEI or Serial signatures for centralized monitoring.', icon: CpuChipIcon },
                           { title: 'Global Sync', desc: 'Connect to our live map engine to view real-time location telemetry on desktop.', icon: MapIcon },
                           { title: 'Passive Transceiver', desc: 'Use our Tracker Client to turn any browser into a GPS beacon—no app install required.', icon: SignalIcon },
                           { title: 'Security Lockdown', desc: 'Remotely report loss or theft to trigger immediate investigation and tracking.', icon: ShieldCheckIcon }
                         ].map((item, idx) => (
                           <div key={idx} className="flex gap-4 group">
                              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#003580]/30 border border-[#0055cc]/20 flex items-center justify-center group-hover:border-[#5a9ef5] transition-colors">
                                 <item.icon className="w-6 h-6 text-[#5a9ef5]" />
                              </div>
                              <div>
                                 <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                 <p className="text-sm text-[#4a6a90]">{item.desc}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="relative">
                      <div className="glass-card p-4 aspect-square flex items-center justify-center relative bg-[rgba(0,85,204,0.05)]">
                         <div className="absolute inset-0 rounded-2xl border-2 border-[#1a72f0]/10 animate-pulse" />
                         <div className="absolute inset-8 rounded-full border border-[#5a9ef5]/20 animate-[spin_10s_linear_infinite]" />
                         <GlobeAltIcon className="w-32 h-32 text-[#1a72f0] opacity-50" />
                      </div>
                   </div>
                </div>
             </div>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  // --- AUTHORIZED DASHBOARD HUB ---
  return (
    <div className="min-h-screen flex flex-col bg-[#020b1a]">
      <Navbar />

      <main className="flex-grow py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Central Management</span>
              <h1 className="hero-title !text-4xl md:!text-5xl mt-4">Asset <span className="gradient-text">Inventory</span></h1>
              <p className="mt-4 text-[#8baed4] max-w-2xl leading-relaxed">
                Monitor and manage your registered hardware. Each device maintains a secure signal link with the Purpose network.
              </p>
            </div>
            <Link href="/devices/register" className="btn-primary">
               <PlusIcon className="w-5 h-5 mr-2" />
               <span>Asset Enrollment</span>
            </Link>
          </div>

          {/* Active Uplink Card */}
          <div className="glass-card p-6 md:p-8 mb-12 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <GlobeAltIcon className="w-48 h-48 text-[#1a72f0]" />
             </div>
             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-[#003580]/40 border border-[#0055cc]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,85,204,0.2)]">
                      <SignalIcon className="w-8 h-8 text-[#5a9ef5] animate-pulse" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live Signal Network</h2>
                      <p className="text-[#8baed4] text-sm">Real-time processing active for {devices.length} asset signature{devices.length !== 1 ? 's' : ''}.</p>
                   </div>
                </div>
                <div className="flex flex-wrap gap-3">
                   <Link href="/devices/track" className="btn-primary !px-6 !py-3">
                      <span>Tracking Dashboard</span>
                      <ChevronRightIcon className="w-4 h-4 ml-2" />
                   </Link>
                   <Link href="/devices/report" className="btn-outline !px-6 !py-3">
                      <span>Tracker Client</span>
                   </Link>
                </div>
             </div>
          </div>

          {devices.length === 0 ? (
            <div className="glass-card p-20 text-center max-w-2xl mx-auto border-dashed border-[#0055cc]/30">
               <CpuChipIcon className="w-16 h-16 text-[#003580] mx-auto mb-6 opacity-50" />
               <h3 className="text-xl font-bold text-white mb-2">Inventory Empty</h3>
               <p className="text-[#4a6a90] mb-8 leading-relaxed">No hardware signals detected. Please initiate asset enrollment to begin monitoring.</p>
               <Link href="/devices/register" className="btn-primary">Enroll Device Now</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div key={device.id} className="glass-card group p-6 flex flex-col border-[rgba(0,85,204,0.1)] hover:border-[#1a72f0]/40 transition-all duration-500">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#003580]/20 flex items-center justify-center border border-[#0055cc]/10">
                           <DevicePhoneMobileIcon className="w-5 h-5 text-[#5a9ef5]" />
                        </div>
                        <div>
                           <h3 className="font-bold text-white">{device.device_name}</h3>
                           <p className="text-[10px] uppercase tracking-widest text-[#4a6a90] font-bold">{device.brand} {device.model}</p>
                        </div>
                     </div>
                     {getStatusBadge(device.status)}
                  </div>

                  <div className="space-y-3 mb-8">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-[#4a6a90] uppercase font-bold tracking-tighter">IMEI Code</span>
                        <span className="font-mono text-white/70">{device.imei_number}</span>
                     </div>
                     {device.purchase_date && (
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-[#4a6a90] uppercase font-bold tracking-tighter">Enrollment Date</span>
                           <span className="text-[#8baed4]">{new Date(device.purchase_date).toLocaleDateString()}</span>
                        </div>
                     )}
                  </div>

                  {device.tracking_requested && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-2 opacity-10">
                          <MagnifyingGlassIcon className="w-8 h-8 text-red-500" />
                       </div>
                       <div className="flex items-center gap-2 mb-2 text-red-400 font-bold text-[10px] uppercase tracking-widest">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Critical Status: Investigation Active
                       </div>
                       <p className="text-xs text-[#8baed4] italic truncate">Last Pos: {device.incident_location || 'Receiving location...'}</p>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-[rgba(0,53,128,0.15)] flex gap-2">
                     {device.status === 'active' ? (
                       <Link href="/devices/report" className="flex-1 btn-outline !py-2 !text-[11px] !rounded scroll-smooth">
                          Signal Check
                       </Link>
                     ) : (
                       <button onClick={() => handleMarkAsFound(device.id)} className="flex-1 btn-primary !bg-green-600/20 !border-green-600/30 !text-green-500 !py-2 !text-[11px] !rounded">
                          Verify Retrieval
                       </button>
                     )}
                     <button onClick={() => handleDelete(device.id)} className="p-2 border border-red-500/10 rounded group-hover:border-red-500/30 transition-colors text-red-500/60 hover:text-red-500">
                        <TrashIcon className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
