'use client'

import { Suspense } from 'react'
import AppDetails from '@/components/apps/AppDetails'

export default async function AppPage({ params }: { params: { id: string } }) {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <AppDetails appId={params.id} />
    </Suspense>
  )
}
