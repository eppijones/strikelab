import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import { useAuthStore, type Persona } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCourse } from '@/api/courses'
import { SLLogo } from '@/components/ui'
import clsx from 'clsx'

interface NavItem {
  path: string
  key: string
  end?: boolean
}

const HQ_ITEM: NavItem = { path: '/', key: 'hq', end: true }

/**
 * Persona-aware navigation — one bar, three zones:
 *   Left: round / range / course / equipment / data loop
 *   Center: HQ (home) — always visually anchored in the middle
 *   Right: social (friends)
 *
 * Performance no longer uses a second rail; everything lives in the left zone
 * so the header reads as one calm strip instead of two competing menus.
 */
const PERSONA_NAV: Record<
  Persona,
  { left: NavItem[]; right: NavItem[] }
> = {
  beginner: {
    left: [
      { path: '/tee', key: 'tee' },
      { path: '/courses', key: 'courses' },
      { path: '/lab/range', key: 'rangelab' },
    ],
    right: [{ path: '/friends', key: 'friends' }],
  },
  improver: {
    left: [
      { path: '/tee', key: 'tee' },
      { path: '/play', key: 'play' },
      { path: '/sessions', key: 'sessions' },
      { path: '/lab', key: 'analyze' },
      { path: '/lab/range', key: 'rangelab' },
      { path: '/training', key: 'plan' },
      { path: '/courses', key: 'courses' },
      { path: '/my-bag', key: 'bag' },
      { path: '/connectors', key: 'data' },
    ],
    right: [{ path: '/friends', key: 'friends' }],
  },
  performance: {
    left: [
      { path: '/tee', key: 'tee' },
      { path: '/play', key: 'play' },
      { path: '/sessions', key: 'sessions' },
      { path: '/coach', key: 'reports' },
      { path: '/training', key: 'plan' },
      { path: '/courses', key: 'courses' },
      { path: '/lab', key: 'lab' },
      { path: '/lab/range', key: 'rangelab' },
      { path: '/stats', key: 'stats' },
      { path: '/my-bag', key: 'bag' },
      { path: '/connectors', key: 'data' },
    ],
    right: [{ path: '/friends', key: 'friends' }],
  },
}

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

  const { data: homeClub } = useCourse(user?.homeClubId ?? '')

  const persona: Persona = (user?.persona as Persona) ?? 'improver'
  const { left, right } = PERSONA_NAV[persona] ?? PERSONA_NAV.improver

  const navLinkClass = (isActive: boolean, withRightRule: boolean) =>
    clsx(
      'mono text-[10px] uppercase tracking-micro px-3 sm:px-3.5 py-2.5 transition-colors flex items-center justify-center min-h-[40px]',
      withRightRule && 'border-r border-line-strong',
      isActive ? 'ui-selected' : 'text-ink-2 hover:text-ink hover:bg-bg-2',
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
    <div className="min-h-screen bg-bg text-ink">
      {/* TOP BAR */}
      <header className="border-b border-line-strong">
        <div className="px-8 min-h-14 py-2 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-y-3 gap-x-4">
          {/* Brand + optional home club (no decorative “bay / live” strip). */}
          <div className="flex items-center gap-4 min-w-0 justify-self-start">
            <NavLink
              to="/"
              className="flex items-center gap-2.5 text-ink hover:text-accent-fg transition-colors shrink-0"
            >
              <SLLogo size={20} withWord wordSize={12} condensed />
            </NavLink>
            {homeClub ? (
              <span className="mono text-[11px] text-ink-3 truncate max-w-[min(280px,40vw)] hidden md:inline">
                {homeClub.name.toUpperCase()}
              </span>
            ) : null}
          </div>

          {/* Primary nav — spill · HQ · sosialt */}
          <nav className="flex flex-wrap items-stretch justify-center max-w-full min-w-0 justify-self-center border border-line-strong bg-surface-solid/30">
            <div className="flex flex-wrap min-w-0">
              {left.map((item, i) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => navLinkClass(isActive, i < left.length - 1)}
                >
                  <span>{t(`shell.${item.key}`, { defaultValue: item.key.toUpperCase() })}</span>
                </NavLink>
              ))}
            </div>

            <div className="flex border-l border-r border-line-strong bg-bg-2/50 shrink-0">
              <NavLink
                to={HQ_ITEM.path}
                end={HQ_ITEM.end}
                className={({ isActive }) =>
                  clsx(
                    'mono text-[10px] uppercase tracking-micro px-4 sm:px-5 py-2.5 transition-colors flex items-center justify-center min-w-[52px] min-h-[40px] font-medium',
                    isActive ? 'ui-selected' : 'text-ink hover:bg-bg-2',
                  )
                }
              >
                {t(`shell.${HQ_ITEM.key}`, { defaultValue: 'HQ' })}
              </NavLink>
            </div>

            <div className="flex flex-wrap min-w-0">
              {right.map((item, i) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => navLinkClass(isActive, i < right.length - 1)}
                >
                  <span>{t(`shell.${item.key}`, { defaultValue: item.key.toUpperCase() })}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4 shrink-0 flex-wrap justify-self-stretch lg:justify-self-end justify-end">
            <span className="mono text-[11px] text-ink-3 hidden md:block">{today}</span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'no' : 'en')}
              className="mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro"
              aria-label="Toggle language"
            >
              {i18n.language.toUpperCase()}
            </button>
            <button
              onClick={toggleTheme}
              className="mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '◐' : '◑'}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-7 h-7 border border-line-strong text-[11px] mono text-ink-2 hover:text-ink hover:border-ink-3 flex items-center justify-center"
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
      <main className="px-8 py-8">
        <Outlet />
      </main>

      {/* FOOTER STRIP */}
      <footer className="px-8 h-10 border-t border-line-strong flex items-center justify-between text-ink-4 mono text-[10px] uppercase tracking-micro">
        <span>STRIKELAB · {persona.toUpperCase()} · v0.2</span>
        <span>{t('brand.tagline')}</span>
      </footer>
    </div>
  )
}
