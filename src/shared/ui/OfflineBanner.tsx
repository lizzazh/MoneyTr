import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus'

/**
 * Sticky banner shown below the header when the device is offline.
 * Non-intrusive amber-toned design matching the app palette.
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="bg-amber/10 border-b border-amber/20 px-4 py-2.5">
      <div className="max-w-3xl mx-auto flex items-center gap-2.5">
        <WifiOff size={16} className="text-amber-dark flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-dark">
            Немає з'єднання з інтернетом
          </p>
          <p className="text-xs text-warm-gray">
            Збережені дані можуть бути неактуальними.
          </p>
        </div>
      </div>
    </div>
  )
}
