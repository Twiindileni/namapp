'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#020b1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-[#1a72f0]/30 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[#1a72f0] animate-spin" />
        </div>
        <p className="text-[#8baed4] text-xs font-bold tracking-widest uppercase">Initialising Map Engine…</p>
      </div>
    </div>
  ),
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
  const [devices, setDevices]               = useState<Device[]>([])
  const [loading, setLoading]               = useState(true)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen]       = useState(true)
  const [updateCount, setUpdateCount]       = useState(0)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadDevices()

    const channel = supabase
      .channel('registered_devices_tracking')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'registered_devices', filter: `user_email=eq.${user.email}` },
        (payload) => {
          const u = payload.new as Device
          setDevices((prev) => prev.map((d) => d.id === u.id ? { ...d, ...u } : d))
          setUpdateCount((n) => n + 1)
          toast.success(`📍 Location updated: ${u.device_name}`, { duration: 3000 })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
    } catch (e: any) {
      toast.error('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const activeDevices = devices.filter((d) => d.incident_latitude !== null && d.incident_longitude !== null)

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b1a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-[#1a72f0]/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#1a72f0] animate-spin" />
            </div>
            <p className="text-[#8baed4] text-xs font-bold tracking-widest uppercase">Loading tracker…</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Not logged in ────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020b1a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative w-full max-w-sm">
            {/* Multi-layer glow */}
            <div className="absolute -inset-6 rounded-[40px] bg-[#1a72f0]/8 blur-3xl pointer-events-none" />
            <div className="absolute -inset-2 rounded-[32px] bg-[#00d4ff]/5 blur-xl pointer-events-none" />

            <div className="relative bg-[#030e1f]/95 backdrop-blur-3xl border border-[#1a72f0]/30 rounded-[28px] p-10 text-center shadow-2xl shadow-[#1a72f0]/10">
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#1a72f0] to-transparent rounded-t-[28px]" />
              {/* Corner bracket decorations */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#1a72f0]/50 rounded-tl-sm" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#1a72f0]/50 rounded-tr-sm" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#00d4ff]/30 rounded-bl-sm" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#00d4ff]/30 rounded-br-sm" />

              {/* Triple radar rings */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border border-[#1a72f0]/25 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full border border-[#1a72f0]/20 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.6s' }} />
                <div className="absolute inset-4 rounded-full border border-[#1a72f0]/15 animate-ping" style={{ animationDuration: '3.6s', animationDelay: '1.2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a72f0]/15 to-[#00d4ff]/10 border border-[#1a72f0]/30 flex items-center justify-center shadow-inner shadow-[#1a72f0]/10">
                    <svg className="w-7 h-7 text-[#1a72f0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-[9px] font-black tracking-[0.4em] text-[#1a72f0] uppercase mb-2">Purpose Technology</p>
              <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">Sign in to view map</h2>
              <p className="text-[#8baed4] text-sm mb-8 leading-relaxed">Log in to see the live tracking map and your device positions.</p>
              <Link href="/login?redirect=/devices/track" className="block w-full bg-gradient-to-r from-[#1a72f0] to-[#1560d4] hover:from-[#1560d4] hover:to-[#1050c0] text-white font-black py-3.5 rounded-2xl transition-all duration-200 text-sm uppercase tracking-widest mb-4 shadow-lg shadow-[#1a72f0]/30 hover:shadow-[#1a72f0]/50">
                Sign In
              </Link>
              <p className="text-[#4a7aaa] text-sm">
                No account?{' '}
                <Link href="/register" className="text-[#1a72f0] font-semibold hover:text-white transition-colors">Register</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Main tracker view ────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#020b1a]">
      {/* Navbar */}
      <div className="relative z-20 shrink-0">
        <Navbar />
      </div>

      <div className="flex-1 relative flex overflow-hidden">

        {/* ── Dark Sidebar ──────────────────────────────────────── */}
        <div className={`absolute left-0 top-0 bottom-0 z-[1000] flex flex-col bg-[#06111f]/95 backdrop-blur-xl border-r border-white/8 shadow-2xl transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'}`}>
          {/* Sidebar header */}
          <div className="shrink-0 p-5 border-b border-white/8">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1a72f0]/15 border border-[#1a72f0]/25 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#1a72f0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">Live Tracker</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">System Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#4a7aaa] hover:text-white transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1 bg-white/3 rounded-xl border border-white/8 px-3 py-2 text-center">
                <p className="text-white font-black text-lg leading-none">{devices.length}</p>
                <p className="text-[#4a7aaa] text-[9px] uppercase tracking-widest font-bold mt-1">Total</p>
              </div>
              <div className="flex-1 bg-white/3 rounded-xl border border-white/8 px-3 py-2 text-center">
                <p className="text-[#1a72f0] font-black text-lg leading-none">{activeDevices.length}</p>
                <p className="text-[#4a7aaa] text-[9px] uppercase tracking-widest font-bold mt-1">On Map</p>
              </div>
              <div className="flex-1 bg-white/3 rounded-xl border border-white/8 px-3 py-2 text-center">
                <p className="text-amber-400 font-black text-lg leading-none">{updateCount}</p>
                <p className="text-[#4a7aaa] text-[9px] uppercase tracking-widest font-bold mt-1">Updates</p>
              </div>
            </div>
          </div>

          {/* Device list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-14 h-14 mb-4">
                  <div className="absolute inset-0 rounded-full border border-[#1a72f0]/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute inset-2 rounded-full border border-[#1a72f0]/20 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.7s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-xl bg-[#1a72f0]/10 border border-[#1a72f0]/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#4a7aaa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-[#4a7aaa] text-xs leading-relaxed">No devices transmitting location data yet.</p>
                <button
                  onClick={() => router.push('/devices/report')}
                  className="mt-4 text-[#1a72f0] text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Start Tracker Client →
                </button>
              </div>
            ) : (
              activeDevices.map((device) => {
                const isLost = device.status === 'lost' || device.status === 'stolen'
                const isSelected = selectedDeviceId === device.id
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => setSelectedDeviceId(isSelected ? null : device.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#1a72f0]/15 border-[#1a72f0]/50 shadow-lg shadow-[#1a72f0]/15'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {/* Device icon with pulsing dot */}
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLost ? 'bg-red-500/15 border border-red-500/30' : 'bg-[#1a72f0]/15 border border-[#1a72f0]/25'}`}>
                          <svg className={`w-4 h-4 ${isLost ? 'text-red-400' : 'text-[#1a72f0]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLost ? 'bg-red-400' : 'bg-[#1a72f0]'}`} />
                          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLost ? 'bg-red-500' : 'bg-[#1a72f0]'}`} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm truncate">{device.device_name}</p>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isLost ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {device.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#4a7aaa] space-y-1 ml-12">
                      <p className="font-mono">{device.imei_number}</p>
                      <p className="flex items-start gap-1">
                        <span className="text-[#1a72f0] mt-0.5">📍</span>
                        <span className="line-clamp-1">{device.incident_location || 'Location recorded'}</span>
                      </p>
                      <p className="text-[#2a4a6a] font-mono text-[9px]">
                        {device.incident_latitude?.toFixed(4)}, {device.incident_longitude?.toFixed(4)}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Sidebar footer */}
          <div className="shrink-0 p-4 border-t border-white/[0.08]">
            <button
              onClick={() => router.push('/devices')}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#1a72f0]/30 text-[#8baed4] hover:text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              My Devices
            </button>
          </div>
        </div>

        {/* Toggle button when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-6 z-[1000] bg-[#06111f] border border-white/10 border-l-0 rounded-r-xl px-2 py-4 flex items-center justify-center text-[#1a72f0] hover:text-white hover:bg-[#1a72f0]/20 transition-all shadow-xl"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* ── Map ──────────────────────────────────────────────── */}
        <div className="flex-1 relative h-full">
          <TrackingMap devices={devices} />

          {/* HUD overlay — top left */}
          <div className="absolute top-4 left-4 z-[500] pointer-events-none">
            <div className="bg-[#020b1a]/85 backdrop-blur-xl border border-[#1a72f0]/30 rounded-2xl px-4 py-3">
              {/* Top accent */}
              <div className="absolute top-0 left-4 right-4 h-[1.5px] bg-gradient-to-r from-transparent via-[#1a72f0] to-transparent rounded-full" />
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#1a72f0] mb-0.5">Purpose Technology</p>
              <p className="text-white font-bold text-sm">Live Device Tracker</p>
            </div>
          </div>

          {/* Legend — top right */}
          <div className="absolute top-4 right-4 z-[500]">
            <div className="bg-[#020b1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 min-w-[140px]">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a7aaa] mb-3">Map Legend</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-3 h-3 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" style={{ animationDuration: '2s' }} />
                    <div className="relative w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <span className="text-[#8baed4] text-xs">Lost / Stolen</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-3 h-3 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-[#1a72f0] animate-ping opacity-50" style={{ animationDuration: '2.5s' }} />
                    <div className="relative w-3 h-3 rounded-full bg-[#1a72f0]" />
                  </div>
                  <span className="text-[#8baed4] text-xs">Active Device</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom HUD bar */}
          <div className="absolute bottom-4 left-4 right-4 z-[500] pointer-events-none">
            <div className="bg-[#020b1a]/80 backdrop-blur-xl border border-white/[0.09] rounded-2xl px-5 py-3 flex items-center justify-between gap-6">
              {/* Top accent */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#1a72f0]/40 to-transparent" />
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                </span>
                <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">Realtime GPS Active</span>
              </div>
              <div className="flex items-center gap-5 text-[10px] text-[#4a7aaa] font-mono">
                <span>{activeDevices.length} device{activeDevices.length !== 1 ? 's' : ''} on map</span>
                <span className="hidden sm:block">{updateCount} live update{updateCount !== 1 ? 's' : ''} received</span>
                <span className="hidden md:block">Satellite / GPS · High Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
