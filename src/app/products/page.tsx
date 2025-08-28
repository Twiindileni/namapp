'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import ImageLightbox from '@/components/common/ImageLightbox'

interface Product {
  id: string
  name: string
  description: string
  price_nad: number
  image_url: string | null
  created_at: string
  status: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userRole } = useAuth()

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price_nad, image_url, created_at, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      toast.error('Failed to load products')
      setLoading(false)
      return
    }
    setProducts((data || []) as Product[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const canAdd = !!user && (userRole === 'developer' || userRole === 'admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            {canAdd && (
              <Link href="/products/new" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Add Product</Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-gray-600">No products yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {p.image_url ? (
                    <ImageLightbox 
                      src={p.image_url} 
                      alt={p.name}
                      thumbClassName="w-full"
                      imgClassName="w-full h-48 object-contain bg-gray-100"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{p.name}</h3>
                      <span className="text-sm font-semibold text-indigo-700">N$ {p.price_nad.toFixed(2)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{p.description}</p>
                    <p className="mt-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}