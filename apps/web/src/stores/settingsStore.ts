import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n'

type Language = 'en' | 'no'
type Units = 'yards' | 'meters'

interface SettingsState {
  language: Language
  units: Units
  sidebarCollapsed: boolean
  setLanguage: (language: Language) => void
  setUnits: (units: Units) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      units: 'yards',
      sidebarCollapsed: false,
      
      setLanguage: (language) => {
        i18n.changeLanguage(language)
        localStorage.setItem('strikelab-language', language)
        set({ language })
      },
      
      setUnits: (units) => set({ units }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'strikelab-settings',
    }
  )
)
