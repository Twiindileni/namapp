'use client'

import { useEffect } from 'react'

const CHUNK_RETRY_KEY = 'purpose_chunk_reload_once'

/**
 * After a new deploy, browsers sometimes keep an old HTML shell that references
 * deleted JS chunks → infinite spinner. One hard reload usually fixes it.
 */
export default function BootRecovery() {
  useEffect(() => {
    const tryReload = () => {
      try {
        if (sessionStorage.getItem(CHUNK_RETRY_KEY)) return
        sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
      } catch {
        return
      }
      window.location.reload()
    }

    const onWindowError = (event: ErrorEvent) => {
      const msg = `${event.message || ''} ${(event.error && String(event.error)) || ''}`
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        tryReload()
      }
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const r = event.reason
      const msg = typeof r === 'string' ? r : r?.message || String(r)
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        tryReload()
      }
    }

    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onRejection)

    const clearRetry = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(CHUNK_RETRY_KEY)
      } catch {
        /* ignore */
      }
    }, 120_000)

    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.clearTimeout(clearRetry)
    }
  }, [])

  return null
}
