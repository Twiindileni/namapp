'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Rating {
  id: string
  rating: number
  review: string | null
  user_name: string
  created_at: string
}

interface ProductRatingProps {
  productId: string
  showReviews?: boolean
  compact?: boolean
}

export default function ProductRating({ productId, showReviews = false, compact = false }: ProductRatingProps) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const { data, error } = await supabase
          .from('product_ratings')
          .select('id, rating, review, user_name, created_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching ratings:', error)
          setRatings([])
          setAverageRating(0)
          setTotalRatings(0)
        } else {
          setRatings(data || [])
          
          if (data && data.length > 0) {
            const avg = data.reduce((sum, rating) => sum + rating.rating, 0) / data.length
            setAverageRating(avg)
            setTotalRatings(data.length)
          } else {
            setAverageRating(0)
            setTotalRatings(0)
          }
        }
      } catch (error) {
        console.error('Error fetching ratings:', error)
        setRatings([])
        setAverageRating(0)
        setTotalRatings(0)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchRatings()
    } else {
      setLoading(false)
    }

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [productId])

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  if (totalRatings === 0) {
    return (
      <div className="flex items-center space-x-1 text-gray-400">
        {renderStars(0, compact ? 'sm' : 'md')}
        <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          No ratings yet
        </span>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center space-x-2">
        {renderStars(Math.round(averageRating), compact ? 'sm' : 'md')}
        <span className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>
          {averageRating.toFixed(1)}
        </span>
        <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
        </span>
      </div>

      {showReviews && ratings.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Reviews</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {renderStars(rating.rating, 'sm')}
                    <span className="text-sm font-medium text-gray-900">
                      {rating.user_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.review && (
                  <p className="text-sm text-gray-600 mt-1">{rating.review}</p>
                )}
              </div>
            ))}
            {ratings.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                Showing 5 of {ratings.length} reviews
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}