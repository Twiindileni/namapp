'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  description: string
  price_nad: number
  image_url: string | null
  status: string
  created_at: string
}

export default function AdminProductsPage() {
  const { userRole, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price_nad, image_url, status, created_at')
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

  useEffect(() => {
    if (authLoading) return
    if (userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }
    load()
  }, [userRole, authLoading])

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    const { error } = await supabase.from('products').update({ status }).eq('id', id)
    if (error) {
      console.error(error)
      toast.error('Failed to update status')
      return
    }
    toast.success(`Product ${status}`)
    await load()
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
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Manage Products</h1>
              <p className="mt-2 text-sm text-gray-700">Approve or reject submitted products.</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{p.name}</h3>
                    <span className="text-sm font-semibold text-indigo-700">N$ {p.price_nad.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === 'approved' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span>
                    <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => updateStatus(p.id, 'approved')} className="px-3 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700">Approve</button>
                    <button onClick={() => updateStatus(p.id, 'rejected')} className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">Reject</button>
                    {p.status !== 'pending' && (
                      <button onClick={() => updateStatus(p.id, 'pending')} className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300">Mark Pending</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}