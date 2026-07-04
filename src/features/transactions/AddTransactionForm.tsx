import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { addTransaction } from './useTransactions'
import { useAuth } from '@/shared/auth-context'
import { Input, Textarea, Select } from '@/shared/ui/FormFields'
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
import { TRANSACTION_CATEGORY_LABELS, TRANSACTION_METHOD_LABELS } from '@/shared/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  amount: z.number().positive('Сума має бути більше 0'),
  description: z.string().min(1, 'Додайте опис операції'),
  category: z.enum([
    'food', 'transport', 'utilities', 'entertainment',
    'health', 'shopping', 'other',
  ]),
  method: z.enum(['cash', 'card', 'transfer', 'other']),
  transactionDate: z.string().min(1, 'Оберіть дату'),
  payerKey: z.enum(['me', 'partner']),
})

type FormData = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

interface AddTransactionFormProps {
  connection: Connection
  currentUser: AppUser
  partner: AppUser | null // null in personal mode
  open: boolean
  onClose: () => void
}

export function AddTransactionForm({
  connection,
  currentUser,
  partner,
  open,
  onClose,
}: AddTransactionFormProps) {
  const { appUser } = useAuth()
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'other',
      method: 'transfer',
      transactionDate: new Date().toISOString().split('T')[0],
      payerKey: 'me',
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: FormData) => {
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
        description: data.description,
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

  const categoryOptions = Object.entries(TRANSACTION_CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  const methodOptions = Object.entries(TRANSACTION_METHOD_LABELS).map(
    ([value, label]) => ({ value, label })
  )

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
        <DialogBody className="space-y-4">
          {/* Who paid selector */}
          <div>
            <p className="label-base">Хто платив?</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'me', label: `${currentUser.displayName} (я)` },
                  { key: 'partner', label: partnerDisplayName },
                ] as const
              ).map(({ key, label }) => (
                <label
                  key={key}
                  className="relative cursor-pointer"
                >
                  <input
                    type="radio"
                    value={key}
                    className="sr-only peer"
                    {...register('payerKey')}
                  />
                  <div className="peer-checked:border-chocolate peer-checked:bg-chocolate/5 border-2 border-cream rounded-xl p-3 text-center text-sm font-medium text-chocolate transition-all">
                    {label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Input
            label={`Сума (${connection.currency})`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="1000"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          <Textarea
            label="Опис"
            placeholder="Наприклад: Продукти з супермаркету"
            rows={2}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Категорія"
              error={errors.category?.message}
              options={categoryOptions}
              {...register('category')}
            />
            <Select
              label="Спосіб"
              error={errors.method?.message}
              options={methodOptions}
              {...register('method')}
            />
          </div>

          <Input
            label="Дата"
            type="date"
            error={errors.transactionDate?.message}
            {...register('transactionDate')}
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
