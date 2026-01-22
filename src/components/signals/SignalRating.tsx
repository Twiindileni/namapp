'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SignalRatingProps {
  signalId: string
  showReviews?: boolean
  compact?: boolean
}

interface RatingRow {
  id: string
  rating: number
  review: string | null
  created_at: string
}

export default function SignalRating({ signalId, showReviews = false, compact = false }: SignalRatingProps) {
  const [ratings, setRatings] = useState<RatingRow[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('forex_signal_ratings')
          .select('id, rating, review, created_at')
          .eq('signal_id', signalId)
          .order('created_at', { ascending: false })
        if (error) throw error
        const rows = (data || []) as RatingRow[]
        setRatings(rows)
        if (rows.length > 0) {
          const avg = rows.reduce((sum, r) => sum + (r.rating || 0), 0) / rows.length
          setAverageRating(avg)
          setTotalRatings(rows.length)
        } else {
          setAverageRating(0)
          setTotalRatings(0)
        }
      } catch (e) {
        setRatings([])
        setAverageRating(0)
        setTotalRatings(0)
      } finally {
        setLoading(false)
      }
    }

    if (signalId) load()
  }, [signalId])

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className={`${sizeClasses[size]} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (loading) return <div className="animate-pulse bg-gray-200 rounded w-16 h-4" />

  if (totalRatings === 0) {
    return (
      <div className="flex items-center space-x-1 text-gray-400">
        {renderStars(0, compact ? 'sm' : 'md')}
        <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>No ratings yet</span>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center space-x-2">
        {renderStars(Math.round(averageRating), compact ? 'sm' : 'md')}
        <span className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>{averageRating.toFixed(1)}</span>
        <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
      </div>

      {showReviews && ratings.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Reviews</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ratings.slice(0, 5).map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  {renderStars(r.rating, 'sm')}
                  <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

