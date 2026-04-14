'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  CreditCardIcon,
  MapIcon
} from '@heroicons/react/24/outline'

const HOURS_RATE_NAD = 130

const DRIVING_STAGE_LABELS = [
  'Clutch balancing',
  'Gears change',
  'Road driving & road signs',
  'Parallel parking',
  'Reverse parking',
  'Ready for NATIS test drive',
]

interface PaymentRow {
  id: string
  booking_id: string
  amount_nad: number
  created_at: string
}

interface SessionRow {
  id: string
  booking_id: string
  hours: number
  session_date: string | null
  created_at: string
}

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
  const [paymentsByBooking, setPaymentsByBooking] = useState<Record<string, PaymentRow[]>>({})
  const [sessionsByBooking, setSessionsByBooking] = useState<Record<string, SessionRow[]>>({})
  const [drivingLoading, setDrivingLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) {
      setDrivingLoading(false)
      return
    }

    const fetchAll = async () => {
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('driving_school_bookings')
          .select('id, status, preferred_date, preferred_time, created_at, clutch_switch_off_count, stage_clutch_done, stage_gears_done, stage_road_driving_done, stage_parallel_parking_done, stage_reverse_parking_done, stage_ready_natis_done, stage_clutch_pct, stage_gears_pct, stage_road_driving_pct, stage_parallel_parking_pct, stage_reverse_parking_pct, stage_ready_natis_pct, driving_school_packages(name, price_nad)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (bookingsError) throw bookingsError
        const bookings = (bookingsData || []) as DrivingBooking[]
        setDrivingBookings(bookings)

        const ids = bookings.map((b) => b.id)
        const payments: Record<string, PaymentRow[]> = {}
        const sessions: Record<string, SessionRow[]> = {}

        if (ids.length > 0) {
          const { data: paymentsData } = await supabase
            .from('driving_school_payments')
            .select('id, booking_id, amount_nad, created_at')
            .in('booking_id', ids)
            .order('created_at', { ascending: false })
          for (const p of (paymentsData || []) as PaymentRow[]) {
            if (!payments[p.booking_id]) payments[p.booking_id] = []
            payments[p.booking_id].push(p)
          }

          const { data: sessionsData } = await supabase
            .from('driving_school_sessions')
            .select('id, booking_id, hours, session_date, created_at')
            .in('booking_id', ids)
            .order('session_date', { ascending: false })
          for (const s of (sessionsData || []) as SessionRow[]) {
            if (!sessions[s.booking_id]) sessions[s.booking_id] = []
            sessions[s.booking_id].push(s)
          }
        }
        setPaymentsByBooking(payments)
        setSessionsByBooking(sessions)
      } catch (error) {
        console.error('Error fetching driving data:', error)
      } finally {
        setDrivingLoading(false)
      }
    }

    fetchAll()
  }, [user, authLoading])

  const getDrivingStages = (b: DrivingBooking) => [
      { label: DRIVING_STAGE_LABELS[0], pct: b.stage_clutch_pct ?? (b.stage_clutch_done ? 100 : 0), extra: typeof b.clutch_switch_off_count === 'number' && b.clutch_switch_off_count > 0 ? `${b.clutch_switch_off_count} switch-offs` : '' },
      { label: DRIVING_STAGE_LABELS[1], pct: b.stage_gears_pct ?? (b.stage_gears_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[2], pct: b.stage_road_driving_pct ?? (b.stage_road_driving_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[3], pct: b.stage_parallel_parking_pct ?? (b.stage_parallel_parking_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[4], pct: b.stage_reverse_parking_pct ?? (b.stage_reverse_parking_done ? 100 : 0), extra: '' },
      { label: DRIVING_STAGE_LABELS[5], pct: b.stage_ready_natis_pct ?? (b.stage_ready_natis_done ? 100 : 0), extra: '' },
    ]

  const starsForPct = (pct: number) => Math.min(5, Math.floor((pct / 100) * 5))

  function getPaymentSummary(bookingId: string) {
    const payments = paymentsByBooking[bookingId] || []
    const sessions = sessionsByBooking[bookingId] || []
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_nad), 0)
    const hoursPurchased = totalPaid / HOURS_RATE_NAD
    const hoursPracticed = sessions.reduce((sum, s) => sum + Number(s.hours), 0)
    const hoursRemaining = Math.max(0, hoursPurchased - hoursPracticed)
    const valuePracticed = hoursPracticed * HOURS_RATE_NAD
    const valueRemaining = hoursRemaining * HOURS_RATE_NAD
    const completionPct = hoursPurchased > 0 ? Math.round((hoursPracticed / hoursPurchased) * 100) : 0
    return {
      totalPaid,
      hoursPurchased,
      hoursPracticed,
      hoursRemaining,
      valuePracticed,
      valueRemaining,
      completionPct,
      sessions: sessions.sort((a, b) => {
        const d1 = a.session_date || a.created_at
        const d2 = b.session_date || b.created_at
        return d2.localeCompare(d1)
      }),
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b1a]">
        <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b1a]">
        <div className="text-center glass-card p-12">
          <h1 className="text-2xl font-bold text-white mb-4">Secure Portal Locked</h1>
          <p className="text-[#8baed4] mb-8">Please synchronize your identity to view driving telemetry.</p>
          <Link href="/login" className="btn-primary">Initialize Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Student Telemetry</span>
              <h1 className="hero-title !text-4xl md:!text-5xl mt-4">Driving <span className="gradient-text">Portal</span></h1>
              <p className="mt-4 text-[#8baed4] max-w-2xl leading-relaxed">
                Your instructor synchronizes your technical progress after each session. Monitor your telemetry and mission stages below.
              </p>
            </div>
          </div>

          {drivingLoading ? (
            <div className="flex justify-center py-20">
               <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin" />
            </div>
          ) : drivingBookings.length === 0 ? (
            <div className="glass-card p-12 text-center max-w-2xl mx-auto">
               <ExclamationCircleIcon className="w-16 h-16 text-[#003580] mx-auto mb-4" />
               <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>No Active Missions</h3>
               <p className="text-[#4a6a90] mb-8">Launch your driving journey by initializing a booking.</p>
               <Link href="/driving-school" className="btn-primary">Book Lessons</Link>
            </div>
          ) : (
            <div className="space-y-12">
               {drivingBookings.map((b) => {
                  const summary = getPaymentSummary(b.id)
                  return (
                    <div key={b.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                      
                      {/* Configuration & Status Head */}
                      <div className="flex flex-wrap items-center justify-between gap-6 bg-[rgba(0,53,128,0.1)] rounded-2xl p-6 border border-[rgba(0,85,204,0.15)]">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#003580]/30 border border-[#0055cc]/30 flex items-center justify-center">
                               <MapIcon className="w-6 h-6 text-[#5a9ef5]" />
                            </div>
                            <div>
                               <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                  {b.driving_school_packages?.name || 'Standard Curriculum'}
                               </h3>
                               <p className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">
                                  Began Execution: {new Date(b.created_at).toLocaleDateString()}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest">Mission Status</span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                               b.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                               b.status === 'completed' ? 'bg-[#1a72f0]/10 text-[#5a9ef5] border border-[#1a72f0]/20' :
                               b.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                               'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                               {b.status}
                            </span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         
                         {/* Financial / Credits Module */}
                         <div className="lg:col-span-1 space-y-6">
                            <div className="glass-card p-8">
                               <div className="flex items-center gap-2 mb-8">
                                  <CreditCardIcon className="w-5 h-5 text-[#5a9ef5]" />
                                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Financial Credits</h4>
                               </div>
                               <div className="space-y-6">
                                  <div>
                                     <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest mb-1">Total Paid (NAD)</p>
                                     <p className="text-3xl font-extrabold text-[#e8f0ff]">N${summary.totalPaid.toFixed(2)}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest mb-1">Practiced</p>
                                        <p className="text-lg font-bold text-[#5a9ef5]">N${summary.valuePracticed.toFixed(0)}</p>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest mb-1">Remaining</p>
                                        <p className="text-lg font-bold text-amber-500">N${summary.valueRemaining.toFixed(0)}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="glass-card p-8 bg-[rgba(26,114,240,0.03)] border-indigo-500/10">
                               <div className="flex items-center gap-2 mb-8">
                                  <ClockIcon className="w-5 h-5 text-[#5a9ef5]" />
                                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Performance Sync</h4>
                               </div>
                               <div className="grid grid-cols-2 gap-8">
                                  <div>
                                     <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest mb-1">Session Hours</p>
                                     <p className="text-3xl font-extrabold text-white">{summary.hoursPracticed.toFixed(1)}</p>
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest mb-1">Sync Success</p>
                                     <p className="text-3xl font-extrabold text-[#5a9ef5]">{summary.completionPct}%</p>
                                  </div>
                               </div>
                               
                               {/* Timeline dots for sessions */}
                               {summary.sessions.length > 0 && (
                                 <div className="mt-8 pt-8 border-t border-[rgba(0,53,128,0.15)]">
                                    <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-widest mb-4">Historical Sessions</p>
                                    <div className="flex flex-wrap gap-2">
                                       {summary.sessions.map((s) => (
                                          <div key={s.id} className="w-2 h-2 rounded-full bg-[#1a72f0] shadow-[0_0_8px_#1a72f0]" title={`${s.hours} hours`} />
                                       ))}
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* Telemetry Progress Grid */}
                         <div className="lg:col-span-2">
                            <div className="glass-card p-8 lg:p-10">
                               <div className="flex items-center gap-2 mb-10">
                                  <ChartBarIcon className="w-5 h-5 text-[#5a9ef5]" />
                                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Cockpit Telemetry</h4>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {getDrivingStages(b).map((stage, i) => {
                                     const complete = stage.pct >= 100
                                     const stars = starsForPct(stage.pct)
                                     return (
                                        <div key={i} className="space-y-3 p-4 rounded-xl bg-[rgba(0,53,128,0.05)] border border-[rgba(26,114,240,0.05)] group hover:border-[#1a72f0]/30 transition-all">
                                           <div className="flex items-start justify-between">
                                              <span className={`text-xs font-bold uppercase tracking-wider ${complete ? 'text-white' : 'text-[#4a6a90] group-hover:text-[#8baed4]'}`}>
                                                 {stage.label}
                                              </span>
                                              <span className="text-[10px] font-mono text-[#5a9ef5]">{stage.pct}%</span>
                                           </div>
                                           
                                           <div className="relative h-1.5 w-full bg-[#0d2040] rounded-full overflow-hidden">
                                              <div 
                                                className={`absolute left-0 top-0 h-full transition-all duration-1000 ${complete ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-[#1a72f0] shadow-[0_0_10px_#1a72f0]'}`}
                                                style={{ width: `${stage.pct}%` }}
                                              />
                                           </div>

                                           {stage.extra && (
                                              <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80 font-bold uppercase italic">
                                                 <ExclamationCircleIcon className="w-3 h-3" />
                                                 <span>{stage.extra}</span>
                                              </div>
                                           )}

                                           <div className="flex items-center justify-between pt-2">
                                              <div className="flex gap-1">
                                                 {[1, 2, 3, 4, 5].map((n, idx) => (
                                                   <div key={idx} className={`w-3 h-1 rounded-sm ${idx < stars ? 'bg-[#5a9ef5]' : 'bg-[#0d2040]'}`} />
                                                 ))}
                                              </div>
                                              {complete && <CheckCircleIcon className="w-4 h-4 text-green-400" />}
                                           </div>
                                        </div>
                                     )
                                  })}
                               </div>

                               <div className="mt-12 flex justify-center">
                                  <Link href="/driving-school" className="text-sm font-bold text-[#5a9ef5] hover:text-white flex items-center gap-2 group">
                                     Book Additional Support Sessions 
                                     <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                  </Link>
                               </div>
                            </div>
                         </div>
                      </div>

                    </div>
                  )
               })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}