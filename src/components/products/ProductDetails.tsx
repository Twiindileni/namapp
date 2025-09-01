'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ImageLightbox from '@/components/common/ImageLightbox'
import OrderForm from '@/components/orders/OrderForm'

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

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price_nad, image_url, created_at, status')
        .eq('id', productId)
        .single()
      if (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load product')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">Product not found</div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                {product.image_url ? (
                  <ImageLightbox src={product.image_url} alt={product.name} thumbClassName="w-full" imgClassName="w-full h-80 object-contain bg-gray-100 rounded-md" />
                ) : (
                  <div className="w-full h-80 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <div className="mt-2 text-indigo-700 font-semibold text-xl">N$ {product.price_nad.toFixed(2)}</div>
                <p className="mt-4 text-gray-700 whitespace-pre-wrap">{product.description}</p>
                <p className="mt-4 text-sm text-gray-400">{new Date(product.created_at).toLocaleString()}</p>
                
                <div className="mt-6">
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    Order Now - N$ {product.price_nad.toFixed(2)}
                  </button>
                </div>
              </div>
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
    </div>
  )
}