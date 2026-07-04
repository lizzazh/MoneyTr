import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { createConnection } from './useConnections'
import { useAuth } from '@/shared/auth-context'
import { Input, Select } from '@/shared/ui/FormFields'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/shared/ui/Dialog'
import { PlusCircle } from 'lucide-react'
import type { Currency, ConnectionType, ConnectionMode } from '@/shared/types'
import { CONNECTION_TYPE_LABELS } from '@/shared/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи'),
  type: z.enum([
    'couple', 'friend', 'parents', 'relatives',
    'colleague', 'neighbor', 'other',
  ]),
  mode: z.enum(['personal', 'shared']),
  currency: z.enum(['UAH', 'USD', 'EUR']),
  virtualPartnerName: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateConnectionFormProps {
  open: boolean
  onClose: () => void
  onCreated: (connectionId: string) => void
}

export function CreateConnectionForm({
  open,
  onClose,
  onCreated,
}: CreateConnectionFormProps) {
  const { appUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'couple',
      mode: 'shared',
      currency: 'UAH',
      virtualPartnerName: 'Партнер',
    },
  })

  const selectedMode = watch('mode')

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: FormData) => {
    if (!appUser) return
    setIsLoading(true)
    try {
      const connId = await createConnection({
        name: data.name,
        type: data.type as ConnectionType,
        mode: data.mode as ConnectionMode,
        currency: data.currency as Currency,
        creatorId: appUser.id,
        virtualPartnerName: data.virtualPartnerName,
      })

      if (data.mode === 'shared') {
        toast.success('Зв\'язок створено! Поділіться кодом запрошення.')
      } else {
        toast.success('Особистий зв\'язок створено!')
      }

      onCreated(connId)
      handleClose()
    } catch {
      toast.error('Помилка при створенні зв\'язку')
    } finally {
      setIsLoading(false)
    }
  }

  const typeOptions = Object.entries(CONNECTION_TYPE_LABELS).map(
    ([value, label]) => ({ value, label })
  )

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Створити зв'язок</DialogTitle>
        <DialogDescription>
          Додайте нову людину для спільного чи особистого обліку фінансів.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody className="space-y-4">
          <Input
            label="Назва зв'язку"
            placeholder="Наприклад: Муж, Мама, Аня"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Хто це?"
              error={errors.type?.message}
              options={typeOptions}
              {...register('type')}
            />
            <Select
              label="Валюта"
              error={errors.currency?.message}
              options={[
                { value: 'UAH', label: '₴ UAH' },
                { value: 'USD', label: '$ USD' },
                { value: 'EUR', label: '€ EUR' },
              ]}
              {...register('currency')}
            />
          </div>

          {/* Mode Selector */}
          <div>
            <p className="label-base">Режим обліку</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'personal', label: '👤 Особистий', desc: 'Записую все сам(а)' },
                  { value: 'shared', label: '👥 Спільний', desc: 'Партнер вводить код' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border-2 p-3 transition-all block ${
                    selectedMode === opt.value
                      ? 'border-chocolate bg-chocolate/5'
                      : 'border-cream bg-milk hover:border-sand'
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only"
                    {...register('mode')}
                  />
                  <div className="text-sm font-medium text-chocolate">{opt.label}</div>
                  <div className="text-[10px] text-warm-gray mt-0.5 leading-tight">{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Virtual partner name (only for personal mode) */}
          {selectedMode === 'personal' && (
            <Input
              label="Ім'я іншої людини"
              placeholder="Мама, Аня тощо"
              error={errors.virtualPartnerName?.message}
              {...register('virtualPartnerName')}
            />
          )}
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
            {isLoading ? 'Збереження...' : 'Створити'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
