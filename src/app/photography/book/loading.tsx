import React from 'react'
import PageLoader from '@/components/ui/PageLoader'
import { CameraIcon } from '@heroicons/react/24/outline'

export default function BookPhotoshootLoading() {
  return (
    <PageLoader 
      icon={<CameraIcon className="w-8 h-8" />}
      message="Initializing Vision..."
    />
  )
}
