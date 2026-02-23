import { motion } from 'framer-motion'
import { LogOut, Zap, LayoutDashboard, Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const NAV_LINKS = [
  { label: 'Expenses', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Groups', icon: Users, to: '/groups' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-heading font-bold text-white tracking-tight hidden sm:block">
              Tellr
            </span>
          </button>

          {/* Nav tabs */}
          {user && (
            <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-1">
              {NAV_LINKS.map(({ label, icon: Icon, to }) => {
                const active = pathname === to || (to === '/groups' && pathname.startsWith('/groups'))
                return (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium font-heading transition-all duration-200 ${
                      active
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden xs:block">{label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* User info + logout */}
          {user && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm text-slate-300 font-medium max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
