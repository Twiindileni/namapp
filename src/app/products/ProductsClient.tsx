'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import OrderForm from '@/components/orders/OrderForm'
import ProductRating from '@/components/products/ProductRating'
import { 
  PlusIcon, 
  ShoppingBagIcon, 
  ArrowRightIcon, 
  CpuChipIcon, 
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  description: string
  price_nad: number
  image_url: string | null
  created_at: string
  status: string
}

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { user, userRole } = useAuth()

  const load = async () => {
    setLoading(true)
    console.log('--- PRODUCT SYNC INITIATED ---')
    
    // Safety timeout: 8 seconds
    const timeout = setTimeout(() => {
      setLoading(false)
      console.warn('Sync Timeout: Forcing loading state to terminal.')
    }, 8000)

    try {
      // Fetch all products first to diagnose status issues
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price_nad, image_url, created_at, status')
        .order('created_at', { ascending: false })

      clearTimeout(timeout)

      if (error) {
        console.error('DATABASE_ERROR:', error)
        toast.error('Sync failure: Remote registry unreachable.')
        setLoading(false)
        return
      }

      console.log(`Found ${data?.length || 0} total product signatures.`)
      
      // Filter for approved products
      const approved = (data || []).filter(p => p.status === 'approved')
      console.log(`${approved.length} signatures verified as APPROVED.`)

      setProducts(approved as Product[])
    } catch (err) {
      console.error('UNEXPECTED_ENGINE_FAILURE:', err)
      clearTimeout(timeout)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const canAdd = !!user && (userRole === 'developer' || userRole === 'admin')

  const handleOrderClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProduct(product)
    setShowOrderForm(true)
  }

  // Get dynamic badges based on product characteristics
  const getProductBadge = (product: Product) => {
    const isNew = new Date().getTime() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    if (isNew) return { text: 'New Release', icon: SparklesIcon, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' }
    if (product.price_nad > 5000) return { text: 'Enterprise', icon: ShieldCheckIcon, color: 'text-[#5a9ef5] border-[#1a72f0]/20 bg-[#1a72f0]/10' }
    return { text: 'Certified', icon: ShieldCheckIcon, color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' }
  }

  return (
    <div className="min-h-screen bg-[#020b1a] flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 fade-in-up">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a9ef5]">Equipment Catalog</span>
              <h1 className="hero-title mt-4 !text-4xl md:!text-6xl">Digital <span className="gradient-text">Showroom</span></h1>
              <p className="mt-6 text-[#8baed4] text-lg leading-relaxed">
                Explore our curated selection of high-performance hardware and enterprise-grade software solutions, engineered for the Purpose ecosystem.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#1a72f0] animate-spin"></div>
                <p className="text-[#4a6a90] font-mono text-[10px] uppercase tracking-[0.2em]">Synchronizing Asset Database...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card p-20 text-center max-w-2xl mx-auto border-dashed border-[#0055cc]/30">
               <ShoppingBagIcon className="w-16 h-16 text-[#003580] mx-auto mb-6 opacity-50" />
               <h3 className="text-xl font-bold text-white mb-2">Inventory Empty</h3>
               <p className="text-[#4a6a90] mb-8 leading-relaxed">No approved hardware or software protocols found in the registry.</p>
               <button onClick={load} className="btn-outline !py-2 !text-[10px]">Retry Sync</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((p, idx) => {
                const badge = getProductBadge(p);
                return (
                  <div 
                    key={p.id} 
                    className="glass-card group flex flex-col hover:border-[#1a72f0]/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(26,114,240,0.1)] fade-in-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <Link href={`/products/${p.id}`} className="block relative aspect-[4/3] overflow-hidden rounded-t-xl bg-[#010610]">
                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#4a6a90] border-b border-[rgba(0,85,204,0.1)]">
                          <CpuChipIcon className="w-12 h-12 mb-2 opacity-20" />
                          <span className="text-[10px] uppercase tracking-widest font-bold">No Visual Entry</span>
                        </div>
                      )}
                      
                      {/* Price Badge Over Image */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="glass-effect !bg-[#020b1a]/80 py-1.5 px-3 rounded-full border border-[rgba(0,85,204,0.3)] shadow-lg">
                           <span className="text-[#5a9ef5] font-bold text-sm">N$ {p.price_nad.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020b1a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                         <span className="text-white text-xs font-bold flex items-center gap-2">
                           View Specification Dossier <ArrowRightIcon className="w-3 h-3" />
                         </span>
                      </div>
                    </Link>

                    <div className="p-8 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-bold uppercase tracking-widest ${badge.color}`}>
                          <badge.icon className="w-3 h-3" />
                          {badge.text}
                        </div>
                      </div>

                      <Link href={`/products/${p.id}`} className="block">
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#5a9ef5] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {p.name}
                        </h3>
                      </Link>

                      <p className="text-[#8baed4] text-sm line-clamp-2 leading-relaxed mb-6 flex-grow">
                        {p.description}
                      </p>

                      <div className="mb-6 pt-4 border-t border-[rgba(0,85,204,0.1)]">
                        <ProductRating productId={p.id} compact={true} />
                      </div>

                      <div className="flex gap-4">
                        <Link
                          href={`/products/${p.id}`}
                          className="flex-1 btn-outline !py-2.5 !text-[11px] justify-center"
                        >
                          Specs
                        </Link>
                        <button
                          onClick={(e) => handleOrderClick(e, p)}
                          className="flex-1 btn-primary !py-2.5 !text-[11px] justify-center"
                        >
                          Order Protocol
                        </button>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2 text-[9px] text-[#4a6a90] font-mono uppercase tracking-[0.2em]">
                        <ClockIcon className="w-3 h-3" />
                        Added: {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showOrderForm && selectedProduct && (
        <OrderForm
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          productPrice={selectedProduct.price_nad}
          onClose={() => {
            setShowOrderForm(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
