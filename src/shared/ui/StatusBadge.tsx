import type { TransactionStatus } from '@/shared/types'
import { TRANSACTION_STATUS_LABELS } from '@/shared/lib/utils'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: TransactionStatus
}

const configs: Record<
  TransactionStatus,
  { className: string; Icon: typeof Clock }
> = {
  pending: { className: 'badge-pending', Icon: Clock },
  confirmed: { className: 'badge-confirmed', Icon: CheckCircle2 },
  rejected: { className: 'badge-rejected', Icon: XCircle },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { className, Icon } = configs[status]
  return (
    <span className={className}>
      <Icon size={12} />
      {TRANSACTION_STATUS_LABELS[status]}
    </span>
  )
}
