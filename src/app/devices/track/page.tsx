'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import { FaMobileAlt, FaSearchLocation, FaArrowLeft, FaSatelliteDish } from 'react-icons/fa'

// Dynamically import the map component with no SSR
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Initializing Map Engine...</p>
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
                    console.log('Realtime update received:', payload)
                    const updatedDevice = payload.new as Device

                    setDevices((currentDevices) =>
                        currentDevices.map((device) =>
                            device.id === updatedDevice.id ? { ...device, ...updatedDevice } : device
                        )
                    )

                    toast.success(`Location updated: ${updatedDevice.device_name}`, {
                        icon: '📍',
                        duration: 3000
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
            toast.error('Failed to load devices')
        } finally {
            setLoading(false)
        }
    }

    const activeDevices = devices.filter(
        d => d.incident_latitude !== null && d.incident_longitude !== null
    )

    const handleDeviceClick = (deviceId: string) => {
        setSelectedDeviceId(deviceId)
        // Logic to center map on device could be added via a shared context or callback if needed,
        // but focusing the sidebar item is a good start.
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-md text-center">
                        <FaSatelliteDish className="text-blue-600 text-4xl mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Log in to view your map</h2>
                        <p className="text-gray-600 mb-6">
                            Sign in to see the live tracking map and your devices.
                        </p>
                        <Link
                            href="/login?redirect=/devices/track"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                        >
                            Sign in
                        </Link>
                        <p className="mt-6 text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            <div className="z-20 shadow-md">
                <Navbar />
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                {/* Sidebar Overlay */}
                <div
                    className={`absolute left-0 top-0 bottom-0 z-[1000] bg-white/95 backdrop-blur-sm shadow-2xl transition-all duration-300 ease-in-out border-r border-gray-200 flex flex-col ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
                        }`}
                >
                    {/* Sidebar Toggle Button (Visible when closed) */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`absolute -right-12 top-4 bg-white p-3 rounded-r-lg shadow-md border border-l-0 border-gray-200 z-[1000] hover:bg-gray-50 transition-colors ${!isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    >
                        <FaSearchLocation className="text-blue-600 text-xl" />
                    </button>

                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FaSatelliteDish className="text-blue-600" />
                                Live Tracking
                            </h2>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaArrowLeft />
                            </button>
                        </div>
                        <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            System Online
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeDevices.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p>No devices currently transmitting location data.</p>
                            </div>
                        ) : (
                            activeDevices.map(device => (
                                <div
                                    key={device.id}
                                    onClick={() => handleDeviceClick(device.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${selectedDeviceId === device.id
                                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-md'
                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${device.status === 'lost' || device.status === 'stolen'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            <FaMobileAlt />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{device.device_name}</h3>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${device.status === 'lost' || device.status === 'stolen'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {device.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-600 space-y-1 ml-11">
                                        <p className="font-mono text-gray-500">{device.imei_number}</p>
                                        <p className="flex items-start gap-1">
                                            <span className="mt-0.5">📍</span>
                                            <span className="line-clamp-2">{device.incident_location || 'Unknown location'}</span>
                                        </p>
                                        <p className="text-gray-400">
                                            Lat: {device.incident_latitude?.toFixed(4)}, Lng: {device.incident_longitude?.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-center text-gray-500">
                        Receiving real-time updates via Satellite/GPS
                    </div>
                </div>

                {/* Floating Toggle Button (Visible when open) - handled in sidebar, but we need one when closed */}
                {/* We can rely on the one inside the sidebar logic with translate. */}

                {/* Map Container */}
                <div className="flex-1 relative h-full">
                    <TrackingMap devices={devices} />

                    {/* Map Controls / Legend Overlay */}
                    <div className="absolute top-4 right-4 z-[500] bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
                        <h4 className="font-bold text-sm text-gray-700 mb-2">Map Legend</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span>Lost/Stolen Device</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span>Active Device</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
