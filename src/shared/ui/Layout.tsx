import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/auth-context'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  ArrowLeftRight,
  LogOut,
  Scale,
  User,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Баланс', icon: LayoutDashboard },
  { to: '/transactions', label: 'Операції', icon: ArrowLeftRight },
]

interface LayoutProps {
  children: React.ReactNode
  pendingCount?: number
}

export function Layout({ children, pendingCount = 0 }: LayoutProps) {
  const { appUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth')
      toast.success('До зустрічі!')
    } catch {
      toast.error('Помилка виходу')
    }
  }



  return (
    <div className="min-h-screen bg-milk flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-beige/80 backdrop-blur-md border-b border-cream">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-chocolate flex items-center justify-center transition-transform group-hover:scale-105">
              <Scale size={16} className="text-milk" />
            </div>
            <span className="font-semibold text-chocolate text-sm">DebtTrack</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  location.pathname === to
                    ? 'bg-chocolate text-milk'
                    : 'text-warm-gray hover:text-chocolate hover:bg-cream'
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
                {to === '/transactions' && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cream rounded-lg">
              <div className="w-5 h-5 rounded-full bg-chocolate/20 flex items-center justify-center">
                <User size={11} className="text-chocolate" />
              </div>
              <span className="text-xs font-medium text-chocolate">
                {appUser?.displayName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-ghost p-2"
              title="Вийти"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-cream py-4">
        <p className="text-center text-xs text-warm-gray/50">
          DebtTrack © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
