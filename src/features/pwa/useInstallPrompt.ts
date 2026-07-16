import { useState, useEffect, useRef, useCallback } from 'react'
import { isStandalone, isIosSafari } from './pwa.utils'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UseInstallPromptReturn {
  /** True if the native install prompt is available (Chrome/Edge) */
  canInstall: boolean
  /** True if running on iOS Safari (needs manual instructions) */
  isIosSafariBrowser: boolean
  /** True if app is already running in standalone mode */
  isStandaloneMode: boolean
  /** Trigger the native browser install prompt */
  promptInstall: () => Promise<void>
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isStandaloneMode, setIsStandaloneMode] = useState(isStandalone())
  const isIosSafariBrowser = isIosSafari()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    const installedHandler = () => {
      setCanInstall(false)
      setIsStandaloneMode(true)
      deferredPrompt.current = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    // Listen for display-mode changes (e.g., user installs PWA while it's open)
    const mql = window.matchMedia('(display-mode: standalone)')
    const displayHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandaloneMode(true)
        setCanInstall(false)
      }
    }
    mql.addEventListener('change', displayHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      mql.removeEventListener('change', displayHandler)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
      deferredPrompt.current = null
    }
  }, [])

  return { canInstall, isIosSafariBrowser, isStandaloneMode, promptInstall }
}
