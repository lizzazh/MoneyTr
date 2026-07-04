import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, TRANSACTION_CATEGORY_LABELS, cn } from '@/shared/lib/utils'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useTransactionFilter, softDeleteTransaction, restoreTransaction } from './useTransactions'
import { isToday, isYesterday, format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  Search,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Undo2,
  CreditCard,
  ShoppingCart,
  Coffee,
  Car,
  Zap,
  Ticket,
  HeartPulse,
  Package,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import type { Transaction, AppUser, Connection } from '@/shared/types'
import type { FilterStatus } from './useTransactions'
import { TransactionDetails } from './TransactionDetails'
import { EditTransactionForm } from './EditTransactionForm'

// ─── Constants & Icons ────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Всі' },
  { value: 'confirmed', label: 'Підтверджені' },
  { value: 'pending', label: 'Очікують' },
  { value: 'deleted', label: 'Видалені' },
]

const CATEGORY_ICONS: Record<string, typeof ShoppingCart> = {
  food: Coffee,
  transport: Car,
  utilities: Zap,
  entertainment: Ticket,
  health: HeartPulse,
  shopping: ShoppingCart,
  other: Package,
}

// ─── TransactionTimeline ──────────────────────────────────────────────────────

interface TransactionTimelineProps {
  transactions: Transaction[]
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null
}

