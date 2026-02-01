import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n'

type Language = 'en' | 'no'
type Units = 'yards' | 'meters'
type Theme = 'midnight' | 'scandinavian'

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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'en',
      units: 'yards',
      theme: 'scandinavian', // Default to scandinavian (light)
      sidebarCollapsed: false,
      
      setLanguage: (language) => {
        i18n.changeLanguage(language)
        localStorage.setItem('strikelab-language', language)
        set({ language })
      },
      
      setUnits: (units) => set({ units }),
      
      setTheme: (theme) => {
        // Apply theme class to document
        document.documentElement.classList.remove('midnight', 'scandinavian', 'dark', 'light')
        document.documentElement.classList.add(theme)
        if (theme === 'midnight') {
            document.documentElement.classList.add('dark')
        }
        set({ theme })
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'midnight' ? 'scandinavian' : 'midnight'
        document.documentElement.classList.remove('midnight', 'scandinavian', 'dark', 'light')
        document.documentElement.classList.add(newTheme)
        if (newTheme === 'midnight') {
            document.documentElement.classList.add('dark')
        }
        set({ theme: newTheme })
      },
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'strikelab-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme on initial load
        if (state?.theme) {
          document.documentElement.classList.remove('midnight', 'scandinavian', 'dark', 'light')
          document.documentElement.classList.add(state.theme)
          if (state.theme === 'midnight') {
              document.documentElement.classList.add('dark')
          }
        } else {
             // Fallback default
             document.documentElement.classList.add('scandinavian')
        }
      },
    }
  )
)
