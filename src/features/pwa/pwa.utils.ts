/**
 * PWA utility functions for platform detection and standalone mode checks.
 */

/** Check if app is running in standalone mode (installed PWA). */
export function isStandalone(): boolean {
  // Standard check
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari check
  if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone) return true
  return false
}

/** Check if the device is running iOS or iPadOS. */
export function isIos(): boolean {
  const ua = navigator.userAgent
  // iPad on iOS 13+ reports as Macintosh with touch support
  if (/iPad|iPhone|iPod/.test(ua)) return true
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true
  return false
}

/** Check if the browser is Safari on iOS (not Chrome/Firefox/etc on iOS). */
export function isIosSafari(): boolean {
  if (!isIos()) return false
  const ua = navigator.userAgent
  // All iOS browsers use WebKit, but Chrome/Firefox/Edge add their own tokens
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  return isSafari
}
