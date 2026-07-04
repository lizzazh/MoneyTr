import { cn } from '@/shared/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center mb-4">
          <Icon size={28} className="text-warm-gray" />
        </div>
      )}
      <h3 className="text-base font-semibold text-chocolate mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-warm-gray max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
