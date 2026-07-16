import { formatCurrency, TRANSACTION_CATEGORY_LABELS, TRANSACTION_METHOD_LABELS } from '@/shared/lib/utils'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/shared/ui/Dialog'
import { useTransactionActivities } from './useTransactions'
import { UserAvatar } from '@/shared/ui/Avatar'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import type { Transaction, AppUser, Connection, ActivityAction, TransactionCategory, TransactionMethod } from '@/shared/types'

interface TransactionDetailsProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null
}

const ACTION_LABELS: Record<ActivityAction, string> = {
  created: 'створив(ла) операцію',
  confirmed: 'підтвердив(ла) операцію',
  rejected: 'відхилив(ла) операцію',
  deleted: 'видалив(ла) операцію',
  restored: 'відновив(ла) операцію',
  updated: 'оновив(ла) операцію',
}

const FIELD_LABELS: Record<string, string> = {
  amount: 'Сума',
  description: 'Опис',
  category: 'Категорія',
  method: 'Спосіб оплати',
  payerId: 'Платник',
  beneficiaryId: 'Отримувач',
  transactionDate: 'Дата',
  status: 'Статус',
  isDeleted: 'Видалено',
}

export function TransactionDetails({
  transaction,
  open,
  onClose,
  connection,
  currentUser,
  partner,
}: TransactionDetailsProps) {
  const { activities, isLoading } = useTransactionActivities(
    connection.id,
    transaction?.id || null
  )

  if (!transaction) return null

  const isPersonal = connection.mode === 'personal'
  const partnerName = isPersonal
    ? connection.virtualPartnerName || 'Партнер'
    : partner?.displayName || 'Партнер'

  const getPayerName = () =>
    transaction.payerId === currentUser.id ? currentUser.displayName : partnerName
  const getBeneficiaryName = () =>
    transaction.beneficiaryId === currentUser.id ? currentUser.displayName : partnerName

  const getUserName = (userId: string) => {
    if (userId === currentUser.id) return currentUser.displayName
    if (userId === partner?.id) return partner.displayName
    return 'Партнер'
  }

  const formatDiffValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') return 'не вказано'
    if (key === 'amount') return formatCurrency(value as number, connection.currency)
    if (key === 'category') return TRANSACTION_CATEGORY_LABELS[value as TransactionCategory] || value
    if (key === 'method') return TRANSACTION_METHOD_LABELS[value as TransactionMethod] || value
    if (key === 'payerId' || key === 'beneficiaryId') return getUserName(value as string)
    if (key === 'transactionDate') return format(new Date(value as string), 'd MMM yyyy', { locale: uk })
    if (typeof value === 'boolean') return value ? 'Так' : 'Ні'
    return String(value)
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Деталі операції</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-6">
        {/* Header Summary */}
        <div className="text-center space-y-1 mt-2">
          <p className="text-3xl font-extrabold text-chocolate tracking-tight">
            {formatCurrency(transaction.amount, connection.currency)}
          </p>
          <p className="text-lg font-bold text-chocolate">
            {transaction.description || TRANSACTION_CATEGORY_LABELS[transaction.category]}
          </p>
          <p className="text-sm text-warm-gray">
            {format(transaction.transactionDate.toDate(), 'd MMMM yyyy, HH:mm', { locale: uk })}
          </p>
        </div>

        {/* Direction */}
        <div className="bg-cream/30 rounded-2xl p-4 flex items-center justify-between text-sm gap-2">
          <div className="flex flex-col items-center gap-1 w-[80px] sm:w-[100px] flex-shrink-0">
            <UserAvatar name={getPayerName()} className="w-10 h-10" color="chocolate" />
            <span className="font-medium text-chocolate truncate w-full text-center">{getPayerName()}</span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-warm-gray/30 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-milk px-1 sm:px-2 text-[10px] sm:text-xs text-warm-gray font-medium uppercase tracking-wider whitespace-nowrap">
              Оплатив(ла) за
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 w-[80px] sm:w-[100px] flex-shrink-0">
            <UserAvatar name={getBeneficiaryName()} className="w-10 h-10" color="amber" />
            <span className="font-medium text-chocolate truncate w-full text-center">{getBeneficiaryName()}</span>
          </div>
        </div>

        {/* Activity Log */}
        <div className="pt-4 border-t border-cream">
          <h4 className="text-xs font-bold uppercase tracking-wider text-warm-gray mb-4">
            Історія змін
          </h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-warm-gray">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-warm-gray italic text-center py-4">Немає історії</p>
              ) : (
                <div className="relative pl-3 border-l-2 border-cream space-y-5">
                  {activities.map((act) => (
                    <div key={act.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-chocolate border-2 border-milk" />
                      <p className="text-sm text-chocolate">
                        <span className="font-semibold">{getUserName(act.userId)}</span>{' '}
                        {ACTION_LABELS[act.action as ActivityAction]}
                      </p>
                      <p className="text-xs text-warm-gray mt-0.5">
                        {format(act.createdAt.toDate(), 'd MMM, HH:mm', { locale: uk })}
                      </p>
                      
                      {act.diff && act.diff.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {act.diff.map((d, i) => (
                            <p key={i} className="text-xs text-warm-gray/80 bg-cream/30 p-2 rounded-lg">
                              <span className="font-medium text-chocolate">{FIELD_LABELS[d.field] || d.field}:</span>{' '}
                              <span className="line-through opacity-70">{formatDiffValue(d.field, d.oldValue)}</span>
                              {' → '}
                              <span className="text-chocolate font-medium">{formatDiffValue(d.field, d.newValue)}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </DialogBody>
    </Dialog>
  )
}
