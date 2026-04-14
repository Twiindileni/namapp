'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }
    setLoading(true)
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : '/reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })
      if (error) throw error
      setSent(true)
      toast.success('Check your email for the reset link')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
      <Navbar />
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="glass-effect rounded-lg p-8 hover-lift">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 gradient-text">
              Forgot your password?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email and we will send you a link to reset it.
            </p>
          </div>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="glass-effect rounded-lg p-8 hover-lift">
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Check your spam folder if you do not see it. The link usually expires in 1 hour.
                </p>
                <Link
                  href="/login"
                  className="block w-full text-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Back to login
                </Link>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail('') }}
                  className="block w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Try another email
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </div>
                <div className="text-center">
                  <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
