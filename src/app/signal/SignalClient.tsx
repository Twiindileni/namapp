'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SignalRating from '@/components/signals/SignalRating'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import SignalRatingForm from '@/components/signals/SignalRatingForm'
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  ArrowRightIcon, 
  CpuChipIcon, 
  GlobeAltIcon,
  ChartBarIcon,
  BoltIcon,
  InformationCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'

type ForexSignal = {
  id: string
  instrument: string
  side: 'BUY' | 'SELL'
  entry_point: number
  take_profit_1?: number | null
  take_profit_2?: number | null
  take_profit_3?: number | null
  rating?: number | null
  created_at: string
}

export default function SignalClient() {
  const { user, loading: authLoading } = useAuth()
  const [signal, setSignal] = useState<ForexSignal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [ratingsCount, setRatingsCount] = useState<number>(0)
  const [showRatingForm, setShowRatingForm] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('forex_signals')
        .select('id,instrument,side,entry_point,take_profit_1,take_profit_2,take_profit_3,rating,created_at,status')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (error) {
        setError('Failed to synchronize with signal satellite')
      } else {
        setSignal(data as any)
        if (data?.id) {
          const { data: agg } = await supabase
            .from('forex_signal_ratings')
            .select('rating', { count: 'exact' })
            .eq('signal_id', data.id)
          if (agg && agg.length > 0) {
            const total = agg.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
            setRatingsCount(agg.length)
            setAvgRating(agg.length > 0 ? total / agg.length : null)
          } else {
            setRatingsCount(0)
            setAvgRating(null)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const renderContent = () => {
    if (authLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin"></div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="max-w-3xl mx-auto py-20 px-6 fade-in-up">
          <div className="glass-card !p-12 text-center relative overflow-hidden group border-[rgba(0,85,204,0.15)] bg-[rgba(0,53,128,0.02)]">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0055cc 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
            <div className="w-20 h-20 rounded-2xl bg-[#020b1a] border border-[rgba(0,85,204,0.3)] flex items-center justify-center mx-auto mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
               <LockClosedIcon className="w-10 h-10 text-[#5a9ef5] animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Secure Protocol Barrier</h2>
            <p className="text-[#8baed4] mb-10 max-w-lg mx-auto leading-relaxed">
              Identification required. This signal stream is encrypted for authorized members only. Enter your credentials to decrypt the latest market intelligence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login" className="btn-outline !px-10 !py-4 group">
                 <span>Initialize Login</span>
                 <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/register" className="btn-primary !px-10 !py-4">
                 Sign Up for Access
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-16">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 fade-in-up">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#5a9ef5]">Live Signal Stream : Active</span>
              </div>
              <h1 className="hero-title !text-5xl md:!text-7xl">Signal <span className="gradient-text">Intelligence</span></h1>
              <p className="mt-6 text-[#8baed4] text-lg leading-relaxed">
                Direct market intercepts from the Purpose analysis engine. High-fidelity forex telemetry for professional tactical operations.
              </p>
            </div>
            
            <div className="glass-card flex items-center gap-6 !p-6 border-[rgba(0,85,204,0.2)]">
               <div className="w-12 h-12 rounded-xl bg-[rgba(0,53,128,0.1)] flex items-center justify-center">
                  <GlobeAltIcon className="w-6 h-6 text-[#5a9ef5]" />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Satellite Uplink</p>
                  <p className="text-sm font-bold text-white">Global Network Stable</p>
               </div>
            </div>
          </div>

          {loading && (
             <div className="flex flex-col items-center gap-4 py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin" />
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#4a6a90]">Synchronizing market data...</p>
             </div>
          )}
          
          {error && (
             <div className="glass-card !bg-red-500/5 border-red-500/20 p-10 text-center max-w-xl mx-auto">
                <InformationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 font-bold uppercase tracking-widest text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-6 btn-outline !border-red-500/30 !text-red-400">Retry Link</button>
             </div>
          )}

          {!loading && !error && signal && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 fade-in-up delay-100">
               {/* Primary Signal HUD */}
               <div className={`xl:col-span-2 glass-card relative overflow-hidden group border-2 ${signal.side === 'BUY' ? 'border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)]' : 'border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.05)]'}`}>
                  {/* Decorative Mesh Background */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  
                  <div className="relative z-10 p-10">
                     <div className="flex items-center justify-between mb-10 border-b border-[rgba(0,85,204,0.1)] pb-8">
                        <div className="flex items-center gap-6">
                           <div className={`text-5xl font-black tracking-tighter ${signal.side === 'BUY' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                              {signal.side} PROTOCOL
                           </div>
                           <div className={`hidden sm:block h-10 w-px bg-[rgba(0,85,204,0.1)]`} />
                           <div className="hidden sm:block">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Timestamp</p>
                              <p className="text-xs font-mono text-white">{new Date(signal.created_at).toLocaleString()}</p>
                           </div>
                        </div>
                        <SignalRating signalId={signal.id} compact />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Essential Specs */}
                        <div className="space-y-8">
                           <div className="glass-card !p-6 border-[rgba(0,85,204,0.1)] !bg-[rgba(0,53,128,0.03)] group/item transition-all hover:bg-[rgba(0,53,128,0.05)]">
                              <div className="flex items-center gap-4 mb-4">
                                 <CpuChipIcon className="w-5 h-5 text-[#5a9ef5]" />
                                 <span className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Asset Instrument</span>
                              </div>
                              <div className="text-3xl font-bold text-white group-hover/item:text-[#5a9ef5] transition-colors">{signal.instrument}</div>
                           </div>

                           <div className="glass-card !p-6 border-[rgba(26,114,240,0.2)] !bg-[rgba(26,114,240,0.02)]">
                              <div className="flex items-center gap-4 mb-4">
                                 <BoltIcon className="w-5 h-5 text-yellow-500" />
                                 <span className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90]">Critical Entry Point</span>
                              </div>
                              <div className="text-4xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{signal.entry_point}</div>
                           </div>
                        </div>

                        {/* Objectives HUD */}
                        <div className="space-y-4">
                           <div className="text-[10px] uppercase font-bold tracking-widest text-[#5a9ef5] mb-6 flex items-center gap-2">
                              <ChartBarIcon className="w-4 h-4" />
                              Profit Extraction Objectives
                           </div>
                           
                           {[
                             { label: 'TP Alpha', val: signal.take_profit_1, color: 'text-emerald-400' },
                             { label: 'TP Bravo', val: signal.take_profit_2, color: 'text-[#5a9ef5]' },
                             { label: 'TP Charlie', val: signal.take_profit_3, color: 'text-yellow-400' }
                           ].map((tp, i) => (
                             <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[rgba(0,85,204,0.05)] bg-[rgba(0,53,128,0.02)] group/tp hover:bg-[rgba(0,53,128,0.04)] transition-all">
                                <span className="text-[10px] uppercase font-bold text-[#4a6a90] tracking-widest">{tp.label}</span>
                                <span className={`text-lg font-bold font-mono ${tp.val ? tp.color : 'text-gray-600 opacity-30'}`}>{tp.val ?? 'SECURE'}</span>
                             </div>
                           ))}

                           <div className="mt-8 p-4 rounded-lg bg-[rgba(16,185,129,0.05)] border border-emerald-500/10 flex gap-4">
                              <InformationCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                              <p className="text-[10px] text-[#8baed4] italic leading-relaxed">
                                 Secure profits progressively. Trading high-fidelity assets involves volatility risk. Verify protocol manual prior to execution.
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-12 flex gap-4">
                        <button
                          onClick={() => setShowRatingForm(true)}
                          className="flex-1 btn-primary !py-4 justify-center"
                        >
                          <StarIcon className="w-5 h-5 mr-2" />
                          <span>Commit Performance Review</span>
                        </button>
                     </div>
                  </div>
               </div>

               {/* Auxiliary Side HUD / Info */}
               <div className="space-y-8">
                  <div className="glass-card !p-8 border-[rgba(0,85,204,0.15)] bg-gradient-to-br from-[rgba(2,11,26,0.4)] to-transparent">
                     <h3 className="text-xs font-bold text-[#5a9ef5] uppercase tracking-widest mb-6 border-b border-[rgba(0,85,204,0.1)] pb-4">Analysis Matrix</h3>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <span className="text-xs text-[#4a6a90]">Signal Identity</span>
                           <span className="text-xs font-mono text-white opacity-40 uppercase">#{signal.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-xs text-[#4a6a90]">Target Integrity</span>
                           <span className="text-xs font-bold text-emerald-400">92%</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-xs text-[#4a6a90]">Risk Parameter</span>
                           <div className="flex gap-1">
                              {[1,2,3].map(i => <div key={i} className={`w-3 h-1 rounded-sm ${i < 3 ? 'bg-emerald-400' : 'bg-[#0d2040]'}`} />)}
                           </div>
                        </div>
                     </div>
                     <div className="mt-8 pt-8 border-t border-[rgba(0,85,204,0.1)]">
                        <p className="text-[9px] text-[#4a6a90] uppercase leading-relaxed font-bold tracking-widest mb-4">Tactical Intelligence Overview</p>
                        <p className="text-xs text-[#8baed4] leading-relaxed">
                           Our proprietary Purpose Algorithm has identified a high-probability liquidity sweep at the indicated entry point. Synchronize your terminals immediately.
                        </p>
                     </div>
                  </div>

                  {/* Rating Summary Widget */}
                  <div className="glass-card !p-8 border-[rgba(26,114,240,0.1)]">
                     <h3 className="text-xs font-bold text-[#5a9ef5] uppercase tracking-widest mb-4">Peer Validation</h3>
                     <SignalRating signalId={signal.id} showReviews={false} />
                  </div>
               </div>
            </div>
          )}

          {showRatingForm && signal && (
            <SignalRatingForm
              signalId={signal.id}
              onSubmitted={() => {
                setRatingsCount((c) => c)
              }}
              onClose={() => setShowRatingForm(false)}
            />
          )}

          {!loading && !error && signal && (
            <div className="mt-20 fade-in-up">
              <div className="flex items-center justify-between mb-8 border-b border-[rgba(0,85,204,0.1)] pb-4">
                 <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Signal Transmission History</h2>
                    <p className="text-sm text-[#4a6a90] mt-1 uppercase tracking-widest font-bold">Encrypted feedback logs</p>
                 </div>
                 <button onClick={() => setShowRatingForm(true)} className="text-[#5a9ef5] hover:text-[#1a72f0] transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 group">
                    Initialize Feedback
                    <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
              
              <div className="glass-card !bg-[rgba(0,53,128,0.01)] border-[rgba(26,114,240,0.1)]">
                <SignalRating signalId={signal.id} showReviews />
              </div>
            </div>
          )}

          {!loading && !error && !signal && (
            <div className="glass-card p-20 text-center max-w-2xl mx-auto border-dashed border-[rgba(0,85,204,0.2)]">
               <CpuChipIcon className="w-16 h-16 text-[#003580] mx-auto mb-6 opacity-40 animate-pulse" />
               <h3 className="text-xl font-bold text-white mb-2">No Active Intercepts</h3>
               <p className="text-[#4a6a90] mb-10 leading-relaxed italic">The market intelligence engine is currently scanning for new protocol opportunities. Stay synchronized.</p>
               <button onClick={() => window.location.reload()} className="btn-primary !px-10">Manual Registry Scan</button>
            </div>
          )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      <main className="flex-grow py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
