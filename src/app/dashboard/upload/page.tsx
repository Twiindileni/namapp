import Navbar from '@/components/layout/Navbar'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppUploadForm from '@/components/apps/AppUploadForm'

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Upload New App</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Fill out the form below to upload your app to the NamApps marketplace. Make sure to provide accurate information and high-quality screenshots.
                  </p>
                </div>
              </div>
              <div className="mt-5 md:col-span-2 md:mt-0">
                <div className="shadow sm:overflow-hidden sm:rounded-md">
                  <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <AppUploadForm />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 