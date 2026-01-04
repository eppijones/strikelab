import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getBrandById, type GolfBrand } from '@/lib/golfBrands'
import type { Club, ClubStats } from '@/api/equipment'

interface ClubWithStats extends Club {
  stats?: ClubStats
}

interface GolfBagVisualizationProps {
  clubs: Club[]
  clubStats: ClubStats[]
  ballBrand?: string | null
  ballModel?: string | null
  onBagClick?: () => void
}

// Map club types to display info and position in bag
const CLUB_DISPLAY_ORDER = [
  { type: 'driver', label: 'Driver', shortLabel: 'D' },
  { type: '3_wood', label: '3-Wood', shortLabel: '3W' },
  { type: '5_wood', label: '5-Wood', shortLabel: '5W' },
  { type: '7_wood', label: '7-Wood', shortLabel: '7W' },
  { type: 'hybrid', label: 'Hybrid', shortLabel: 'H' },
  { type: 'iron', label: 'Irons', shortLabel: 'I' },
  { type: 'wedge', label: 'Wedges', shortLabel: 'W' },
  { type: 'putter', label: 'Putter', shortLabel: 'P' },
]

// Get a nice gradient for the club score badge
function getScoreColor(score: number): string {
  if (score >= 85) return 'from-emerald-500 to-emerald-600'
  if (score >= 75) return 'from-cyan to-cyan'
  if (score >= 65) return 'from-amber-500 to-amber-600'
  return 'from-red-500 to-red-600'
}

function getScoreBorderColor(score: number): string {
  if (score >= 85) return 'border-emerald-400'
  if (score >= 75) return 'border-cyan'
  if (score >= 65) return 'border-amber-400'
  return 'border-red-400'
}

// Club chip component with distance
function ClubChip({ 
  label, 
  score, 
  avgCarry, 
  brandColor 
}: { 
  label: string
  score?: number
  avgCarry?: number | null
  brandColor?: string
}) {
  const displayScore = score ?? Math.floor(70 + Math.random() * 20)
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted mb-1 font-medium">{label}</span>
      <div 
        className={`
          w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold
          bg-gradient-to-b ${getScoreColor(displayScore)} text-obsidian
          shadow-lg border-2 ${getScoreBorderColor(displayScore)}
          transition-transform hover:scale-110
        `}
        style={brandColor ? { boxShadow: `0 0 12px ${brandColor}40` } : undefined}
      >
        {displayScore}
      </div>
      {avgCarry && (
        <span className="text-xs text-muted mt-1">{Math.round(avgCarry)} yds</span>
      )}
    </div>
  )
}

