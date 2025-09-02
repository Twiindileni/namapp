"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type SignalForm = {
  instrument: string
  side: 'BUY' | 'SELL'
  entry_point: string
  take_profit_1?: string
  take_profit_2?: string
  take_profit_3?: string
  rating?: number
  status?: 'pending' | 'approved' | 'rejected'
}

export default function AdminSignalsPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [form, setForm] = useState<SignalForm>({
    instrument: 'GOLD',
    side: 'BUY',
    entry_point: '',
    take_profit_1: '',
    take_profit_2: '',
    take_profit_3: '',
    rating: 3,
    status: 'approved',
  })
  const [submitting, setSubmitting] = useState(false)
  const [signals, setSignals] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    if (userRole !== 'admin') {
      router.push('/admin/login')
    }
  }, [user, userRole, router])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('forex_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setSignals(data || [])
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRatingChange = (value: number) => {
    setForm((prev) => ({ ...prev, rating: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      const payload = {
        instrument: form.instrument,
        side: form.side,
        entry_point: Number(form.entry_point),
        take_profit_1: form.take_profit_1 ? Number(form.take_profit_1) : null,
        take_profit_2: form.take_profit_2 ? Number(form.take_profit_2) : null,
        take_profit_3: form.take_profit_3 ? Number(form.take_profit_3) : null,
        rating: form.rating ?? null,
        status: form.status ?? 'pending',
        created_by: user.id,
      }
      const { error } = await supabase.from('forex_signals').insert(payload)
      if (error) throw error
      const { data } = await supabase
        .from('forex_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setSignals(data || [])
      setForm((prev) => ({ ...prev, entry_point: '', take_profit_1: '', take_profit_2: '', take_profit_3: '' }))
    } catch (err) {
      console.error('Failed to create signal', err)
      alert('Failed to create signal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Forex Signals</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Instrument</label>
          <select name="instrument" value={form.instrument} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
            <option value="GOLD">Gold (XAUUSD)</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="EURUSD">EURUSD</option>
            <option value="US30">US30</option>
            <option value="NAS100">NAS100</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Side</label>
          <select name="side" value={form.side} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Entry Point</label>
          <input name="entry_point" value={form.entry_point} onChange={handleChange} type="number" step="0.0001" className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Take Profit 1</label>
          <input name="take_profit_1" value={form.take_profit_1} onChange={handleChange} type="number" step="0.0001" className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Take Profit 2</label>
          <input name="take_profit_2" value={form.take_profit_2} onChange={handleChange} type="number" step="0.0001" className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Take Profit 3</label>
          <input name="take_profit_3" value={form.take_profit_3} onChange={handleChange} type="number" step="0.0001" className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Signal Rating</label>
          <select name="rating" value={form.rating} onChange={(e) => handleRatingChange(Number(e.target.value))} className="mt-1 w-full border rounded px-3 py-2">
            <option value={1}>⭐</option>
            <option value={2}>⭐⭐</option>
            <option value={3}>⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐</option>
            <option value={5}>⭐⭐⭐⭐⭐</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button disabled={submitting} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {submitting ? 'Saving...' : 'Save Signal'}
          </button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Recent Signals</h2>
        <div className="grid gap-3">
          {signals.map((s) => (
            <div key={s.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{new Date(s.created_at).toLocaleString()} • {s.status}</div>
                <div className="font-medium">
                  {s.instrument} • {s.side} at {s.entry_point}
                </div>
                <div className="text-sm">TP1 {s.take_profit_1 ?? '-'} • TP2 {s.take_profit_2 ?? '-'} • TP3 {s.take_profit_3 ?? '-'}</div>
              </div>
              <div className="text-yellow-500">
                {Array.from({ length: s.rating || 0 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

