import { z } from 'zod'
import { Input, Textarea, Select } from '@/shared/ui/FormFields'
import { TRANSACTION_CATEGORY_LABELS, TRANSACTION_METHOD_LABELS } from '@/shared/lib/utils'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

// ─── Schema ───────────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  amount: z.number().positive('Сума має бути більше 0'),
  description: z.string().optional(),
  category: z.enum([
    'food', 'transport', 'utilities', 'entertainment',
    'health', 'shopping', 'other',
  ]),
  method: z.enum(['cash', 'card', 'transfer', 'other']),
  transactionDate: z.string().min(1, 'Оберіть дату'),
  payerKey: z.enum(['me', 'partner']),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

// ─── Component ────────────────────────────────────────────────────────────────

interface TransactionFormFieldsProps {
  register: UseFormRegister<TransactionFormData>
  errors: FieldErrors<TransactionFormData>
  currency: string
  currentUserDisplayName: string
  partnerDisplayName: string
}

export function TransactionFormFields({
  register,
  errors,
  currency,
  currentUserDisplayName,
  partnerDisplayName,
}: TransactionFormFieldsProps) {
  const categoryOptions = Object.entries(TRANSACTION_CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  const methodOptions = Object.entries(TRANSACTION_METHOD_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  return (
    <div className="space-y-4">
      {/* Who paid selector */}
      <div>
        <p className="label-base">Хто платив?</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: 'me', label: `${currentUserDisplayName} (я)` },
              { key: 'partner', label: partnerDisplayName },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="relative cursor-pointer">
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
        label={`Сума (${currency})`}
        type="number"
        step="0.01"
        min="0.01"
        placeholder="1000"
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />

      <Textarea
        label="Опис (необов'язково)"
        placeholder="Наприклад: Продукти з супермаркету"
        rows={2}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    </div>
  )
}
