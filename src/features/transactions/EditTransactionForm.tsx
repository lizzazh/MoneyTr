import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Timestamp } from 'firebase/firestore'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateTransaction } from './useTransactions'
import { useAuth } from '@/shared/auth-context'
import { useOnlineGuard } from '@/shared/hooks/useOnlineGuard'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/shared/ui/Dialog'
import { Save, AlertTriangle } from 'lucide-react'
import type { AppUser, Connection, Transaction } from '@/shared/types'
import { TransactionFormFields, transactionSchema, type TransactionFormData } from './TransactionFormFields'

// ─── Component ────────────────────────────────────────────────────────────────

interface EditTransactionFormProps {
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null // null in personal mode
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function EditTransactionForm({
  connection,
  currentUser,
  partner,
  transaction,
  open,
  onClose,
}: EditTransactionFormProps) {
  const { appUser } = useAuth()
  const { guardOnline } = useOnlineGuard()
  const [isLoading, setIsLoading] = useState(false)

  const isPersonal = connection.mode === 'personal'
  const partnerDisplayName = isPersonal
    ? (connection.virtualPartnerName || 'Партнер')
    : (partner?.displayName || 'Партнер')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      category: 'other',
      method: 'transfer',
      transactionDate: new Date().toISOString().split('T')[0],
      payerKey: 'me',
    },
  })

  // Set default values when transaction changes
  useEffect(() => {
    if (transaction) {
      const payerKey = transaction.payerId === currentUser.id ? 'me' : 'partner'
      reset({
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        method: transaction.method,
        transactionDate: transaction.transactionDate.toDate().toISOString().split('T')[0],
        payerKey,
      })
    }
  }, [transaction, currentUser.id, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: TransactionFormData) => {
    if (!guardOnline()) return
    if (!appUser || !transaction) return

    let payerId = ''
    let beneficiaryId = ''

    if (isPersonal) {
      payerId = data.payerKey === 'me' ? currentUser.id : 'partner'
      beneficiaryId = data.payerKey === 'me' ? 'partner' : currentUser.id
    } else {
      if (!partner) return
      payerId = data.payerKey === 'me' ? currentUser.id : partner.id
      beneficiaryId = data.payerKey === 'me' ? partner.id : currentUser.id
    }

    setIsLoading(true)
    try {
      await updateTransaction({
        connectionId: connection.id,
        transactionId: transaction.id,
        updates: {
          amount: data.amount,
          description: data.description || '',
          category: data.category,
          method: data.method,
          payerId,
          beneficiaryId,
          transactionDate: Timestamp.fromDate(new Date(data.transactionDate)),
        },
        currentTx: transaction,
        updatedBy: appUser.id,
        isPersonal,
      })

      toast.success('Зміни збережено!')
      handleClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка при збереженні змін'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const showWarning = !isPersonal && (transaction?.status === 'confirmed' || transaction?.status === 'rejected')

  if (!transaction) return null

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Редагування операції</DialogTitle>
        <DialogDescription>
          Внесіть необхідні зміни.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody className="space-y-4">
          {showWarning && (
            <div className="bg-amber/10 border border-amber/30 rounded-xl p-3 flex gap-3 text-sm text-amber-dark">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <p>
                Ця операція вже була <b>{transaction.status === 'confirmed' ? 'підтверджена' : 'відхилена'}</b>. 
                Зміна суми, дати або учасників скасує її статус і вона знову потребуватиме підтвердження від партнера.
              </p>
            </div>
          )}

          <TransactionFormFields
            register={register}
            errors={errors}
            currency={connection.currency}
            currentUserDisplayName={currentUser.displayName}
            partnerDisplayName={partnerDisplayName}
          />
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="btn-primary"
          >
            <Save size={16} />
            {isLoading ? 'Збереження...' : 'Зберегти зміни'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
