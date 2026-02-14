'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const DRIVING_STAGE_LABELS = [
  'Clutch balancing',
  'Gears change',
  'Road driving & road signs',
  'Parallel parking',
  'Reverse parking',
  'Ready for NATIS test drive',
]

interface DrivingBooking {
  id: string
  status: string
  preferred_date: string | null
  preferred_time: string | null
  created_at: string
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
  driving_school_packages?: { name: string; price_nad: number } | null
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [drivingBookings, setDrivingBookings] = useState<DrivingBooking[]>([])
  const [drivingLoading, setDrivingLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) {
      setDrivingLoading(false)
      return
    }

    const fetchDrivingBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('driving_school_bookings')
          .select('id, status, preferred_date, preferred_time, created_at, clutch_switch_off_count, stage_clutch_done, stage_gears_done, stage_road_driving_done, stage_parallel_parking_done, stage_reverse_parking_done, stage_ready_natis_done, stage_clutch_pct, stage_gears_pct, stage_road_driving_pct, stage_parallel_parking_pct, stage_reverse_parking_pct, stage_ready_natis_pct, driving_school_packages(name, price_nad)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        setDrivingBookings((data || []) as DrivingBooking[])
      } catch (error) {
        console.error('Error fetching driving bookings:', error)
      } finally {
        setDrivingLoading(false)
      }
    }

    fetchDrivingBookings()
  }, [user, authLoading])

  const getDrivingStages = (b: DrivingBooking) => [
      { label: DRIVING_STAGE_LABELS[0], pct: b.stage_clutch_pct ?? (b.stage_clutch_done ? 100 : 0), extra: typeof b.clutch_switch_off_count === 'number' ? ` (${b.clutch_switch_off_count} switch-offs)` : '' },
      { label: DRIVING_STAGE_LABELS[1], pct: b.stage_gears_pct ?? (b.stage_gears_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[2], pct: b.stage_road_driving_pct ?? (b.stage_road_driving_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[3], pct: b.stage_parallel_parking_pct ?? (b.stage_parallel_parking_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[4], pct: b.stage_reverse_parking_pct ?? (b.stage_reverse_parking_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[5], pct: b.stage_ready_natis_pct ?? (b.stage_ready_natis_done ? 100 : 0), extra: '' },
    ]

  const starsForPct = (pct: number) => Math.min(5, Math.floor((pct / 100) * 5))

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please log in to view your driving portal</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Driving Portal
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Your driving lesson bookings and progress. Your instructor updates progress after each lesson.
            </p>
          </div>

          {/* Driving School – learner bookings & progress (only content for users) */}
          <div className="mt-8">
            <h2 className="text-base font-semibold leading-6 text-gray-900">Your Driving School</h2>
            <p className="mt-1 text-sm text-gray-700">
              View your bookings and stage progress below.
            </p>
            {drivingLoading ? (
              <div className="mt-4 flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : drivingBookings.length === 0 ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center">
                <p className="text-sm text-gray-600">You don&apos;t have a driving school booking yet.</p>
                <Link href="/driving-school" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Book driving lessons →
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {drivingBookings.map((b) => (
                  <div key={b.id} className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {b.driving_school_packages && (
                          <p className="font-medium text-gray-900">{b.driving_school_packages.name}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Booked {new Date(b.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          {b.preferred_date && ` · Preferred: ${new Date(b.preferred_date + 'T12:00:00').toLocaleDateString()}${b.preferred_time ? ` at ${b.preferred_time}` : ''}`}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        b.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Progress</p>
                      <ul className="space-y-2">
                        {getDrivingStages(b).map((stage, i) => {
                          const done = stage.pct >= 100
                          const stars = starsForPct(stage.pct)
                          return (
                            <li key={i} className="text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className={done ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                                  {stage.label}{stage.extra}
                                </span>
                                <span className="text-gray-500 tabular-nums">{stage.pct}%</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${stage.pct}%` }}
                                  />
                                </div>
                                <span className="flex text-amber-400" aria-label={`${stars} of 5 stars`}>
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <span key={n} className={n <= stars ? 'text-amber-400' : 'text-gray-200'}>★</span>
                                  ))}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <Link href="/driving-school" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      View driving school →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 