import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/shared/auth-context'
import { useConnectionById } from '@/features/connections/useConnections'
import { useTransactions } from '@/features/transactions/useTransactions'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { AddTransactionForm } from '@/features/transactions/AddTransactionForm'
import { Layout } from '@/shared/ui/Layout'
import { SkeletonCard, SkeletonRow } from '@/shared/ui/Skeleton'
import { Plus, ArrowLeft } from 'lucide-react'

export function TransactionsPage() {
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

  // Count pending transactions created by partner (which current user must confirm)
  const pendingCountForMe = connection?.mode === 'shared' && partner
    ? transactions.filter((t) => t.status === 'pending' && t.createdBy === partner.id).length
    : 0

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
          <Link to="/" className="btn-secondary gap-1.5 inline-flex">
            <ArrowLeft size={14} /> На головну
          </Link>
        </div>
      </Layout>
    )
  }

  const partnerDisplayName = connection.mode === 'personal'
    ? (connection.virtualPartnerName || 'Партнер')
    : (partner?.displayName || 'Партнер')

  return (
    <Layout pendingCount={pendingCountForMe}>
      <div className="space-y-5 animate-fade-in">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to={`/connections/${connection.id}`}
            className="flex items-center gap-1 text-sm font-medium text-warm-gray hover:text-chocolate transition-colors"
          >
            <ArrowLeft size={14} />
            Назад до зв'язку
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-chocolate">Всі операції</h1>
            <p className="text-sm text-warm-gray">
              {connection.name} ({partnerDisplayName})
            </p>
          </div>
          <button
            onClick={() => setIsAddTxOpen(true)}
            className="btn-primary gap-1.5"
          >
            <Plus size={16} /> Додати
          </button>
        </div>

        {/* Main Table */}
        <TransactionTable
          transactions={transactions}
          connection={connection}
          currentUser={appUser}
          partner={partner}
        />

        {/* Add Transaction Dialog */}
        <AddTransactionForm
          connection={connection}
          currentUser={appUser}
          partner={partner}
          open={isAddTxOpen}
          onClose={() => setIsAddTxOpen(false)}
        />
      </div>
    </Layout>
  )
}
