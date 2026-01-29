'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import DeviceMap from '@/components/DeviceMap'
import MapPicker from '@/components/MapPicker'

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
      router.push('/login')
      return
    }
    loadDevices()
  }, [user])

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_devices')
        .select('*')
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

        {/* Interactive Map showing lost/stolen devices */}
        {lostOrStolenDevices.length > 0 && (
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
        )}

        {devices.length === 0 ? (
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
        )}
      </main>

      {/* Report Lost/Stolen Modal */}
      {showReportModal && selectedDevice && (
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
      )}
    </div>
  )
}
