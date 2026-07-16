import { motion } from 'framer-motion'
import { formatCurrency } from '@/shared/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { uk } from 'date-fns/locale'
import type { AppUser, BalanceResult, Currency, TransactionStats } from '@/shared/types'
import { UserAvatar } from '@/shared/ui/Avatar'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

// ─── BalanceCard ──────────────────────────────────────────────────────────────

interface BalanceCardProps {
  balance: BalanceResult
  currency: Currency
  currentUser: AppUser
  partner: AppUser
  stats: TransactionStats
  connectionCreatedAt?: Date
  onSettleClick?: () => void
}

export function BalanceCard({
  balance,
  currency,
  currentUser,
  partner,
  stats,
  connectionCreatedAt,
  onSettleClick,
}: BalanceCardProps) {
  const isSettled = balance.isSettled
  const iOwePartner = balance.debtorId === currentUser.id
  const partnerOwesMe = balance.debtorId === partner.id

  const lastActivityText = stats.lastActivity
    ? `Остання операція ${formatDistanceToNow(stats.lastActivity.toDate(), {
        addSuffix: true,
        locale: uk,
      })}`
    : connectionCreatedAt
    ? `Баланс відкритий з ${connectionCreatedAt.toLocaleDateString('uk-UA', { month: 'long', day: 'numeric' })}`
    : 'Немає активності'

  return (
    <div className="rounded-[32px] bg-chocolate text-milk shadow-md p-5 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8">
      {/* Header: Avatars & Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={iOwePartner ? currentUser.displayName : partner.displayName}
            className="w-12 h-12 text-lg"
            color="milk"
          />
          <ArrowRight size={20} className="text-milk/40" />
          <UserAvatar
            name={iOwePartner ? partner.displayName : currentUser.displayName}
            className="w-12 h-12 text-lg"
            color="amber"
          />
        </div>

        {/* Status badge */}
        <div
          className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide ${
            isSettled
              ? 'bg-olive text-white'
              : iOwePartner
                ? 'bg-rose text-white'
                : 'bg-amber text-chocolate-dark'
          }`}
        >
          {isSettled ? '✓ Розраховано' : iOwePartner ? '↑ Ви винні' : '↓ Вам винні'}
        </div>
      </div>

      {/* Main balance amount */}
      <div>
        {isSettled ? (
          <div className="flex items-start gap-4">
            <div className="bg-olive-light/20 p-3 rounded-2xl flex-shrink-0 mt-1">
              <CheckCircle2 size={32} className="text-olive-light" />
            </div>
            <div className="min-w-0">
              <motion.p
                key="settled"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-milk mb-2 break-all"
              >
                {formatCurrency(0, currency)}
              </motion.p>
              <p className="text-milk/70 font-medium text-lg leading-snug">
                Ніхто нікому не винен
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <motion.p
                key={balance.amount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-milk mb-2 break-all"
              >
                {formatCurrency(balance.amount, currency)}
              </motion.p>
              <p className="text-milk/70 font-medium text-lg leading-snug">
                {partnerOwesMe ? (
                  <>
                    <span className="text-milk font-semibold">{partner.displayName}</span> винен вам
                  </>
                ) : (
                  <>
                    Ви винні <span className="text-milk font-semibold">{partner.displayName}</span>
                  </>
                )}
              </p>
            </div>
            {onSettleClick && (
              <button
                onClick={onSettleClick}
                className="btn-secondary w-full sm:w-auto bg-milk/10 text-milk border-none hover:bg-milk/20 flex-shrink-0 py-2.5 transition-colors"
              >
                <CheckCircle2 size={16} /> Погасити
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-6 border-t border-milk/10">
        <p className="text-milk/50 text-sm font-medium">{lastActivityText}</p>
        
        <div className="flex flex-row gap-4 w-full sm:w-auto justify-start sm:justify-end">
          <MiniStat
            label="Підтверджено"
            value={formatCurrency(stats.confirmedTotal, currency)}
            icon={TrendingUp}
          />
          <MiniStat
            label="Очікують"
            value={String(stats.pendingCount)}
            icon={Clock}
            warn={stats.pendingCount > 0}
          />
        </div>
      </div>
    </div>
  )
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon: Icon,
  warn,
}: {
  label: string
  value: string
  icon: typeof TrendingUp
  warn?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 items-start sm:items-end">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={warn ? 'text-amber' : 'text-milk/40'} />
        <span className="text-milk/50 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`font-bold text-sm sm:text-base tracking-wide ${warn ? 'text-amber' : 'text-milk'}`}>
        {value}
      </p>
    </div>
  )
}
