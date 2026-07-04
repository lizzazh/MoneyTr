import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/auth-context'
import { useConnectionById, deleteConnection, leaveConnection } from '@/features/connections/useConnections'
import { useTransactions } from '@/features/transactions/useTransactions'
import { calcBalance, calcStats } from '@/shared/lib/balance'
import { BalanceCard } from '@/features/connections/BalanceCard'
import { AddTransactionForm } from '@/features/transactions/AddTransactionForm'
import { PendingTransactions } from '@/features/transactions/PendingTransactions'
import { TransactionTimeline } from '@/features/transactions/TransactionTimeline'
import { Layout } from '@/shared/ui/Layout'
import type { AppUser } from '@/shared/types'
import {
  Plus,
  ArrowLeft,
  Share2,
  RefreshCw,
  Settings,
  Edit2,
  Trash2,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { SkeletonCard, SkeletonRow } from '@/shared/ui/Skeleton'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@/shared/ui/Dialog'
import { EditConnectionForm } from '@/features/connections/EditConnectionForm'

export function ConnectionDetailsPage() {
  const { connectionId } = useParams<{ connectionId: string }>()
  const { appUser } = useAuth()


  const {
    connection,
    partner,
    isLoading: isConnLoading,
    error: connError,
  } = useConnectionById(connectionId, appUser?.id)

  const {
    transactions,
    isLoading: isTxLoading,
    error: txError,
  } = useTransactions(connectionId || null)

  const [isAddTxOpen, setIsAddTxOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  
  const navigate = useNavigate()

  const isLoading = isConnLoading || isTxLoading
  const error = connError || txError

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !connection || !appUser) {
    return (
      <Layout>
        <div className="card text-center py-8">
          <p className="text-rose font-medium mb-3">
            {error || 'Зв\'язок не знайдено або немає доступу.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/" className="btn-secondary gap-1.5">
              <ArrowLeft size={14} /> На головну
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary gap-1.5"
            >
              <RefreshCw size={14} /> Оновити
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const isShared = connection.mode === 'shared'
  const isPendingInvite = isShared && connection.status === 'pending_invite'

  const partnerId = isShared
    ? (connection.memberIds.find((id) => id !== appUser.id) || 'partner')
    : 'partner'

  const partnerDisplayName = isShared
    ? (partner?.displayName || 'Партнер')
    : (connection.virtualPartnerName || 'Партнер')

  const balance = calcBalance(transactions, appUser.id, partnerId)
  const stats = calcStats(transactions)

  // Count pending transactions created by partner (which current user must confirm)
  const pendingCountForMe = isShared && partner
    ? transactions.filter((t) => t.status === 'pending' && t.createdBy === partner.id).length
    : 0

  const handleCopyInviteCode = () => {
    if (!connection.inviteCode) return
    navigator.clipboard.writeText(connection.inviteCode)
    toast.success('Код запрошення скопійовано!')
  }

  const handleDelete = async () => {
    try {
      await deleteConnection(connection.id)
      toast.success('Зв\'язок видалено')
      navigate('/')
    } catch (err) {
      toast.error('Не вдалося видалити зв\'язок')
    }
  }

  const handleLeave = async () => {
    try {
      await leaveConnection(connection.id, appUser.id, connection.activeMemberIds)
      toast.success('Ви вийшли зі зв\'язку')
      navigate('/')
    } catch (err) {
      toast.error('Не вдалося вийти зі зв\'язку')
    }
  }

  const partnerLeft = isShared && connection.status === 'partner_left'

  return (
    <Layout pendingCount={pendingCountForMe}>
      <div className="space-y-6 animate-fade-in">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-medium text-warm-gray hover:text-chocolate transition-colors"
          >
            <ArrowLeft size={14} />
            Назад до зв'язків
          </Link>
          <span className="text-xs text-warm-gray bg-cream py-1 px-2.5 rounded-full capitalize">
            {isShared ? 'Спільний облік' : 'Особистий облік'}
          </span>
        </div>

        {/* Title and Settings */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-chocolate">{connection.name}</h1>
            {isShared && (
              <p className="text-xs text-warm-gray mt-1">
                {isPendingInvite ? (
                  <span className="text-amber font-semibold">Очікує підключення партнера</span>
                ) : partnerLeft ? (
                  <span className="text-rose font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Учасник вийшов зі зв'язку
                  </span>
                ) : (
                  <span>Спільний баланс з {partnerDisplayName}</span>
                )}
              </p>
            )}
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-cream text-chocolate transition-colors outline-none focus-visible:ring-2 focus-visible:ring-chocolate/20">
                <Settings size={20} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                className="bg-white rounded-2xl shadow-xl border border-cream p-1 min-w-[200px] animate-in fade-in zoom-in-95 z-50"
                sideOffset={8}
              >
                <DropdownMenu.Item 
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-chocolate hover:bg-cream rounded-xl cursor-pointer outline-none transition-colors"
                >
                  <Edit2 size={16} /> {isShared ? 'Редагувати назву' : 'Редагувати зв\'язок'}
                </DropdownMenu.Item>
                
                {isShared ? (
                  <DropdownMenu.Item 
                    onClick={() => setIsLeaveConfirmOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-rose hover:bg-rose/10 rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <LogOut size={16} /> Вийти зі зв'язку
                  </DropdownMenu.Item>
                ) : (
                  <DropdownMenu.Item 
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-rose hover:bg-rose/10 rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <Trash2 size={16} /> Видалити зв'язок
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Shared Connection: Pending Invite View */}
        {isPendingInvite ? (
          <div className="card border-2 border-dashed border-cream text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center mx-auto text-amber-dark">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-chocolate">Запросіть партнера</h3>
              <p className="text-xs text-warm-gray mt-1 max-w-sm mx-auto">
                Партнер має зареєструватись у DebtTrack та ввести цей код у розділі
                "Приєднатись за кодом":
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <div className="bg-milk font-mono font-bold text-lg border border-cream rounded-xl py-2 px-4 select-all flex-1 tracking-wider text-chocolate">
                {connection.inviteCode}
              </div>
              <button
                onClick={handleCopyInviteCode}
                className="btn-secondary py-2.5 px-3"
                title="Копіювати код"
              >
                Копіювати
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <BalanceCard
              balance={balance}
              currency={connection.currency}
              currentUser={appUser}
              partner={partner || ({ id: 'partner', displayName: partnerDisplayName } as AppUser)}
              stats={stats}
              connectionCreatedAt={connection.createdAt?.toDate()}
            />

            {/* Desktop Actions */}
            <div className="hidden sm:block">
              <button
                onClick={() => setIsAddTxOpen(true)}
                className="btn-primary w-full py-3"
              >
                <Plus size={18} />
                Додати операцію
              </button>
            </div>

            {/* Mobile FAB */}
            <div className="sm:hidden fixed bottom-20 right-6 mb-safe z-50">
              <button
                onClick={() => setIsAddTxOpen(true)}
                className="w-14 h-14 bg-chocolate text-milk rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                title="Додати операцію"
              >
                <Plus size={28} />
              </button>
            </div>

            {/* Pending Approvals (Shared only) */}
            {isShared && partner && (
              <PendingTransactions
                transactions={transactions}
                connection={connection}
                currentUser={appUser}
                partner={partner}
              />
            )}

            {/* Transactions History Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Історія операцій
                </h3>
                <Link
                  to={`/connections/${connection.id}/transactions`}
                  className="text-xs font-semibold text-chocolate hover:underline"
                >
                  Повна історія
                </Link>
              </div>
              <TransactionTimeline
                transactions={transactions.slice(0, 5)}
                connection={connection}
                currentUser={appUser}
                partner={partner}
              />
            </div>
          </>
        )}
      </div>

      <AddTransactionForm
        connection={connection}
        currentUser={appUser}
        partner={partner}
        open={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
      />

      <EditConnectionForm
        connection={connection}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Delete Personal Connection Confirm */}
      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogHeader>
          <DialogTitle><span className="text-rose">Видалити зв'язок?</span></DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-warm-gray">
            Ви впевнені? Усі операції цього зв'язку будуть видалені назавжди.
          </p>
        </DialogBody>
        <DialogFooter className="flex gap-2">
          <button onClick={() => setIsDeleteConfirmOpen(false)} className="btn-secondary flex-1">
            Скасувати
          </button>
          <button onClick={handleDelete} className="bg-rose text-white rounded-2xl py-3 px-4 font-bold flex-1 hover:bg-rose/90 transition-colors">
            Видалити
          </button>
        </DialogFooter>
      </Dialog>

      {/* Leave Shared Connection Confirm */}
      <Dialog open={isLeaveConfirmOpen} onClose={() => setIsLeaveConfirmOpen(false)}>
        <DialogHeader>
          <DialogTitle><span className="text-rose">Вийти зі зв'язку?</span></DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-warm-gray">
            Ви більше не зможете переглядати цей облік та додавати операції. У партнера він залишиться.
          </p>
        </DialogBody>
        <DialogFooter className="flex gap-2">
          <button onClick={() => setIsLeaveConfirmOpen(false)} className="btn-secondary flex-1">
            Скасувати
          </button>
          <button onClick={handleLeave} className="bg-rose text-white rounded-2xl py-3 px-4 font-bold flex-1 hover:bg-rose/90 transition-colors">
            Вийти
          </button>
        </DialogFooter>
      </Dialog>
    </Layout>
  )
}
