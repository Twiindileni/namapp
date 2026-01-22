'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  event_type: string
  event_date: string
  event_location: string | null
  preferred_package_name: string | null
  guest_count: number | null
  special_requests: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  admin_notes: string | null
  created_at: string
}

export default function ManageBookingsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (authLoading) return
    
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/admin')
      return
    }
    
    loadBookings()
  }, [userRole, authLoading, router])

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('photography_bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('photography_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Booking status updated')
      loadBookings()
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus as any })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const updateAdminNotes = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('photography_bookings')
        .update({ admin_notes: adminNotes })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Notes saved')
      loadBookings()
      if (selectedBooking) {
        setSelectedBooking({ ...selectedBooking, admin_notes: adminNotes })
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Failed to save notes')
    }
  }

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return

    try {
      const { error } = await supabase
        .from('photography_bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Booking deleted')
      loadBookings()
      setShowDetails(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Failed to delete booking')
    }
  }

  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setAdminNotes(booking.admin_notes || '')
    setShowDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus)

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photography Bookings</h1>
            <p className="text-gray-600 mt-1">Manage customer booking requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Bookings</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-yellow-800">Pending</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-green-800">Confirmed</div>
            <div className="text-3xl font-bold text-green-900 mt-2">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-blue-800">Completed</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">
              {bookings.filter(b => b.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="text-sm font-medium text-gray-700 mr-4">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.customer_name}</div>
                      <div className="text-sm text-gray-500">{booking.customer_email}</div>
                      <div className="text-sm text-gray-500">{booking.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.event_type}</div>
                      <div className="text-sm text-gray-500">{booking.event_location || 'TBD'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.event_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.preferred_package_name || 'Not selected'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openDetails(booking)}
                        className="text-indigo-600 hover:text-indigo-900"
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

        {/* Details Modal */}
        {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedBooking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedBooking.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedBooking.customer_phone}</p>
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Event Type</p>
                    <p className="font-medium">{selectedBooking.event_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Event Date</p>
                    <p className="font-medium">{new Date(selectedBooking.event_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{selectedBooking.event_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guest Count</p>
                    <p className="font-medium">{selectedBooking.guest_count || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Preferred Package</p>
                    <p className="font-medium">{selectedBooking.preferred_package_name || 'Not selected'}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                <div className="flex gap-2">
                  {['pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateBookingStatus(selectedBooking.id, status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedBooking.status === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add internal notes about this booking..."
                />
                <button
                  onClick={() => updateAdminNotes(selectedBooking.id)}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Notes
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={() => deleteBooking(selectedBooking.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Booking
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                <p>Submitted: {new Date(selectedBooking.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  </div>
  )
}
