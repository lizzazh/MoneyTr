import { formatCurrency } from '@/shared/lib/utils'
import type { AppUser, BalanceResult, Currency, TransactionStats } from '@/shared/types'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ReceiptText,
} from 'lucide-react'

// ─── BalanceCard ──────────────────────────────────────────────────────────────

interface BalanceCardProps {
  balance: BalanceResult
  currency: Currency
  currentUser: AppUser
  partner: AppUser
  stats: TransactionStats
}

export function BalanceCard({
  balance,
  currency,
  currentUser,
  partner,
  stats,
}: BalanceCardProps) {
  const isSettled = balance.isSettled
  const iOwePartner = balance.debtorId === currentUser.id
  const partnerOwesMe = balance.debtorId === partner.id

  return (
    <div className="relative overflow-hidden rounded-3xl bg-chocolate text-milk shadow-card-lg animate-slide-up">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-milk" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-milk" />
      </div>

      <div className="relative p-6 md:p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-milk/60 text-xs font-medium uppercase tracking-wider mb-1">
              Загальний баланс
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-milk/80">
                {currentUser.displayName}
              </span>
              <ArrowRight size={14} className="text-milk/40" />
              <span className="text-sm font-medium text-milk/80">
                {partner.displayName}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${
              isSettled
                ? 'bg-olive text-white'
                : iOwePartner
                  ? 'bg-rose/80 text-white'
                  : 'bg-amber/80 text-chocolate-dark'
            }`}
          >
            {isSettled ? '✓ Розраховано' : iOwePartner ? '↑ Ви винні' : '↓ Вам винні'}
          </div>
        </div>

        {/* Main balance amount */}
        <div className="mb-6">
          {isSettled ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 size={32} className="text-olive-light flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-milk">Баланс закрито</p>
                <p className="text-milk/60 text-sm">Ніхто нікому не винен</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-4xl font-bold text-milk mb-1">
                {formatCurrency(balance.amount, currency)}
              </p>
              <p className="text-milk/70 text-sm">
                {partnerOwesMe ? (
                  <>
                    <span className="font-semibold text-milk/90">{partner.displayName}</span>
                    {' '}винен вам
                  </>
                ) : (
                  <>
                    Ви винні{' '}
                    <span className="font-semibold text-milk/90">{partner.displayName}</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            label="Підтверджено"
            value={formatCurrency(stats.confirmedTotal, currency)}
            icon={TrendingUp}
          />
          <MiniStat
            label="Операцій"
            value={String(stats.confirmedCount)}
            icon={ReceiptText}
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
    <div className="bg-milk/10 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon
          size={12}
          className={warn ? 'text-amber' : 'text-milk/40'}
        />
        <span className="text-milk/50 text-xs leading-tight">{label}</span>
      </div>
      <p className={`font-semibold text-sm leading-tight break-all ${warn ? 'text-amber' : 'text-milk'}`}>
        {value}
      </p>
    </div>
  )
}
