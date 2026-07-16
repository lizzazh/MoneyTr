import { useCallback } from 'react'
import { toast } from 'sonner'
import { useNetworkStatus } from './useNetworkStatus'

/**
 * Centralized offline guard for all Firestore write operations.
 *
 * Per user requirement #4: blocks create, edit, delete, restore,
 * confirm/reject, create connection, join and leave — all Firestore writes.
 *
 * Usage:
 *   const { guardOnline } = useOnlineGuard()
 *
 *   const handleSubmit = () => {
 *     if (!guardOnline()) return
 *     // ... proceed with Firestore write
 *   }
 */
export function useOnlineGuard() {
  const { isOnline } = useNetworkStatus()

  const guardOnline = useCallback((): boolean => {
    if (!isOnline) {
      toast.error('Для цієї дії потрібне з\'єднання з інтернетом.')
      return false
    }
    return true
  }, [isOnline])

  return { isOnline, guardOnline }
}
