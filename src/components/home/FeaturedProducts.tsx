'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { CubeIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  description: string
  price_nad: number
  image_url: string | null
  created_at: string
  status: string
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price_nad, image_url, created_at, status')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3)
        if (error) {
          console.error('Error fetching featured products:', error)
          setProducts([])
          return
        }
        setProducts((data || []) as Product[])
      } catch (error: any) {
        console.error('Error loading featured products:', error.message)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(9, 24, 48, 0.6)',
              border: '1px solid rgba(0, 71, 168, 0.15)',
            }}
          >
            <div className="h-40 shimmer" />
            <div className="p-4 space-y-2">
              <div className="h-4 rounded shimmer" style={{ width: '70%', background: 'rgba(0, 85, 204, 0.1)' }} />
              <div className="h-3 rounded shimmer" style={{ width: '90%', background: 'rgba(0, 85, 204, 0.05)' }} />
              <div className="h-5 rounded shimmer w-20 mt-4" style={{ background: 'rgba(0, 85, 204, 0.1)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div
        className="text-center py-12 rounded-2xl"
        style={{
          background: 'rgba(9, 24, 48, 0.4)',
          border: '1px dashed rgba(0, 53, 128, 0.3)',
        }}
      >
        <div className="flex justify-center mb-4">
          <CubeIcon className="w-12 h-12 text-[#4a6a90]/40" />
        </div>
        <p className="text-sm" style={{ color: '#4a6a90' }}>No featured products yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/products`}
          className="group rounded-2xl overflow-hidden glass-card transition-all duration-300"
          style={{
            background: 'rgba(9, 24, 48, 0.7)',
            border: '1px solid rgba(0, 71, 168, 0.15)',
          }}
        >
          <div className="relative h-44 overflow-hidden">
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-2"
                style={{ background: 'rgba(0, 53, 128, 0.12)' }}
              >
                <CubeIcon className="w-10 h-10 text-[#5a9ef5]/50" />
                <span className="text-xs" style={{ color: '#4a6a90' }}>No image preview</span>
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(2,11,26,0.6) 0%, transparent 60%)',
              }}
            />
            <div className="absolute bottom-3 right-3 text-right">
              <span
                className="text-sm font-bold px-3 py-1 rounded-lg backdrop-blur-md"
                style={{
                  background: 'rgba(0, 53, 128, 0.7)',
                  border: '1px solid rgba(0, 85, 204, 0.4)',
                  color: '#fff',
                }}
              >
                N$ {p.price_nad.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-[#5a9ef5] transition-colors">
              {p.name}
            </h3>
            <p className="mt-1 text-sm line-clamp-2 leading-relaxed" style={{ color: '#4a6a90' }}>
              {p.description}
            </p>
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-[rgba(0,53,128,0.15)]">
              <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#4a6a90' }}>
                {new Date(p.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs font-semibold text-[#5a9ef5] flex items-center gap-1">
                 Details <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}