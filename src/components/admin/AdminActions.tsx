'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { App } from '@/types/app'
import toast from 'react-hot-toast'

interface AdminActionsProps {
  app: App
  onAction: () => void
}

export default function AdminActions({ app, onAction }: AdminActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    try {
      setLoading(true)
      const appRef = doc(db, 'apps', app.id)
      await updateDoc(appRef, {
        status: 'approved'
      })
      toast.success('App approved successfully')
      onAction()
    } catch (error) {
      console.error('Error approving app:', error)
      toast.error('Failed to approve app')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      const appRef = doc(db, 'apps', app.id)
      await updateDoc(appRef, {
        status: 'rejected'
      })
      toast.success('App rejected')
      onAction()
    } catch (error) {
      console.error('Error rejecting app:', error)
      toast.error('Failed to reject app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Approve'}
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="text-red-600 hover:text-red-900 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Reject'}
      </button>
    </div>
  )
} 