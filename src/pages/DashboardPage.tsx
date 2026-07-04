import { useState } from 'react'
import { useAuth } from '@/shared/auth-context'
import { useConnections } from '@/features/connections/useConnections'
import { ConnectionCard } from '@/features/connections/ConnectionCard'
import { CreateConnectionForm } from '@/features/connections/CreateConnectionForm'
import { JoinConnectionForm } from '@/features/connections/JoinConnectionForm'
import { Layout } from '@/shared/ui/Layout'
import { SkeletonRow } from '@/shared/ui/Skeleton'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Plus, Link2, Users, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { appUser } = useAuth()
  const { connections, isLoading, error } = useConnections(appUser?.id)
  const navigate = useNavigate()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)

  const handleCreated = (connectionId: string) => {
    navigate(`/connections/${connectionId}`)
  }

  const handleJoined = (connectionId: string) => {
    navigate(`/connections/${connectionId}`)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-chocolate">Мої зв'язки</h1>
            <p className="text-sm text-warm-gray">
              Керуйте спільними та особистими фінансами з різними людьми
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="btn-secondary gap-1.5 text-xs py-2 px-3 flex-1 sm:flex-initial"
            >
              <Link2 size={14} />
              Приєднатись за кодом
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary gap-1.5 text-xs py-2 px-3 flex-1 sm:flex-initial"
            >
              <Plus size={14} />
              Створити зв'язок
            </button>
          </div>
        </div>

        {/* Connections List */}
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : error ? (
          <div className="card text-center py-8">
            <p className="text-rose font-medium mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary gap-1.5"
            >
              <RefreshCw size={14} /> Оновити сторінку
            </button>
          </div>
        ) : connections.length === 0 ? (
          <div className="max-w-md mx-auto py-10">
            <EmptyState
              icon={Users}
              title="Немає активних зв'язків"
              description="Створіть свій перший зв'язок для особистого чи спільного обліку або приєднайтеся до існуючого."
              action={
                <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="btn-primary w-full"
                  >
                    <Plus size={16} />
                    Створити перший зв'язок
                  </button>
                  <button
                    onClick={() => setIsJoinOpen(true)}
                    className="btn-secondary w-full"
                  >
                    <Link2 size={16} />
                    Приєднатись за кодом
                  </button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                currentUserId={appUser?.id || ''}
              />
            ))}
          </div>
        )}
      </div>

      {/* Forms */}
      <CreateConnectionForm
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      <JoinConnectionForm
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={handleJoined}
      />
    </Layout>
  )
}
