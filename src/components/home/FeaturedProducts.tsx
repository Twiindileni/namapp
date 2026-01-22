"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
					.limit(6)
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
			<div className="flex justify-center items-center h-32">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
			</div>
		)
	}

	if (!products.length) {
		return <div className="text-gray-600">No featured products yet.</div>
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{products.map((p) => (
				<Link key={p.id} href={`/products`} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
					{p.image_url ? (
						<img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
					) : (
						<div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
					)}
					<div className="p-4">
						<div className="flex justify-between items-start">
							<h3 className="text-base font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
							<span className="text-sm font-semibold text-indigo-700">N$ {p.price_nad.toFixed(2)}</span>
						</div>
						<p className="mt-1 text-sm text-gray-600 line-clamp-2">{p.description}</p>
						<p className="mt-2 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
					</div>
				</Link>
			))}
		</div>
	)
}