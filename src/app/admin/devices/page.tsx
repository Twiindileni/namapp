'use client'

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Leaflet
const DeviceMap = dynamic(() => import('@/components/DeviceMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-lg"></div>
})

interface Device {
  id: string
  user_email: string
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
  resolved_date: string | null
  created_at: string
}

export default function AdminDevicesPage() {
  const router = useRouter()
  const { userRole, authLoading } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTrackingRequested, setFilterTrackingRequested] = useState<string>('all')
  const [adminNotes, setAdminNotes] = useState('')
  const [adminStatus, setAdminStatus] = useState<'pending' | 'investigating' | 'resolved' | 'closed'>('pending')

  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      router.push('/admin')
      return
    }
    if (userRole === 'admin') {
      loadDevices()
    }
  }, [userRole, authLoading])

  useEffect(() => {
    applyFilters()
  }, [devices, filterStatus, filterTrackingRequested])

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_devices')
        .select('*')
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

  const applyFilters = () => {
    let filtered = devices

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus)
    }

    if (filterTrackingRequested === 'requested') {
      filtered = filtered.filter(d => d.tracking_requested === true)
    } else if (filterTrackingRequested === 'not-requested') {
      filtered = filtered.filter(d => d.tracking_requested === false)
    }

    setFilteredDevices(filtered)
  }

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device)
    setAdminNotes(device.admin_notes || '')
    setAdminStatus(device.admin_status)
    setShowDetailModal(true)
  }

  const handleUpdateDevice = async () => {
    if (!selectedDevice) return

    try {
      const updateData: any = {
        admin_notes: adminNotes,
        admin_status: adminStatus
      }

      if (adminStatus === 'resolved' || adminStatus === 'closed') {
        updateData.resolved_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('registered_devices')
        .update(updateData)
        .eq('id', selectedDevice.id)

      if (error) throw error

      toast.success('Device updated successfully!')
      setShowDetailModal(false)
      setSelectedDevice(null)
      loadDevices()
    } catch (error: any) {
      console.error('Error updating device:', error)
      toast.error('Failed to update device')
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('registered_devices')
        .delete()
        .eq('id', deviceId)

      if (error) throw error

      toast.success('Device deleted successfully')
      setShowDetailModal(false)
      setSelectedDevice(null)
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

  const stats = {
    total: devices.length,
    trackingRequested: devices.filter(d => d.tracking_requested).length,
    pending: devices.filter(d => d.admin_status === 'pending' && d.tracking_requested).length,
    investigating: devices.filter(d => d.admin_status === 'investigating').length,
    resolved: devices.filter(d => d.admin_status === 'resolved').length
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return null
  }

  const devicesWithLocation = devices.filter(d => d.incident_latitude && d.incident_longitude)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Device Tracking Management
          </h1>
          <p className="text-gray-600 mt-1 text-lg">Manage registered devices and tracking requests</p>
        </div>

        {/* Map showing all tracked devices */}
        {devicesWithLocation.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All Device Locations</h2>
                  <p className="text-gray-600">Real-time view of reported lost/stolen devices</p>
                </div>
              </div>
              <DeviceMap devices={devicesWithLocation} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Devices</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.trackingRequested}</div>
            <div className="text-sm text-gray-600">Tracking Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
            <div className="text-sm text-gray-600">Investigating</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="lost">Lost</option>
                <option value="stolen">Stolen</option>
                <option value="found">Found</option>
                <option value="recovered">Recovered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Requests
              </label>
              <select
                value={filterTrackingRequested}
                onChange={(e) => setFilterTrackingRequested(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Devices</option>
                <option value="requested">Tracking Requested</option>
                <option value="not-requested">No Tracking Request</option>
              </select>
            </div>
          </div>
        </div>

        {/* Devices List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No devices found
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{device.device_name}</div>
                        <div className="text-sm text-gray-600">{device.brand} {device.model}</div>
                        <div className="text-xs font-mono text-gray-500 mt-1">IMEI: {device.imei_number}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {device.user_email}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(device.status)}
                      </td>
                      <td className="px-6 py-4">
                        {device.tracking_requested ? (
                          <div>
                            <span className="text-sm font-semibold text-red-600">Requested</span>
                            {device.incident_location && (
                              <div className="text-xs text-gray-600 mt-1">
                                {device.incident_location}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {device.tracking_requested ? getAdminStatusBadge(device.admin_status) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(device)}
                          className="text-blue-600 hover:text-blue-900 font-semibold text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Device Details</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Device Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">Name:</span> <span className="font-semibold">{selectedDevice.device_name}</span></div>
                  <div><span className="text-gray-600">IMEI:</span> <span className="font-mono font-semibold">{selectedDevice.imei_number}</span></div>
                  <div><span className="text-gray-600">Brand:</span> {selectedDevice.brand || 'N/A'}</div>
                  <div><span className="text-gray-600">Model:</span> {selectedDevice.model || 'N/A'}</div>
                  <div><span className="text-gray-600">Color:</span> {selectedDevice.color || 'N/A'}</div>
                  <div><span className="text-gray-600">Serial:</span> {selectedDevice.serial_number || 'N/A'}</div>
                  {selectedDevice.purchase_date && (
                    <div><span className="text-gray-600">Purchase Date:</span> {new Date(selectedDevice.purchase_date).toLocaleDateString()}</div>
                  )}
                  <div><span className="text-gray-600">Status:</span> {getStatusBadge(selectedDevice.status)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Owner Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">Email:</span> <span className="font-semibold">{selectedDevice.user_email}</span></div>
                  <div><span className="text-gray-600">Registered:</span> {new Date(selectedDevice.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {selectedDevice.tracking_requested && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-red-900 mb-3">🚨 Tracking Request Details</h3>
                <div className="space-y-2 text-sm text-red-900">
                  <div><span className="text-red-700">Request Date:</span> {selectedDevice.tracking_request_date ? new Date(selectedDevice.tracking_request_date).toLocaleString() : 'N/A'}</div>
                  <div><span className="text-red-700">Incident Date:</span> {selectedDevice.incident_date ? new Date(selectedDevice.incident_date).toLocaleDateString() : 'N/A'}</div>
                  <div><span className="text-red-700">Last Known Location:</span> {selectedDevice.incident_location || 'N/A'}</div>
                  {selectedDevice.incident_latitude && selectedDevice.incident_longitude && (
                    <div><span className="text-red-700">Coordinates:</span> {selectedDevice.incident_latitude.toFixed(4)}, {selectedDevice.incident_longitude.toFixed(4)}</div>
                  )}
                  {selectedDevice.police_report_number && (
                    <div><span className="text-red-700">Police Report:</span> {selectedDevice.police_report_number}</div>
                  )}
                  {selectedDevice.description && (
                    <div className="mt-2">
                      <span className="text-red-700">Description:</span>
                      <p className="mt-1 whitespace-pre-wrap">{selectedDevice.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Status
                </label>
                <select
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this case..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdateDevice}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Update Device
              </button>
              <button
                onClick={() => handleDeleteDevice(selectedDevice.id)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedDevice(null)
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
