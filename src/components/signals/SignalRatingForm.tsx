'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface SignalRatingFormProps {
  signalId: string
  onClose: () => void
  onSubmitted?: () => void
}

export default function SignalRatingForm({ signalId, onClose, onSubmitted }: SignalRatingFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState<number>(5)
  const [review, setReview] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('forex_signal_ratings').insert({
        signal_id: signalId,
        user_id: user.id,
        rating,
        review: review || null,
        user_name: userName || null,
      })
      if (error) throw error
      onSubmitted && onSubmitted()
      onClose()
    } catch (err) {
      console.error('Failed to submit rating', err)
      alert('Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900">Rate This Signal</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value={1}>1 - Poor</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5 - Excellent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Review (optional)</label>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2"
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-50">Cancel</button>
            <button disabled={submitting} type="submit" className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

