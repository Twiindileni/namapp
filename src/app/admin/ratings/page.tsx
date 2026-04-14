'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface Rating {
  id: string
  product_id: string
  product_name: string
  rating: number
  review: string | null
  user_name: string
  user_email: string | null
  created_at: string
  updated_at: string
}

export default function AdminRatingsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const { data, error } = await supabase
          .from('product_ratings')
          .select(`
            id,
            product_id,
            rating,
            review,
            user_name,
            user_email,
            created_at,
            updated_at,
            products!inner(name)
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching ratings:', error)
          toast.error('Failed to load ratings')
          return
        }

        // Transform the data to include product name
        const transformedRatings = (data || []).map((rating: any) => ({
          ...rating,
          product_name: rating.products?.name || 'Unknown Product'
        }))

        setRatings(transformedRatings)
      } catch (error) {
        console.error('Error fetching ratings:', error)
        toast.error('Failed to load ratings')
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }

    fetchRatings()
  }, [userRole, authLoading])

  const deleteRating = async (ratingId: string) => {
    if (!confirm('Are you sure you want to delete this rating?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('product_ratings')
        .delete()
        .eq('id', ratingId)

      if (error) {
        console.error('Error deleting rating:', error)
        toast.error('Failed to delete rating')
        return
      }

      setRatings(prev => prev.filter(rating => rating.id !== ratingId))
      toast.success('Rating deleted successfully')
    } catch (error) {
      console.error('Error deleting rating:', error)
      toast.error('Failed to delete rating')
    }
  }

  const filteredRatings = filter === 'all' 
    ? ratings 
    : ratings.filter(rating => rating.rating.toString() === filter)

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
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

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return 'text-red-600'
      case 2: return 'text-orange-600'
      case 3: return 'text-yellow-600'
      case 4: return 'text-blue-600'
      case 5: return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Rating Management
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage and monitor all product ratings and reviews
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Ratings', count: ratings.length },
                  { key: '5', label: '5 Stars', count: ratings.filter(r => r.rating === 5).length },
                  { key: '4', label: '4 Stars', count: ratings.filter(r => r.rating === 4).length },
                  { key: '3', label: '3 Stars', count: ratings.filter(r => r.rating === 3).length },
                  { key: '2', label: '2 Stars', count: ratings.filter(r => r.rating === 2).length },
                  { key: '1', label: '1 Star', count: ratings.filter(r => r.rating === 1).length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Ratings Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {filteredRatings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No ratings found.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredRatings.map((rating) => (
                  <li key={rating.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {rating.product_name}
                            </p>
                            <p className="text-sm text-gray-900 font-semibold">
                              {rating.user_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {renderStars(rating.rating)}
                              <span className={`text-lg font-semibold ${getRatingColor(rating.rating)}`}>
                                {rating.rating}/5
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {rating.review && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                              "{rating.review}"
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                          <div>
                            {rating.user_email && (
                              <span>Email: {rating.user_email}</span>
                            )}
                          </div>
                          <div>
                            <span>Posted: {new Date(rating.created_at).toLocaleString()}</span>
                            {rating.updated_at !== rating.created_at && (
                              <span className="ml-2">Updated: {new Date(rating.updated_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <div className="ml-4">
                        <button
                          onClick={() => deleteRating(rating.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}