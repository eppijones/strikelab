import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSessions } from '@/api/sessions'
import { useClubStats } from '@/api/equipment'
import { CardGlass } from '@/components/ui/CardGlass'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { SpotlightCard, TextReveal } from '@/components/ui/MotionPrimitives'

// Helper to predict date
const getProjectedDate = (current: number, goal: number) => {
  if (current <= goal) return "Goal Achieved"
  const diff = current - goal
  const weeksNeeded = Math.ceil(diff / 0.15) // Assume 0.15 improvement per week
  const date = new Date()
  date.setDate(date.getDate() + (weeksNeeded * 7))
  // Format: Nov 2027
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const units = useSettingsStore((state) => state.units)
  const { data: sessionsData } = useSessions({ limit: 5 })
  const { data: clubStats } = useClubStats()

  const clubData = useMemo(() => {
    if (clubStats && clubStats.length > 0) {
      return clubStats.map(s => ({
        label: s.club_label,
        shortLabel: s.club_label.replace('-', '').replace('Iron', 'i').replace('Wood', 'W'),
        score: s.good_shots && s.total_shots ? Math.round((s.good_shots / s.total_shots) * 100) : 80,
        distance: s.avg_carry ? Math.round(s.avg_carry) : null,
        status: (s.good_shots / s.total_shots) > 0.8 ? 'dialed' : (s.good_shots / s.total_shots) > 0.6 ? 'stable' : 'needs_work'
      }))
    }
    return [
      { label: 'Driver', shortLabel: 'DRV', score: 76, distance: 268, status: 'stable' },
      { label: '7-Iron', shortLabel: '7i', score: 89, distance: 162, status: 'dialed' },
      { label: 'Pitching Wedge', shortLabel: 'PW', score: 65, distance: 125, status: 'needs_work' },
      { label: 'Putter', shortLabel: 'PUT', score: 78, distance: null, status: 'needs_work' },
    ]
  }, [clubStats])

  const projectedDate = useMemo(() => 
    getProjectedDate(user?.handicapIndex || 12.4, user?.goalHandicap || 8.0), 
  [user])

  const currentHC = user?.handicapIndex || 12.4
  const goalHC = user?.goalHandicap || 8.0

  return (
    <div className="space-y-8 pb-32">
      
      {/* --- HEADER: Tactical Welcome --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
           <TextReveal 
            text={`COMMAND CENTER`} 
            className="text-[10px] font-bold text-nordic-sage uppercase tracking-[0.2em] mb-1"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-nordic-forest dark:text-white tracking-tight">
            {user?.displayName?.split(' ')[0] || 'Golfer'}
            <span className="text-nordic-forest/20 dark:text-white/20">.HQ</span>
          </h1>
        </div>
      </div>

      {/* --- SECTION 1: FLIGHT PATH (New Handicap HUD) --- */}
      <section className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-nordic-forest/5 via-nordic-sage/10 to-nordic-forest/5 dark:from-white/5 dark:via-white/10 dark:to-white/5 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardGlass className="relative overflow-hidden border-nordic-forest/10 dark:border-white/10" padding="md">
          <div className="flex items-center justify-between gap-6 md:gap-12">
            
            {/* Current State */}
            <div className="text-left shrink-0">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-nordic-forest/60 dark:text-white/60 uppercase tracking-widest">Current</span>
               </div>
               <div className="text-5xl md:text-6xl font-bold text-nordic-forest dark:text-white tracking-tighter tabular-nums font-mono">
                 {currentHC.toFixed(1)}
               </div>
            </div>

            {/* The Flight Path (Visualizer) */}
            <div className="flex-1 relative h-16 md:h-20 flex items-center px-4">
              {/* Background Line */}
              <div className="absolute left-0 right-0 h-[1px] bg-nordic-forest/10 dark:bg-white/10" />
              
              {/* Progress Line */}
              <motion.div 
                className="absolute left-0 h-[2px] bg-gradient-to-r from-nordic-forest via-nordic-sage to-transparent dark:from-white dark:via-white/60 dark:to-transparent"
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />

              {/* Data Points on Line */}
              <div className="relative w-full flex justify-between text-[10px] font-mono font-medium text-nordic-forest/40 dark:text-white/40 pt-6 uppercase tracking-wider">
                <span>Now</span>
                <span className="hidden md:inline-block">Milestone 1</span>
                <span>Target</span>
              </div>
            </div>

            {/* Target State */}
            <div className="text-right shrink-0">
               <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-[10px] font-mono text-nordic-forest/40 dark:text-white/40 uppercase tracking-widest">Projection</span>
               </div>
               <div className="text-4xl md:text-5xl font-bold text-nordic-forest/30 dark:text-white/30 tracking-tighter tabular-nums font-mono">
                 {goalHC.toFixed(1)}
               </div>
               <div className="mt-1">
                  <Badge variant="outline" className="border-nordic-forest/10 dark:border-white/10 text-nordic-sage text-[10px] font-mono py-0 h-5">
                    BY {projectedDate.toUpperCase()}
                  </Badge>
               </div>
            </div>

          </div>
        </CardGlass>
      </section>

      {/* --- SECTION 2: MISSION CONTROL (Action Center) --- */}
      <section className="grid md:grid-cols-2 gap-6">
        
        {/* Primary Mission Card */}
        <Link to="/calendar" className="group h-full">
          <SpotlightCard className="h-full bg-nordic-forest text-white dark:bg-white dark:text-nordic-forest border-none overflow-hidden relative">
             <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             
             <div className="p-8 h-full flex flex-col justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <Badge className="bg-white/20 text-white dark:bg-nordic-forest/10 dark:text-nordic-forest border-none backdrop-blur-md">
                      PRIORITY MISSION
                    </Badge>
                    <span className="font-mono text-xs opacity-60">T-MINUS 14HRS</span>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-2">Driver Optimization</h3>
                  <p className="opacity-80 leading-relaxed max-w-sm">
                    Your dispersion has increased by 12% in the last 2 sessions. Let's tighten it up.
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10 dark:border-nordic-forest/10">
                   <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-nordic-forest/10 flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                   </div>
                   <div>
                     <p className="font-bold text-sm uppercase tracking-wider">Range Session</p>
                     <p className="font-mono text-xs opacity-60">45 Minutes • 60 Balls</p>
                   </div>
                   <div className="ml-auto">
                      <div className="w-8 h-8 rounded-full border border-white/30 dark:border-nordic-forest/30 flex items-center justify-center group-hover:bg-white group-hover:text-nordic-forest dark:group-hover:bg-nordic-forest dark:group-hover:text-white transition-all">
                        →
                      </div>
                   </div>
                </div>
             </div>
          </SpotlightCard>
        </Link>

        {/* Quick Stats / Secondary Intel */}
        <div className="grid grid-rows-2 gap-6">
           <Link to="/stats" className="block">
              <CardGlass className="h-full p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-white/60 dark:hover:bg-nordic-forest/60 transition-colors">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-nordic-sage">Consistency</span>
                    <span className="text-green-500 text-xs font-bold">+2.4%</span>
                 </div>
                 <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-nordic-forest dark:text-white font-mono">82<span className="text-lg">%</span></span>
                   <span className="text-sm text-nordic-forest/40 dark:text-white/40">GIR Last 5</span>
                 </div>
                 {/* Mini Chart Decoration */}
                 <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,40 Q50,30 100,10 T200,30 T300,5 T400,20 L400,50 L0,50 Z" fill="currentColor" />
                    </svg>
                 </div>
              </CardGlass>
           </Link>

           <Link to="/training" className="block">
             <CardGlass className="h-full p-6 flex flex-col justify-center hover:bg-white/60 dark:hover:bg-nordic-forest/60 transition-colors">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-nordic-sage">Training Plan</span>
                   <span className="text-xs font-mono text-nordic-forest/40 dark:text-white/40">WEEK 3/8</span>
                </div>
                <div className="w-full bg-nordic-forest/5 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-3">
                   <div className="h-full bg-nordic-sage w-[65%]" />
                </div>
                <p className="text-sm font-medium text-nordic-forest dark:text-white truncate">
                  Iron Compression Drills
                </p>
             </CardGlass>
           </Link>
        </div>

      </section>

      {/* --- SECTION 3: ARSENAL CHIPS (Compact Club Data) --- */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-bold text-nordic-forest/40 dark:text-white/40 uppercase tracking-[0.2em]">Active Arsenal</h3>
          <Link to="/my-bag" className="text-[10px] font-bold text-nordic-sage hover:text-nordic-forest dark:hover:text-white uppercase tracking-widest transition-colors">
            Manage Loadout →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {clubData.map((club, index) => (
            <Link to={`/my-bag?club=${club.shortLabel}`} key={club.label}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.05) }}
              >
                <CardGlass className={cn(
                  "p-4 group hover:border-nordic-sage/50 transition-colors h-full",
                  club.status === 'dialed' && "bg-green-500/5 border-green-500/20"
                )}>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-nordic-forest/60 dark:text-white/60">{club.shortLabel}</span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        club.status === 'dialed' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                        club.status === 'stable' ? "bg-nordic-sage" : "bg-amber-500"
                      )} />
                    </div>
                    
                    <div>
                      <div className="text-xl font-bold font-mono text-nordic-forest dark:text-white tabular-nums">
                        {club.distance || '--'}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-nordic-forest/40 dark:text-white/40 mt-1">
                        Carry {units === 'yards' ? 'Yds' : 'M'}
                      </div>
                    </div>
                  </div>
                </CardGlass>
              </motion.div>
            </Link>
          ))}
          
          <Link to="/my-bag" className="md:hidden flex items-center justify-center p-4 border border-dashed border-nordic-forest/20 dark:border-white/20 rounded-2xl text-nordic-forest/40 dark:text-white/40 hover:text-nordic-forest dark:hover:text-white hover:border-nordic-forest/40 transition-colors">
             <span className="text-xs font-medium">+ View All</span>
          </Link>
        </div>
      </section>

    </div>
  )
}