export function TransactionTimeline({
  transactions,
  connection,
  currentUser,
  partner,
}: TransactionTimelineProps) {
  const [rawSearch, setRawSearch] = useState('')
  const debouncedSearch = useDebounce(rawSearch, 250)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const { filter, setFilter, sortDesc, setSortDesc } = useTransactionFilter(transactions)

  const isPersonal = connection.mode === 'personal'
  const partnerName = isPersonal
    ? connection.virtualPartnerName || 'Партнер'
    : partner?.displayName || 'Партнер'

  // Filter and sort list
  const list = useMemo(() => {
    let result = [...transactions]

    // 1. Handle deleted vs active
    if (filter === 'deleted') {
      result = result.filter((t) => t.isDeleted)
    } else {
      result = result.filter((t) => !t.isDeleted)
      if (filter !== 'all') {
        result = result.filter((t) => t.status === filter)
      }
    }

    // 2. Handle search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          TRANSACTION_CATEGORY_LABELS[t.category]?.toLowerCase().includes(q)
      )
    }

    // 3. Sort
    result.sort((a, b) => {
      const aTime = a.transactionDate?.toMillis() ?? 0
      const bTime = b.transactionDate?.toMillis() ?? 0
      return sortDesc ? bTime - aTime : aTime - bTime
    })

    return result
  }, [transactions, filter, debouncedSearch, sortDesc])

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    list.forEach((tx) => {
      const date = tx.transactionDate.toDate()
      let key = ''
      if (isToday(date)) key = 'Сьогодні'
      else if (isYesterday(date)) key = 'Вчора'
      else key = format(date, 'dd MMMM', { locale: uk })

      if (!groups[key]) groups[key] = []
      groups[key].push(tx)
    })
    return groups
  }, [list])

  // Handlers
  const handleDelete = async (tx: Transaction) => {
    try {
      await softDeleteTransaction(connection.id, tx.id, currentUser.id)
      toast('Операцію видалено', {
        action: {
          label: 'Скасувати',
          onClick: async () => {
            try {
              await restoreTransaction(connection.id, tx.id, currentUser.id)
              toast.success('Операцію відновлено')
            } catch (err) {
              toast.error('Помилка відновлення')
            }
          },
        },
      })
    } catch (err) {
      toast.error('Не вдалося видалити операцію')
    }
  }

  const handleRestore = async (tx: Transaction) => {
    try {
      await restoreTransaction(connection.id, tx.id, currentUser.id)
      toast.success('Операцію відновлено')
    } catch (err) {
      toast.error('Не вдалося відновити операцію')
    }
  }

  const getDirectionText = (tx: Transaction) => {
    const payerName =
      tx.payerId === currentUser.id ? currentUser.displayName : partnerName
    const beneficiaryName =
      tx.beneficiaryId === currentUser.id ? currentUser.displayName : partnerName
    
    if (tx.payerId === currentUser.id && tx.beneficiaryId === currentUser.id) {
      return 'Особиста витрата'
    }

    return `${payerName} оплатив(ла) за ${beneficiaryName}`
  }

  // --- Rendering empty states ---
  const renderEmptyState = () => {
    if (transactions.length === 0) {
      return (
        <EmptyState
          icon={CreditCard}
          title="Поки що тут порожньо"
          description="Створіть першу операцію між вами, щоб розпочати облік."
        />
      )
    }
    if (filter === 'pending' && list.length === 0) {
      return (
        <EmptyState
          icon={CreditCard}
          title="Усі операції підтверджені"
          description="🎉 У вас немає операцій, які очікують на підтвердження."
        />
      )
    }
    return (
      <EmptyState
        icon={Search}
        title="Нічого не знайдено"
        description="За вашим запитом немає результатів."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              type="text"
              placeholder="Пошук..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="w-full bg-white border-none rounded-2xl pl-9 pr-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-chocolate/20 outline-none transition-all placeholder:text-warm-gray text-chocolate"
            />
          </div>
          <button
            onClick={() => setSortDesc((p) => !p)}
            className="flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm hover:bg-cream transition-colors text-chocolate"
            title={sortDesc ? 'Спочатку старіші' : 'Спочатку новіші'}
          >
            <ArrowUpDown size={18} />
          </button>
        </div>

        {!isPersonal && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm',
                  filter === value
                    ? 'bg-chocolate text-milk'
                    : 'bg-white text-warm-gray hover:text-chocolate hover:bg-cream'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="flex flex-col gap-8">
        {list.length === 0 ? (
          renderEmptyState()
        ) : (
          Object.entries(grouped).map(([dateKey, txs]) => (
            <div key={dateKey} className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-gray px-2">
                {dateKey}
              </h4>
              <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {txs.map((tx) => {
                    const Icon = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.other
                    const iOwe = tx.payerId !== currentUser.id && tx.beneficiaryId === currentUser.id
                    const iPaid = tx.payerId === currentUser.id

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        key={tx.id}
                        className={cn(
                          'group bg-white rounded-[24px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm border border-transparent hover:border-cream transition-all',
                          tx.isDeleted && 'opacity-60 grayscale'
                        )}
                      >
                        {/* Category Icon */}
                        <div className="w-12 h-12 rounded-full bg-cream/50 flex flex-shrink-0 items-center justify-center text-chocolate">
                          <Icon size={20} />
                        </div>

                        <div 
                          className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <p className="font-bold text-chocolate truncate text-base leading-tight mb-1">
                            {tx.description || TRANSACTION_CATEGORY_LABELS[tx.category]}
                          </p>
                          <p className="text-xs text-warm-gray truncate">
                            {getDirectionText(tx)}
                          </p>
                          {(!isPersonal || tx.isDeleted) && (
                            <div className="mt-2 flex">
                              {tx.isDeleted ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-warm-gray/20 text-[10px] font-bold text-warm-gray uppercase tracking-wider">
                                  Видалено
                                </span>
                              ) : (
                                <StatusBadge status={tx.status} />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex flex-col items-end justify-center pl-2 gap-1 flex-shrink-0">
                          <span
                            className={cn(
                              'text-base sm:text-lg font-extrabold tracking-tight',
                              tx.isDeleted
                                ? 'text-warm-gray'
                                : iOwe
                                ? 'text-rose'
                                : iPaid
                                ? 'text-olive'
                                : 'text-chocolate'
                            )}
                          >
                            {iOwe ? '-' : iPaid && tx.beneficiaryId !== tx.payerId ? '+' : ''}
                            {formatCurrency(tx.amount, connection.currency)}
                          </span>

                          {isPersonal && (
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream text-warm-gray transition-colors outline-none focus-visible:ring-2 focus-visible:ring-chocolate/20">
                                  <MoreVertical size={16} />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                  align="end"
                                  className="bg-white rounded-2xl shadow-xl border border-cream p-1 min-w-[160px] animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                                  sideOffset={4}
                                >
                                  {!tx.isDeleted && (
                                    <>
                                      <DropdownMenu.Item 
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-chocolate hover:bg-cream rounded-xl cursor-pointer outline-none transition-colors"
                                        onClick={() => setEditingTx(tx)}
                                      >
                                        <Edit2 size={14} /> Редагувати
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item
                                        onClick={() => handleDelete(tx)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-rose hover:bg-rose/10 rounded-xl cursor-pointer outline-none transition-colors"
                                      >
                                        <Trash2 size={14} /> Видалити
                                      </DropdownMenu.Item>
                                    </>
                                  )}
                                  {tx.isDeleted && (
                                    <DropdownMenu.Item
                                      onClick={() => handleRestore(tx)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-olive hover:bg-olive/10 rounded-xl cursor-pointer outline-none transition-colors"
                                    >
                                      <Undo2 size={14} /> Відновити
                                    </DropdownMenu.Item>
                                  )}
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      <TransactionDetails
        transaction={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        connection={connection}
        currentUser={currentUser}
        partner={partner}
      />

      <EditTransactionForm
        connection={connection}
        currentUser={currentUser}
        partner={partner}
        transaction={editingTx}
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
      />
    </div>
  )
}
