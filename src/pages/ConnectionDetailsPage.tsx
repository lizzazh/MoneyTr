import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/shared/auth-context'
import { useConnectionById } from '@/features/connections/useConnections'
import { useTransactions } from '@/features/transactions/useTransactions'
import { calcBalance, calcStats } from '@/shared/lib/balance'
import { BalanceCard } from '@/features/connections/BalanceCard'
import { AddTransactionForm } from '@/features/transactions/AddTransactionForm'
import { PendingTransactions } from '@/features/transactions/PendingTransactions'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { Layout } from '@/shared/ui/Layout'
import type { AppUser } from '@/shared/types'
import {
  Plus,
  ArrowLeft,
  Share2,
  RefreshCw,
} from 'lucide-react'
import { SkeletonCard, SkeletonRow } from '@/shared/ui/Skeleton'
import { toast } from 'sonner'

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

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-chocolate">{connection.name}</h1>
          {isShared && (
            <p className="text-xs text-warm-gray mt-1">
              {isPendingInvite ? (
                <span className="text-amber font-semibold">Очікує підключення партнера</span>
              ) : (
                <span>Спільний баланс з {partnerDisplayName}</span>
              )}
            </p>
          )}
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
            />

            {/* Actions */}
            <button
              onClick={() => setIsAddTxOpen(true)}
              className="btn-primary w-full py-3"
            >
              <Plus size={18} />
              Додати операцію
            </button>

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
              <TransactionTable
                transactions={transactions}
                connection={connection}
                currentUser={appUser}
                partner={partner}
              />
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <AddTransactionForm
        connection={connection}
        currentUser={appUser}
        partner={partner}
        open={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
      />
    </Layout>
  )
}
