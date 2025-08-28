'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories')
        const q = query(categoriesRef, orderBy('name', 'asc'))
        const querySnapshot = await getDocs(q)
        const categoriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }))
        setCategories(categoriesList)
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
      <Navbar />
      <main className="flex-grow relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass-effect rounded-lg p-8 sm:p-10 lg:p-12 shadow-xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              App Categories
            </span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length === 0 ? (
              <p className="col-span-full text-center text-gray-600">No categories found.</p>
            ) : (
              categories.map(category => (
                <Link
                  key={category.id}
                  href={`/apps?category=${encodeURIComponent(category.name)}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 gradient-text">
                      {category.name}
                    </h2>
                    <p className="text-gray-600 text-sm">Explore apps in this category</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 