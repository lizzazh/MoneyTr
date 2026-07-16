import { Link } from 'react-router-dom'
import { useTransactions } from '@/features/transactions/useTransactions'
import { calcBalance } from '@/shared/lib/balance'
import { formatCurrency, CONNECTION_TYPE_LABELS } from '@/shared/lib/utils'
import { ArrowRight, UserPlus } from 'lucide-react'
import type { Connection } from '@/shared/types'

// ─── ConnectionCard ───────────────────────────────────────────────────────────

interface ConnectionCardProps {
  connection: Connection
  currentUserId: string
}

export function ConnectionCard({ connection, currentUserId }: ConnectionCardProps) {
  const { transactions, isLoading } = useTransactions(connection.id)

  const isShared = connection.mode === 'shared'
  const isPending = isShared && connection.status === 'pending_invite'


  const partnerId = isShared
    ? (connection.memberIds.find((id) => id !== currentUserId) || 'partner')
    : 'partner'

  const balance = !isLoading && !isPending
    ? calcBalance(transactions, currentUserId, partnerId)
    : null

  const typeIcon = CONNECTION_TYPE_LABELS[connection.type].split(' ')[0]

  return (
    <Link
      to={`/connections/${connection.id}`}
      className="card-hover flex items-center justify-between p-4 bg-beige hover:border-sand border border-cream transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Type Icon */}
        <div className="w-10 h-10 rounded-xl bg-chocolate/10 flex items-center justify-center text-lg flex-shrink-0">
          {typeIcon}
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-chocolate truncate">
            {connection.name}
          </h3>
          <p className="text-xs text-warm-gray capitalize mt-0.5">
            {isShared ? 'Спільний облік' : 'Особистий облік'}
          </p>

          {/* Balance Preview */}
          <div className="mt-1 text-xs">
            {isLoading ? (
              <span className="text-warm-gray/50 animate-pulse">Завантаження...</span>
            ) : isPending ? (
              <span className="text-amber flex items-center gap-1">
                <UserPlus size={12} />
                Очікує партнера (Код: {connection.inviteCode})
              </span>
            ) : balance?.isSettled ? (
              <span className="text-olive font-medium">Баланс: {formatCurrency(0, connection.currency)}</span>
            ) : balance ? (
              balance.debtorId === currentUserId ? (
                <span className="text-rose font-medium">
                  Ви винні: {formatCurrency(balance.amount, connection.currency)}
                </span>
              ) : (
                <span className="text-amber-dark font-medium">
                  Вам винні: {formatCurrency(balance.amount, connection.currency)}
                </span>
              )
            ) : null}
          </div>
        </div>
      </div>

      <ArrowRight size={16} className="text-warm-gray hover:text-chocolate ml-3 flex-shrink-0" />
    </Link>
  )
}
