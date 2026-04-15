'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircleIcon, ExclamationCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

type Status = 'loading' | 'success' | 'already' | 'error'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token || calledRef.current) return
    calledRef.current = true

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.unsubscribed) {
          setStatus('success')
        } else if (data.alreadyUnsubscribed) {
          setStatus('already')
        } else {
          setStatus('error')
          setMessage(data.error ?? 'Something went wrong.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Network error — please try again.')
      })
  }, [token])

  if (!token) {
    return (
      <UnsubscribeShell>
        <StatusCard
          icon={<ExclamationCircleIcon className="w-12 h-12 text-red-400" />}
          title="Invalid Link"
          body="This unsubscribe link appears to be missing a token. Please use the link from your email."
        />
      </UnsubscribeShell>
    )
  }

  if (status === 'loading') {
    return (
      <UnsubscribeShell>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-[#1a72f0]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500 text-sm font-medium">Processing your request…</p>
        </div>
      </UnsubscribeShell>
    )
  }

  if (status === 'success') {
    return (
      <UnsubscribeShell>
        <StatusCard
          icon={<CheckCircleIcon className="w-12 h-12 text-green-500" />}
          title="You're unsubscribed"
          body="You have been successfully removed from our newsletter. You won't receive product updates or specials from us anymore."
          footer="Changed your mind? You can re-subscribe at any time from your account settings."
        />
      </UnsubscribeShell>
    )
  }

  if (status === 'already') {
    return (
      <UnsubscribeShell>
        <StatusCard
          icon={<EnvelopeIcon className="w-12 h-12 text-gray-400" />}
          title="Already unsubscribed"
          body="You're already off our newsletter list. No further action needed."
        />
      </UnsubscribeShell>
    )
  }

  return (
    <UnsubscribeShell>
      <StatusCard
        icon={<ExclamationCircleIcon className="w-12 h-12 text-red-400" />}
        title="Something went wrong"
        body={message || 'We could not process your unsubscribe request. Please try again or contact us.'}
      />
    </UnsubscribeShell>
  )
}

function UnsubscribeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/purpose_logo.png"
            alt="Purpose Technology"
            width={52}
            height={52}
            className="object-contain mb-4"
          />
          <span className="text-[10px] font-black text-[#5a9ef5] uppercase tracking-[0.3em]">
            Purpose Technology
          </span>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_40px_120px_rgba(0,0,0,0.6)] p-10 text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#003580] via-[#1a72f0] to-[#003580] rounded-t-[32px]" />
          <div className="relative">
            {children}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1a72f0] hover:text-black uppercase tracking-widest transition-colors"
              >
                Back to Purpose Technology
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({
  icon,
  title,
  body,
  footer,
}: {
  icon: React.ReactNode
  title: string
  body: string
  footer?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {icon}
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
      <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
      {footer && <p className="text-xs text-gray-400 leading-relaxed mt-1">{footer}</p>}
    </div>
  )
}
