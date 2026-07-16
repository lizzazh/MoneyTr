import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { addTransaction } from './useTransactions'
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
import { PlusCircle } from 'lucide-react'
import type { AppUser, Connection } from '@/shared/types'
import { TransactionFormFields, transactionSchema, type TransactionFormData } from './TransactionFormFields'

// ─── Component ────────────────────────────────────────────────────────────────

interface AddTransactionFormProps {
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null // null in personal mode
  open: boolean
  onClose: () => void
  initialData?: Partial<TransactionFormData>
}

export function AddTransactionForm({
  connection,
  currentUser,
  partner,
  open,
  onClose,
  initialData,
}: AddTransactionFormProps) {
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
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: initialData?.amount || undefined,
      description: initialData?.description || '',
      category: initialData?.category || 'other',
      method: initialData?.method || 'transfer',
      transactionDate: initialData?.transactionDate || new Date().toISOString().split('T')[0],
      payerKey: initialData?.payerKey || 'me',
    },
  })

  // Update form if initialData changes (e.g. user clicks "Погасити борг" then closes, then clicks again)
  useEffect(() => {
    if (open) {
      reset({
        amount: initialData?.amount || undefined,
        description: initialData?.description || '',
        category: initialData?.category || 'other',
        method: initialData?.method || 'transfer',
        transactionDate: initialData?.transactionDate || new Date().toISOString().split('T')[0],
        payerKey: initialData?.payerKey || 'me',
      })
    }
  }, [open, initialData, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: TransactionFormData) => {
    if (!guardOnline()) return
    if (!appUser) return

    // Resolve payerId and beneficiaryId based on 'me'/'partner' selection
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
      await addTransaction({
        connectionId: connection.id,
        amount: data.amount,
        currency: connection.currency,
        description: data.description || '',
        category: data.category,
        method: data.method,
        payerId,
        beneficiaryId,
        createdBy: appUser.id,
        transactionDate: new Date(data.transactionDate),
        isPersonal,
      })

      if (isPersonal) {
        toast.success('Операцію додано!')
      } else {
        toast.success('Операцію додано! Очікує підтвердження.')
      }
      handleClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка при додаванні операції'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Нова операція</DialogTitle>
        <DialogDescription>
          {isPersonal
            ? 'Вкажіть суму та опис. Запис буде додано одразу.'
            : 'Вкажіть хто платив. Партнер підтвердить транзакцію.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody>
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
            disabled={isLoading}
            className="btn-primary"
          >
            <PlusCircle size={16} />
            {isLoading ? 'Збереження...' : 'Додати'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

