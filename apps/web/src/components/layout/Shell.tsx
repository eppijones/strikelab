import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCourse } from '@/api/courses'
import { SLLogo } from '@/components/ui'
import clsx from 'clsx'

interface NavItem {
  path: string
  key: string
  end?: boolean
}

const PRIMARY_NAV: NavItem[] = [
  { path: '/tee', key: 'tee', end: true },
  { path: '/courses', key: 'courses' },
  { path: '/bag', key: 'bag' },
  { path: '/practice', key: 'practice' },
  { path: '/play', key: 'play' },
]

export function Shell() {
  const { t, i18n } = useTranslation()
  const clerk = useClerk()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useSettingsStore((s) => s.theme)
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const navigate = useNavigate()
  const location = useLocation()
  const isTee = location.pathname.startsWith('/tee')

  const { data: homeClub } = useCourse(user?.homeClubId ?? '')

  const navLabel = (key: string) => {
    const labels: Record<string, { en: string; no: string }> = {
      tee: { en: 'Discover', no: 'Oppdag' },
      courses: { en: 'Clubs', no: 'Klubber' },
      bag: { en: 'Membership', no: 'Medlemskap' },
      practice: { en: 'Practice', no: 'Trening' },
      play: { en: 'Rounds', no: 'Runder' },
    }
    const language = i18n.language === 'no' ? 'no' : 'en'
    return labels[key]?.[language] ?? t(`shell.${key}`, { defaultValue: key.toUpperCase() })
  }

  const navLinkClass = (isActive: boolean) =>
    clsx(
      'text-[13.5px] px-1 py-2 transition-colors flex items-center justify-center min-h-[34px]',
      isActive ? 'text-ink font-medium' : 'text-ink-2 hover:text-ink',
    )

  const initials = (user?.displayName || user?.email || 'SL')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const today = new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  async function signOut() {
    try {
      await clerk.signOut()
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className={clsx('min-h-screen bg-bg text-ink', isTee && 'tee-editorial')}>
      {/* TOP BAR */}
      <header className={clsx('sticky top-0 z-40 border-b border-line-strong bg-surface/85 backdrop-blur-md', isTee && 'border-line bg-surface/80')}>
        <div className="px-5 sm:px-8 lg:px-12 min-h-[58px] py-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <NavLink
              to="/tee"
              className="font-serif italic text-[26px] leading-none tracking-[-0.06em] text-ink hover:text-accent-fg transition-colors shrink-0"
            >
              tee.
            </NavLink>
            {homeClub ? (
              <span className="mono text-[11px] text-ink-3 truncate max-w-[min(280px,40vw)] hidden md:inline">
                {homeClub.name.toUpperCase()}
              </span>
            ) : null}

            <nav className="hidden md:flex items-center gap-7">
              {PRIMARY_NAV.map((item, i) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  <span>{navLabel(item.key)}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            <button className="hidden lg:flex min-w-[280px] items-center gap-2 rounded-pill border border-line bg-surface-solid/70 px-3.5 py-2 text-left text-[12.5px] text-ink-3">
              <span>⌖</span>
              <span className="flex-1">{i18n.language === 'no' ? 'Søk i 174 baner i Norge' : 'Search 174 courses in Norway'}</span>
              <span className="mono rounded border border-line px-1.5 py-0.5 text-[9px]">⌘K</span>
            </button>
            <div className="flex rounded-pill border border-line bg-surface-solid/60 p-0.5">
              {(['no', 'en'] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => setLanguage(lng)}
                  className={clsx(
                    'rounded-pill px-2.5 py-1 mono text-[10px] uppercase',
                    i18n.language === lng ? 'bg-ink text-surface-solid' : 'text-ink-3 hover:text-ink',
                  )}
                  aria-label={`Set language ${lng}`}
                >
                  {lng}
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              className="hidden mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '◐' : '◑'}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-pill bg-accent text-accent-ink text-[12px] mono flex items-center justify-center"
              aria-label="Account"
            >
              {initials}
            </button>
            <button
              onClick={signOut}
              className="mono text-[10px] text-ink-3 hover:text-bad uppercase tracking-micro"
              aria-label="Sign out"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>

      </header>

      {/* PAGE CONTENT */}
      <main className={clsx('px-8 py-8', isTee && 'px-0 py-0')}>
        <Outlet />
      </main>

      {/* FOOTER STRIP */}
      <footer className="px-8 min-h-10 border-t border-line-strong flex items-center justify-between gap-4 text-ink-4 mono text-[10px] uppercase tracking-micro">
        <span>{isTee ? 'STRIKELAB · BOOKING BETA · DEMO MODE' : 'STRIKELAB · PLAYER WORKSPACE · v0.3'}</span>
        <span>{t('brand.tagline')}</span>
      </footer>
    </div>
  )
}
