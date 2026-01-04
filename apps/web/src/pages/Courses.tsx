import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ALL_COURSES, 
  NORWEGIAN_COURSES, 
  INTERNATIONAL_COURSES,
  COURSE_COUNTRIES,
  searchCourses,
  type GolfCourse 
} from '@/lib/golfCourses'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select } from '@/components/ui'

// Course Type Badge Colors
const TYPE_COLORS: Record<string, string> = {
  links: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  parkland: 'bg-green-500/20 text-green-400 border-green-500/30',
  heathland: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  desert: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  mountain: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  resort: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

// Price Range Badge
const PRICE_BADGES: Record<string, { label: string; color: string }> = {
  budget: { label: '€', color: 'bg-green-500/20 text-green-400' },
  moderate: { label: '€€', color: 'bg-yellow-500/20 text-yellow-400' },
  premium: { label: '€€€', color: 'bg-orange-500/20 text-orange-400' },
  luxury: { label: '€€€€', color: 'bg-purple-500/20 text-purple-400' },
}

// Course Card Component
function CourseCard({ course, onClick }: { course: GolfCourse; onClick: () => void }) {
  const country = COURSE_COUNTRIES.find(c => c.code === course.countryCode)
  const priceInfo = PRICE_BADGES[course.priceRange]
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      <Card variant="hover" className="overflow-hidden h-full">
        {/* Header Image Placeholder with Course Type */}
        <div className={`h-32 relative ${TYPE_COLORS[course.type]?.replace('text-', 'bg-').replace('-400', '-900/30') || 'bg-surface'}`}>
          {/* Course Type Pattern */}
          <div className="absolute inset-0 bg-precision-grid opacity-30" />
          
          {/* Country Flag */}
          <div className="absolute top-3 left-3">
            <span className="text-2xl drop-shadow-lg">{country?.flag}</span>
          </div>
          
          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${priceInfo.color}`}>
              {priceInfo.label}
            </span>
          </div>
          
          {/* Course Type */}
          <div className="absolute bottom-3 left-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${TYPE_COLORS[course.type] || 'bg-surface text-muted border-border'}`}>
              {course.type.charAt(0).toUpperCase() + course.type.slice(1)}
            </span>
          </div>
          
          {/* Holes Badge */}
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-obsidian/50 backdrop-blur text-ice-white">
              {course.holes} holes
            </span>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-ice-white group-hover:text-cyan transition-colors line-clamp-1">
            {course.name}
          </h3>
          <p className="text-sm text-muted mt-1">
            {course.city}, {course.country}
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 rounded-lg bg-graphite">
              <p className="text-lg font-display font-bold text-cyan">{course.par}</p>
              <p className="text-xs text-muted">Par</p>
            </div>
            {course.courseRating && (
              <div className="text-center p-2 rounded-lg bg-graphite">
                <p className="text-lg font-display font-bold text-ice-white">{course.courseRating}</p>
                <p className="text-xs text-muted">Rating</p>
              </div>
            )}
            {course.slopeRating && (
              <div className="text-center p-2 rounded-lg bg-graphite">
                <p className="text-lg font-display font-bold text-ice-white">{course.slopeRating}</p>
                <p className="text-xs text-muted">Slope</p>
              </div>
            )}
          </div>
          
          {/* Facilities Preview */}
          {course.facilities && course.facilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {course.facilities.slice(0, 3).map((facility) => (
                <span 
                  key={facility}
                  className="px-2 py-0.5 rounded text-xs bg-surface text-muted border border-border"
                >
                  {facility.replace('_', ' ')}
                </span>
              ))}
              {course.facilities.length > 3 && (
                <span className="px-2 py-0.5 rounded text-xs bg-surface text-muted border border-border">
                  +{course.facilities.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  )
}

// Shot Planner Component
function ShotPlanner({ course, onBack }: { course: GolfCourse; onBack: () => void }) {
  const [selectedHole, setSelectedHole] = useState(1)
  const [plannedShots, setPlannedShots] = useState<Record<number, { club: string; target: string; notes: string }[]>>({})
  const [currentClub, setCurrentClub] = useState('')
  const [currentTarget, setCurrentTarget] = useState('')
  const [currentNotes, setCurrentNotes] = useState('')
  
  const addShot = () => {
    if (!currentClub) return
    
    const shot = { club: currentClub, target: currentTarget, notes: currentNotes }
    setPlannedShots(prev => ({
      ...prev,
      [selectedHole]: [...(prev[selectedHole] || []), shot],
    }))
    setCurrentClub('')
    setCurrentTarget('')
    setCurrentNotes('')
  }
  
  const removeShot = (holeNum: number, shotIndex: number) => {
    setPlannedShots(prev => ({
      ...prev,
      [holeNum]: (prev[holeNum] || []).filter((_, i) => i !== shotIndex),
    }))
  }
  
  const holeData = course.holeData?.[selectedHole - 1]
  const totalPlannedShots = Object.values(plannedShots).reduce((sum, shots) => sum + shots.length, 0)
  
  const CLUB_OPTIONS = [
    'Driver', '3 Wood', '5 Wood', 'Hybrid',
    '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron',
    'PW', 'GW', 'SW', 'LW', 'Putter',
  ]
  
  const TARGET_OPTIONS = [
    'Center of fairway', 'Left side fairway', 'Right side fairway',
    'Center of green', 'Front of green', 'Back of green', 'Left pin', 'Right pin',
    'Layup area', 'Short of bunker', 'Over bunker',
  ]
  
  return (
    <div className="fixed inset-0 z-50 bg-obsidian overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-graphite border-b border-border z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-surface hover:bg-surface/80 transition-colors"
              >
                <svg className="w-5 h-5 text-ice-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-display font-bold text-ice-white">{course.name}</h1>
                <p className="text-sm text-muted">Shot Planner · Par {course.par}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="cyan" size="lg">{totalPlannedShots} shots planned</Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hole Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Holes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: course.holes }, (_, i) => i + 1).map(hole => {
                    const hasPlans = (plannedShots[hole] || []).length > 0
                    return (
                      <button
                        key={hole}
                        onClick={() => setSelectedHole(hole)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-all relative ${
                          selectedHole === hole
                            ? 'bg-cyan text-obsidian'
                            : hasPlans
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-surface text-muted hover:text-ice-white hover:bg-surface/80'
                        }`}
                      >
                        {hole}
                        {hasPlans && selectedHole !== hole && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Hole Info */}
                <div className="mt-4 p-4 rounded-xl bg-graphite border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-ice-white">Hole {selectedHole}</h3>
                    {holeData && (
                      <Badge variant="default">Par {holeData.par}</Badge>
                    )}
                  </div>
                  
                  {holeData ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {holeData.whiteTee && (
                        <div>
                          <span className="text-muted">White:</span>
                          <span className="text-ice-white ml-2">{holeData.whiteTee}m</span>
                        </div>
                      )}
                      {holeData.yellowTee && (
                        <div>
                          <span className="text-muted">Yellow:</span>
                          <span className="text-ice-white ml-2">{holeData.yellowTee}m</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted">HCP:</span>
                        <span className="text-ice-white ml-2">{holeData.handicap}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Hole data not available</p>
                  )}
                </div>
                
                {/* Quick Summary */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-muted">All Planned Shots</h4>
                  {Object.entries(plannedShots).map(([hole, shots]) => (
                    shots.length > 0 && (
                      <div key={hole} className="text-sm flex items-center justify-between">
                        <span className="text-muted">Hole {hole}</span>
                        <span className="text-ice-white">{shots.length} shot{shots.length !== 1 ? 's' : ''}</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Shot Planning Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Hole Shots */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Hole {selectedHole} Strategy</CardTitle>
                  {holeData && (
                    <span className="text-lg font-display font-bold text-cyan">Par {holeData.par}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Shots */}
                {(plannedShots[selectedHole] || []).length > 0 ? (
                  <div className="space-y-2">
                    {(plannedShots[selectedHole] || []).map((shot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-graphite border border-border"
                      >
                        <div className="w-8 h-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-ice-white font-medium">{shot.club}</p>
                          <p className="text-sm text-muted">{shot.target || 'No target specified'}</p>
                          {shot.notes && (
                            <p className="text-xs text-muted/60 mt-1">📝 {shot.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeShot(selectedHole, idx)}
                          className="p-2 text-muted hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl block mb-2">🏌️</span>
                    <p className="text-muted">No shots planned yet</p>
                    <p className="text-sm text-muted/60">Add your strategy below</p>
                  </div>
                )}
                
                {/* Add Shot Form */}
                <div className="p-4 rounded-xl bg-graphite border border-border space-y-3">
                  <h4 className="text-sm font-medium text-ice-white">Add Shot</h4>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Club</label>
                      <select
                        value={currentClub}
                        onChange={(e) => setCurrentClub(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-ice-white text-sm focus:border-cyan focus:outline-none"
                      >
                        <option value="">Select club...</option>
                        {CLUB_OPTIONS.map(club => (
                          <option key={club} value={club}>{club}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Target</label>
                      <select
                        value={currentTarget}
                        onChange={(e) => setCurrentTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-ice-white text-sm focus:border-cyan focus:outline-none"
                      >
                        <option value="">Select target...</option>
                        {TARGET_OPTIONS.map(target => (
                          <option key={target} value={target}>{target}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      placeholder="e.g., Avoid water on left"
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-ice-white text-sm placeholder:text-muted/50 focus:border-cyan focus:outline-none"
                    />
                  </div>
                  
                  <Button onClick={addShot} disabled={!currentClub} className="w-full">
                    Add Shot to Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Strategy Tips */}
            <Card className="bg-gradient-to-r from-cyan/5 to-emerald-500/5 border-cyan/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-ice-white font-medium">Course Strategy Tip</p>
                    <p className="text-sm text-muted mt-1">
                      {holeData?.par === 3 
                        ? "Par 3: Focus on hitting the green. Check wind direction and club up if needed."
                        : holeData?.par === 5
                          ? "Par 5: Consider your layup position for the best angle into the green."
                          : "Par 4: Find the fairway first. Position yourself for a comfortable approach distance."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Course Detail Modal
function CourseDetailModal({ course, onClose, onOpenPlanner }: { course: GolfCourse; onClose: () => void; onOpenPlanner: () => void }) {
  const { t } = useTranslation()
  const country = COURSE_COUNTRIES.find(c => c.code === course.countryCode)
  const priceInfo = PRICE_BADGES[course.priceRange]
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-surface rounded-2xl border border-border shadow-2xl my-8">
        {/* Hero Header */}
        <div className={`h-48 relative rounded-t-2xl overflow-hidden ${TYPE_COLORS[course.type]?.replace('text-', 'bg-').replace('-400', '-900/30') || 'bg-graphite'}`}>
          <div className="absolute inset-0 bg-precision-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-obsidian/50 backdrop-blur hover:bg-obsidian transition-colors"
          >
            <svg className="w-5 h-5 text-ice-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Country & Price */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-3xl drop-shadow-lg">{country?.flag}</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${priceInfo.color}`}>
              {priceInfo.label}
            </span>
          </div>
          
          {/* Course Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div>
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border mb-2 ${TYPE_COLORS[course.type]}`}>
                  {course.type.charAt(0).toUpperCase() + course.type.slice(1)} Course
                </span>
                <h2 className="text-2xl font-display font-bold text-ice-white">{course.name}</h2>
                <p className="text-muted">{course.city}, {course.region && `${course.region}, `}{course.country}</p>
              </div>
              {course.established && (
                <div className="text-right">
                  <p className="text-xs text-muted">Est.</p>
                  <p className="text-xl font-display font-bold text-ice-white">{course.established}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {course.description && (
            <p className="text-ice-white leading-relaxed">{course.description}</p>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-graphite border border-border text-center">
              <p className="text-3xl font-display font-bold text-cyan">{course.par}</p>
              <p className="text-sm text-muted">Par</p>
            </div>
            <div className="p-4 rounded-xl bg-graphite border border-border text-center">
              <p className="text-3xl font-display font-bold text-ice-white">{course.holes}</p>
              <p className="text-sm text-muted">Holes</p>
            </div>
            {course.courseRating && (
              <div className="p-4 rounded-xl bg-graphite border border-border text-center">
                <p className="text-3xl font-display font-bold text-ice-white">{course.courseRating}</p>
                <p className="text-sm text-muted">Course Rating</p>
              </div>
            )}
            {course.slopeRating && (
              <div className="p-4 rounded-xl bg-graphite border border-border text-center">
                <p className="text-3xl font-display font-bold text-ice-white">{course.slopeRating}</p>
                <p className="text-sm text-muted">Slope</p>
              </div>
            )}
          </div>
          
          {/* Length & Designer */}
          <div className="grid md:grid-cols-2 gap-4">
            {course.length && (
              <div className="p-4 rounded-xl bg-graphite border border-border">
                <p className="text-sm text-muted mb-1">Course Length</p>
                <p className="text-xl font-medium text-ice-white">
                  {course.length.toLocaleString()}m / {course.lengthYards?.toLocaleString() || Math.round(course.length * 1.0936).toLocaleString()} yards
                </p>
              </div>
            )}
            {course.designer && (
              <div className="p-4 rounded-xl bg-graphite border border-border">
                <p className="text-sm text-muted mb-1">Course Designer</p>
                <p className="text-xl font-medium text-ice-white">{course.designer}</p>
              </div>
            )}
          </div>
          
          {/* Facilities */}
          {course.facilities && course.facilities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted mb-3">Facilities</h4>
              <div className="flex flex-wrap gap-2">
                {course.facilities.map((facility) => (
                  <span
                    key={facility}
                    className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-ice-white capitalize"
                  >
                    {facility.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Contact & Links */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            {/* Shot Planner Button */}
            <button
              onClick={onOpenPlanner}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Plan Shots
            </button>
            {course.website && (
              <a
                href={course.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-obsidian font-medium hover:bg-cyan/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Visit Website
              </a>
            )}
            {course.phone && (
              <a
                href={`tel:${course.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-ice-white hover:border-cyan/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {course.phone}
              </a>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Courses() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string | 'all'>('all')
  const [selectedType, setSelectedType] = useState<string | 'all'>('all')
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null)
  const [showPlanner, setShowPlanner] = useState(false)
  
  // Filter courses
  const filteredCourses = useMemo(() => {
    let courses = searchQuery ? searchCourses(searchQuery) : ALL_COURSES
    
    if (selectedCountry !== 'all') {
      courses = courses.filter(c => c.countryCode === selectedCountry)
    }
    
    if (selectedType !== 'all') {
      courses = courses.filter(c => c.type === selectedType)
    }
    
    return courses
  }, [searchQuery, selectedCountry, selectedType])
  
  // Stats
  const norwegianCount = NORWEGIAN_COURSES.length
  const internationalCount = INTERNATIONAL_COURSES.length
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ice-white">
          {t('courses.title', 'Golf Courses')}
        </h1>
        <p className="text-muted mt-1">
          {ALL_COURSES.length} courses · {norwegianCount} in Norway · {internationalCount} international
        </p>
      </div>
      
      {/* Featured Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-cyan">{norwegianCount}</p>
          <p className="text-sm text-muted">🇳🇴 Norwegian</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-ice-white">{internationalCount}</p>
          <p className="text-sm text-muted">🌍 International</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-ice-white">
            {ALL_COURSES.filter(c => c.type === 'links').length}
          </p>
          <p className="text-sm text-muted">Links Courses</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-display font-bold text-ice-white">
            {ALL_COURSES.filter(c => c.priceRange === 'luxury').length}
          </p>
          <p className="text-sm text-muted">Bucket List</p>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search courses, cities, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-40"
              >
                <option value="all">All Countries</option>
                {COURSE_COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-36"
              >
                <option value="all">All Types</option>
                <option value="links">Links</option>
                <option value="parkland">Parkland</option>
                <option value="heathland">Heathland</option>
                <option value="desert">Desert</option>
                <option value="mountain">Mountain</option>
                <option value="resort">Resort</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted">
          Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        </p>
        {(searchQuery || selectedCountry !== 'all' || selectedType !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedCountry('all')
              setSelectedType('all')
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>
      
      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course}
            onClick={() => setSelectedCourse(course)}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <Card className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-ice-white font-medium mb-2">No courses found</p>
          <p className="text-muted">Try adjusting your search or filters</p>
        </Card>
      )}
      
      {/* Course Detail Modal */}
      {selectedCourse && !showPlanner && (
        <CourseDetailModal 
          course={selectedCourse} 
          onClose={() => setSelectedCourse(null)}
          onOpenPlanner={() => setShowPlanner(true)}
        />
      )}
      
      {/* Shot Planner */}
      {selectedCourse && showPlanner && (
        <ShotPlanner
          course={selectedCourse}
          onBack={() => setShowPlanner(false)}
        />
      )}
    </div>
  )
}
