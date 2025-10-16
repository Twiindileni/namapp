"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import SignalRating from '@/components/signals/SignalRating'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import SignalRatingForm from '@/components/signals/SignalRatingForm'

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
        setError('Failed to load signal')
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
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )
    }
    if (!user) {
      return (
        <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900">Create an account to view signals</h2>
          <p className="mt-2 text-gray-600">Please login or register to access our latest forex signals.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-md border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-sm font-medium">Login</Link>
            <Link href="/register" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium">Register</Link>
          </div>
        </div>
      )
    }

    return (
      <>
          <h1 className="text-3xl font-bold text-gray-900">Forex Signal</h1>
          {loading && <p className="mt-6">Loading...</p>}
          {error && <p className="mt-6 text-red-600">{error}</p>}
          {!loading && !error && signal && (
            <div className={`mt-6 border rounded-lg p-6 ${signal.side === 'BUY' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${signal.side === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{signal.side}</div>
                <SignalRating signalId={signal.id} compact />
              </div>
              <div className="mt-2 text-gray-600 text-sm">{new Date(signal.created_at).toLocaleString()}</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Instrument</div>
                  <div className={`text-lg font-medium ${signal.side === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{signal.instrument}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Entry Point</div>
                  <div className={`text-lg font-medium ${signal.side === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{signal.entry_point}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Take Profit 1</div>
                  <div className={`text-lg ${signal.side === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{signal.take_profit_1 ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Take Profit 2</div>
                  <div className={`text-lg ${signal.side === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{signal.take_profit_2 ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Take Profit 3</div>
                  <div className={`text-lg ${signal.side === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{signal.take_profit_3 ?? '-'}</div>
                </div>
              </div>
              <div className="mt-6 text-sm text-gray-600">
                Trading involves substantial risk and is not suitable for every investor. Past performance is not indicative of future results. Always trade responsibly.
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Rate This Signal
                </button>
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
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
              <SignalRating signalId={signal.id} showReviews />
            </div>
          )}
          {!loading && !error && !signal && (
            <p className="mt-6 text-gray-600">No approved signals yet. Please check back later.</p>
          )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

