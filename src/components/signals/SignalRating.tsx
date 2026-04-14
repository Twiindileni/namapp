'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline, UserCircleIcon, ChatBubbleBottomCenterIcon } from '@heroicons/react/24/outline'

interface SignalRatingProps {
  signalId: string
  showReviews?: boolean
  compact?: boolean
}

interface RatingRow {
  id: string
  rating: number
  review: string | null
  user_name: string | null
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
          .select('id, rating, review, user_name, created_at')
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

  if (loading) return <div className="animate-pulse bg-[rgba(0,85,204,0.1)] rounded w-16 h-4" />

  if (totalRatings === 0) {
    return (
      <div className="flex items-center gap-2">
        {renderStars(0, compact ? 'sm' : 'md')}
        <span className={`text-[#4a6a90] font-bold uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
           Sync Awaiting
        </span>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-8'}>
      <div className="flex items-center gap-3">
        {renderStars(Math.round(averageRating), compact ? 'sm' : 'md')}
        <div className="flex items-center gap-1.5 font-mono">
           <span className={`font-bold text-white ${compact ? 'text-sm' : 'text-xl'}`}>
             {averageRating.toFixed(1)}
           </span>
           <span className={`text-[#4a6a90] font-bold ${compact ? 'text-[8px]' : 'text-xs'} uppercase tracking-tight`}>
             / Intel Verification ({totalRatings})
           </span>
        </div>
      </div>

      {showReviews && ratings.length > 0 && (
        <div className="space-y-6 pt-6 mt-6 border-t border-[rgba(0,85,204,0.1)]">
          <div className="flex items-center gap-2 mb-2">
             <ChatBubbleBottomCenterIcon className="w-4 h-4 text-[#5a9ef5]" />
             <h4 className="text-[10px] uppercase font-bold text-[#5a9ef5] tracking-[0.2em]">Transmission Logs</h4>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-4">
            {ratings.map((r) => (
              <div key={r.id} className="glass-card !bg-[rgba(2,11,26,0.5)] p-5 border-[rgba(0,85,204,0.1)] hover:border-[#1a72f0]/20 transition-all group/rev">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-8 h-8 text-[#4a6a90] opacity-40 group-hover/rev:text-[#5a9ef5] transition-colors" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {r.user_name || 'Anonymous Intelligence'}
                      </span>
                      {renderStars(r.rating, 'sm')}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#4a6a90] uppercase tracking-widest">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.review && (
                  <p className="text-sm text-[#8baed4] leading-relaxed italic border-l-2 border-[rgba(0,85,204,0.2)] pl-4 ml-4">
                    &quot;{r.review}&quot;
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
