import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'

export function Shell() {
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-theme-bg-primary bg-precision-grid transition-colors duration-300">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-250 min-h-screen',
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
