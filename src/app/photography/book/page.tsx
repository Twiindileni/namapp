'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Package {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  is_popular: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

function BookPhotoshootContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const packageParam = searchParams.get('package')

  const [packages, setPackages] = useState<Package[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_type: categoryParam || '',
    event_date: '',
    event_location: '',
    package_id: packageParam || '',
    guest_count: '',
    special_requests: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load packages
        const { data: packagesData } = await supabase
          .from('photography_packages')
          .select('*')
          .eq('is_active', true)
          .order('display_order')

        if (packagesData) setPackages(packagesData)

        // Load categories
        const { data: categoriesData } = await supabase
          .from('photography_categories')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('display_order')

        if (categoriesData) setCategories(categoriesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Get the package name if package is selected
      let preferredPackageName = ''
      if (formData.package_id) {
        const selectedPackage = packages.find(p => p.id === formData.package_id)
        if (selectedPackage) {
          preferredPackageName = selectedPackage.name
        }
      }

      const bookingData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        event_type: formData.event_type,
        event_date: formData.event_date,
        event_location: formData.event_location || null,
        package_id: formData.package_id || null,
        preferred_package_name: preferredPackageName || null,
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
        special_requests: formData.special_requests || null,
        status: 'pending'
      }

      const { error } = await supabase
        .from('photography_bookings')
        .insert([bookingData])

      if (error) throw error

      toast.success('Booking request submitted successfully! We\'ll contact you soon.')

      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        event_type: '',
        event_date: '',
        event_location: '',
        package_id: '',
        guest_count: '',
        special_requests: ''
      })

      // Redirect to confirmation page or home
      setTimeout(() => {
        router.push('/categories?booking=success')
      }, 2000)
    } catch (error) {
      console.error('Error submitting booking:', error)
      toast.error('Failed to submit booking. Please try again.')
    } finally {
      setSubmitting(false)
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Book Your Photoshoot</h1>
            <p className="text-lg text-gray-600">
              Fill out the form below and we'll get back to you within 24 hours to confirm your booking.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+264 81 234 5678"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select event type</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Location
                    </label>
                    <input
                      type="text"
                      value={formData.event_location}
                      onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Windhoek, Namibia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests (Approx)
                    </label>
                    <input
                      type="number"
                      value={formData.guest_count}
                      onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="50"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Package Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Package (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setFormData({ ...formData, package_id: pkg.id })}
                      className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all ${formData.package_id === pkg.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                      {pkg.is_popular && (
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                        <p className="text-2xl font-bold text-indigo-600 mb-1">N${pkg.price}</p>
                        <p className="text-sm text-gray-600">{pkg.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Not sure which package? We can discuss options after you submit.
                </p>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests or Additional Information
                </label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us about any specific requirements, themes, or questions you have..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-gray-600">
            <p>
              <strong>What happens next?</strong> We'll review your request and contact you within 24 hours
              to confirm availability and discuss any details.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function BookPhotoshootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <BookPhotoshootContent />
    </Suspense>
  )
}