export function GolfBagVisualization({ 
  clubs, 
  clubStats, 
  ballBrand,
  ballModel,
  onBagClick 
}: GolfBagVisualizationProps) {
  // Get dominant brand for styling
  const dominantBrand = useMemo(() => {
    const brandCounts: Record<string, number> = {}
    clubs.forEach(club => {
      brandCounts[club.brand_id] = (brandCounts[club.brand_id] || 0) + 1
    })
    
    const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) {
      return getBrandById(sorted[0][0])
    }
    return null
  }, [clubs])

  // Get unique brands in the bag
  const uniqueBrands = useMemo(() => {
    const brands = new Set(clubs.map(c => c.brand_id))
    return Array.from(brands).map(getBrandById).filter(Boolean) as GolfBrand[]
  }, [clubs])

  // Match clubs with their stats
  const clubsWithStats = useMemo(() => {
    const statsMap = new Map(clubStats.map(s => [s.club_label, s]))
    
    return clubs.map(club => ({
      ...club,
      stats: statsMap.get(club.club_label || club.club_type)
    }))
  }, [clubs, clubStats])

  // Group clubs by category for display grid
  const clubsByCategory = useMemo(() => {
    // Woods & Hybrids
    const woods = clubsWithStats.filter(c => 
      ['driver', '3_wood', '5_wood', '7_wood', 'hybrid'].includes(c.club_type)
    )
    // Irons
    const irons = clubsWithStats.filter(c => c.club_type === 'iron')
    // Wedges & Short game
    const wedges = clubsWithStats.filter(c => c.club_type === 'wedge')
    // Putter
    const putters = clubsWithStats.filter(c => c.club_type === 'putter')

    return { woods, irons, wedges, putters }
  }, [clubsWithStats])

  // Generate demo clubs if bag is empty
  const demoClubs = useMemo(() => [
    { label: 'Driver', score: 76, avgCarry: 268 },
    { label: '3-Wood', score: 81, avgCarry: 238 },
    { label: '5-Wood', score: 79, avgCarry: 218 },
    { label: '4-Iron', score: 85, avgCarry: 195 },
    { label: '5-Iron', score: 87, avgCarry: 182 },
    { label: '6-Iron', score: 88, avgCarry: 170 },
    { label: '7-Iron', score: 89, avgCarry: 162 },
    { label: '8-Iron', score: 91, avgCarry: 150 },
    { label: '9-Iron', score: 90, avgCarry: 138 },
    { label: 'PW', score: 88, avgCarry: 125 },
    { label: 'GW', score: 86, avgCarry: 110 },
    { label: 'SW', score: 84, avgCarry: 95 },
    { label: 'LW', score: 82, avgCarry: 85 },
    { label: 'Putter', score: 78, avgCarry: null },
  ], [])

  const hasClubs = clubs.length > 0

  return (
    <Link 
      to="/my-bag" 
      className="block group"
      onClick={(e) => {
        if (onBagClick) {
          e.preventDefault()
          onBagClick()
        }
      }}
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="px-4 py-2 rounded-full bg-surface border border-cyan/30 shadow-glow-sm">
            <span className="text-sm font-medium text-ice-white">
              Your {hasClubs ? clubs.length : 14} Clubs
            </span>
          </div>
        </div>

        {/* Main Bag Visualization */}
        <div 
          className={`
            relative rounded-3xl p-6 overflow-hidden
            bg-gradient-to-b from-surface via-graphite to-obsidian
            border border-border group-hover:border-cyan/40
            transition-all duration-300 group-hover:shadow-glow
          `}
          style={{
            background: dominantBrand 
              ? `linear-gradient(180deg, 
                  ${dominantBrand.color}08 0%, 
                  var(--color-graphite) 30%, 
                  var(--color-obsidian) 100%)`
              : undefined
          }}
        >
          {/* Decorative bag silhouette */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg viewBox="0 0 200 400" className="w-full h-full" fill="currentColor">
              <ellipse cx="100" cy="60" rx="70" ry="50" />
              <rect x="30" y="60" width="140" height="300" rx="20" />
              <ellipse cx="100" cy="360" rx="70" ry="30" />
              {/* Club silhouettes */}
              <rect x="45" y="10" width="4" height="120" rx="2" transform="rotate(-5 47 70)" />
              <rect x="65" y="5" width="4" height="115" rx="2" transform="rotate(-2 67 65)" />
              <rect x="85" y="2" width="4" height="110" rx="2" />
              <rect x="105" y="2" width="4" height="110" rx="2" />
              <rect x="125" y="5" width="4" height="115" rx="2" transform="rotate(2 127 65)" />
              <rect x="145" y="10" width="4" height="120" rx="2" transform="rotate(5 147 70)" />
            </svg>
          </div>

          {/* Brand logos strip */}
          {uniqueBrands.length > 0 && (
            <div className="flex items-center justify-center gap-4 mb-6 opacity-60">
              {uniqueBrands.slice(0, 3).map((brand) => (
                <div 
                  key={brand.id}
                  className="h-5"
                  style={{ color: brand.color }}
                  dangerouslySetInnerHTML={{ __html: brand.logo }}
                />
              ))}
            </div>
          )}

          {/* Club Grid */}
          <div className="space-y-4">
            {/* Woods Row */}
            <div className="flex justify-center gap-2">
              {(hasClubs 
                ? clubsByCategory.woods.slice(0, 4).map(c => ({
                    label: c.club_label || c.club_type,
                    score: c.stats?.good_shots ? Math.round((c.stats.good_shots / c.stats.total_shots) * 100) : undefined,
                    avgCarry: c.stats?.avg_carry,
                    brandColor: getBrandById(c.brand_id)?.color
                  }))
                : demoClubs.slice(0, 3)
              ).map((club, i) => (
                <ClubChip key={i} {...club} />
              ))}
            </div>

            {/* Irons Row 1 */}
            <div className="flex justify-center gap-2">
              {(hasClubs 
                ? clubsByCategory.irons.slice(0, 4).map(c => ({
                    label: c.club_label || c.club_type,
                    score: c.stats?.good_shots ? Math.round((c.stats.good_shots / c.stats.total_shots) * 100) : undefined,
                    avgCarry: c.stats?.avg_carry,
                    brandColor: getBrandById(c.brand_id)?.color
                  }))
                : demoClubs.slice(3, 7)
              ).map((club, i) => (
                <ClubChip key={i} {...club} />
              ))}
            </div>

            {/* Irons Row 2 */}
            <div className="flex justify-center gap-2">
              {(hasClubs 
                ? clubsByCategory.irons.slice(4, 7).map(c => ({
                    label: c.club_label || c.club_type,
                    score: c.stats?.good_shots ? Math.round((c.stats.good_shots / c.stats.total_shots) * 100) : undefined,
                    avgCarry: c.stats?.avg_carry,
                    brandColor: getBrandById(c.brand_id)?.color
                  }))
                : demoClubs.slice(7, 10)
              ).map((club, i) => (
                <ClubChip key={i} {...club} />
              ))}
            </div>

            {/* Wedges & Putter Row */}
            <div className="flex justify-center gap-2">
              {(hasClubs 
                ? [...clubsByCategory.wedges, ...clubsByCategory.putters].slice(0, 4).map(c => ({
                    label: c.club_label || c.club_type,
                    score: c.stats?.good_shots ? Math.round((c.stats.good_shots / c.stats.total_shots) * 100) : undefined,
                    avgCarry: c.stats?.avg_carry,
                    brandColor: getBrandById(c.brand_id)?.color
                  }))
                : demoClubs.slice(10, 14)
              ).map((club, i) => (
                <ClubChip key={i} {...club} />
              ))}
            </div>
          </div>

          {/* Ball info footer */}
          {(ballBrand || ballModel) && (
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <span className="text-xs text-muted">
                {ballModel ? `Playing ${ballModel}` : 'Game Ball'}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-3xl" />
        </div>

        {/* Click to manage hint */}
        <div className="mt-3 text-center">
          <span className="text-xs text-muted group-hover:text-cyan transition-colors">
            Click to manage your bag →
          </span>
        </div>

        {/* Demo data badge */}
        {!hasClubs && (
          <div className="absolute top-0 right-0 px-2 py-1 bg-graphite/90 rounded-bl-lg rounded-tr-2xl">
            <span className="text-xs text-muted">Demo</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// Compact version for sidebar or smaller spaces
export function GolfBagCompact({ 
  clubs, 
  clubStats 
}: { 
  clubs: Club[]
  clubStats: ClubStats[]
}) {
  const avgScore = useMemo(() => {
    if (clubStats.length === 0) return 82 // Demo value
    const totalGood = clubStats.reduce((sum, s) => sum + s.good_shots, 0)
    const totalShots = clubStats.reduce((sum, s) => sum + s.total_shots, 0)
    return totalShots > 0 ? Math.round((totalGood / totalShots) * 100) : 0
  }, [clubStats])

  return (
    <Link to="/my-bag" className="group">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-graphite border border-border group-hover:border-cyan/30 transition-all">
        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-cyan to-emerald-500 flex items-center justify-center">
          <span className="text-lg">🏌️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ice-white">My Bag</p>
          <p className="text-xs text-muted">{clubs.length || 14} clubs</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-cyan">{avgScore}</p>
          <p className="text-xs text-muted">avg</p>
        </div>
      </div>
    </Link>
  )
}
