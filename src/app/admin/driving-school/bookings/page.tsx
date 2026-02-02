'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  package_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  message: string | null
  preferred_date: string | null
  preferred_time: string | null
  preferred_dates: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  admin_notes: string | null
  created_at: string
  driving_school_packages?: { name: string; price_nad: number } | null
}

export default function AdminDrivingSchoolBookingsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('driving_school_bookings')
      .select('*, driving_school_packages(name, price_nad)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      toast.error('Failed to load bookings')
      setLoading(false)
      return
    }
    setBookings((data ?? []) as Booking[])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }
    load()
  }, [userRole, authLoading])

  const updateStatus = async (id: string, status: Booking['status']) => {
    const { error } = await supabase
      .from('driving_school_bookings')
      .update({ status })
      .eq('id', id)
    if (error) {
      toast.error('Failed to update status')
      return
    }
    toast.success('Status updated')
    await load()
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  const saveAdminNotes = async (id: string) => {
    const { error } = await supabase
      .from('driving_school_bookings')
      .update({ admin_notes: adminNotes })
      .eq('id', id)
    if (error) {
      toast.error('Failed to save notes')
      return
    }
    toast.success('Notes saved')
    await load()
    if (selected?.id === id) setSelected({ ...selected, admin_notes: adminNotes })
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

  const filtered = filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus)

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/admin/driving-school" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
            ← Back to Driving School
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Driving School Bookings</h1>
          <p className="mt-2 text-sm text-gray-600">Inquiries and bookings from the driving school page</p>

          <div className="mt-4 flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filtered.map((b) => (
                <li key={b.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.customer_name}</p>
                      <p className="text-sm text-gray-500">{b.customer_email} · {b.customer_phone}</p>
                      {b.driving_school_packages && (
                        <p className="text-sm text-gray-500 mt-1">
                          Package: {b.driving_school_packages.name} (N$ {Number(b.driving_school_packages.price_nad).toFixed(2)})
                        </p>
                      )}
                      {(b.preferred_date || b.preferred_time) && (
                        <p className="text-sm text-gray-500 mt-1">
                          Date & time: {b.preferred_date ? new Date(b.preferred_date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'} {b.preferred_time ? `at ${b.preferred_time}` : ''}
                        </p>
                      )}
                      {b.preferred_dates && (
                        <p className="text-sm text-gray-500">Other: {b.preferred_dates}</p>
                      )}
                      {b.message && <p className="text-sm text-gray-600 mt-1">{b.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(b.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value as Booking['status'])}
                        className="text-sm rounded border-gray-300"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  {selected?.id === b.id ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700">Admin notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveAdminNotes(b.id)}
                          className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                        >
                          Save notes
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelected(null)}
                          className="px-3 py-1 text-sm font-medium text-gray-700 border rounded hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(b)
                        setAdminNotes(b.admin_notes ?? '')
                      }}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      {b.admin_notes ? 'Edit notes' : 'Add notes'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-500">No bookings match the filter.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
