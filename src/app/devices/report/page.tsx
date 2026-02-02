'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { FaSatelliteDish, FaStop, FaPlay, FaMobileAlt, FaLaptop, FaMapMarkedAlt, FaCheckCircle } from 'react-icons/fa'

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
        // Cleanup on unmount
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
            toast.error('Failed to load devices')
        } finally {
            setLoading(false)
        }
    }

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString()
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50))
    }

    const updateLocation = async (lat: number, lng: number, accuracy: number) => {
        if (!selectedDeviceId) return

        setLastPosition({ lat, lng })
        addLog(`📍 Location: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(accuracy)}m)`)

        try {
            const { error } = await supabase
                .from('registered_devices')
                .update({
                    incident_latitude: lat,
                    incident_longitude: lng,
                    incident_location: `Live Tracker: ${lat.toFixed(5)}, ${lng.toFixed(5)} (Accuracy: ${Math.round(accuracy)}m)`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedDeviceId)

            if (error) {
                console.error('Update error:', error)
                addLog(`❌ Upload failed: ${error.message}`)
            } else {
                addLog('✅ Uploaded to server')
            }
        } catch (err: any) {
            addLog(`❌ Error: ${err.message}`)
        }
    }

    // Function to request wake lock
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                const lock = await (navigator as any).wakeLock.request('screen')
                setWakeLock(lock)
                addLog('💡 Screen Wake Lock active (Always On)')

                lock.addEventListener('release', () => {
                    addLog('💡 Screen Wake Lock released')
                    setWakeLock(null)
                })
            } else {
                addLog('⚠️ Wake Lock API not supported')
            }
        } catch (err: any) {
            console.error('Wake Lock error:', err)
            addLog(`⚠️ Failed to lock screen: ${err.name}, ${err.message}`)
        }
    }

    const startTracking = async () => { // Changed to async
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by this browser.')
            return
        }

        if (!selectedDeviceId) {
            toast.error('Please select a device to link this phone to.')
            return
        }

        setIsTracking(true)
        addLog('🚀 Starting tracking service...')

        // Request Wake Lock
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
                console.error('Geo error:', error)
                let msg = 'Unknown error'
                switch (error.code) {
                    case 1: msg = 'Permission denied'; break;
                    case 2: msg = 'Position unavailable'; break;
                    case 3: msg = 'Timeout'; break;
                }
                addLog(`⚠️ GPS Error: ${msg}`)
                toast.error(`GPS Error: ${msg}`)
            },
            options
        )
    }

    const stopTracking = async () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }

        // Release Wake Lock
        if (wakeLock) {
            try {
                await wakeLock.release()
            } catch (_) { /* ignore */ }
            setWakeLock(null)
        }

        setIsTracking(false)
        addLog('🛑 Tracking stopped')
    }

    // Handle visibility change to re-acquire lock if tab comes back
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isTracking && !wakeLock) {
                await requestWakeLock()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [isTracking, wakeLock])

    if (loading) return <div className="p-10 flex justify-center">Loading...</div>

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
                <Navbar />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 text-center border border-white/20 max-w-sm w-full">
                        <FaSatelliteDish className="text-blue-600 text-4xl mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900">Live Tracker Client</h1>
                        <p className="mt-2 text-gray-600 text-sm">Log in to see your devices and turn this phone into a GPS tracker.</p>
                        <a href="/login" className="mt-6 inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                            Log in
                        </a>
                    </div>
                </main>
            </div>
        )
    }

    if (devices.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
                <Navbar />
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 text-center border border-white/20 max-w-sm w-full">
                        <FaMobileAlt className="text-blue-500 text-4xl mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900">No devices</h1>
                        <p className="mt-2 text-gray-600 text-sm">Register a device first so this phone can report its location as that device.</p>
                        <a href="/devices/register" className="mt-6 inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                            Register a device
                        </a>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
            <Navbar />

            <main className="flex-1 flex flex-col lg:flex-row items-stretch min-h-0">
                {/* Left: How it works */}
                <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:py-16 lg:pl-16 lg:pr-12 relative overflow-hidden">
                    {/* Decorative leaves/shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none" aria-hidden>
                        <svg viewBox="0 0 200 200" fill="currentColor" className="text-emerald-400">
                            <path d="M100 20 Q140 60 120 100 Q100 140 60 120 Q20 100 60 60 Q100 20 100 20" />
                        </svg>
                    </div>
                    <div className="absolute bottom-20 left-0 w-40 h-40 opacity-10 pointer-events-none" aria-hidden>
                        <svg viewBox="0 0 200 200" fill="currentColor" className="text-emerald-300">
                            <path d="M50 150 Q90 110 130 150 Q100 180 50 150" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <p className="text-blue-200/90 text-sm font-semibold uppercase tracking-wider">How it works</p>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mt-2 mb-6">Live Tracker Client</h1>
                        <p className="text-blue-100/95 text-lg max-w-md mb-8">
                            Turn this phone into a GPS tracker. No app download—use your browser and the device&apos;s real GPS.
                        </p>

                        <ol className="space-y-5 max-w-md">
                            <li className="flex gap-4 items-start">
                                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <FaLaptop className="text-lg" />
                                </span>
                                <div>
                                    <span className="font-semibold text-white">On your laptop or PC</span>
                                    <p className="text-blue-100/90 text-sm mt-0.5">Open <strong>/devices/track</strong> to see the live map.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <FaMobileAlt className="text-lg" />
                                </span>
                                <div>
                                    <span className="font-semibold text-white">On this phone</span>
                                    <p className="text-blue-100/90 text-sm mt-0.5">Select your device below and tap <strong>Start Tracking</strong>.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <FaMapMarkedAlt className="text-lg" />
                                </span>
                                <div>
                                    <span className="font-semibold text-white">Real-time map</span>
                                    <p className="text-blue-100/90 text-sm mt-0.5">Your position updates on the map as you move. Keep this tab open.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-200">
                                    <FaCheckCircle className="text-lg" />
                                </span>
                                <div>
                                    <span className="font-semibold text-white">High accuracy</span>
                                    <p className="text-blue-100/90 text-sm mt-0.5">Uses this device&apos;s GPS hardware—not cell towers.</p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </div>

                {/* Right: Form card */}
                <div className="flex-shrink-0 w-full lg:max-w-md flex items-center justify-center p-6 lg:py-16 lg:pr-16 lg:pl-8 relative">
                    <div className="absolute right-0 top-1/4 w-48 h-48 opacity-10 pointer-events-none hidden lg:block" aria-hidden>
                        <svg viewBox="0 0 200 200" fill="currentColor" className="text-emerald-400">
                            <path d="M100 30 Q160 80 140 140 Q80 160 30 100 Q50 40 100 30" />
                        </svg>
                    </div>

                    <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden border border-white/20 relative z-10">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-center">
                            <FaSatelliteDish className="text-white text-3xl mx-auto mb-2 opacity-95" />
                            <h2 className="text-xl font-bold text-white">Tracker Client</h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {isTracking ? <span className="text-emerald-200 font-medium">● Transmitting</span> : 'Idle'}
                            </p>
                            {wakeLock && <p className="text-emerald-200 text-xs mt-1 animate-pulse">Screen lock active</p>}
                        </div>

                        <div className="p-6 space-y-5">
                            {!isTracking && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select device</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDeviceId}
                                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                                            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 pl-10 bg-gray-50"
                                        >
                                            {devices.map(d => (
                                                <option key={d.id} value={d.id}>{d.device_name} ({d.imei_number})</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaMobileAlt className="text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Which device is this phone?</p>
                                </div>
                            )}

                            {isTracking ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3 border-4 border-emerald-500">
                                        <div className="w-3 h-3 rounded-full bg-emerald-600 animate-ping" />
                                    </div>
                                    <p className="font-semibold text-gray-800">Tracking active</p>
                                    <p className="text-gray-500 text-sm">Keep this tab open</p>
                                    {lastPosition && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-xl text-center w-full border border-gray-200">
                                            <p className="text-xs text-gray-500 uppercase font-medium">Position</p>
                                            <p className="font-mono text-sm">{lastPosition.lat.toFixed(5)}, {lastPosition.lng.toFixed(5)}</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={stopTracking}
                                        className="mt-5 w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition active:scale-[0.98]"
                                    >
                                        <FaStop /> Stop Tracking
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={startTracking}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition active:scale-[0.98]"
                                >
                                    <FaPlay /> Start Tracking
                                </button>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Activity log</h3>
                                <div className="bg-gray-900 text-emerald-400/90 text-xs font-mono p-3 rounded-xl h-28 overflow-y-auto">
                                    {logs.length === 0 ? (
                                        <span className="text-gray-500 italic">No activity yet…</span>
                                    ) : (
                                        logs.map((log, i) => <div key={i}>{log}</div>)
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
