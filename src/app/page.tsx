'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { App } from '@/types/app'
import toast from 'react-hot-toast'
import FeaturedApps from '@/components/home/FeaturedApps'
import FeaturedProducts from '@/components/home/FeaturedProducts'

// Mark the page as dynamic
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Discover Amazing <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#003580] via-[#D21034] to-[#009543] bg-clip-text text-transparent animate-gradient-flow-1">Namibian</span> Technology
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Explore innovative technology solutions, apps, products, and services created by Namibian developers and entrepreneurs. Your one-stop hub for local tech excellence.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/apps"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Browse Apps
                </Link>
                <Link href="/register" className="text-sm font-semibold leading-6 text-gray-900">
                  Register as Developer <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Apps Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-effect rounded-lg p-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Featured Apps
              </span>
            </h2>
            <FeaturedApps />
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-effect rounded-lg p-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Featured Products
              </span>
            </h2>
            <FeaturedProducts />
          </div>
        </div>

        {/* Categories Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Popular Categories
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {['Productivity', 'Entertainment', 'Education', 'Games', 'Social', 'Utilities'].map((category) => (
              <Link
                key={category}
                href={`/apps?category=${category.toLowerCase()}`}
                className="group relative rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <h3 className="relative text-lg font-medium text-gray-900">{category}</h3>
                <p className="relative mt-1 text-sm text-gray-500">Explore {category.toLowerCase()} apps</p>
                <div className="relative mt-4 flex items-center text-sm font-medium text-indigo-600">
                  <span>Browse apps</span>
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
