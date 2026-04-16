'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

/* ── Status helpers ─────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    lost:      'bg-red-500/20 text-red-400 border border-red-500/40',
    stolen:    'bg-red-500/20 text-red-400 border border-red-500/40',
    found:     'bg-sky-500/20 text-sky-400 border border-sky-500/40',
    recovered: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>
      {status}
    </span>
  )
}

function AdminPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:       'bg-amber-500/20 text-amber-400',
    investigating: 'bg-sky-500/20 text-sky-400',
    resolved:      'bg-emerald-500/20 text-emerald-400',
    closed:        'bg-gray-700 text-gray-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>
      {status}
    </span>
  )
}

/* ── Full-screen Map Navigation Background ──────────────────────── */
function MapNavBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {/* Deep navy base */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 40%, #071428 0%, #040d1c 50%, #020810 100%)' }} />

      {/* ── City street grid (SVG, percentage-based) ── */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-white">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-cyan">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="pin-glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Animated dash offset for route */}
          <style>{`
            @keyframes dash-flow { to { stroke-dashoffset: -40; } }
            @keyframes radar-spin { to { transform: rotate(360deg); transform-origin: 310px 470px; } }
            @keyframes radar-spin2 { to { transform: rotate(-360deg); transform-origin: 310px 470px; } }
            @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
            .route-dash { animation: dash-flow 1.2s linear infinite; }
            .radar-r1  { animation: radar-spin 6s linear infinite; transform-origin: 310px 470px; }
            .radar-r2  { animation: radar-spin2 4s linear infinite; transform-origin: 310px 470px; }
            .dot-blink { animation: blink 2s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* ── Street grid — horizontal major roads ── */}
        {[80,160,240,310,380,450,520,590,660,730,800].map((y,i) => (
          <line key={`h${i}`} x1="0" y1={y} x2="1440" y2={y} stroke="#0d2448" strokeWidth={i%3===0?"1.2":"0.6"} opacity={i%3===0?"0.9":"0.5"} />
        ))}
        {/* ── Street grid — vertical major roads ── */}
        {[100,200,310,420,530,630,720,820,920,1020,1130,1240,1340,1440].map((x,i) => (
          <line key={`v${i}`} x1={x} y1="0" x2={x} y2="820" stroke="#0d2448" strokeWidth={i%3===0?"1.2":"0.6"} opacity={i%3===0?"0.9":"0.5"} />
        ))}

        {/* ── Diagonal/organic city blocks ── */}
        <line x1="200" y1="0" x2="420" y2="820" stroke="#0d2448" strokeWidth="0.7" opacity="0.4"/>
        <line x1="620" y1="0" x2="760" y2="820" stroke="#0d2448" strokeWidth="0.7" opacity="0.4"/>
        <line x1="900" y1="0" x2="1100" y2="820" stroke="#0d2448" strokeWidth="0.7" opacity="0.3"/>
        <line x1="0" y1="200" x2="1440" y2="350" stroke="#0d2448" strokeWidth="0.7" opacity="0.3"/>
        <line x1="0" y1="500" x2="1440" y2="620" stroke="#0d2448" strokeWidth="0.7" opacity="0.3"/>

        {/* ── City block fills (subtle lighter areas) ── */}
        <rect x="420" y="160" width="110" height="80" fill="#0b1e3a" opacity="0.5" rx="2"/>
        <rect x="630" y="240" width="90" height="70" fill="#0b1e3a" opacity="0.5" rx="2"/>
        <rect x="820" y="80" width="100" height="80" fill="#0b1e3a" opacity="0.5" rx="2"/>
        <rect x="1020" y="310" width="110" height="70" fill="#0b1e3a" opacity="0.5" rx="2"/>
        <rect x="100" y="380" width="100" height="90" fill="#0b1e3a" opacity="0.4" rx="2"/>
        <rect x="530" y="450" width="90" height="70" fill="#0b1e3a" opacity="0.4" rx="2"/>
        <rect x="730" y="590" width="100" height="80" fill="#0b1e3a" opacity="0.4" rx="2"/>
        <rect x="200" y="590" width="90" height="130" fill="#0b1e3a" opacity="0.4" rx="2"/>
        <rect x="1130" y="160" width="100" height="70" fill="#0b1e3a" opacity="0.4" rx="2"/>
        <rect x="920" y="520" width="110" height="70" fill="#0b1e3a" opacity="0.4" rx="2"/>

        {/* ── MAIN ROUTE PATH (white, glowing) ── */}
        {/* Shadow/glow layer */}
        <polyline
          points="80,470 200,470 200,380 310,380 310,300 530,300 530,240 720,240 840,240 840,310 1020,310 1130,200 1260,200"
          fill="none" stroke="#1a72f0" strokeWidth="10" opacity="0.15" strokeLinejoin="round" strokeLinecap="round"
        />
        {/* Main white route */}
        <polyline
          points="80,470 200,470 200,380 310,380 310,300 530,300 530,240 720,240 840,240 840,310 1020,310 1130,200 1260,200"
          fill="none" stroke="white" strokeWidth="2.5" opacity="0.9" strokeLinejoin="round" strokeLinecap="round"
          filter="url(#glow-white)"
        />
        {/* Animated dashes overlay */}
        <polyline
          className="route-dash"
          points="80,470 200,470 200,380 310,380 310,300 530,300 530,240 720,240 840,240 840,310 1020,310 1130,200 1260,200"
          fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray="8 32"
        />

        {/* ── Waypoint small dots ── */}
        {[
          [200,470],[310,380],[530,300],[720,240],[840,310],[1020,310],[1130,200]
        ].map(([cx,cy],i) => (
          <g key={`wp${i}`}>
            <circle cx={cx} cy={cy} r="8" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
            <circle cx={cx} cy={cy} r="3.5" fill="white" opacity="0.7"/>
          </g>
        ))}

        {/* ── CURRENT POSITION — Radar HUD at start of route ── */}
        {/* Outer dashed rings */}
        <circle className="radar-r1" cx="310" cy="470" r="52" fill="none" stroke="#00d4ff" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.5"/>
        <circle className="radar-r2" cx="310" cy="470" r="38" fill="none" stroke="#00d4ff" strokeWidth="0.8" strokeDasharray="3 8" opacity="0.4"/>
        {/* Solid inner rings */}
        <circle cx="310" cy="470" r="28" fill="rgba(0,180,220,0.08)" stroke="#00d4ff" strokeWidth="1" opacity="0.7"/>
        <circle cx="310" cy="470" r="16" fill="rgba(0,180,220,0.15)" stroke="#00d4ff" strokeWidth="1.5" opacity="0.9"/>
        {/* Cross-hairs */}
        <line x1="310" y1="435" x2="310" y2="455" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5"/>
        <line x1="310" y1="485" x2="310" y2="505" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5"/>
        <line x1="275" y1="470" x2="295" y2="470" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5"/>
        <line x1="325" y1="470" x2="345" y2="470" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5"/>
        {/* Navigation arrow (cyan triangle pointing up-right) */}
        <polygon points="310,458 325,478 310,472 295,478" fill="#00d4ff" opacity="0.95" filter="url(#glow-cyan)" transform="rotate(-30 310 468)"/>

        {/* Distance label */}
        <rect x="340" y="458" width="68" height="22" rx="4" fill="rgba(0,30,60,0.7)" stroke="#00d4ff" strokeWidth="0.8" opacity="0.9"/>
        <text x="374" y="473" textAnchor="middle" fill="#00d4ff" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="1">7.3 km</text>

        {/* ── DESTINATION PIN (top-right area, cyan) ── */}
        <g filter="url(#pin-glow)">
          {/* Glow ring */}
          <circle className="dot-blink" cx="1260" cy="200" r="22" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
          <circle cx="1260" cy="200" r="12" fill="rgba(0,180,220,0.2)" stroke="#00d4ff" strokeWidth="1.5" opacity="0.9"/>
          {/* Pin shape */}
          <path d="M1260 175 C1250 175 1242 183 1242 193 C1242 205 1260 220 1260 220 C1260 220 1278 205 1278 193 C1278 183 1270 175 1260 175Z" fill="#00d4ff" opacity="0.95"/>
          <circle cx="1260" cy="193" r="5" fill="white" opacity="0.9"/>
        </g>

        {/* ── HUD text overlays ── */}
        {/* Title */}
        <text x="720" y="38" textAnchor="middle" fill="white" fontSize="15" fontFamily="monospace" fontWeight="bold" letterSpacing="6" opacity="0.9">MAP NAVIGATION</text>
        <line x1="560" y1="44" x2="880" y2="44" stroke="white" strokeWidth="0.5" opacity="0.3"/>

        {/* Location label */}
        <text x="580" y="64" textAnchor="middle" fill="#8baed4" fontSize="8" fontFamily="monospace" letterSpacing="2" opacity="0.7">LOCATION</text>
        <text x="580" y="76" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" letterSpacing="1" opacity="0.85">58.35.22</text>

        {/* Destination label */}
        <text x="860" y="64" textAnchor="middle" fill="#8baed4" fontSize="8" fontFamily="monospace" letterSpacing="2" opacity="0.7">DESTINATION</text>
        <text x="860" y="76" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" letterSpacing="1" opacity="0.85">18.24.13</text>

        {/* Bottom dots indicator */}
        {[-3,-2,-1,0,1,2,3].map((i) => (
          <circle key={i} cx={720 + i*18} cy={800} r={i===0?4:2.5} fill={i===0?"#00d4ff":"#1a3a5a"} opacity={i===0?1:0.7}/>
        ))}

        {/* Small detail waypoint labels */}
        <text x="200" y="465" fill="#8baed4" fontSize="7" fontFamily="monospace" opacity="0.6" textAnchor="middle">A</text>
        <text x="1260" y="250" fill="#00d4ff" fontSize="7" fontFamily="monospace" opacity="0.8" textAnchor="middle">DEST</text>

        {/* Corner bracket decorations */}
        <path d="M 20 20 L 20 55 M 20 20 L 55 20" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
        <path d="M 1420 20 L 1420 55 M 1420 20 L 1385 20" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
        <path d="M 20 800 L 20 765 M 20 800 L 55 800" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
        <path d="M 1420 800 L 1420 765 M 1420 800 L 1385 800" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
      </svg>

      {/* Subtle blue glow blooms */}
      <div className="absolute" style={{ left: '21%', top: '57%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,220,0.08) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
      <div className="absolute" style={{ left: '87%', top: '24%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,220,0.12) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────── */
export default function MyDevicesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [devices, setDevices]         = useState<Device[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm]   = useState({
    incident_date: '',
    incident_location: '',
    incident_latitude: null as number | null,
    incident_longitude: null as number | null,
    police_report_number: '',
    description: '',
  })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadDevices()
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
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const handleReportLost = (device: Device) => {
    setSelectedDevice(device)
    setShowReportModal(true)
    setReportForm({ incident_date: '', incident_location: '', incident_latitude: null, incident_longitude: null, police_report_number: '', description: '' })
  }

  const submitReport = async () => {
    if (!selectedDevice) return
    if (!reportForm.incident_date || !reportForm.incident_location) { toast.error('Fill in incident date and location'); return }
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
          admin_status: 'pending',
        })
        .eq('id', selectedDevice.id)
      if (error) throw error
      toast.success('Tracking request submitted!')
      setShowReportModal(false)
      setSelectedDevice(null)
      loadDevices()
    } catch (e: any) {
      toast.error('Failed to submit tracking request')
    }
  }

  const handleMarkAsFound = async (deviceId: string) => {
    try {
      const { error } = await supabase.from('registered_devices').update({ status: 'found', tracking_requested: false }).eq('id', deviceId)
      if (error) throw error
      toast.success('Device marked as found!')
      loadDevices()
    } catch { toast.error('Failed to update device') }
  }

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Delete this device registration?')) return
    try {
      const { error } = await supabase.from('registered_devices').delete().eq('id', deviceId)
      if (error) throw error
      toast.success('Device deleted')
      loadDevices()
    } catch { toast.error('Failed to delete device') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b1a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-[#1a72f0]/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#1a72f0] animate-spin" />
            </div>
            <p className="text-[#8baed4] text-sm font-medium tracking-widest uppercase">Initialising tracker…</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── NOT LOGGED IN ────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#040d1c] flex flex-col relative overflow-hidden">
        {/* Full-screen map navigation background */}
        <MapNavBackground />

        {/* Dark overlay so card is readable */}
        <div className="absolute inset-0 bg-[#030c1b]/50 pointer-events-none" aria-hidden />

        {/* Navbar sits on top */}
        <div className="relative z-20">
          <Navbar />
        </div>

        {/* Login card — right side, vertically centred */}
        <div className="relative z-10 flex-1 flex items-center justify-end pr-8 sm:pr-16 lg:pr-24 pb-12">
          <div className="w-full max-w-[340px] relative">

            {/* Multi-layer card glow */}
            <div className="absolute -inset-4 rounded-[36px] bg-[#00d4ff]/6 blur-3xl pointer-events-none" />
            <div className="absolute -inset-1 rounded-[32px] bg-[#1a72f0]/8 blur-xl pointer-events-none" />

            <div className="relative bg-[#030e1f]/90 backdrop-blur-3xl border border-[#00d4ff]/25 rounded-[28px] p-8 shadow-2xl shadow-[#00d4ff]/10">
              {/* top cyan accent line */}
              <div className="absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent rounded-full" />
              {/* inner subtle top glow */}
              <div className="absolute top-0 left-1/4 right-1/4 h-8 bg-[#00d4ff]/8 blur-xl rounded-full pointer-events-none" />

              {/* Corner bracket decorations */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#00d4ff]/50 rounded-tl-sm" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#00d4ff]/50 rounded-tr-sm" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#1a72f0]/40 rounded-bl-sm" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#1a72f0]/40 rounded-br-sm" />

              {/* Radar icon with 3 pulsing rings */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border border-[#00d4ff]/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full border border-[#00d4ff]/20 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.6s' }} />
                <div className="absolute inset-4 rounded-full border border-[#00d4ff]/15 animate-ping" style={{ animationDuration: '3.6s', animationDelay: '1.2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00d4ff]/15 to-[#1a72f0]/10 border border-[#00d4ff]/35 flex items-center justify-center shadow-inner shadow-[#00d4ff]/10">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L4 20l8-4 8 4L12 2Z" fill="#00d4ff" opacity="0.95"/>
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-[9px] font-black tracking-[0.4em] text-[#00d4ff] uppercase text-center mb-1.5">Purpose Technology</p>
              <h2 className="text-white text-2xl font-bold text-center mb-2 tracking-tight">Phone Tracker</h2>
              <p className="text-[#8baed4] text-xs text-center mb-6 leading-relaxed">
                Sign in to register your device, open the live map,
                and track location in real time.
              </p>

              {/* Coordinate-style stat strip */}
              <div className="flex justify-between mb-6 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3">
                <div className="text-center">
                  <p className="text-white font-black text-sm leading-none mb-1">GPS</p>
                  <p className="text-[#4a7aaa] text-[9px] uppercase tracking-wider font-bold">High</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-[#00d4ff] font-black text-sm leading-none mb-1">Live</p>
                  <p className="text-[#4a7aaa] text-[9px] uppercase tracking-wider font-bold">Updates</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-white font-black text-sm leading-none mb-1">256</p>
                  <p className="text-[#4a7aaa] text-[9px] uppercase tracking-wider font-bold">Encrypt</p>
                </div>
              </div>

              <Link
                href="/login?redirect=/devices"
                className="block w-full bg-gradient-to-r from-[#00d4ff] to-[#00b8e0] hover:from-[#00bde8] hover:to-[#009fcb] text-[#020b1a] font-black py-3.5 rounded-2xl transition-all duration-200 text-sm uppercase tracking-[0.18em] text-center shadow-lg shadow-[#00d4ff]/30 hover:shadow-[#00d4ff]/50 mb-3"
              >
                Sign In to Track
              </Link>
              <Link
                href="/register"
                className="block w-full border border-[#00d4ff]/30 hover:border-[#00d4ff]/70 text-[#00d4ff] hover:bg-[#00d4ff]/8 font-bold py-3 rounded-2xl transition-all duration-200 text-sm uppercase tracking-[0.18em] text-center"
              >
                Create Account
              </Link>

              {/* bottom accent line */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#1a72f0]/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* Bottom left HUD info panel */}
        <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
          <div className="bg-[#030e1f]/80 backdrop-blur-xl border border-[#1a72f0]/25 rounded-2xl px-4 py-3">
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-[#1a72f0]/60" />
            <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-[#1a72f0]/60" />
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#4a7aaa] mb-2">System Status</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-xs font-bold tracking-wide">Tracker Online</span>
            </div>
            <p className="text-[#4a7aaa] text-[10px] font-mono">GPS · Real-time · Encrypted</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── LOGGED IN ────────────────────────────────────────────────── */
  const lostDevices = devices.filter(d => (d.status === 'lost' || d.status === 'stolen') && d.incident_latitude && d.incident_longitude)

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col relative">
      {/* dark grid bg */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g2" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1a72f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g2)" />
        </svg>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#1a72f0]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#003580]/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1a72f0] animate-pulse" />
              <p className="text-[10px] font-black tracking-[0.4em] text-[#1a72f0] uppercase">Purpose Technology · Tracker</p>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              My Devices
            </h1>
            <p className="text-[#8baed4] text-sm mt-1">
              {devices.length} device{devices.length !== 1 ? 's' : ''} registered
            </p>
          </div>

          {/* Live tracking banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#050e20] via-[#060f22] to-[#071326] border border-[#1a72f0]/25 rounded-[28px] p-6 mb-8 shadow-2xl shadow-[#1a72f0]/10">
            {/* Background decorations */}
            <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
              <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="g3" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a72f0" strokeWidth="0.5" /></pattern></defs>
                <rect width="100%" height="100%" fill="url(#g3)" />
              </svg>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 60 Q 25 40 50 30 T 100 20" fill="none" stroke="#1a72f0" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.3" />
                <path d="M 0 80 Q 30 60 60 50 T 100 40" fill="none" stroke="#00d4ff" strokeWidth="0.3" strokeDasharray="2 4" opacity="0.15" />
              </svg>
              {/* Right-side glow bloom */}
              <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-[#1a72f0]/8 to-transparent" />
            </div>
            {/* Top accent */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#1a72f0]/60 to-transparent" />

            <div className="relative z-10 flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  </span>
                  <h2 className="text-white font-bold text-lg tracking-tight">Live Tracking Dashboard</h2>
                </div>
                <p className="text-[#8baed4] text-sm">
                  Real-time GPS positions of your devices are available in your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Incident map */}
          {lostDevices.length > 0 && (
            <div className="bg-white/3 border border-white/8 rounded-[28px] p-5 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Last Known Locations</h3>
                  <p className="text-[#8baed4] text-xs">Lost / stolen devices incident map</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden">
                <DeviceMap devices={lostDevices} />
              </div>
            </div>
          )}

          {/* Device list */}
          {devices.length === 0 ? (
            <div className="w-full space-y-6">

              {/* ── LIVE TRACKING MAP VISUALIZATION ── */}
              <div className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-[#1a72f0]/20 bg-[#040d1c] shadow-2xl shadow-[#1a72f0]/10 h-[220px] sm:h-[300px] md:h-[380px] lg:h-[420px]">

                {/* CSS animations */}
                <style>{`
                  @keyframes gps-pulse   { 0%,100%{r:6;opacity:.9} 50%{r:9;opacity:.5} }
                  @keyframes gps-ring    { 0%{r:10;opacity:.7} 100%{r:28;opacity:0} }
                  @keyframes dot-drift-a { 0%{transform:translate(0,0)} 25%{transform:translate(18px,-12px)} 50%{transform:translate(32px,4px)} 75%{transform:translate(14px,18px)} 100%{transform:translate(0,0)} }
                  @keyframes dot-drift-b { 0%{transform:translate(0,0)} 33%{transform:translate(-14px,10px)} 66%{transform:translate(8px,20px)} 100%{transform:translate(0,0)} }
                  @keyframes dot-drift-c { 0%{transform:translate(0,0)} 40%{transform:translate(20px,-8px)} 80%{transform:translate(-6px,-16px)} 100%{transform:translate(0,0)} }
                  @keyframes dot-drift-d { 0%{transform:translate(0,0)} 30%{transform:translate(-20px,-10px)} 60%{transform:translate(-8px,14px)} 100%{transform:translate(0,0)} }
                  @keyframes route-flow  { to{stroke-dashoffset:-60} }
                  @keyframes coord-blink { 0%,100%{opacity:1} 50%{opacity:.4} }
                  @keyframes scan-sweep  { 0%{transform:rotate(0deg) translate(0,-38px) rotate(0deg)} 100%{transform:rotate(360deg) translate(0,-38px) rotate(-360deg)} }
                  .gps-a { animation: dot-drift-a 14s ease-in-out infinite; }
                  .gps-b { animation: dot-drift-b 18s ease-in-out infinite; }
                  .gps-c { animation: dot-drift-c 11s ease-in-out infinite; }
                  .gps-d { animation: dot-drift-d 16s ease-in-out infinite; }
                  .route-anim { animation: route-flow 1.5s linear infinite; }
                  .coord-flash { animation: coord-blink 3s ease-in-out infinite; }
                  .ring-anim-1 { animation: gps-ring 2.2s ease-out infinite; }
                  .ring-anim-2 { animation: gps-ring 2.2s ease-out infinite .6s; }
                  .ring-anim-3 { animation: gps-ring 2.2s ease-out infinite 1.1s; }
                  .ring-anim-r1 { animation: gps-ring 2.5s ease-out infinite; }
                  .ring-anim-r2 { animation: gps-ring 2.5s ease-out infinite .8s; }
                  .scan-dot { animation: scan-sweep 4s linear infinite; }
                `}</style>

                {/* ── Real map image background ── */}
                <img
                  src="/images/map-bg.png"
                  alt="Map background"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: 0.85 }}
                />
                {/* Dark tint overlay to deepen and unify colours */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(4,13,28,0.55) 0%, rgba(2,8,16,0.45) 100%)' }} />

                {/* SVG MAP */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="glow-b"><feGaussianBlur stdDeviation="3" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <filter id="glow-c"><feGaussianBlur stdDeviation="5" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <filter id="glow-r"><feGaussianBlur stdDeviation="2" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <radialGradient id="rg-blue" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1a72f0" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#1a72f0" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="rg-cyan" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="rg-red" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                    </radialGradient>
                  </defs>

                  {/* ── No SVG grid  — real image handles map texture ── */}

                  {/*
                    SVG viewBox: 900 × 420
                    Map centre (hub): ~450, 210
                    The city has radial arteries + ring roads.
                    Routes are traced along the major visible streets.
                  */}

                  {/* ══ ROUTE A — Blue: top-right diagonal artery ══
                      Starts bottom-left outer ring, curves through inner ring
                      up the NE radial artery to top-right quadrant.           */}
                  {/* glow shadow */}
                  <polyline
                    points="155,395 210,355 265,315 320,270 380,240 420,215 450,210 490,195 540,175 600,148 665,118 730,88 795,62"
                    fill="none" stroke="#1a72f0" strokeWidth="10" opacity="0.10"
                    strokeLinejoin="round" strokeLinecap="round"
                  />
                  {/* main white route */}
                  <polyline
                    points="155,395 210,355 265,315 320,270 380,240 420,215 450,210 490,195 540,175 600,148 665,118 730,88 795,62"
                    fill="none" stroke="white" strokeWidth="2.2" opacity="0.80"
                    strokeLinejoin="round" strokeLinecap="round" filter="url(#glow-b)"
                  />
                  {/* animated dash overlay */}
                  <polyline
                    className="route-anim"
                    points="155,395 210,355 265,315 320,270 380,240 420,215 450,210 490,195 540,175 600,148 665,118 730,88 795,62"
                    fill="none" stroke="#1a72f0" strokeWidth="1.5" opacity="0.65"
                    strokeDasharray="12 22" strokeLinejoin="round" strokeLinecap="round"
                  />

                  {/* ══ ROUTE B — Cyan: bottom-right to west ring road ══
                      Follows the SE radial down, sweeps along the outer
                      southern ring, then up the western artery.              */}
                  {/* glow shadow */}
                  <polyline
                    points="760,62 720,95 680,128 640,162 600,190 560,205 510,210 450,210 400,215 360,228 320,248 285,275 255,310 230,348 215,385"
                    fill="none" stroke="#00d4ff" strokeWidth="8" opacity="0.10"
                    strokeLinejoin="round" strokeLinecap="round"
                  />
                  {/* main cyan route */}
                  <polyline
                    points="760,62 720,95 680,128 640,162 600,190 560,205 510,210 450,210 400,215 360,228 320,248 285,275 255,310 230,348 215,385"
                    fill="none" stroke="#00d4ff" strokeWidth="1.8" opacity="0.70"
                    strokeLinejoin="round" strokeLinecap="round" filter="url(#glow-c)"
                  />
                  {/* animated dash overlay */}
                  <polyline
                    className="route-anim"
                    points="760,62 720,95 680,128 640,162 600,190 560,205 510,210 450,210 400,215 360,228 320,248 285,275 255,310 230,348 215,385"
                    fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.55"
                    strokeDasharray="10 20" strokeLinejoin="round" strokeLinecap="round"
                  />

                  {/* ── Waypoint dots — at ring road intersections ── */}
                  {[
                    [265,315],[380,240],[450,210],[540,175],[665,118],
                    [640,162],[510,210],[360,228],[255,310],
                  ].map(([cx,cy],i)=>(
                    <g key={`wp${i}`}>
                      <circle cx={cx} cy={cy} r="5" fill="none" stroke="white" strokeWidth="0.8" opacity="0.25"/>
                      <circle cx={cx} cy={cy} r="2.5" fill="white" opacity="0.55"/>
                    </g>
                  ))}

                  {/* ══ GPS DEVICE A — blue: top-right artery end ══ */}
                  <g className="gps-a" style={{transformOrigin:'795px 62px'}}>
                    <circle cx="795" cy="62" r="40" fill="url(#rg-blue)" opacity="0.7"/>
                    <circle className="ring-anim-1" cx="795" cy="62" r="10" fill="none" stroke="#1a72f0" strokeWidth="1.5" opacity="0.7"/>
                    <circle className="ring-anim-2" cx="795" cy="62" r="10" fill="none" stroke="#1a72f0" strokeWidth="1" opacity="0.5"/>
                    <circle cx="795" cy="62" r="7" fill="#1a72f0" opacity="0.95" filter="url(#glow-b)"/>
                    <circle cx="795" cy="62" r="3.5" fill="white" opacity="0.9"/>
                    <rect x="808" y="50" width="58" height="18" rx="4" fill="rgba(6,14,30,0.85)" stroke="#1a72f0" strokeWidth="0.8"/>
                    <text x="837" y="63" textAnchor="middle" fill="#8baed4" fontSize="7.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">DEV-001</text>
                  </g>

                  {/* ══ GPS DEVICE B — cyan: bottom-left artery end ══ */}
                  <g className="gps-b" style={{transformOrigin:'215px 385px'}}>
                    <circle cx="215" cy="385" r="38" fill="url(#rg-cyan)" opacity="0.7"/>
                    <circle className="ring-anim-1" cx="215" cy="385" r="10" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
                    <circle className="ring-anim-2" cx="215" cy="385" r="10" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4"/>
                    <circle cx="215" cy="385" r="7" fill="#00d4ff" opacity="0.9" filter="url(#glow-c)"/>
                    <circle cx="215" cy="385" r="3.5" fill="white" opacity="0.9"/>
                    <rect x="229" y="373" width="58" height="18" rx="4" fill="rgba(6,14,30,0.85)" stroke="#00d4ff" strokeWidth="0.8"/>
                    <text x="258" y="386" textAnchor="middle" fill="#8baed4" fontSize="7.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">DEV-002</text>
                  </g>

                  {/* ══ GPS DEVICE C — red (lost): on inner ring near hub ══ */}
                  <g className="gps-c" style={{transformOrigin:'540px 175px'}}>
                    <circle cx="540" cy="175" r="36" fill="url(#rg-red)" opacity="0.7"/>
                    <circle className="ring-anim-r1" cx="540" cy="175" r="10" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8"/>
                    <circle className="ring-anim-r2" cx="540" cy="175" r="10" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5"/>
                    <circle cx="540" cy="175" r="7" fill="#ef4444" opacity="0.95" filter="url(#glow-r)"/>
                    <circle cx="540" cy="175" r="3.5" fill="white" opacity="0.9"/>
                    <rect x="553" y="164" width="64" height="18" rx="4" fill="rgba(30,6,6,0.9)" stroke="#ef4444" strokeWidth="0.8"/>
                    <text x="585" y="177" textAnchor="middle" fill="#fca5a5" fontSize="7.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">LOST·003</text>
                  </g>

                  {/* ══ GPS DEVICE D — blue: top-left artery end ══ */}
                  <g className="gps-d" style={{transformOrigin:'760px 62px'}}>
                    <circle cx="760" cy="62" r="34" fill="url(#rg-blue)" opacity="0.7"/>
                    <circle className="ring-anim-1" cx="760" cy="62" r="10" fill="none" stroke="#1a72f0" strokeWidth="1.5" opacity="0.7"/>
                    <circle className="ring-anim-2" cx="760" cy="62" r="10" fill="none" stroke="#1a72f0" strokeWidth="1" opacity="0.4"/>
                    <circle cx="760" cy="62" r="7" fill="#1a72f0" opacity="0.95" filter="url(#glow-b)"/>
                    <circle cx="760" cy="62" r="3.5" fill="white" opacity="0.9"/>
                    <rect x="703" y="50" width="52" height="18" rx="4" fill="rgba(6,14,30,0.85)" stroke="#1a72f0" strokeWidth="0.8"/>
                    <text x="729" y="63" textAnchor="middle" fill="#8baed4" fontSize="7.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">DEV-004</text>
                  </g>

                  {/* ── HUD TITLE — hidden on mobile, visible sm+ ── */}
                  <text x="450" y="28" textAnchor="middle" fill="white" fontSize="12" fontFamily="monospace" fontWeight="bold" letterSpacing="5" opacity="0.85" className="hidden sm:block">LIVE DEVICE TRACKING</text>
                  <line x1="320" y1="34" x2="580" y2="34" stroke="white" strokeWidth="0.4" opacity="0.25"/>

                  {/* ── Coordinate readouts — hidden on mobile ── */}
                  <text x="340" y="50" textAnchor="middle" fill="#4a7aaa" fontSize="7" fontFamily="monospace" letterSpacing="1.5" opacity="0.8">LOCATION</text>
                  <text className="coord-flash" x="340" y="62" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" letterSpacing="1" opacity="0.9">-22.5597.13</text>
                  <text x="560" y="50" textAnchor="middle" fill="#4a7aaa" fontSize="7" fontFamily="monospace" letterSpacing="1.5" opacity="0.8">TRACKING</text>
                  <text className="coord-flash" x="560" y="62" textAnchor="middle" fill="#00d4ff" fontSize="9" fontFamily="monospace" letterSpacing="1" opacity="0.9">17.0832.44</text>

                  {/* ── Bottom dot indicator ── */}
                  {[-3,-2,-1,0,1,2,3].map(i=>(
                    <circle key={i} cx={450+i*16} cy={408} r={i===0?3.5:2} fill={i===0?'#1a72f0':'#1a3a5a'} opacity={i===0?1:0.6}/>
                  ))}

                  {/* ── Corner bracket decorations — hidden on mobile ── */}
                  <path className="hidden sm:block" d="M 16 16 L 16 44 M 16 16 L 44 16" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
                  <path className="hidden sm:block" d="M 884 16 L 884 44 M 884 16 L 856 16" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
                  <path className="hidden sm:block" d="M 16 404 L 16 376 M 16 404 L 44 404" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
                  <path className="hidden sm:block" d="M 884 404 L 884 376 M 884 404 L 856 404" stroke="#1a72f0" strokeWidth="1.5" opacity="0.5" fill="none"/>
                </svg>

                {/* ── Glow blooms aligned to GPS dot positions ── */}
                <div className="absolute pointer-events-none" style={{left:'88%',top:'15%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(26,114,240,0.14) 0%,transparent 70%)',transform:'translate(-50%,-50%)'}}/>
                <div className="absolute pointer-events-none" style={{left:'24%',top:'92%',width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,212,255,0.12) 0%,transparent 70%)',transform:'translate(-50%,-50%)'}}/>
                <div className="absolute pointer-events-none" style={{left:'60%',top:'42%',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(239,68,68,0.10) 0%,transparent 70%)',transform:'translate(-50%,-50%)'}}/>
                <div className="absolute pointer-events-none" style={{left:'84%',top:'15%',width:140,height:140,borderRadius:'50%',background:'radial-gradient(circle,rgba(26,114,240,0.10) 0%,transparent 70%)',transform:'translate(-50%,-50%)'}}/>

                {/* ── Top overlay bar ── */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#1a72f0]/70 to-transparent"/>

                {/* ── Bottom status bar — stacks on mobile ── */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#020b1a]/90 to-transparent h-14 pointer-events-none"/>
                <div className="absolute bottom-2 left-3 right-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                      <span className="relative inline-flex h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"/>
                    </span>
                    <span className="text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Realtime GPS Active</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[9px] font-mono text-[#4a7aaa]">
                    <span>4 devices tracked</span>
                    <span className="hidden sm:block">3 active · 1 lost</span>
                    <span className="hidden md:block">Satellite · High Accuracy</span>
                  </div>
                </div>

                {/* ── Legend card — compact on mobile ── */}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-[#020b1a]/85 backdrop-blur border border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2.5 pointer-events-none">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#4a7aaa] mb-1 sm:mb-2">Legend</p>
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="relative w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0">
                        <div className="absolute inset-0 rounded-full bg-[#1a72f0] animate-ping opacity-60" style={{animationDuration:'2s'}}/>
                        <div className="relative w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#1a72f0]"/>
                      </div>
                      <span className="text-[#8baed4] text-[8px] sm:text-[9px]">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="relative w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0">
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" style={{animationDuration:'1.8s'}}/>
                        <div className="relative w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500"/>
                      </div>
                      <span className="text-[#8baed4] text-[8px] sm:text-[9px]">Lost</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Info row — 1 col mobile, 3 col sm+ ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 sm:p-4 flex sm:block items-center gap-4 sm:gap-0 text-center">
                  <p className="text-xl sm:text-2xl font-black text-[#1a72f0] sm:mb-1">GPS</p>
                  <p className="text-[#4a7aaa] text-[10px] uppercase tracking-widest font-bold">High Accuracy</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 sm:p-4 flex sm:block items-center gap-4 sm:gap-0 text-center justify-center sm:justify-start">
                  <div className="flex items-center justify-center gap-2 sm:mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-white">Live</p>
                  </div>
                  <p className="text-[#4a7aaa] text-[10px] uppercase tracking-widest font-bold">Real-time Updates</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 sm:p-4 flex sm:block items-center gap-4 sm:gap-0 text-center">
                  <p className="text-xl sm:text-2xl font-black text-[#00d4ff] sm:mb-1">256</p>
                  <p className="text-[#4a7aaa] text-[10px] uppercase tracking-widest font-bold">Bit Encrypted</p>
                </div>
              </div>

              {/* ── Message ── */}
              <div className="text-center pb-4">
                <h3 className="text-white text-xl font-bold mb-2">No devices registered yet</h3>
                <p className="text-[#8baed4] text-sm max-w-sm mx-auto leading-relaxed">Your registered devices will appear here once added by Purpose Technology. The live map above shows how your devices will be tracked.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {devices.map((device) => (
                <div key={device.id} className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#1a72f0]/40 rounded-[24px] p-6 transition-all duration-200 shadow-xl hover:shadow-[#1a72f0]/10 hover:shadow-2xl">
                  {/* top accent — always faint, full brightness on hover */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#1a72f0]/30 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-200" />
                  {/* hover side glow */}
                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#1a72f0]/0 to-[#1a72f0]/0 group-hover:from-[#1a72f0]/5 group-hover:to-transparent transition-all duration-200 pointer-events-none" />

                  {/* header */}
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Device icon with pulsing status dot */}
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${device.status === 'lost' || device.status === 'stolen' ? 'bg-red-500/15 border border-red-500/30' : 'bg-[#1a72f0]/15 border border-[#1a72f0]/20'}`}>
                          <svg className={`w-5 h-5 ${device.status === 'lost' || device.status === 'stolen' ? 'text-red-400' : 'text-[#1a72f0]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {/* Pulsing status dot */}
                        <span className="absolute -top-1 -right-1 relative flex h-2.5 w-2.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${device.status === 'lost' || device.status === 'stolen' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${device.status === 'lost' || device.status === 'stolen' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm leading-tight">{device.device_name}</h3>
                        <p className="text-[#4a7aaa] text-xs">{device.brand} {device.model}</p>
                      </div>
                    </div>
                    <StatusPill status={device.status} />
                  </div>

                  {/* details */}
                  <div className="relative space-y-2 text-xs mb-4 border-t border-white/[0.06] pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#4a7aaa] font-semibold uppercase tracking-wider text-[10px]">IMEI</span>
                      <span className="text-white font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded-lg">{device.imei_number}</span>
                    </div>
                    {device.color && (
                      <div className="flex justify-between">
                        <span className="text-[#4a7aaa] font-semibold uppercase tracking-wider text-[10px]">Color</span>
                        <span className="text-white">{device.color}</span>
                      </div>
                    )}
                    {device.purchase_date && (
                      <div className="flex justify-between">
                        <span className="text-[#4a7aaa] font-semibold uppercase tracking-wider text-[10px]">Purchased</span>
                        <span className="text-white">{new Date(device.purchase_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* tracking request */}
                  {device.tracking_requested && (
                    <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-3 mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-amber-400 text-[11px] font-black uppercase tracking-wider">Tracking Active</span>
                        <AdminPill status={device.admin_status} />
                      </div>
                      {device.incident_location && (
                        <p className="text-amber-300/70 text-xs">Last seen: {device.incident_location}</p>
                      )}
                      {device.admin_notes && (
                        <p className="text-amber-300/60 text-xs mt-1">Note: {device.admin_notes}</p>
                      )}
                    </div>
                  )}

                  {/* actions */}
                  <div className="relative flex gap-2 pt-2 border-t border-white/[0.06]">
                    {device.status === 'active' && (
                      <button
                        onClick={() => handleReportLost(device)}
                        className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 hover:border-red-500/40 text-red-400 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-150"
                      >
                        Report Lost
                      </button>
                    )}
                    {(device.status === 'lost' || device.status === 'stolen') && (
                      <button
                        onClick={() => handleMarkAsFound(device.id)}
                        className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-150"
                      >
                        Mark Found
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="px-4 py-2 border border-white/10 text-[#4a7aaa] hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/5 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-150"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Report lost modal */}
      {showReportModal && selectedDevice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#06111f] border border-[#1a72f0]/20 rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-xl font-bold">Report Lost / Stolen</h2>
                  <p className="text-[#4a7aaa] text-sm mt-0.5">{selectedDevice.device_name}</p>
                </div>
                <button
                  onClick={() => { setShowReportModal(false); setSelectedDevice(null) }}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#4a7aaa] hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#4a7aaa] uppercase tracking-widest mb-2">Incident Date *</label>
                  <input
                    type="date"
                    value={reportForm.incident_date}
                    onChange={(e) => setReportForm({ ...reportForm, incident_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-[#1a72f0] outline-none transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#4a7aaa] uppercase tracking-widest mb-2">Last Known Location *</label>
                  <p className="text-[#1a72f0] text-xs mb-3">Click on the map to mark the location</p>
                  <div className="rounded-2xl overflow-hidden border border-white/10 mb-3">
                    <MapPicker onLocationSelect={(lat, lng, addr) => setReportForm(prev => ({ ...prev, incident_location: addr, incident_latitude: lat, incident_longitude: lng }))} />
                  </div>
                  <input
                    type="text"
                    value={reportForm.incident_location}
                    onChange={(e) => setReportForm({ ...reportForm, incident_location: e.target.value })}
                    placeholder="Location (auto-filled or type manually)"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-[#1a72f0] outline-none transition-all placeholder:text-[#2a4a6a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#4a7aaa] uppercase tracking-widest mb-2">Police Report Number (optional)</label>
                  <input
                    type="text"
                    value={reportForm.police_report_number}
                    onChange={(e) => setReportForm({ ...reportForm, police_report_number: e.target.value })}
                    placeholder="Optional"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-[#1a72f0] outline-none transition-all placeholder:text-[#2a4a6a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#4a7aaa] uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    rows={3}
                    placeholder="Describe what happened..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-[#1a72f0] outline-none transition-all resize-none placeholder:text-[#2a4a6a]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={submitReport}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-sm transition-all"
                >
                  Submit Tracking Request
                </button>
                <button
                  onClick={() => { setShowReportModal(false); setSelectedDevice(null) }}
                  className="px-6 py-3 border border-white/10 text-[#4a7aaa] hover:text-white rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
