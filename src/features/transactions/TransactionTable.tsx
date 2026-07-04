import { useState } from 'react'
import { formatCurrency, formatDate, TRANSACTION_CATEGORY_LABELS, cn } from '@/shared/lib/utils'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useTransactionFilter } from './useTransactions'
import {
  Search,
  ArrowUpDown,
  Filter,
  ReceiptText,
} from 'lucide-react'
import type { Transaction, TransactionStatus, AppUser, Connection } from '@/shared/types'

// ─── TransactionTable ─────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: Transaction[]
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null
}

const STATUS_FILTER_OPTIONS: { value: 'all' | TransactionStatus; label: string }[] =
  [
    { value: 'all', label: 'Всі' },
    { value: 'confirmed', label: 'Підтверджені' },
    { value: 'pending', label: 'Очікують' },
    { value: 'rejected', label: 'Відхилені' },
  ]

export function TransactionTable({
  transactions,
  connection,
  currentUser,
  partner,
}: TransactionTableProps) {
  const [rawSearch, setRawSearch] = useState('')
  const debouncedSearch = useDebounce(rawSearch, 250)

  const { filter, setFilter, sortDesc, setSortDesc } =
    useTransactionFilter(transactions)

  const isPersonal = connection.mode === 'personal'
  const partnerName = isPersonal
    ? (connection.virtualPartnerName || 'Партнер')
    : (partner?.displayName || 'Партнер')

  // Build final list with search + filter + sort
  const list = (() => {
    let result = [...transactions]

    if (filter !== 'all') {
      result = result.filter((t) => t.status === filter)
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          TRANSACTION_CATEGORY_LABELS[t.category].toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      const aTime = a.transactionDate?.toMillis() ?? 0
      const bTime = b.transactionDate?.toMillis() ?? 0
      return sortDesc ? bTime - aTime : aTime - bTime
    })

    return result
  })()

  const getPayerName = (tx: Transaction) => {
    if (isPersonal) {
      return tx.payerId === currentUser.id ? currentUser.displayName : partnerName
    }
    return tx.payerId === currentUser.id ? currentUser.displayName : partnerName
  }

  const getBeneficiaryName = (tx: Transaction) => {
    if (isPersonal) {
      return tx.beneficiaryId === currentUser.id ? currentUser.displayName : partnerName
    }
    return tx.beneficiaryId === currentUser.id ? currentUser.displayName : partnerName
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray"
          />
          <input
            type="text"
            placeholder="Пошук за описом або категорією..."
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortDesc((p) => !p)}
          className="btn-ghost gap-1.5 px-3 flex-shrink-0"
          title={sortDesc ? 'Спочатку старіші' : 'Спочатку новіші'}
        >
          <ArrowUpDown size={15} />
          <span className="text-xs hidden sm:inline">
            {sortDesc ? 'Нові ↓' : 'Старі ↓'}
          </span>
        </button>
      </div>

      {/* Status filter tabs (only for shared connection) */}
      {!isPersonal && (
        <div className="flex gap-1 bg-cream rounded-xl p-1 mb-4 overflow-x-auto">
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex-1 min-w-max py-1.5 px-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
                filter === value
                  ? 'bg-beige text-chocolate shadow-sm'
                  : 'text-warm-gray hover:text-chocolate'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Table / Card list */}
      {list.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Операцій не знайдено"
          description={
            debouncedSearch
              ? 'Спробуйте інший пошуковий запит'
              : 'Додайте першу операцію натисканням кнопки'
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-warm-gray">Дата</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-warm-gray">Опис</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-warm-gray">Напрямок</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-warm-gray">Сума</th>
                  {!isPersonal && (
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-warm-gray">Статус</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {list.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-cream/50 hover:bg-cream/30 transition-colors"
                  >
                    <td className="py-3 px-3 text-warm-gray text-xs whitespace-nowrap">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-chocolate truncate max-w-[160px]">
                        {tx.description || '—'}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {TRANSACTION_CATEGORY_LABELS[tx.category]}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-xs text-warm-gray whitespace-nowrap">
                      <span className="font-medium text-chocolate">{getPayerName(tx)}</span>
                      {' → '}
                      <span className="font-medium text-chocolate">{getBeneficiaryName(tx)}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-chocolate whitespace-nowrap">
                      {formatCurrency(tx.amount, connection.currency)}
                    </td>
                    {!isPersonal && (
                      <td className="py-3 px-3">
                        <StatusBadge status={tx.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {list.map((tx) => (
              <div
                key={tx.id}
                className="bg-milk rounded-xl p-4 border border-cream flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="font-medium text-chocolate truncate">
                      {tx.description || TRANSACTION_CATEGORY_LABELS[tx.category]}
                    </p>
                    <span className="font-semibold text-chocolate text-sm flex-shrink-0">
                      {formatCurrency(tx.amount, connection.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isPersonal && <StatusBadge status={tx.status} />}
                    <span className="text-xs text-warm-gray">
                      {formatDate(tx.transactionDate)}
                    </span>
                    <span className="text-xs text-warm-gray">
                      {getPayerName(tx)} → {getBeneficiaryName(tx)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="mt-4 pt-3 border-t border-cream flex items-center justify-between text-xs text-warm-gray">
            <span>
              <Filter size={12} className="inline mr-1" />
              Показано {list.length} з {transactions.length} операцій
            </span>
          </div>
        </>
      )}
    </div>
  )
}
