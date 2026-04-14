'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import { 
  SignalIcon, 
  MagnifyingGlassIcon, 
  ChevronLeftIcon, 
  MapPinIcon,
  DevicePhoneMobileIcon,
  ExclamationCircleIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'

// Dynamically import the map component with no SSR
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-[#020b1a]">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin mx-auto mb-4" />
                <p className="text-[#4a6a90] font-mono text-xs uppercase tracking-widest">Initializing Tactical HUD...</p>
            </div>
        </div>
    )
})

interface Device {
    id: string
    device_name: string
    imei_number: string
    status: 'active' | 'lost' | 'stolen' | 'found' | 'recovered'
    incident_latitude: number | null
    incident_longitude: number | null
    incident_location: string | null
    last_updated?: string
}

export default function TrackDevicesPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        loadDevices()

        // Set up Realtime subscription
        const channel = supabase
            .channel('registered_devices_tracking')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'registered_devices',
                    filter: `user_email=eq.${user.email}`
                },
                (payload) => {
                    const updatedDevice = payload.new as Device
                    setDevices((currentDevices) =>
                        currentDevices.map((device) =>
                            device.id === updatedDevice.id ? { ...device, ...updatedDevice } : device
                        )
                    )
                    toast.success(`Signal Synchronized: ${updatedDevice.device_name}`, {
                        icon: '🛰️',
                        style: {
                            borderRadius: '10px',
                            background: '#020b1a',
                            color: '#fff',
                            border: '1px solid rgba(0,85,204,0.3)'
                        }
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
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
            toast.error('Tactical sync failed')
        } finally {
            setLoading(false)
        }
    }

    const activeDevices = devices.filter(
        d => d.incident_latitude !== null && d.incident_longitude !== null
    )

    const handleDeviceClick = (deviceId: string) => {
        setSelectedDeviceId(deviceId)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020b1a] flex flex-col">
                <Navbar />
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#020b1a] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="glass-card p-12 max-w-md text-center">
                        <SignalIcon className="w-12 h-12 text-[#1a72f0] mx-auto mb-6 opacity-50" />
                        <h2 className="text-2xl font-bold text-white mb-4">Command Center Locked</h2>
                        <p className="text-[#8baed4] mb-8 leading-relaxed">Identity verification required to access live device telemetry.</p>
                        <Link href="/login?redirect=/devices/track" className="btn-primary">Verify Identity</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#020b1a]">
            {/* Nav with less shadow for seamless feel */}
            <div className="z-20">
                <Navbar />
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                
                {/* ═══════════════════════════════════════
                    TACTICAL SIDEBAR
                ════════════════════════════════════════ */}
                <div
                    className={`absolute left-0 top-0 bottom-0 z-[1000] glass-effect !rounded-none transition-all duration-500 ease-in-out border-r border-[rgba(0,85,204,0.15)] flex flex-col ${
                        isSidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
                    }`}
                >
                    {/* Toggle Switch (visible when closed) */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`absolute -right-12 top-4 glass-card !p-3 rounded-r-lg border-l-0 border-[rgba(0,85,204,0.15)] z-[1000] hover:bg-[rgba(0,53,128,0.3)] transition-all ${
                            !isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        <MagnifyingGlassIcon className="w-5 h-5 text-[#5a9ef5]" />
                    </button>

                    <div className="p-6 border-b border-[rgba(0,85,204,0.1)]">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                <CommandLineIcon className="w-5 h-5 text-[#5a9ef5]" />
                                Signal HUD
                            </h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-[#4a6a90] hover:text-white transition-colors">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-green-500/80 uppercase tracking-[0.2em] flex items-center gap-2 mt-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Uplink Established
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeDevices.length === 0 ? (
                            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[rgba(0,85,204,0.15)] bg-[rgba(0,53,128,0.05)]">
                                <p className="text-xs text-[#4a6a90] font-mono leading-relaxed">Searching for active asset signatures in the AO...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                               {activeDevices.map(device => (
                                  <div
                                      key={device.id}
                                      onClick={() => handleDeviceClick(device.id)}
                                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                                          selectedDeviceId === device.id
                                          ? 'bg-[rgba(0,85,204,0.15)] border-[#1a72f0]/40 shadow-[0_0_15px_rgba(26,114,240,0.1)]'
                                          : 'bg-[rgba(2,11,26,0.4)] border-[rgba(0,85,204,0.1)] hover:border-[#1a72f0]/30'
                                      }`}
                                  >
                                      <div className="flex items-center gap-3 mb-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                              device.status === 'lost' || device.status === 'stolen'
                                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                              : 'bg-[#1a72f0]/10 text-[#5a9ef5] border-[#1a72f0]/20'
                                          }`}>
                                              <DevicePhoneMobileIcon className="w-4 h-4" />
                                          </div>
                                          <div>
                                              <h3 className="text-xs font-bold text-white">{device.device_name}</h3>
                                              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                  device.status === 'lost' || device.status === 'stolen' ? 'text-red-400' : 'text-[#5a9ef5]'
                                              }`}>{device.status}</span>
                                          </div>
                                      </div>

                                      <div className="text-[10px] text-[#4a6a90] space-y-2 ml-11">
                                          <p className="font-mono opacity-60">IMEI: {device.imei_number}</p>
                                          <p className="flex items-start gap-1.5 leading-relaxed">
                                              <MapPinIcon className="w-3 h-3 mt-0.5 text-[#5a9ef5]" />
                                              <span className="line-clamp-2">{device.incident_location || 'Receiving location...'}</span>
                                          </p>
                                          <p className="font-mono text-[9px] opacity-40">
                                              LAT: {device.incident_latitude?.toFixed(4)} / LNG: {device.incident_longitude?.toFixed(4)}
                                          </p>
                                      </div>
                                  </div>
                               ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-[rgba(0,85,204,0.1)] bg-[rgba(2,11,26,0.6)] text-[9px] text-center text-[#4a6a90] font-mono uppercase tracking-widest">
                        Satellite / GPS Relay Active
                    </div>
                </div>

                {/* ═══════════════════════════════════════
                    MAP HUD
                ════════════════════════════════════════ */}
                <div className="flex-1 relative h-full">
                    <TrackingMap devices={devices} />

                    {/* Legend HUD Overlay */}
                    <div className="absolute top-6 right-6 z-[500] glass-card p-4 min-w-[160px] border-[rgba(0,85,204,0.2)]">
                        <h4 className="font-bold text-[10px] text-[#5a9ef5] uppercase tracking-widest mb-4">Tactical Legend</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></span>
                                <span className="text-[10px] text-white/70 uppercase">Missing Asset</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#1a72f0] shadow-[0_0_8px_#1a72f0] animate-pulse"></span>
                                <span className="text-[10px] text-white/70 uppercase">Active Signal</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-[rgba(0,85,204,0.1)]">
                               <p className="text-[9px] text-[#4a6a90] italic">Pins indicate last known coordinate relay.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
