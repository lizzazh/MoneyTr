import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@/shared/ui/Dialog'
import { updateConnection } from './useConnections'
import { toast } from 'sonner'
import type { Connection } from '@/shared/types'

const schema = z.object({
  name: z.string().min(1, 'Введіть назву'),
  virtualPartnerName: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EditConnectionFormProps {
  connection: Connection
  open: boolean
  onClose: () => void
}

export function EditConnectionForm({ connection, open, onClose }: EditConnectionFormProps) {
  const isPersonal = connection.mode === 'personal'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: connection.name,
      virtualPartnerName: connection.virtualPartnerName || '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await updateConnection(connection.id, {
        name: data.name,
        virtualPartnerName: isPersonal ? data.virtualPartnerName || 'Партнер' : undefined,
      })
      toast.success('Налаштування збережено')
      onClose()
    } catch (err) {
      toast.error('Не вдалося зберегти налаштування')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Налаштування обліку</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <DialogBody>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-chocolate">Назва обліку</label>
              <input
                {...register('name')}
                className="w-full bg-cream border-none rounded-xl px-4 py-3 text-chocolate focus:ring-2 focus:ring-chocolate/20 outline-none transition-all"
                placeholder="Напр. Спільні витрати"
              />
              {errors.name && <p className="text-rose text-xs">{errors.name.message}</p>}
            </div>

            {isPersonal && (
              <div className="space-y-2 mt-4">
                <label className="text-sm font-semibold text-chocolate">Ім'я партнера</label>
                <input
                  {...register('virtualPartnerName')}
                  className="w-full bg-cream border-none rounded-xl px-4 py-3 text-chocolate focus:ring-2 focus:ring-chocolate/20 outline-none transition-all"
                  placeholder="Введіть ім'я віртуального партнера"
                />
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Збереження...' : 'Зберегти'}
            </button>
          </DialogFooter>
        </form>
    </Dialog>
  )
}
