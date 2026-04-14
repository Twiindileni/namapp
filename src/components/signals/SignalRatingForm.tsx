'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  XMarkIcon, 
  CommandLineIcon, 
  UserIcon, 
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  StarIcon as StarOutline
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface SignalRatingFormProps {
  signalId: string
  onClose: () => void
  onSubmitted?: () => void
}

export default function SignalRatingForm({ signalId, onClose, onSubmitted }: SignalRatingFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState<number>(0)
  const [review, setReview] = useState<string>('')
  const [userName, setUserName] = useState<string>(user?.email?.split('@')[0] || '')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (rating === 0) {
      toast.error('Select accuracy coefficient')
      return
    }
    
    setSubmitting(true)
    try {
      const { error } = await supabase.from('forex_signal_ratings').insert({
        signal_id: signalId,
        user_id: user.id,
        rating,
        review: review.trim() || null,
        user_name: userName.trim() || null,
      })
      if (error) throw error
      toast.success('Performance data synchronized')
      onSubmitted && onSubmitted()
      onClose()
    } catch (err) {
      console.error('Failed to submit rating', err)
      toast.error('Sync failure. Protocol rejected.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (currentRating: number) => {
    return (
      <div className="flex items-center gap-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="group outline-none"
          >
            {star <= currentRating ? (
              <StarSolid className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] transition-all scale-110" />
            ) : (
              <StarOutline className="w-10 h-10 text-[#4a6a90] group-hover:text-[#5a9ef5] transition-colors" />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020b1a]/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative glass-card !p-0 max-w-lg w-full overflow-hidden border-[rgba(0,85,204,0.15)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] fade-in-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003580] to-[#001a40] p-6 border-b border-[rgba(0,85,204,0.1)] flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#020b1a]/50 flex items-center justify-center border border-[rgba(0,85,204,0.2)]">
                 <CommandLineIcon className="w-6 h-6 text-[#5a9ef5]" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Verification Protocol</h2>
                 <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-[0.2em]">Commit Performance Intel</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#4a6a90] hover:text-white">
              <XMarkIcon className="w-6 h-6" />
           </button>
        </div>

        <div className="p-8 space-y-8 bg-[#020b1a]/40">
           <div className="text-center">
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#5a9ef5] mb-6">Signal Accuracy Coefficient</p>
              <div className="flex justify-center">{renderStars(rating)}</div>
              <p className="text-[10px] font-mono text-[#4a6a90] mt-6 uppercase tracking-widest">
                 {rating === 0 ? 'Initialize Input Vector' : `Accuracy Rating: Lvl-0${rating}`}
              </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="form-label">Signature Identity (Name)</label>
                 <div className="relative">
                    <input
                       type="text"
                       required
                       value={userName}
                       onChange={(e) => setUserName(e.target.value)}
                       placeholder="Identification ID"
                    />
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90]" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="form-label">Transmission Logs (Review)</label>
                 <div className="relative">
                    <textarea
                       rows={3}
                       value={review}
                       onChange={(e) => setReview(e.target.value)}
                       placeholder="Enter additional signal experience data..."
                    />
                    <ChatBubbleBottomCenterTextIcon className="absolute right-4 top-4 w-4 h-4 text-[#4a6a90]" />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button
                   disabled={submitting || rating === 0}
                   type="submit"
                   className="flex-1 btn-primary !py-4 justify-center group"
                 >
                    <span>{submitting ? 'Transmitting...' : 'Commit Intelligence'}</span>
                    <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <button
                   type="button"
                   onClick={onClose}
                   className="btn-outline !py-4 !px-8 justify-center"
                 >
                    Abort
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  )
}
