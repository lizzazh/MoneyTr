import { cn } from '@/shared/lib/utils'

interface ProgressBarProps {
  value: number // 0–100
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'olive' | 'chocolate' | 'amber'
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const colorClasses = {
  olive: 'bg-olive',
  chocolate: 'bg-chocolate',
  amber: 'bg-amber',
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
  size = 'md',
  color = 'olive',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-warm-gray">Прогрес</span>
          <span className="text-xs font-semibold text-chocolate">{clamped}%</span>
        </div>
      )}
      <div
        className={cn('w-full bg-cream rounded-full overflow-hidden', sizeClasses[size])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
