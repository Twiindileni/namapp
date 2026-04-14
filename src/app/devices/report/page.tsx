'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'
import { 
  SignalIcon, 
  StopIcon, 
  PlayIcon, 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon, 
  MapIcon, 
  CheckCircleIcon,
  GlobeAltIcon,
  CommandLineIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Device {
    id: string
    device_name: string
    imei_number: string
}

export default function ReportLocationPage() {
    const { user } = useAuth()
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
    const [isTracking, setIsTracking] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [lastPosition, setLastPosition] = useState<{ lat: number, lng: number } | null>(null)
    const [wakeLock, setWakeLock] = useState<{ release: () => Promise<void> } | null>(null)

    const watchIdRef = useRef<number | null>(null)

    useEffect(() => {
        if (user) {
            loadDevices()
        } else {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        return () => stopTracking()
    }, [])

    const loadDevices = async () => {
        try {
            const { data, error } = await supabase
                .from('registered_devices')
                .select('id, device_name, imei_number')
                .eq('user_email', user?.email)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDevices(data || [])
            if (data && data.length > 0) {
                setSelectedDeviceId(data[0].id)
            }
        } catch (error: any) {
            console.error('Error loading devices:', error)
            toast.error('Sync failure')
        } finally {
            setLoading(false)
        }
    }

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50))
    }

    const updateLocation = async (lat: number, lng: number, accuracy: number) => {
        if (!selectedDeviceId) return

        setLastPosition({ lat, lng })
        addLog(`COORD RELAY: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(accuracy)}m)`)

        try {
            const { error } = await supabase
                .from('registered_devices')
                .update({
                    incident_latitude: lat,
                    incident_longitude: lng,
                    incident_location: `Live Pulse: ${lat.toFixed(5)}, ${lng.toFixed(5)} (Acc: ${Math.round(accuracy)}m)`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedDeviceId)

            if (error) {
                addLog(`CRITICAL: UPLINK FAILED - ${error.message}`)
            } else {
                addLog('SUCCESS: PACKET TRANSMITTED')
            }
        } catch (err: any) {
            addLog(`ERROR: SIG_THROUGHPUT_FAILURE`)
        }
    }

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                const lock = await (navigator as any).wakeLock.request('screen')
                setWakeLock(lock)
                addLog('INFO: SIGNAL_INTEGRITY_LOCKED (Always On)')

                lock.addEventListener('release', () => {
                    addLog('WARN: SIGNAL_INTEGRITY_DROPPED')
                    setWakeLock(null)
                })
            } else {
                addLog('NOTICE: WAKE_LOCK_API_UNAVAILABLE')
            }
        } catch (err: any) {
            addLog(`ERR: LOCK_ACQUISITION_FAILURE`)
        }
    }

    const startTracking = async () => {
        if (!navigator.geolocation) {
            toast.error('GEO_ENGINE_REJECTED')
            return
        }

        if (!selectedDeviceId) {
            toast.error('SELECT_TARGET_ASSET')
            return
        }

        setIsTracking(true)
        addLog('INIT: SIGNAL_TRANSMISSION_PROTOCOL...')

        await requestWakeLock()

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords
                updateLocation(latitude, longitude, accuracy)
            },
            (error) => {
                let msg = 'Unknown'
                switch (error.code) {
                    case 1: msg = 'AUTH_DENIED'; break;
                    case 2: msg = 'POS_UNAVAILABLE'; break;
                    case 3: msg = 'SYNC_TIMEOUT'; break;
                }
                addLog(`CRIT: GPS_UNIT_ERROR - ${msg}`)
                toast.error(`SIGNAL ERROR: ${msg}`)
            },
            options
        )
    }

    const stopTracking = async () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }

        if (wakeLock) {
            try {
                await wakeLock.release()
            } catch (_) { }
            setWakeLock(null)
        }

        setIsTracking(false)
        addLog('TERM: PROTOCOL_SHUTDOWN')
    }

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isTracking && !wakeLock) {
                await requestWakeLock()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isTracking, wakeLock])

    if (loading) return (
       <div className="min-h-screen bg-[#020b1a] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin" />
       </div>
    )

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col bg-[#020b1a]">
                <Navbar />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="glass-card p-12 max-w-sm w-full text-center">
                        <GlobeAltIcon className="w-16 h-16 text-[#1a72f0] mx-auto mb-6 opacity-50" />
                        <h1 className="text-xl font-bold text-white mb-4">Signal Transmitter</h1>
                        <p className="text-[#8baed4] text-sm mb-8">Verification required to instantiate signal relay protocols.</p>
                        <Link href="/login" className="btn-primary w-full justify-center">Authorize Now</Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (devices.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-[#020b1a]">
                <Navbar />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="glass-card p-12 max-w-sm w-full text-center">
                        <ExclamationCircleIcon className="w-16 h-16 text-[#003580] mx-auto mb-6 opacity-50" />
                        <h1 className="text-xl font-bold text-white mb-4">No Asset Target</h1>
                        <p className="text-[#8baed4] text-sm mb-8">Register a hardware signature before initializing the transmitter.</p>
                        <Link href="/devices/register" className="btn-primary w-full justify-center">Asset Enrollment</Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#020b1a]">
            <Navbar />

            <main className="flex-grow pt-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
               <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
                  
                  {/* Left: Engine Intel */}
                  <div className="relative">
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Relay Service</span>
                      <h1 className="hero-title !text-4xl md:!text-5xl mt-4">Signal <span className="gradient-text">Transmitter</span></h1>
                      <p className="mt-6 text-[#8baed4] text-lg max-w-md leading-relaxed">
                          Turn this physical unit into a GPS beacon. Transmit coordinate telemetry directly to the Signal Hub without external software.
                      </p>

                      <div className="mt-12 space-y-6">
                         {[
                           { label: 'Uplink Protocol', desc: 'Secure browser-to-server coordinate relay.', icon: ComputerDesktopIcon },
                           { label: 'Hardware Precise', desc: 'Utilizes direct GPS chipset signatures.', icon: DevicePhoneMobileIcon },
                           { label: 'Tactical Sync', desc: 'Visible instantly on the global command map.', icon: MapIcon }
                         ].map((item, idx) => (
                           <div key={idx} className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[#003580]/30 border border-[#0055cc]/20 flex items-center justify-center">
                                 <item.icon className="w-5 h-5 text-[#5a9ef5]" />
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-white">{item.label}</h4>
                                 <p className="text-xs text-[#4a6a90]">{item.desc}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                  </div>

                  {/* Right: Transmitter Engine */}
                  <div className="flex justify-center">
                     <div className="w-full max-w-sm glass-card !p-0 overflow-hidden relative group">
                        {/* Decorative Grid Mesh */}
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                             style={{ backgroundImage: 'radial-gradient(#0055cc 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
                        
                        <div className="bg-gradient-to-r from-[#003580] to-[#001a40] p-8 text-center border-b border-[rgba(0,85,204,0.1)] relative z-10">
                            <div className="relative inline-block mb-6">
                               {isTracking && (
                                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-[ping_2s_linear_infinite] opacity-50" />
                               )}
                               <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.3)] ${
                                  isTracking ? 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/20' : 'bg-[#020b1a] border-[#0055cc]/30'
                               }`}>
                                  <SignalIcon className={`w-10 h-10 ${isTracking ? 'text-emerald-400' : 'text-[#5a9ef5]'}`} />
                               </div>
                            </div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                               Transmitter Engine
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-[#4a6a90]'}`} />
                               <span className={`text-[10px] font-bold uppercase tracking-widest ${isTracking ? 'text-emerald-400' : 'text-[#4a6a90]'}`}>
                                  {isTracking ? 'Packet Transmission Active' : 'System Standby'}
                               </span>
                            </div>
                            {wakeLock && (
                               <p className="text-[9px] text-emerald-400/60 uppercase tracking-widest mt-2 flex items-center justify-center gap-1 font-bold">
                                  <SparklesIcon className="w-3 h-3" />
                                  Integrity Lock Enabled
                               </p>
                            )}
                        </div>

                        <div className="p-8 space-y-6 relative z-10">
                            {!isTracking && (
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Target Signature</label>
                                    <select
                                        value={selectedDeviceId}
                                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                                        className="w-full !py-3"
                                    >
                                        {devices.map(d => (
                                            <option key={d.id} value={d.id}>{d.device_name} (S/N: {d.imei_number.slice(-6)})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {isTracking ? (
                                <div className="space-y-6">
                                    {lastPosition && (
                                        <div className="p-4 rounded-xl bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 text-center">
                                            <p className="text-[10px] text-[#4a6a90] uppercase font-bold tracking-widest mb-1">Last coordinate Relay</p>
                                            <p className="font-mono text-lg text-emerald-400 font-bold">{lastPosition.lat.toFixed(5)}, {lastPosition.lng.toFixed(5)}</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={stopTracking}
                                        className="btn-primary !bg-red-600/20 !border-red-600/30 !text-red-500 w-full justify-center group"
                                    >
                                        <StopIcon className="w-5 h-5 mr-2" />
                                        <span>Terminate Pulse</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={startTracking}
                                    className="btn-primary w-full justify-center group"
                                >
                                    <PlayIcon className="w-5 h-5 mr-2" />
                                    <span>Initiate Relay</span>
                                </button>
                            )}

                            <div className="pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                   <CommandLineIcon className="w-3.5 h-3.5 text-[#5a9ef5]" />
                                   <h3 className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest">Protocol Log</h3>
                                </div>
                                <div className="bg-[#010610] text-[#5a9ef5]/90 text-[10px] font-mono p-4 rounded-xl h-32 overflow-y-auto custom-scrollbar border border-[rgba(0,85,204,0.1)]">
                                    {logs.length === 0 ? (
                                        <div className="text-[#4a6a90] italic opacity-50">Awaiting protocol initiation...</div>
                                    ) : (
                                        logs.map((log, i) => <div key={i} className="mb-1 leading-relaxed">{log}</div>)
                                    )}
                                </div>
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
