'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline, UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

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
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchRatings()
    } else {
      setLoading(false)
    }
  }, [productId])

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarSolid key={star} className={`${sizeClasses[size]} text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]`} />
          ) : (
            <StarOutline key={star} className={`${sizeClasses[size]} text-[#4a6a90] opacity-30`} />
          )
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 h-3 bg-[rgba(0,85,204,0.1)] rounded animate-pulse" />
      </div>
    )
  }

  if (totalRatings === 0) {
    return (
      <div className="flex items-center gap-2">
        {renderStars(0, compact ? 'sm' : 'md')}
        <span className={`text-[#4a6a90] font-bold uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
          Await Review Sync
        </span>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-6'}>
      <div className="flex items-center gap-3">
        {renderStars(Math.round(averageRating), compact ? 'sm' : 'md')}
        <div className="flex items-center gap-1.5 font-mono">
           <span className={`font-bold text-white ${compact ? 'text-sm' : 'text-xl'}`}>
             {averageRating.toFixed(1)}
           </span>
           <span className={`text-[#4a6a90] font-bold ${compact ? 'text-[8px]' : 'text-xs'} uppercase tracking-tight`}>
             / Sync Rate ({totalRatings})
           </span>
        </div>
      </div>

      {showReviews && ratings.length > 0 && (
        <div className="space-y-6 pt-6 mt-6 border-t border-[rgba(0,85,204,0.1)]">
          <div className="flex items-center gap-2 mb-2">
             <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#5a9ef5]" />
             <h4 className="text-[10px] uppercase font-bold text-[#5a9ef5] tracking-[0.2em]">Transmission History</h4>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="glass-card !bg-[rgba(2,11,26,0.4)] p-4 border-[rgba(0,85,204,0.1)] hover:border-[#1a72f0]/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-8 h-8 text-[#4a6a90] opacity-40" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {rating.user_name}
                      </span>
                      {renderStars(rating.rating, 'sm')}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#4a6a90] uppercase">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.review && (
                  <p className="text-sm text-[#8baed4] leading-relaxed italic pl-10 border-l border-[rgba(0,85,204,0.1)]">
                    &quot;{rating.review}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}