import { useState } from 'react'
import { Download } from 'lucide-react'
import { useInstallPrompt } from './useInstallPrompt'
import { IosInstallInstructions } from './IosInstallInstructions'

/**
 * Install PWA button shown in the user dropdown menu.
 *
 * Per user requirement #3:
 * - Visible when: !isStandalone && (canInstall || isIosSafari)
 * - On iOS Safari: opens IosInstallInstructions bottom sheet
 * - On Chrome/Edge: triggers native install prompt
 */
export function InstallPwaButton() {
  const { canInstall, isIosSafariBrowser, isStandaloneMode, promptInstall } = useInstallPrompt()
  const [showIosSheet, setShowIosSheet] = useState(false)

  // Don't render if already installed or not installable
  if (isStandaloneMode) return null
  if (!canInstall && !isIosSafariBrowser) return null

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall()
    } else if (isIosSafariBrowser) {
      setShowIosSheet(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 text-sm text-chocolate hover:bg-cream/60 rounded-xl cursor-pointer outline-none transition-colors w-full"
      >
        <Download size={14} />
        Встановити застосунок
      </button>

      <IosInstallInstructions
        open={showIosSheet}
        onClose={() => setShowIosSheet(false)}
      />
    </>
  )
}
