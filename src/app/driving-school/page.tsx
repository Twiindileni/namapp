'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Package {
  id: string
  name: string
  description: string | null
  hours: number
  price_nad: number
  display_order: number
  is_active: boolean
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80'

export default function DrivingSchoolPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    package_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    preferred_date: '',
    preferred_time: '',
    preferred_dates: '',
    message: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('driving_school_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (error) {
        console.error(error)
        toast.error('Failed to load packages')
        setLoading(false)
        return
      }
      setPackages((data ?? []) as Package[])
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.customer_email || !form.customer_phone) {
      toast.error('Please fill in name, email and phone')
      return
    }
    setFormLoading(true)
    const { error } = await supabase.from('driving_school_bookings').insert({
      package_id: form.package_id || null,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time || null,
      preferred_dates: form.preferred_dates || null,
      message: form.message || null,
    })
    setFormLoading(false)
    if (error) {
      console.error(error)
      toast.error('Failed to submit inquiry')
      return
    }
    toast.success('Inquiry sent! We will contact you shortly.')
    setForm({
      package_id: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      preferred_date: '',
      preferred_time: '',
      preferred_dates: '',
      message: '',
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero with background image */}
      <section className="relative h-[320px] sm:h-[400px] w-full overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Driving school"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight drop-shadow-lg">Driving School</h1>
          <p className="mt-4 text-lg sm:text-xl max-w-2xl text-white/95 drop-shadow">
            Learn to drive with professional lessons. N$130 per hour.
          </p>
        </div>
      </section>

      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Lesson packages</h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Choose a package below or send an inquiry. Pick your preferred date and time when booking.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/80 hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="p-6 border-l-4 border-indigo-500">
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>
                    )}
                    <p className="mt-3 text-sm text-gray-500">{pkg.hours} hours</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-600">
                      N$ {Number(pkg.price_nad).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      N$ {(Number(pkg.price_nad) / pkg.hours).toFixed(0)}/hour
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <section className="relative py-12 px-4 sm:px-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-gray-100/80 border border-indigo-100/50">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Book or inquire</h2>
              <p className="text-sm text-gray-600 mb-6">Pick your preferred date and time below.</p>
              <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 sm:p-8 space-y-4 border border-white/60">
              <div>
                <label className="block text-sm font-medium text-gray-700">Package (optional)</label>
                <select
                  value={form.package_id}
                  onChange={(e) => setForm((f) => ({ ...f, package_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select a package</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} – N$ {Number(p.price_nad).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred date</label>
                  <input
                    type="date"
                    value={form.preferred_date}
                    onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                    min={new Date().toISOString().slice(0, 10)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred time</label>
                  <input
                    type="time"
                    value={form.preferred_time}
                    onChange={(e) => setForm((f) => ({ ...f, preferred_time: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Other preferences (optional)</label>
                <input
                  value={form.preferred_dates}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_dates: e.target.value }))}
                  placeholder="e.g. Weekday mornings only, second choice dates"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message (optional)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {formLoading ? 'Sending…' : 'Send inquiry'}
              </button>
            </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
