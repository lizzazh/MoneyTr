import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface UseNetworkStatusReturn {
  /** Current online/offline state — updated immediately */
  isOnline: boolean
}

/**
 * Tracks network status via navigator.onLine + online/offline events.
 *
 * Per user requirement:
 * - `isOnline` updates immediately on network change
 * - Toast notifications are debounced to prevent spam on flaky connections
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasOnlineRef = useRef(navigator.onLine)

  const scheduleToast = useCallback((online: boolean) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = setTimeout(() => {
      // Only show toast if state actually changed from last toast
      if (online && !wasOnlineRef.current) {
        toast.success('З\'єднання відновлено')
        wasOnlineRef.current = true
      } else if (!online && wasOnlineRef.current) {
        // Toast is not needed for going offline — OfflineBanner handles it
        wasOnlineRef.current = false
      }
      toastTimeoutRef.current = null
    }, 1000)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      scheduleToast(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
      scheduleToast(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [scheduleToast])

  return { isOnline }
}
