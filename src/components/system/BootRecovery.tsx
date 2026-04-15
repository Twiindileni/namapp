'use client'

import { useEffect } from 'react'

const RELOAD_FLAG = 'pt_chunk_reload'

/**
 * Catches ChunkLoadError (stale HTML referencing old JS after a Vercel deploy)
 * and performs a single hard reload to pull fresh assets.
 * The session-storage flag prevents an infinite reload loop.
 */
export default function BootRecovery() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event?.message ?? ''
      const isChunkError =
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('error loading dynamically imported module')

      if (!isChunkError) return

      // Only attempt one automatic reload per session
      if (sessionStorage.getItem(RELOAD_FLAG)) return
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.reload()
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event?.reason ?? '')
      const isChunkError =
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('error loading dynamically imported module')

      if (!isChunkError) return
      if (sessionStorage.getItem(RELOAD_FLAG)) return
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.reload()
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Clear the flag on a successful page load so future deploys
    // can trigger another recovery if needed
    sessionStorage.removeItem(RELOAD_FLAG)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
