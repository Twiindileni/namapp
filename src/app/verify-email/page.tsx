'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import { sendEmailVerification } from 'firebase/auth'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)

  const handleResendVerification = async () => {
    if (!user) {
      toast.error('No user logged in')
      return
    }

    try {
      setSending(true)
      await sendEmailVerification(user)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="glass-effect rounded-lg p-8 hover-lift">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 gradient-text">
              Verify Your Email
            </h2>
            <div className="mt-6 space-y-6">
              <p className="text-center text-sm text-gray-600">
                We've sent a verification email to {user.email}. Please check your inbox and click the verification link to continue.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={handleResendVerification}
                  disabled={sending}
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 hover-lift"
                >
                  {sending ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : 'Resend Verification Email'}
                </button>
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or try resending.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 