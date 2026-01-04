import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', icon: HomeIcon, label: 'nav.home' },
  { path: '/coach/chat', icon: ChatIcon, label: 'nav.chat', highlight: true },
  { path: '/sessions', icon: SessionIcon, label: 'nav.sessions' },
  { path: '/stats', icon: StatsIcon, label: 'nav.stats' },
  { path: '/my-bag', icon: BagIcon, label: 'nav.myBag' },
  { path: '/courses', icon: CourseIcon, label: 'nav.courses' },
  { path: '/connectors', icon: ConnectorIcon, label: 'nav.connectors' },
  { path: '/coach', icon: CoachIcon, label: 'nav.coach' },
  { path: '/training', icon: TrainingIcon, label: 'nav.training' },
  { path: '/swing-lab', icon: SwingIcon, label: 'nav.swingLab' },
  { path: '/calendar', icon: CalendarIcon, label: 'nav.calendar' },
  { path: '/friends', icon: FriendsIcon, label: 'nav.friends' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar, language, setLanguage } = useSettingsStore()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-obsidian/60 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 z-50',
        sidebarCollapsed ? 'w-[72px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-lg bg-surface/80 flex items-center justify-center relative overflow-hidden">
            {/* Simplified target */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border border-white/10" />
              <div className="absolute w-3 h-3 rounded-full border border-white/8" />
            </div>
            <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan shadow-glow" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-display font-bold text-base text-ice-white/90">
              Strike<span className="text-cyan">Lab</span>
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group',
                isActive
                  ? 'bg-cyan/8 text-cyan'
                  : item.highlight
                    ? 'text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/5'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/3'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan rounded-r" />
                )}
                <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive && 'drop-shadow-sm')} />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-[13px] font-medium">{t(item.label)}</span>
                    {item.highlight && (
                      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Settings */}
      <div className="border-t border-white/5 p-3 space-y-3">
        {/* Language Toggle */}
        <div className={cn('flex', sidebarCollapsed ? 'justify-center' : 'justify-start')}>
          <div className="inline-flex rounded-md border border-white/5 bg-white/3 p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded transition-all',
                language === 'en' ? 'bg-cyan/90 text-obsidian' : 'text-white/40 hover:text-white/60'
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('no')}
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded transition-all',
                language === 'no' ? 'bg-cyan/90 text-obsidian' : 'text-white/40 hover:text-white/60'
              )}
            >
              NO
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
            <NavLink
              to="/settings"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan/20 to-emerald-500/20 border border-white/10 flex items-center justify-center hover:border-cyan/30 transition-colors"
            >
              <span className="text-xs font-medium text-cyan/90">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </NavLink>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <NavLink to="/settings" className="block">
                  <p className="text-xs font-medium text-white/70 truncate hover:text-cyan transition-colors">
                    {user.displayName}
                  </p>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-white/30 hover:text-cyan transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

// Icons - Thinner stroke weight for lighter feel
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function SessionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  )
}

function ConnectorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}

function CoachIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}

function TrainingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function SwingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function CourseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function StatsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}
