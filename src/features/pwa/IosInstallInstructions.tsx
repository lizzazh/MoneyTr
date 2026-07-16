import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/shared/ui/Dialog'
import { Share, PlusSquare } from 'lucide-react'

interface IosInstallInstructionsProps {
  open: boolean
  onClose: () => void
}

/**
 * Bottom sheet with step-by-step instructions for installing PWA on iOS Safari.
 * Only shown when the user explicitly clicks the install button — never auto-shown.
 */
export function IosInstallInstructions({ open, onClose }: IosInstallInstructionsProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Встановлення на iPhone</DialogTitle>
        <DialogDescription>
          Додайте DebtTrack на домашній екран для швидкого доступу
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-chocolate/10 flex items-center justify-center text-xs font-bold text-chocolate">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-chocolate">
                Натисніть кнопку «Поділитися»
              </p>
              <p className="text-xs text-warm-gray mt-0.5 flex items-center gap-1">
                <Share size={12} />
                Внизу екрана у Safari
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-chocolate/10 flex items-center justify-center text-xs font-bold text-chocolate">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-chocolate">
                Оберіть «На початковий екран»
              </p>
              <p className="text-xs text-warm-gray mt-0.5 flex items-center gap-1">
                <PlusSquare size={12} />
                Прокрутіть список дій вниз
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-chocolate/10 flex items-center justify-center text-xs font-bold text-chocolate">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-chocolate">
                Натисніть «Додати»
              </p>
              <p className="text-xs text-warm-gray mt-0.5">
                Застосунок з'явиться на домашньому екрані
              </p>
            </div>
          </li>
        </ol>
      </DialogBody>

      <DialogFooter>
        <button onClick={onClose} className="btn-primary w-full">
          Зрозуміло
        </button>
      </DialogFooter>
    </Dialog>
  )
}
