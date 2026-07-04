import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface LayoutProps {
  children: React.ReactNode
  pendingCount?: number
}

export function Layout({ children, pendingCount = 0 }: LayoutProps) {
  const { appUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { connectionId } = useParams<{ connectionId?: string }>()

  const navLinks = [
    { to: '/', label: 'Баланс', icon: LayoutDashboard },
  ]
  if (connectionId) {
    navLinks.push({ to: `/connections/${connectionId}/transactions`, label: 'Операції', icon: ArrowLeftRight })
  }


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

          {/* Nav links (Desktop) */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  location.pathname === to || location.pathname.startsWith(to) && to !== '/'
                    ? 'bg-chocolate text-milk'
                    : 'text-warm-gray hover:text-chocolate hover:bg-cream'
                )}
              >
                <Icon size={15} />
                <span>{label}</span>
                {label === 'Операції' && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-1.5 py-1.5 sm:px-3 sm:bg-cream rounded-lg outline-none hover:bg-cream transition-colors">
                  <div className="w-7 h-7 sm:w-5 sm:h-5 rounded-full bg-chocolate sm:bg-chocolate/20 flex items-center justify-center text-milk sm:text-chocolate">
                    <User size={14} className="sm:hidden" />
                    <User size={11} className="hidden sm:block" />
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-chocolate">
                    {appUser?.displayName}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="bg-white rounded-2xl shadow-xl border border-cream p-1 min-w-[160px] animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 z-50"
                  sideOffset={4}
                >
                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-rose hover:bg-rose/10 rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <LogOut size={14} /> Вийти
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-24 sm:pb-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-cream py-4 mb-16 sm:mb-0">
        <p className="text-center text-xs text-warm-gray/50">
          DebtTrack © {new Date().getFullYear()}
        </p>
      </footer>

      {/* Bottom Nav (Mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-milk/90 backdrop-blur-md border-t border-cream pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== '/')
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-colors relative',
                  isActive ? 'text-chocolate' : 'text-warm-gray hover:text-chocolate hover:bg-cream/50'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
                {label === 'Операції' && pendingCount > 0 && (
                  <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-amber text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
