'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { uploadToBucket, getPublicUrl } from '@/utils/supabaseStorage'

interface Product {
  id: string
  name: string
  description: string
  price_nad: number
  owner_id: string
  created_at: string
  image_url?: string | null
}

export default function NewProductPage() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [listLoading, setListLoading] = useState(true)

  const loadProducts = async () => {
    setListLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price_nad, owner_id, created_at, image_url')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      toast.error('Failed to load products')
      setListLoading(false)
      return
    }
    setProducts((data || []) as Product[])
    setListLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to add products')
      return
    }

    const priceValue = Number(price)
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Please enter a valid non-negative price')
      return
    }

    try {
      setLoading(true)

      let imageUrl: string | null = null
      if (image) {
        const timestamp = Date.now()
        const path = `products/${user.id}/${timestamp}_${image.name}`
        await uploadToBucket('namapps', path, image, image.type)
        imageUrl = getPublicUrl('namapps', path)
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          price_nad: priceValue,
          owner_id: user.id,
          image_url: imageUrl,
          status: 'pending'
        })
      if (error) throw error
      toast.success('Product submitted for review')
      setName('')
      setDescription('')
      setPrice('')
      setImage(null)
      await loadProducts()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

          {/* Form */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add a Product</h2>
            <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (N$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>

          {/* List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Products</h2>
            {listLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-gray-600">No products yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg shadow p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{p.name}</h3>
                      <span className="text-sm font-semibold text-indigo-700">N$ {p.price_nad.toFixed(2)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{p.description}</p>
                    <p className="mt-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}