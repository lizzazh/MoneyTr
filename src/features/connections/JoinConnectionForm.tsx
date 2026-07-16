import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { joinConnection } from './useConnections'
import { useAuth } from '@/shared/auth-context'
import { useOnlineGuard } from '@/shared/hooks/useOnlineGuard'
import { Input } from '@/shared/ui/FormFields'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/shared/ui/Dialog'
import { ArrowRightLeft } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  inviteCode: z
    .string()
    .min(4, 'Введіть код')
    .max(12, 'Код задовгий'),
})

type FormData = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

interface JoinConnectionFormProps {
  open: boolean
  onClose: () => void
  onJoined: (connectionId: string) => void
}

export function JoinConnectionForm({
  open,
  onClose,
  onJoined,
}: JoinConnectionFormProps) {
  const { appUser } = useAuth()
  const { guardOnline } = useOnlineGuard()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: FormData) => {
    if (!guardOnline()) return
    if (!appUser) return
    setIsLoading(true)
    try {
      const result = await joinConnection(data.inviteCode, appUser.id)

      if (!result.success) {
        toast.error(result.error ?? 'Помилка приєднання')
        return
      }

      toast.success('Ви успішно приєдналися до спільного зв\'язку!')
      if (result.connectionId) {
        onJoined(result.connectionId)
      }
      handleClose()
    } catch {
      toast.error('Сталася помилка при з\'єднанні')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Приєднатися за кодом</DialogTitle>
        <DialogDescription>
          Введіть код запрошення, який вам надіслав інший користувач.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody className="space-y-4">
          <Input
            label="Код запрошення"
            placeholder="Наприклад: ABCD-1234"
            error={errors.inviteCode?.message}
            {...register('inviteCode')}
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
            <ArrowRightLeft size={16} />
            {isLoading ? 'З\'єднання...' : 'Приєднатися'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
