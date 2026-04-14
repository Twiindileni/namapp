'use client'

import React from 'react'

interface PageLoaderProps {
  icon?: React.ReactNode
  message?: string
  fullScreen?: boolean
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  icon, 
  message = "Initializing Vision...", 
  fullScreen = true 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-[#020b1a] ${fullScreen ? 'min-h-screen' : 'h-full py-12'}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-[#003580] animate-spin"></div>
        
        {/* Central Icon */}
        {icon && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#5a9ef5] animate-pulse">
            {icon}
          </div>
        )}
      </div>
      
      {message && (
        <p className="mt-6 text-xs font-bold tracking-[0.3em] uppercase text-[#4a6a90] animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

export default PageLoader
