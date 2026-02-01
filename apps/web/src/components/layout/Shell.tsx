import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { DotGrid, AuroraGlow, NoiseTexture } from '@/components/ui/backgrounds'
import { AIOrb } from '@/components/ui/AIOrb'
import { AICoachOverlay } from '@/components/ui/AICoachOverlay'
import { useState } from 'react'

const mainNavItems = [
  { path: '/play', label: 'Play', icon: PlayIcon, level: 1 },
  { path: '/', label: 'HQ', icon: HomeIcon, level: 1 },
  { path: '/my-bag', label: 'Bag', icon: BagIcon, level: 1 },
  { path: '/practice', label: 'Practice', icon: PracticeIcon, level: 2 },
  { path: '/stats', label: 'Insights', icon: InsightsIcon, level: 2 },
]

export function Shell() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [showControlCenter, setShowControlCenter] = useState(false)
  const [showAICoach, setShowAICoach] = useState(false)

  const clearance = user?.clearanceLevel || 1
  
  // Re-order logic to ensure HQ is center if possible
  // For Level 1: Play, HQ, Bag (HQ is center)
  // For Level 2: Play, Practice, HQ, Insights, Bag (HQ is center)
  // We need to construct the array dynamically based on clearance to ensure visual balance
  
  let navDisplayOrder = []
  
  if (clearance === 1) {
    navDisplayOrder = [
      mainNavItems.find(i => i.path === '/play'),
      mainNavItems.find(i => i.path === '/'),
      mainNavItems.find(i => i.path === '/my-bag'),
    ].filter(Boolean)
  } else {
    // For higher levels, try to balance it. 
    // Left: Play, Practice. Center: HQ. Right: Insights, Bag.
    navDisplayOrder = [
      mainNavItems.find(i => i.path === '/play'),
      mainNavItems.find(i => i.path === '/practice'),
      mainNavItems.find(i => i.path === '/'),
      mainNavItems.find(i => i.path === '/stats'),
      mainNavItems.find(i => i.path === '/my-bag'),
    ].filter(Boolean)
  }

  const getContext = () => {
    if (location.pathname === '/') return 'Bag'
    if (location.pathname === '/stats') return 'Performance'
    if (location.pathname === '/training') return 'Training'
    return undefined
  }

  return (
    <div className="min-h-screen bg-nordic-paper dark:bg-nordic-forest transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <DotGrid opacity={0.1} animate={false} />
        <AuroraGlow intensity="subtle" position="top" color="sage" />
        <NoiseTexture opacity={0.015} />
      </div>

      {/* Top Header - Simplified Logo Only */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl pointer-events-none">
         <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-nordic-forest flex items-center justify-center shadow-xl mb-2">
               <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-bold text-lg text-nordic-forest dark:text-white tracking-tight">StrikeLab</h1>
            <p className="text-[10px] font-bold text-nordic-sage uppercase tracking-widest">Get Dialed In</p>
          </div>
      </header>

      {/* Main Content Area */}
      <main className="relative pt-32 pb-32 px-4 md:px-8 max-w-6xl mx-auto z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Floating Navigation Pill */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/80 dark:bg-nordic-forest/80 backdrop-blur-xl border border-white/80 dark:border-white/20 rounded-full h-16 flex items-center px-4 gap-2 shadow-2xl relative">
          
          {/* Profile / Control Center Trigger (Left) */}
          <button 
             onClick={() => setShowControlCenter(!showControlCenter)}
             className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-nordic-sage/20 border border-nordic-sage/30 flex items-center justify-center overflow-hidden">
               <span className="text-xs font-semibold text-nordic-forest dark:text-white">
                 {user?.displayName?.charAt(0).toUpperCase() || 'G'}
               </span>
            </div>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-nordic-forest/10 dark:bg-white/10 mx-1" />

          {/* Main Nav Items */}
          <div className="flex items-center gap-1">
            {navDisplayOrder.map((item: any) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                  isActive ? "text-white" : "text-nordic-forest/60 dark:text-white/60 hover:text-nordic-forest dark:hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-nordic-forest dark:bg-nordic-sage rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className="w-5 h-5" />
                    <span className="sr-only">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

            {/* Divider */}
            <div className="w-px h-6 bg-nordic-forest/10 dark:bg-white/10 mx-1" />

            {/* Settings Trigger (Right) */}
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isActive ? "text-nordic-forest dark:text-white bg-black/5 dark:bg-white/10" : "text-nordic-forest/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
              )}
            >
              <SettingsIcon className="w-5 h-5" />
            </NavLink>
          </div>
        </nav>

        {/* AI Orb - Fixed FAB Position */}
        <div className="fixed bottom-8 right-8 z-50">
          <AIOrb 
            onClick={() => setShowAICoach(true)}
            active={showAICoach}
          />
        </div>

      <AICoachOverlay 
        isOpen={showAICoach} 
        onClose={() => setShowAICoach(false)} 
        context={getContext()}
      />

      {/* Control Center Modal/Overlay */}
      <AnimatePresence>
        {showControlCenter && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowControlCenter(false)}
              className="fixed inset-0 bg-nordic-forest/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-24 right-4 z-[70] w-64 bg-white/90 dark:bg-nordic-forest/90 backdrop-blur-2xl border border-white/80 dark:border-white/20 rounded-3xl shadow-2xl p-4"
            >
              <div className="space-y-2">
                <p className="px-3 py-2 text-xs font-semibold text-nordic-forest/40 dark:text-white/40 uppercase tracking-wider">Control Center</p>
                <ControlCenterItem to="/settings" label="Settings" icon={SettingsIcon} />
                <ControlCenterItem to="/connectors" label="Connectors" icon={ConnectorIcon} />
                <ControlCenterItem to="/friends" label="Friends" icon={FriendsIcon} />
                <hr className="border-nordic-forest/10 dark:border-white/10 my-2" />
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  <LogoutIcon className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ControlCenterItem({ to, label, icon: Icon }: any) {
  return (
    <NavLink 
      to={to} 
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-nordic-forest dark:text-white hover:bg-nordic-forest/5 dark:hover:bg-white/5 transition-colors text-sm font-medium"
    >
      <Icon className="w-4 h-4 text-nordic-sage" />
      {label}
    </NavLink>
  )
}

// Icons
function HomeIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function PlayIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function BagIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
}
function PracticeIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
}
function InsightsIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
}
function CoachIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
}
function SettingsIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function ConnectorIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
}
function FriendsIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}
function LogoutIcon(props: any) {
  return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}
