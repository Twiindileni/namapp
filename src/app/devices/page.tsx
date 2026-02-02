'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import DeviceMap from '@/components/DeviceMap'
import MapPicker from '@/components/MapPicker'
import { FaMobileAlt, FaMapMarkedAlt, FaSatelliteDish, FaPlusCircle, FaCheckCircle } from 'react-icons/fa'

const TRACK_SLIDES = [
  { src: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80', alt: 'Smartphone with map', caption: 'Track your device on a live map' },
  { src: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80', alt: 'Mobile phone GPS', caption: 'Real-time GPS from your phone' },
  { src: 'https://images.unsplash.com/photo-1524660988542-c440de9c0fde?w=1200&q=80', alt: 'Location tracking', caption: 'Find your device anywhere' },
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
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm] = useState({
    incident_date: '',
    incident_location: '',
    incident_latitude: null as number | null,
    incident_longitude: null as number | null,
    police_report_number: '',
    description: ''
  })

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadDevices()
  }, [user])

  // Auto-rotate slides on Track Device landing (when !user)
  useEffect(() => {
    const t = setInterval(() => setSlideIndex((i) => (i + 1) % TRACK_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_devices')
        .select('*')
        .eq('user_email', user?.email)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      setDevices(data || [])
    } catch (error: any) {
      console.error('Error loading devices:', error)
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      console.error('Error hint:', error?.hint)
      toast.error(error?.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const handleReportLost = (device: Device) => {
    setSelectedDevice(device)
    setShowReportModal(true)
    setReportForm({
      incident_date: '',
      incident_location: '',
      incident_latitude: null,
      incident_longitude: null,
      police_report_number: '',
      description: ''
    })
  }

  const handleLocationSelect = (lat: number | null, lng: number | null, address: string) => {
    setReportForm(prev => ({
      ...prev,
      incident_location: address,
      incident_latitude: lat,
      incident_longitude: lng
    }))
  }

  const submitReport = async () => {
    if (!selectedDevice) return

    if (!reportForm.incident_date || !reportForm.incident_location) {
      toast.error('Please fill in incident date and location')
      return
    }

    try {
      const { error } = await supabase
        .from('registered_devices')
        .update({
          status: 'lost',
          tracking_requested: true,
          tracking_request_date: new Date().toISOString(),
          incident_date: reportForm.incident_date,
          incident_location: reportForm.incident_location,
          incident_latitude: reportForm.incident_latitude,
          incident_longitude: reportForm.incident_longitude,
          police_report_number: reportForm.police_report_number || null,
          description: reportForm.description || null,
          admin_status: 'pending'
        })
        .eq('id', selectedDevice.id)

      if (error) throw error

      toast.success('Tracking request submitted successfully!')
      setShowReportModal(false)
      setSelectedDevice(null)
      loadDevices()
    } catch (error: any) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit tracking request')
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

      toast.success('Device marked as found!')
      loadDevices()
    } catch (error: any) {
      console.error('Error updating device:', error)
      toast.error('Failed to update device')
    }
  }

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device registration?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('registered_devices')
        .delete()
        .eq('id', deviceId)

      if (error) throw error

      toast.success('Device deleted successfully')
      loadDevices()
    } catch (error: any) {
      console.error('Error deleting device:', error)
      toast.error('Failed to delete device')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      stolen: 'bg-red-100 text-red-800',
      found: 'bg-blue-100 text-blue-800',
      recovered: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const getAdminStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-600">Loading your devices...</div>
        </div>
      </div>
    )
  }

  // Not logged in: show devices page with "How it works" + login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Polished background: soft circles */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-100/40 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" aria-hidden />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-blue-50/60 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />

        <Navbar />

        {/* Image carousel */}
        <section className="relative w-full max-w-5xl mx-auto px-4 pt-6 pb-4 lg:pt-8 lg:pb-6">
          <div className="rounded-2xl overflow-hidden border border-white/40 shadow-xl bg-gray-900">
            <div className="relative aspect-[21/9] sm:aspect-[3/1]">
              {TRACK_SLIDES.map((slide, i) => (
                <div
                  key={slide.alt}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === slideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 1024px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <p className="text-lg sm:text-xl font-semibold drop-shadow-lg">{slide.caption}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 py-3 bg-gray-900/80">
              {TRACK_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlideIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === slideIndex ? 'w-8 bg-indigo-400' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        </section>

        <main className="flex-1 flex flex-col lg:flex-row items-stretch max-w-7xl mx-auto w-full px-4 py-10 lg:py-16 lg:px-8 gap-12 lg:gap-16 relative z-10">
          {/* Left: How it works */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-indigo-600/90 text-sm font-semibold uppercase tracking-wider">How it works</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Track Device
            </h1>
            <p className="text-gray-600 text-lg max-w-md mb-8">
              Register your phone, view it on a live map, and use the Tracker Client to send GPS from your device—no app download.
            </p>

            <ol className="space-y-5 max-w-md">
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FaPlusCircle className="text-lg" />
                </span>
                <div>
                  <span className="font-semibold text-gray-900">Register your device</span>
                  <p className="text-gray-600 text-sm mt-0.5">Add your phone (name, IMEI, brand) so we can associate it with your account.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FaMapMarkedAlt className="text-lg" />
                </span>
                <div>
                  <span className="font-semibold text-gray-900">Open the live map</span>
                  <p className="text-gray-600 text-sm mt-0.5">On your laptop or PC, open the Tracking Dashboard to see device locations in real time.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FaMobileAlt className="text-lg" />
                </span>
                <div>
                  <span className="font-semibold text-gray-900">Tracker Client on your phone</span>
                  <p className="text-gray-600 text-sm mt-0.5">On the device you want to track, open the Tracker Client, select the device, and tap Start Tracking.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FaCheckCircle className="text-lg" />
                </span>
                <div>
                  <span className="font-semibold text-gray-900">See live location</span>
                  <p className="text-gray-600 text-sm mt-0.5">The map updates as the phone moves. Uses the device&apos;s GPS—high accuracy, no cell-tower lookup.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Right: Login card */}
          <div className="flex-shrink-0 w-full lg:max-w-md flex items-center justify-center">
            <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/80 p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-6">
                <FaSatelliteDish className="text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Log in to view your devices</h2>
              <p className="text-gray-600 text-sm mb-6">
                Sign in to see your registered devices, open the live tracking map, and use the Tracker Client.
              </p>
              <Link
                href="/login?redirect=/devices"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
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
        </main>
      </div>
    )
  }

  const lostOrStolenDevices = devices.filter(d => (d.status === 'lost' || d.status === 'stolen') && d.incident_latitude && d.incident_longitude)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Registered Devices
            </h1>
            <p className="text-gray-600 mt-1 text-lg">Manage your registered phones and tracking requests</p>
          </div>
          <button
            onClick={() => router.push('/devices/register')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            + Register New Device
          </button>
        </div>

        {/* Live Tracking Banner */}
        <div className="bg-indigo-900 rounded-xl p-6 mb-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Device Tracking
              </h2>
              <p className="text-indigo-200 mt-1">
                View real-time location updates of all your active and lost devices on an interactive full-screen map.
              </p>
              <p className="text-indigo-300 text-sm mt-2">
                On your phone? Open <strong>Tracker Client</strong> to send GPS from this device (no app download).
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/devices/track')}
                className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
              >
                Open Tracking Dashboard →
              </button>
              <button
                onClick={() => router.push('/devices/report')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-500 border-2 border-indigo-400 transition-colors shadow-lg whitespace-nowrap"
              >
                Tracker Client (this device)
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Map showing lost/stolen devices */}
        {
          lostOrStolenDevices.length > 0 && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full mr-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Device Location Map</h2>
                    <p className="text-gray-600">Last known locations of your lost/stolen devices</p>
                  </div>
                </div>
                <DeviceMap devices={lostOrStolenDevices} />
              </div>
            </div>
          )
        }

        {
          devices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Devices Registered</h3>
              <p className="text-gray-600 mb-6">Register your first device to start tracking and protection</p>
              <button
                onClick={() => router.push('/devices/register')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Register Your First Device
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div key={device.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{device.device_name}</h3>
                      <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                    </div>
                    {getStatusBadge(device.status)}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">IMEI:</span>
                      <span className="font-mono font-semibold">{device.imei_number}</span>
                    </div>
                    {device.color && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Color:</span>
                        <span className="font-semibold">{device.color}</span>
                      </div>
                    )}
                    {device.purchase_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchased:</span>
                        <span>{new Date(device.purchase_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {device.tracking_requested && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-yellow-900">🔍 Tracking Request</span>
                        {getAdminStatusBadge(device.admin_status)}
                      </div>
                      {device.incident_location && (
                        <p className="text-xs text-yellow-800">Last seen: {device.incident_location}</p>
                      )}
                      {device.admin_notes && (
                        <p className="text-xs text-yellow-800 mt-1">Admin: {device.admin_notes}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {device.status === 'active' && (
                      <button
                        onClick={() => handleReportLost(device)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        Report Lost/Stolen
                      </button>
                    )}
                    {(device.status === 'lost' || device.status === 'stolen') && (
                      <button
                        onClick={() => handleMarkAsFound(device.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        Mark as Found
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </main >

      {/* Report Lost/Stolen Modal */}
      {
        showReportModal && selectedDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Report Lost/Stolen Device
              </h2>
              <p className="text-gray-600 mb-6">
                Device: <span className="font-semibold">{selectedDevice.device_name}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportForm.incident_date}
                    onChange={(e) => setReportForm({ ...reportForm, incident_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Known Location <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-4">
                    <p className="text-sm text-blue-600 mb-2">📍 Click on the map to mark the location</p>
                    <MapPicker onLocationSelect={handleLocationSelect} />
                  </div>
                  <input
                    type="text"
                    value={reportForm.incident_location}
                    onChange={(e) => setReportForm({ ...reportForm, incident_location: e.target.value })}
                    placeholder="Location will appear here or type manually"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Police Report Number (if filed)
                  </label>
                  <input
                    type="text"
                    value={reportForm.police_report_number}
                    onChange={(e) => setReportForm({ ...reportForm, police_report_number: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description of Incident
                  </label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    rows={4}
                    placeholder="Please describe what happened..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={submitReport}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Submit Tracking Request
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setSelectedDevice(null)
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
