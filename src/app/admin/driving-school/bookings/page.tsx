'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const DRIVING_STAGES = [
  { key: 'stage_clutch', label: '1. Clutch balancing', doneKey: 'stage_clutch_done', pctKey: 'stage_clutch_pct' },
  { key: 'stage_gears', label: '2. Gears change', doneKey: 'stage_gears_done', pctKey: 'stage_gears_pct' },
  { key: 'stage_road_driving', label: '3. Road driving & road signs', doneKey: 'stage_road_driving_done', pctKey: 'stage_road_driving_pct' },
  { key: 'stage_parallel_parking', label: '4. Parallel parking', doneKey: 'stage_parallel_parking_done', pctKey: 'stage_parallel_parking_pct' },
  { key: 'stage_reverse_parking', label: '5. Reverse parking', doneKey: 'stage_reverse_parking_done', pctKey: 'stage_reverse_parking_pct' },
  { key: 'stage_ready_natis', label: '6. Ready for NATIS test drive', doneKey: 'stage_ready_natis_done', pctKey: 'stage_ready_natis_pct' },
] as const

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
  clutch_switch_off_count?: number
  stage_clutch_done?: boolean
  stage_gears_done?: boolean
  stage_road_driving_done?: boolean
  stage_parallel_parking_done?: boolean
  stage_reverse_parking_done?: boolean
  stage_ready_natis_done?: boolean
  stage_clutch_pct?: number
  stage_gears_pct?: number
  stage_road_driving_pct?: number
  stage_parallel_parking_pct?: number
  stage_reverse_parking_pct?: number
  stage_ready_natis_pct?: number
}

export default function AdminDrivingSchoolBookingsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [progressClutchCount, setProgressClutchCount] = useState(0)
  const [progressStages, setProgressStages] = useState<Record<string, boolean>>({})
  const [progressPct, setProgressPct] = useState<Record<string, number>>({})
  const [savingProgress, setSavingProgress] = useState(false)

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

  const openBooking = (b: Booking) => {
    setSelected(b)
    setAdminNotes(b.admin_notes ?? '')
    setProgressClutchCount(b.clutch_switch_off_count ?? 0)
    setProgressStages({
      stage_clutch_done: b.stage_clutch_done ?? false,
      stage_gears_done: b.stage_gears_done ?? false,
      stage_road_driving_done: b.stage_road_driving_done ?? false,
      stage_parallel_parking_done: b.stage_parallel_parking_done ?? false,
      stage_reverse_parking_done: b.stage_reverse_parking_done ?? false,
      stage_ready_natis_done: b.stage_ready_natis_done ?? false,
    })
    setProgressPct({
      stage_clutch_pct: b.stage_clutch_pct ?? (b.stage_clutch_done ? 100 : 0),
      stage_gears_pct: b.stage_gears_pct ?? (b.stage_gears_done ? 100 : 0),
      stage_road_driving_pct: b.stage_road_driving_pct ?? (b.stage_road_driving_done ? 100 : 0),
      stage_parallel_parking_pct: b.stage_parallel_parking_pct ?? (b.stage_parallel_parking_done ? 100 : 0),
      stage_reverse_parking_pct: b.stage_reverse_parking_pct ?? (b.stage_reverse_parking_done ? 100 : 0),
      stage_ready_natis_pct: b.stage_ready_natis_pct ?? (b.stage_ready_natis_done ? 100 : 0),
    })
  }

  const canEditStagePct = (index: number): boolean => {
    if (index === 0) return true
    const prev = DRIVING_STAGES[index - 1]
    const prevPct = progressPct[prev.pctKey] ?? 0
    return prevPct >= 100
  }

  const saveProgress = async (id: string) => {
    setSavingProgress(true)
    const pct = (k: string) => Math.min(100, Math.max(0, progressPct[k] ?? 0))
    const { error } = await supabase
      .from('driving_school_bookings')
      .update({
        clutch_switch_off_count: progressClutchCount,
        stage_clutch_pct: pct('stage_clutch_pct'),
        stage_gears_pct: pct('stage_gears_pct'),
        stage_road_driving_pct: pct('stage_road_driving_pct'),
        stage_parallel_parking_pct: pct('stage_parallel_parking_pct'),
        stage_reverse_parking_pct: pct('stage_reverse_parking_pct'),
        stage_ready_natis_pct: pct('stage_ready_natis_pct'),
        stage_clutch_done: (progressPct.stage_clutch_pct ?? 0) >= 100,
        stage_gears_done: (progressPct.stage_gears_pct ?? 0) >= 100,
        stage_road_driving_done: (progressPct.stage_road_driving_pct ?? 0) >= 100,
        stage_parallel_parking_done: (progressPct.stage_parallel_parking_pct ?? 0) >= 100,
        stage_reverse_parking_done: (progressPct.stage_reverse_parking_pct ?? 0) >= 100,
        stage_ready_natis_done: (progressPct.stage_ready_natis_pct ?? 0) >= 100,
      })
      .eq('id', id)
    setSavingProgress(false)
    if (error) {
      toast.error('Failed to save progress')
      return
    }
    toast.success('Progress saved')
    await load()
    if (selected?.id === id) {
      setSelected({
        ...selected,
        clutch_switch_off_count: progressClutchCount,
        ...progressStages,
        stage_clutch_pct: progressPct.stage_clutch_pct,
        stage_gears_pct: progressPct.stage_gears_pct,
        stage_road_driving_pct: progressPct.stage_road_driving_pct,
        stage_parallel_parking_pct: progressPct.stage_parallel_parking_pct,
        stage_reverse_parking_pct: progressPct.stage_reverse_parking_pct,
        stage_ready_natis_pct: progressPct.stage_ready_natis_pct,
      })
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Users booked for driving school</h1>
          <p className="mt-2 text-sm text-gray-600">Manage each learner&apos;s progress below. Open a booking to update clutch count and mark stages complete.</p>

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
                      <div className="mt-2 flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-gray-500">Progress: </span>
                        {DRIVING_STAGES.map((s, i) => {
                          const pct = (b as Record<string, number>)[s.pctKey] ?? 0
                          const done = (b as Record<string, boolean>)[s.doneKey] || pct >= 100
                          return (
                            <span key={s.key} className="text-xs text-gray-600">
                              {i > 0 && <span className="text-gray-300 mx-0.5">·</span>}
                              {done ? <span className="text-green-600">{s.label.split('. ')[1]} ✓</span> : <span>{s.label.split('. ')[1]} {pct}%</span>}
                            </span>
                          )
                        })}
                        {typeof b.clutch_switch_off_count === 'number' && b.clutch_switch_off_count > 0 && (
                          <span className="text-xs text-gray-400">({b.clutch_switch_off_count} switch-offs)</span>
                        )}
                      </div>
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
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Learner progress</label>
                        <p className="text-xs text-gray-500 mt-0.5">Set percentage (0–100) per stage. e.g. 30% if they struggled today; 100% when ready to move on. Next stage unlocks when previous is 100%.</p>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-sm text-gray-700">Clutch – times car switched off:</label>
                          <input
                            type="number"
                            min={0}
                            value={progressClutchCount}
                            onChange={(e) => setProgressClutchCount(parseInt(e.target.value, 10) || 0)}
                            className="w-20 rounded border-gray-300 text-sm"
                          />
                        </div>
                        <ul className="mt-3 space-y-2">
                          {DRIVING_STAGES.map((stage, idx) => {
                            const canEdit = canEditStagePct(idx)
                            const pct = progressPct[stage.pctKey] ?? 0
                            return (
                              <li key={stage.key} className="flex flex-wrap items-center gap-2">
                                <span className={canEdit ? 'text-sm text-gray-700 w-48' : 'text-sm text-gray-400 w-48'}>{stage.label}</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={pct}
                                  disabled={!canEdit}
                                  onChange={(e) => setProgressPct((prev) => ({ ...prev, [stage.pctKey]: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) }))}
                                  className="w-16 rounded border-gray-300 text-sm disabled:bg-gray-100"
                                />
                                <span className="text-xs text-gray-500">%</span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => setProgressPct((prev) => ({ ...prev, [stage.pctKey]: 100 }))}
                                    className="text-xs px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300"
                                  >
                                    100%
                                  </button>
                                )}
                                {!canEdit && <span className="text-xs text-gray-400">(complete previous first)</span>}
                              </li>
                            )
                          })}
                        </ul>
                        <button
                          type="button"
                          disabled={savingProgress}
                          onClick={() => saveProgress(b.id)}
                          className="mt-2 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {savingProgress ? 'Saving…' : 'Save progress'}
                        </button>
                      </div>
                      <div>
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
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openBooking(b)}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      {b.admin_notes ? 'Edit notes & progress' : 'Add notes & progress'}
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
