import { useState } from 'react'
import { toast } from 'sonner'
import { confirmTransaction, rejectTransaction } from './useTransactions'
import { useAuth } from '@/shared/auth-context'
import { formatCurrency, formatDate, TRANSACTION_CATEGORY_LABELS } from '@/shared/lib/utils'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/shared/ui/Dialog'
import { CheckCircle2, XCircle, Clock, AlignLeft } from 'lucide-react'
import type { Transaction, AppUser, Connection } from '@/shared/types'

// ─── Confirm Action Dialog ────────────────────────────────────────────────────

interface ConfirmDialogProps {
  transaction: Transaction | null
  action: 'confirm' | 'reject' | null
  onClose: () => void
  onConfirm: () => Promise<void>
  connection: Connection
}

function ConfirmActionDialog({
  transaction,
  action,
  onClose,
  onConfirm,
  connection,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={!!transaction && !!action} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          {action === 'confirm' ? '✓ Підтвердити операцію' : '✗ Відхилити операцію'}
        </DialogTitle>
        <DialogDescription>
          {action === 'confirm'
            ? 'Після підтвердження операція буде зарахована у загальний баланс.'
            : 'Операція буде відхилена і не вплине на баланс.'}
        </DialogDescription>
      </DialogHeader>

      {transaction && (
        <DialogBody>
          <div className="bg-milk rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-gray">Сума</span>
              <span className="font-semibold text-chocolate">
                {formatCurrency(transaction.amount, connection.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray">Дата</span>
              <span className="text-chocolate">{formatDate(transaction.transactionDate)}</span>
            </div>
            {transaction.description && (
              <div className="flex justify-between gap-4">
                <span className="text-warm-gray">Опис</span>
                <span className="text-chocolate text-right line-clamp-2">
                  {transaction.description}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-warm-gray">Категорія</span>
              <span className="text-chocolate">
                {TRANSACTION_CATEGORY_LABELS[transaction.category]}
              </span>
            </div>
          </div>
        </DialogBody>
      )}

      <DialogFooter>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={isLoading}
        >
          Скасувати
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={action === 'confirm' ? 'btn-success' : 'btn-danger'}
        >
          {action === 'confirm' ? (
            <><CheckCircle2 size={16} />{isLoading ? '...' : 'Підтвердити'}</>
          ) : (
            <><XCircle size={16} />{isLoading ? '...' : 'Відхилити'}</>
          )}
        </button>
      </DialogFooter>
    </Dialog>
  )
}

// ─── PendingTransactions ──────────────────────────────────────────────────────

interface PendingTransactionsProps {
  transactions: Transaction[]
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null
}

export function PendingTransactions({
  transactions,
  connection,
  currentUser,
  partner,
}: PendingTransactionsProps) {
  const { appUser } = useAuth()
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [action, setAction] = useState<'confirm' | 'reject' | null>(null)

  // Only relevant for shared connection
  if (connection.mode !== 'shared') return null

  // Only show pending transactions NOT created by current user
  const pending = transactions.filter(
    (t) => t.status === 'pending' && t.createdBy !== appUser?.id
  )

  const openDialog = (tx: Transaction, act: 'confirm' | 'reject') => {
    setSelected(tx)
    setAction(act)
  }

  const closeDialog = () => {
    setSelected(null)
    setAction(null)
  }

  const handleAction = async () => {
    if (!selected || !action || !appUser) return

    if (action === 'confirm') {
      await confirmTransaction(connection.id, selected.id, appUser.id)
      toast.success('Операцію підтверджено!')
    } else {
      await rejectTransaction(connection.id, selected.id)
      toast.success('Операцію відхилено')
    }
  }

  const getPayerName = (tx: Transaction) =>
    tx.payerId === currentUser.id
      ? currentUser.displayName
      : (partner?.displayName || 'Партнер')

  if (pending.length === 0) return null

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber/15 flex items-center justify-center">
              <Clock size={16} className="text-amber-dark" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-chocolate">
                Очікують підтвердження
              </h3>
              <p className="text-xs text-warm-gray">{pending.length} операція(й)</p>
            </div>
          </div>
          <span className="w-5 h-5 rounded-full bg-amber text-white text-xs font-bold flex items-center justify-center">
            {pending.length}
          </span>
        </div>

        <div className="space-y-3">
          {pending.map((tx) => (
            <div
              key={tx.id}
              className="flex items-start gap-3 bg-milk rounded-xl p-4 border border-cream"
            >
              <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={14} className="text-amber-dark" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-chocolate">
                    {formatCurrency(tx.amount, connection.currency)}
                  </span>
                  <span className="text-xs text-warm-gray flex-shrink-0">
                    {formatDate(tx.transactionDate)}
                  </span>
                </div>
                {tx.description && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlignLeft size={11} className="text-warm-gray flex-shrink-0" />
                    <p className="text-xs text-warm-gray truncate">{tx.description}</p>
                  </div>
                )}
                <p className="text-xs text-warm-gray/60 mt-1">
                  Платив: <span className="font-medium">{getPayerName(tx)}</span>
                  {' · '}{TRANSACTION_CATEGORY_LABELS[tx.category]}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openDialog(tx, 'reject')}
                  className="w-8 h-8 rounded-lg bg-rose/10 hover:bg-rose/20 text-rose flex items-center justify-center transition-colors"
                  title="Відхилити"
                >
                  <XCircle size={16} />
                </button>
                <button
                  onClick={() => openDialog(tx, 'confirm')}
                  className="w-8 h-8 rounded-lg bg-olive/10 hover:bg-olive/20 text-olive flex items-center justify-center transition-colors"
                  title="Підтвердити"
                >
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmActionDialog
        transaction={selected}
        action={action}
        onClose={closeDialog}
        onConfirm={handleAction}
        connection={connection}
      />
    </>
  )
}
