'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppUploadForm from '@/components/apps/AppUploadForm'
import Navbar from '@/components/layout/Navbar'

export default function AddAppPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                  Add New App
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                  Submit your app details and files for review.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <AppUploadForm />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 