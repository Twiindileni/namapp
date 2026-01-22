"use client"

import Navbar from '@/components/layout/Navbar'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function BorrowPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [collateralType, setCollateralType] = useState<'fridge' | 'phone' | 'laptop' | ''>('')
  const [collateralDescription, setCollateralDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const calculateRepayment = (amt: number) => {
    if (!amt) return 0
    // Flat 30% fee per the brief: N$100 -> N$130
    return Number((amt * 1.3).toFixed(2))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !amount || !collateralType) {
      toast.error('Please fill in name, phone, amount and collateral type.')
      return
    }
    if (typeof amount !== 'number' || amount <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }
    if (amount >= 500 && !collateralType) {
      toast.error('Collateral is required for amounts from N$500.00')
      return
    }
    try {
      setSubmitting(true)
      const repayment = calculateRepayment(amount)
      const { error } = await supabase
        .from('loans')
        .insert({
          applicant_name: name,
          phone,
          email: email || null,
          amount,
          repayment_amount: repayment,
          collateral_type: collateralType || null,
          collateral_description: collateralDescription || null,
          status: 'pending'
        })

      if (error) throw error

      // Collateral info is already stored on the loan row; no separate insert needed

      toast.success('Loan request submitted. We will contact you shortly.')
      setName('')
      setPhone('')
      setEmail('')
      setAmount('')
      setCollateralType('')
      setCollateralDescription('')
    } catch (err: any) {
      const message = err?.message || err?.error_description || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      console.error('Loan submit error:', message)
      toast.error(`Failed to submit loan request: ${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Hero with blue gradient and form card on the right */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400">
        <div className="pointer-events-none absolute -top-16 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <div className="text-white">
              <h1 className="text-3xl sm:text-4xl font-bold">Borrow with Confidence</h1>
              <p className="mt-3 max-w-2xl text-white/90">
                Fast, transparent micro-loans. Borrow N$100.00 and pay back N$130.00. For loans from N$500.00, a collateral is required.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/20">
                  <h3 className="font-semibold">Simple Pricing</h3>
                  <p className="mt-1 text-sm text-white/80">Flat 30% fee. Example: N$100 → N$130.</p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/20">
                  <h3 className="font-semibold">Quick Decisions</h3>
                  <p className="mt-1 text-sm text-white/80">Apply in minutes, get a response quickly.</p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/20">
                  <h3 className="font-semibold">Secure Collateral</h3>
                  <p className="mt-1 text-sm text-white/80">From N$500, provide a fridge, phone, or laptop.</p>
                </div>
              </div>
            </div>

            {/* Form kept intact; only container styling changed */}
            <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-xl ring-1 ring-black/5">
              <h2 className="text-xl font-semibold text-gray-900">Request a loan</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0812345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (N$)</label>
                  <input
                    type="number"
                    min={50}
                    step={10}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="100"
                    required
                  />
                  {typeof amount === 'number' && amount > 0 && (
                    <p className="mt-1 text-sm text-gray-600">Estimated pay back: N${calculateRepayment(amount).toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Collateral type {typeof amount === 'number' && amount >= 500 ? '(required)' : '(optional)'}</label>
                  <select
                    value={collateralType}
                    onChange={(e) => setCollateralType(e.target.value as any)}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required={typeof amount === 'number' && amount >= 500}
                  >
                    <option value="">Select</option>
                    <option value="fridge">Fridge</option>
                    <option value="phone">Phone</option>
                    <option value="laptop">Laptop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Collateral description (optional)</label>
                  <textarea
                    value={collateralDescription}
                    onChange={(e) => setCollateralDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Brand, model, condition, accessories..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">How it works</h2>
            <ol className="mt-4 space-y-3 list-decimal list-inside text-gray-700">
              <li>Choose your loan amount and provide your contact details.</li>
              <li>From N$500.00, select collateral: fridge, phone, or laptop.</li>
              <li>We review and contact you to confirm details and pickup if needed.</li>
              <li>Receive funds and repay the agreed amount (principal + 30%).</li>
            </ol>
            <div className="mt-6">
              <h3 className="font-medium text-gray-900">Example repayments</h3>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li>N$100.00 → N$130.00</li>
                <li>N$300.00 → N$390.00</li>
                <li>N$500.00 → N$650.00 (collateral required)</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">What you need</h2>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Valid phone number to reach you</li>
              <li>Collateral item for amounts from N$500.00</li>
              <li>Accurate contact details for quick processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


