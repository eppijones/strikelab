import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n'

type Language = 'en' | 'no'
type Units = 'yards' | 'meters'
type Theme = 'dark' | 'light'

interface SettingsState {
  language: Language
  units: Units
  theme: Theme
  sidebarCollapsed: boolean
  setLanguage: (language: Language) => void
  setUnits: (units: Units) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('strikelab-theme', theme)
}

/**
 * Default the language store to the browser's preference on first load
 * so a Norwegian visitor lands in Norwegian without flipping a switch.
 * Once the user picks explicitly, the persisted store wins.
 */
function detectInitialLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  const tag = (navigator.languages?.[0] || navigator.language || '').toLowerCase()
  if (tag.startsWith('nb') || tag.startsWith('nn') || tag.startsWith('no')) return 'no'
  return 'en'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: detectInitialLanguage(),
      units: 'yards',
      theme: 'dark',
      sidebarCollapsed: false,

      setLanguage: (language) => {
        i18n.changeLanguage(language)
        localStorage.setItem('strikelab-language', language)
        set({ language })
      },

      setUnits: (units) => set({ units }),

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'strikelab-settings',
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'dark')
      },
    },
  ),
)
