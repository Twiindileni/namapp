'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ImageLightbox from '@/components/common/ImageLightbox'
import OrderForm from '@/components/orders/OrderForm'
import ProductRating from './ProductRating'
import RatingForm from './RatingForm'
import { 
  RocketLaunchIcon, 
  ShieldCheckIcon, 
  CreditCardIcon, 
  StarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArchiveBoxIcon,
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price_nad: number
  image_url: string | null
  created_at: string
  status: string
}

export default function ProductDetails({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [ratingKey, setRatingKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price_nad, image_url, created_at, status')
        .eq('id', productId)
        .single()
      if (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load asset')
        setLoading(false)
        return
      }
      setProduct(data as Product)
      setLoading(false)
    }

    load()
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b1a] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#020b1a] flex flex-col pt-32 items-center px-6">
         <ArchiveBoxIcon className="w-20 h-20 text-[#003580] mb-6 opacity-50" />
         <h2 className="text-2xl font-bold text-white mb-4">Asset Signature Not Found</h2>
         <Link href="/products" className="btn-primary">Return to Catalog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020b1a]">
      <Navbar />
      
      <main className="flex-grow py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          
          <div className="mb-10 fade-in-up">
             <Link href="/products" className="inline-flex items-center gap-2 text-[#5a9ef5] hover:text-[#1a72f0] transition-colors text-sm font-bold uppercase tracking-widest">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Showroom
             </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Asset Visualizer */}
            <div className="relative fade-in-up">
               <div className="glass-card !p-8 aspect-square flex items-center justify-center relative overflow-hidden bg-[rgba(0,53,128,0.05)] border-[rgba(0,85,204,0.15)] group">
                  {/* Decorative Radar Overlay */}
                  <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                       style={{ backgroundImage: 'radial-gradient(#0055cc 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
                  <div className="absolute inset-20 rounded-full border border-[rgba(0,85,204,0.2)] animate-[ping_10s_linear_infinite] pointer-events-none" />
                  
                  {product.image_url ? (
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                       <ImageLightbox 
                          src={product.image_url} 
                          alt={product.name} 
                          thumbClassName="w-full flex items-center justify-center" 
                          imgClassName="max-w-full max-h-[400px] object-contain drop-shadow-[0_20px_50px_rgba(26,114,240,0.3)] group-hover:scale-105 transition-transform duration-700" 
                       />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                       <CpuChipIcon className="w-24 h-24 text-[#003580] mb-4 opacity-30" />
                       <span className="text-[10px] uppercase tracking-widest font-bold text-[#4a6a90]">No Static Entry</span>
                    </div>
                  )}
               </div>
               
               {/* Quick Insights */}
               <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Integrity', value: 'Certified', icon: ShieldCheckIcon },
                    { label: 'Uplink', value: 'Direct Hub', icon: GlobeAltIcon },
                    { label: 'Availability', value: 'In-Stock', icon: CircleStackIcon }
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 text-center !bg-[rgba(0,53,128,0.03)] border-[rgba(0,85,204,0.1)]">
                       <stat.icon className="w-5 h-5 text-[#5a9ef5] mx-auto mb-2 opacity-60" />
                       <p className="text-[9px] uppercase tracking-widest text-[#4a6a90] font-bold mb-1">{stat.label}</p>
                       <p className="text-xs text-white font-bold">{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Asset Dossier Content */}
            <div className="space-y-10 fade-in-up fade-in-up-delay-1">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Asset Specification Dossier</span>
                <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {product.name}
                </h1>
                <div className="flex items-center gap-6">
                   <div className="text-[#1a72f0] font-bold text-3xl tracking-tight">
                      <span className="text-sm mr-1 opacity-70">N$</span>
                      {product.price_nad.toLocaleString()}
                   </div>
                   <div className="h-6 w-px bg-[rgba(0,85,204,0.2)]" />
                   <ProductRating productId={product.id} />
                </div>
              </div>

              <div className="glass-card !bg-transparent !p-0 border-none">
                <h3 className="text-xs font-bold text-[#5a9ef5] uppercase tracking-widest mb-4 flex items-center gap-2">
                   <RocketLaunchIcon className="w-4 h-4" />
                   Core Protocol Details
                </h3>
                <p className="text-[#8baed4] leading-relaxed whitespace-pre-wrap text-lg">
                  {product.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[rgba(0,85,204,0.1)]">
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="flex-1 btn-primary !py-4 justify-center"
                >
                  <CreditCardIcon className="w-5 h-5 mr-2" />
                  <span>Execute Order Protocol</span>
                </button>
                
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="btn-outline !py-4 px-8 justify-center group"
                >
                  <StarIcon className="w-5 h-5 mr-2 group-hover:fill-yellow-400 transition-all" />
                  <span>Submit Peer Review</span>
                </button>
              </div>

              <p className="text-[10px] text-[#4a6a90] font-mono uppercase tracking-[0.2em]">
                Registry Entry: {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Enhanced Customer Review Interface */}
          <div className="mt-24 fade-in-up">
            <div className="flex items-center justify-between mb-8 border-b border-[rgba(0,85,204,0.1)] pb-4">
               <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Peer Synchronization</h2>
                  <p className="text-sm text-[#4a6a90] mt-1 uppercase tracking-widest font-bold">Encrypted Feedback Stream</p>
               </div>
               <button onClick={() => setShowRatingForm(true)} className="text-[#5a9ef5] hover:text-[#1a72f0] transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 group">
                  Initialize Feedback Protocol
                  <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
            
            <div className="glass-card !bg-[rgba(0,53,128,0.02)] p-10 border-[rgba(26,114,240,0.1)]">
              <ProductRating 
                key={ratingKey}
                productId={product.id} 
                showReviews={true} 
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {showOrderForm && product && (
        <OrderForm
          productId={product.id}
          productName={product.name}
          productPrice={product.price_nad}
          onClose={() => setShowOrderForm(false)}
        />
      )}
      
      {showRatingForm && product && (
        <RatingForm
          productId={product.id}
          productName={product.name}
          onRatingSubmitted={() => setRatingKey(prev => prev + 1)}
          onClose={() => setShowRatingForm(false)}
        />
      )}
    </div>
  )
}