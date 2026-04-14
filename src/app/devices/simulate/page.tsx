'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'

interface Device {
    id: string
    device_name: string
    imei_number: string
    incident_latitude: number | null
    incident_longitude: number | null
}

export default function SimulateDevicePage() {
    const { user } = useAuth()
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [simulatingId, setSimulatingId] = useState<string | null>(null)

    // Refs to hold interval ID and current position for simulation
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const positionRef = useRef<{ lat: number, lng: number }>({ lat: -22.5609, lng: 17.0658 }) // Windhoek start

    useEffect(() => {
        if (user) {
            loadDevices()
        }
    }, [user])

    useEffect(() => {
        // Cleanup on unmount
        return () => stopSimulation()
    }, [])

    const loadDevices = async () => {
        try {
            const { data, error } = await supabase
                .from('registered_devices')
                .select('id, device_name, imei_number, incident_latitude, incident_longitude')
                .eq('user_email', user?.email)

            if (error) throw error
            setDevices(data || [])
        } catch (error: any) {
            console.error('Error loading devices:', error)
            toast.error('Failed to load devices')
        } finally {
            setLoading(false)
        }
    }

    const startSimulation = (device: Device) => {
        if (simulatingId) stopSimulation() // Stop any existing simulation

        setSimulatingId(device.id)

        // Use current device pos or default to Windhoek if null
        let currentLat = device.incident_latitude || -22.5609
        let currentLng = device.incident_longitude || 17.0658
        positionRef.current = { lat: currentLat, lng: currentLng }

        toast.success(`Started simulation for ${device.device_name}`)

        intervalRef.current = setInterval(async () => {
            // Move slightly (random walk)
            const latChange = (Math.random() - 0.5) * 0.001 // Approx 100m max move
            const lngChange = (Math.random() - 0.5) * 0.001

            const newLat = positionRef.current.lat + latChange
            const newLng = positionRef.current.lng + lngChange

            positionRef.current = { lat: newLat, lng: newLng }

            try {
                const { error } = await supabase
                    .from('registered_devices')
                    .update({
                        incident_latitude: newLat,
                        incident_longitude: newLng,
                        incident_location: `Simulated Location (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', device.id)

                if (error) {
                    console.error('Update failed:', error)
                    stopSimulation()
                    toast.error('Simulation stopped due to error')
                }
            } catch (e) {
                console.error('Simulation error:', e)
            }
        }, 3000) // Update every 3 seconds
    }

    const stopSimulation = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setSimulatingId(null)
        toast('Simulation stopped')
    }

    if (loading) return <div className="p-10 flex justify-center">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto py-10 px-4">
                <h1 className="text-2xl font-bold mb-6">Device Movement Simulator</h1>
                <p className="mb-6 text-gray-600">
                    Use this tool to simulate real-time movement for your devices. Open the <a href="/devices/track" target="_blank" className="text-blue-600 hover:underline">Tracking Page</a> in another tab to see the updates live.
                </p>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {devices.map(device => (
                            <li key={device.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">{device.device_name}</h3>
                                    <p className="text-sm text-gray-500">IMEI: {device.imei_number}</p>
                                    <p className="text-xs text-gray-400">
                                        Current: {device.incident_latitude?.toFixed(4) || 'N/A'}, {device.incident_longitude?.toFixed(4) || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    {simulatingId === device.id ? (
                                        <button
                                            onClick={stopSimulation}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                        >
                                            Stop Simulation
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => startSimulation(device)}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                        >
                                            Start Simulation
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                        {devices.length === 0 && (
                            <li className="p-8 text-center text-gray-500">No devices found. Register a device first.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
