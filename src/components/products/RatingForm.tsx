'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon, 
  EnvelopeIcon,
  CommandLineIcon,
  ChevronRightIcon,
  StarIcon as StarOutline
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface RatingFormProps {
  productId: string
  productName: string
  onRatingSubmitted: () => void
  onClose: () => void
}

export default function RatingForm({ productId, productName, onRatingSubmitted, onClose }: RatingFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [userName, setUserName] = useState(user?.email?.split('@')[0] || '')
  const [userEmail, setUserEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Select satisfaction coefficient')
      return
    }
    if (!userName.trim()) {
      toast.error('Identification missing')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('product_ratings')
        .upsert({
          product_id: productId,
          user_id: user?.id || null,
          rating,
          review: review.trim() || null,
          user_name: userName.trim(),
          user_email: userEmail.trim() || null,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Feedback synchronized successfully')
      onRatingSubmitted()
      onClose()
    } catch (error: any) {
      toast.error('Sync failure. Protocol rejected.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (currentRating: number) => {
    return (
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="group"
          >
            {star <= currentRating ? (
              <StarSolid className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all" />
            ) : (
              <StarOutline className="w-10 h-10 text-[#4a6a90] group-hover:text-[#5a9ef5] transition-colors" />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#020b1a]/90 backdrop-blur-md flex items-center justify-center p-4 z-[6000]">
      <div className="glass-card !p-0 max-w-lg w-full overflow-hidden border-[rgba(0,85,204,0.15)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] fade-in-up">
        
        {/* Terminal Header */}
        <div className="bg-gradient-to-r from-[#003580] to-[#001a40] p-6 border-b border-[rgba(0,85,204,0.1)] flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#020b1a]/40 flex items-center justify-center border border-[rgba(0,85,204,0.2)]">
                 <CommandLineIcon className="w-6 h-6 text-[#5a9ef5]" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Feedback Protocol</h2>
                 <p className="text-[10px] font-bold text-[#4a6a90] uppercase tracking-[0.2em]">Transmit Peer Review</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#4a6a90] hover:text-white">
              <XMarkIcon className="w-6 h-6" />
           </button>
        </div>

        <div className="p-8 space-y-8 bg-[#020b1a]/40">
           <div className="text-center">
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#5a9ef5] mb-2">Subject Evaluation</p>
              <h3 className="text-lg font-bold text-white mb-6">&quot;{productName}&quot;</h3>
              {renderStars(rating)}
              <p className="text-[10px] font-mono text-[#4a6a90] mt-4 uppercase tracking-widest">
                 {rating === 0 ? 'Await Coefficient Input' : `Satisfaction: Lvl-0${rating}`}
              </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Signature (Name)</label>
                    <div className="relative">
                       <input
                          type="text"
                          required
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="User ID"
                       />
                       <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90]" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Relay (Email)</label>
                    <div className="relative">
                       <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="rel@auth.net"
                       />
                       <EnvelopeIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a90]" />
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-[#4a6a90] ml-1">Transmission Data (Review)</label>
                 <div className="relative">
                    <textarea
                       rows={3}
                       value={review}
                       onChange={(e) => setReview(e.target.value)}
                       placeholder="Enter additional experience data..."
                    />
                    <ChatBubbleLeftRightIcon className="absolute right-4 top-4 w-4 h-4 text-[#4a6a90]" />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button
                   type="submit"
                   disabled={loading || rating === 0}
                   className="flex-1 btn-primary !py-4 justify-center group"
                 >
                    <span>{loading ? 'Transmitting...' : 'Commit Feedback'}</span>
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