import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

/**
 * Handles Service Worker lifecycle events:
 * - Shows an update prompt toast when a new version is available
 * - Shows a one-time offline-ready message
 */
export function PwaUpdatePrompt() {
  const hasShownOfflineReady = useRef(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Check for updates periodically (every 60 minutes)
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  // Update prompt
  useEffect(() => {
    if (!needRefresh) return

    toast('Доступна нова версія застосунку', {
      duration: Infinity,
      action: {
        label: 'Оновити',
        onClick: () => {
          updateServiceWorker(true)
        },
      },
      cancel: {
        label: 'Пізніше',
        onClick: () => {
          setNeedRefresh(false)
        },
      },
    })
  }, [needRefresh, updateServiceWorker, setNeedRefresh])

  // Offline-ready notification (once per session)
  useEffect(() => {
    if (!offlineReady || hasShownOfflineReady.current) return

    // Only show once per session
    const sessionKey = 'pwa-offline-ready-shown'
    if (sessionStorage.getItem(sessionKey)) {
      setOfflineReady(false)
      return
    }

    sessionStorage.setItem(sessionKey, '1')
    hasShownOfflineReady.current = true

    toast.success(
      'Основні екрани доступні без мережі. Для змін потрібне підключення.',
      { duration: 4000 }
    )

    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])

  return null
}
