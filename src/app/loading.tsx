'use client'

import React from 'react'
import PageLoader from '@/components/ui/PageLoader'
import { CpuChipIcon } from '@heroicons/react/24/outline'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#020b1a] flex items-center justify-center pointer-events-none">
      <PageLoader 
        icon={<CpuChipIcon className="w-6 h-6" />}
        message="Initializing System..."
      />
    </div>
  )
}
