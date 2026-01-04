import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateProfile } from '@/api/auth'
import { useMyBag, useAddClub, type QuickAddClubData } from '@/api/equipment'
import { GOLF_BRANDS, POPULAR_CLUB_MODELS, getBrandById, type GolfBrand } from '@/lib/golfBrands'
import { Button, Card, Input, ScoreRing, Badge } from '@/components/ui'

type Step = 'welcome' | 'handicap' | 'goals' | 'practice' | 'equipment' | 'complete'

const PRACTICE_OPTIONS = [
  { value: 'daily', label: 'Daily', emoji: '🔥', description: 'I practice every day' },
  { value: '4-5x_week', label: '4-5x/week', emoji: '💪', description: 'Serious commitment' },
  { value: '2-3x_week', label: '2-3x/week', emoji: '⚡', description: 'Regular practice' },
  { value: 'weekly', label: 'Weekly', emoji: '📅', description: 'Once a week' },
  { value: 'occasional', label: 'Occasional', emoji: '🌴', description: 'When I can' },
]

const HANDICAP_RANGES = [
  { min: 0, max: 5, label: 'Scratch-5', tier: 'Elite', color: 'text-yellow-400' },
  { min: 5, max: 10, label: '5-10', tier: 'Low', color: 'text-cyan' },
  { min: 10, max: 18, label: '10-18', tier: 'Mid', color: 'text-emerald-400' },
  { min: 18, max: 28, label: '18-28', tier: 'Developing', color: 'text-blue-400' },
  { min: 28, max: 54, label: '28+', tier: 'Beginner', color: 'text-purple-400' },
]

const CLUB_TYPES = [
  { type: 'driver', label: 'Driver', icon: '🏌️' },
  { type: '3_wood', label: '3 Wood', icon: '🪵' },
  { type: '5_wood', label: '5 Wood', icon: '🪵' },
  { type: 'hybrid', label: 'Hybrid', icon: '🔀' },
  { type: 'iron', label: 'Irons', icon: '⛳' },
  { type: 'wedge', label: 'Wedges', icon: '🎯' },
  { type: 'putter', label: 'Putter', icon: '🏒' },
]

interface SelectedClub {
  id: string
  brand_id: string
  model_name: string
  club_type: string
  club_label: string
}

export default function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const updateProfile = useUpdateProfile()
  const { data: bag } = useMyBag()
  const addClub = useAddClub()
  
  const [step, setStep] = useState<Step>('welcome')
  const [handicap, setHandicap] = useState<string>('')
  const [seasonGoal, setSeasonGoal] = useState<string>('')
  const [dreamGoal, setDreamGoal] = useState<string>('')
  const [practiceFrequency, setPracticeFrequency] = useState<string>('')
  
  // Equipment step state
  const [selectedClubs, setSelectedClubs] = useState<SelectedClub[]>([])
  const [addingClub, setAddingClub] = useState(false)
  const [clubStep, setClubStep] = useState<'brand' | 'type' | 'model'>('brand')
  const [selectedBrand, setSelectedBrand] = useState<GolfBrand | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [clubLabel, setClubLabel] = useState('')
  const [savingClubs, setSavingClubs] = useState(false)
  
  const getHandicapTier = (hcp: number) => {
    return HANDICAP_RANGES.find(r => hcp >= r.min && hcp < r.max) || HANDICAP_RANGES[4]
  }
  
  const handleAddClubToBag = () => {
    if (!selectedBrand || !selectedType || !selectedModel) return
    
    const newClub: SelectedClub = {
      id: `temp-${Date.now()}`,
      brand_id: selectedBrand.id,
      model_name: selectedModel,
      club_type: selectedType,
      club_label: clubLabel || selectedModel,
    }
    
    setSelectedClubs([...selectedClubs, newClub])
    
    // Reset add club flow
    setAddingClub(false)
    setClubStep('brand')
    setSelectedBrand(null)
    setSelectedType(null)
    setSelectedModel('')
    setClubLabel('')
  }
  
  const handleRemoveClub = (clubId: string) => {
    setSelectedClubs(selectedClubs.filter(c => c.id !== clubId))
  }
  
  const handleCancelAddClub = () => {
    setAddingClub(false)
    setClubStep('brand')
    setSelectedBrand(null)
    setSelectedType(null)
    setSelectedModel('')
    setClubLabel('')
  }
  
  const handleComplete = async () => {
    try {
      setSavingClubs(true)
      
      // Save clubs if any were added and bag exists
      if (selectedClubs.length > 0 && bag) {
        for (const club of selectedClubs) {
          await addClub.mutateAsync({
            bagId: bag.id,
            data: {
              brand_id: club.brand_id,
              model_name: club.model_name,
              club_type: club.club_type,
              club_label: club.club_label,
            }
          })
        }
      }
      
      await updateProfile.mutateAsync({
        handicap_index: handicap ? parseFloat(handicap) : undefined,
        goal_handicap: seasonGoal ? parseFloat(seasonGoal) : undefined,
        dream_handicap: dreamGoal ? parseFloat(dreamGoal) : undefined,
        practice_frequency: practiceFrequency || undefined,
        onboarding_completed: true,
      })
      navigate('/')
    } catch (error) {
      console.error('Failed to save onboarding:', error)
    } finally {
      setSavingClubs(false)
    }
  }
  
  // Improvement rates (strokes per week) based on quality practice with tracking
  // These are optimistic but achievable rates for dedicated golfers using data-driven practice
  // Research: USGA handicap data + MyGolfSpy studies show avg golfer improves 1-3 strokes/year
  // With structured practice & tracking, improvement can be 2-5x faster
  const getWeeklyRate = (freq: string) => ({
    'daily': 0.18,        // ~9 strokes/year - elite commitment with full tracking
    '4-5x_week': 0.12,    // ~6 strokes/year - serious amateur with structure
    '2-3x_week': 0.08,    // ~4 strokes/year - dedicated weekend warrior
    'weekly': 0.04,       // ~2 strokes/year - consistent single session
    'occasional': 0.02,   // ~1 stroke/year - maintenance mode
  }[freq] || 0.06)
  
  const calculateJourney = () => {
    if (!handicap || !practiceFrequency) return null
    const current = parseFloat(handicap)
    const season = seasonGoal ? parseFloat(seasonGoal) : null
    const dream = dreamGoal ? parseFloat(dreamGoal) : null
    const weeklyRate = getWeeklyRate(practiceFrequency)
    
    // Calculate time to season goal
    const seasonWeeks = season && season < current 
      ? Math.ceil((current - season) / weeklyRate)
      : null
    
    // Calculate time to dream goal  
    const dreamWeeks = dream && dream < current
      ? Math.ceil((current - dream) / weeklyRate)
      : null
    
    // Generate milestones (every 2-3 strokes or significant thresholds)
    const milestones: { handicap: number; weeks: number; label: string }[] = []
    const thresholds = [36, 28, 20, 18, 15, 12, 10, 8, 5, 3, 0]
    
    for (const threshold of thresholds) {
      if (threshold < current && (!dream || threshold >= dream)) {
        const weeksToThreshold = Math.ceil((current - threshold) / weeklyRate)
        let label = ''
        if (threshold === 0) label = '🏆 Scratch golfer!'
        else if (threshold <= 5) label = '🌟 Single digit elite'
        else if (threshold <= 10) label = '⭐ Single digits!'
        else if (threshold <= 15) label = '💪 Breaking 15'
        else if (threshold <= 20) label = '📈 Breaking 20'
        else label = `Getting to ${threshold}`
        
        milestones.push({ handicap: threshold, weeks: weeksToThreshold, label })
      }
    }
    
    return { seasonWeeks, dreamWeeks, milestones, weeklyRate }
  }
  
  const journey = calculateJourney()
  
  // Get encouraging message based on goals
  const getEncouragingMessage = () => {
    if (!handicap || !practiceFrequency) return null
    const current = parseFloat(handicap)
    const season = seasonGoal ? parseFloat(seasonGoal) : null
    
    if (season && journey?.seasonWeeks) {
      const months = Math.ceil(journey.seasonWeeks / 4.3)
      if (months <= 6) {
        return {
          title: "That's an ambitious but achievable goal! 💪",
          subtitle: "With focused practice and tracking, you're set up for success."
        }
      } else if (months <= 12) {
        return {
          title: "A solid, realistic target! 🎯",
          subtitle: "Consistency beats intensity. You've got this."
        }
      } else {
        return {
          title: "Playing the long game - smart approach! 🧠",
          subtitle: "Sustainable improvement leads to lasting results."
        }
      }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-theme-bg-primary bg-precision-grid flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['welcome', 'handicap', 'goals', 'practice', 'equipment', 'complete'].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === s 
                  ? 'w-8 bg-theme-accent' 
                  : ['welcome', 'handicap', 'goals', 'practice', 'equipment', 'complete'].indexOf(step) > i
                    ? 'bg-theme-accent/50'
                    : 'bg-theme-bg-secondary'
              }`}
            />
          ))}
        </div>
        
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-theme-bg-secondary border border-theme-border flex items-center justify-center relative">
                <div className="absolute w-12 h-12 rounded-full border border-theme-text-muted/20" />
                <div className="absolute w-9 h-9 rounded-full border border-theme-text-muted/15" />
                <div className="absolute w-6 h-6 rounded-full border border-theme-text-muted/10" />
                <div className="absolute w-3 h-3 rounded-full bg-theme-accent shadow-glow translate-x-0.5 -translate-y-0.5" />
              </div>
            </div>
            
            <h1 className="text-4xl font-display font-bold text-theme-text-primary mb-4">
              Welcome to Strike<span className="text-theme-accent">Lab</span>
            </h1>
            <p className="text-xl text-theme-text-muted mb-2">
              Hi {user?.displayName?.split(' ')[0] || 'Golfer'}! 👋
            </p>
            <p className="text-theme-text-muted max-w-md mx-auto mb-8">
              Let's set up your profile so we can give you personalized coaching 
              and help you reach your goals faster.
            </p>
            
            <Card padding="lg" className="text-left mb-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <span className="text-3xl block mb-2">🎯</span>
                  <p className="text-sm text-theme-text-primary font-medium">Track Progress</p>
                  <p className="text-xs text-theme-text-muted">See your improvement</p>
                </div>
                <div className="p-4">
                  <span className="text-3xl block mb-2">🤖</span>
                  <p className="text-sm text-theme-text-primary font-medium">AI Coach</p>
                  <p className="text-xs text-theme-text-muted">Personalized advice</p>
                </div>
                <div className="p-4">
                  <span className="text-3xl block mb-2">📈</span>
                  <p className="text-sm text-theme-text-primary font-medium">Predict</p>
                  <p className="text-xs text-theme-text-muted">Future handicap</p>
                </div>
              </div>
            </Card>
            
            <Button size="lg" onClick={() => setStep('handicap')} className="px-12">
              Let's Get Started →
            </Button>
          </div>
        )}
        
        {/* Handicap Step */}
        {step === 'handicap' && (
          <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="text-5xl mb-6 block">⛳</span>
            <h2 className="text-3xl font-display font-bold text-ice-white mb-3">
              What's your current handicap?
            </h2>
            <p className="text-muted mb-8">
              This helps us personalize your training and track your improvement
            </p>
            
            <Card padding="lg" className="mb-6">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="54"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                    placeholder="12.4"
                    className="w-40 text-center text-5xl font-display font-bold bg-transparent border-b-2 border-border focus:border-cyan text-ice-white placeholder:text-muted/30 focus:outline-none py-4"
                  />
                </div>
                
                {handicap && (
                  <div className="text-center animate-in fade-in duration-300">
                    <p className={`text-lg font-medium ${getHandicapTier(parseFloat(handicap)).color}`}>
                      {getHandicapTier(parseFloat(handicap)).tier} Player
                    </p>
                    <p className="text-sm text-muted">
                      Handicap range: {getHandicapTier(parseFloat(handicap)).label}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Quick select buttons */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['5', '10', '15', '20', '25', '30'].map((hcp) => (
                  <button
                    key={hcp}
                    onClick={() => setHandicap(hcp)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      handicap === hcp
                        ? 'bg-cyan text-obsidian font-medium'
                        : 'bg-surface border border-border text-muted hover:border-cyan/30'
                    }`}
                  >
                    {hcp}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setHandicap('')}
                className="text-sm text-muted hover:text-cyan mt-4 transition-colors"
              >
                I don't know my handicap yet
              </button>
            </Card>
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep('welcome')} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep('goals')} className="flex-1">
                Next →
              </Button>
            </div>
          </div>
        )}
        
        {/* Goals Step */}
        {step === 'goals' && (
          <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="text-5xl mb-6 block">🎯</span>
            <h2 className="text-3xl font-display font-bold text-ice-white mb-3">
              Set your targets
            </h2>
            <p className="text-muted mb-8">
              Dream big, but let's also set a realistic season goal
            </p>
            
            {/* Season Goal */}
            <Card padding="lg" className="mb-4">
              <div className="text-left mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📅</span>
                  <h3 className="font-medium text-ice-white">This Season's Target</h3>
                </div>
                <p className="text-sm text-muted">Where do you want to be by end of {new Date().getFullYear()}?</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={handicap ? parseFloat(handicap) : 54}
                  value={seasonGoal}
                  onChange={(e) => setSeasonGoal(e.target.value)}
                  placeholder={handicap ? String(Math.max(0, parseFloat(handicap) - 3)) : '10.0'}
                  className="w-32 text-center text-4xl font-display font-bold bg-transparent border-b-2 border-border focus:border-cyan text-ice-white placeholder:text-muted/30 focus:outline-none py-2"
                />
                
                {/* Quick suggestions */}
                {handicap && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {[2, 3, 4, 5].map((diff) => {
                      const suggested = Math.max(0, parseFloat(handicap) - diff)
                      return (
                        <button
                          key={diff}
                          onClick={() => setSeasonGoal(suggested.toFixed(1))}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            seasonGoal === suggested.toFixed(1)
                              ? 'bg-cyan text-obsidian font-medium'
                              : 'bg-surface border border-border text-muted hover:border-cyan/30'
                          }`}
                        >
                          {suggested.toFixed(1)} (-{diff})
                        </button>
                      )
                    })}
                  </div>
                )}
                
                {handicap && seasonGoal && parseFloat(seasonGoal) < parseFloat(handicap) && (
                  <div className="text-center animate-in fade-in duration-300 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-emerald-400 font-medium">
                      -{(parseFloat(handicap) - parseFloat(seasonGoal)).toFixed(1)} strokes this season
                    </p>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Dream/Milestone Goal */}
            <Card padding="lg" className="mb-6">
              <div className="text-left mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">⭐</span>
                  <h3 className="font-medium text-ice-white">Dream Milestone</h3>
                  <Badge variant="default" size="sm">Optional</Badge>
                </div>
                <p className="text-sm text-muted">Your ultimate aspiration - scratch? Single digits? The sky's the limit.</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={seasonGoal ? parseFloat(seasonGoal) : handicap ? parseFloat(handicap) : 54}
                  value={dreamGoal}
                  onChange={(e) => setDreamGoal(e.target.value)}
                  placeholder="0"
                  className="w-32 text-center text-4xl font-display font-bold bg-transparent border-b-2 border-border focus:border-yellow-400 text-ice-white placeholder:text-muted/30 focus:outline-none py-2"
                />
                
                {/* Dream goal suggestions */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { value: '0', label: '🏆 Scratch' },
                    { value: '5', label: '⭐ +5' },
                    { value: '10', label: '💪 Single Digits' },
                  ].filter(g => !handicap || parseFloat(g.value) < parseFloat(handicap)).map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setDreamGoal(goal.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        dreamGoal === goal.value
                          ? 'bg-yellow-400 text-obsidian font-medium'
                          : 'bg-surface border border-border text-muted hover:border-yellow-400/30'
                      }`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {dreamGoal && (
                <p className="text-center text-sm text-muted mt-4 italic">
                  "Every expert was once a beginner." — Helen Hayes
                </p>
              )}
            </Card>
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep('handicap')} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep('practice')} className="flex-1">
                Next →
              </Button>
            </div>
          </div>
        )}
        
        {/* Practice Frequency Step */}
        {step === 'practice' && (
          <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="text-5xl mb-6 block">🏋️</span>
            <h2 className="text-3xl font-display font-bold text-ice-white mb-3">
              How often do you practice?
            </h2>
            <p className="text-muted mb-8">
              This helps us create a realistic training plan and predict your progress
            </p>
            
            <div className="grid gap-3 mb-8">
              {PRACTICE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPracticeFrequency(option.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    practiceFrequency === option.value
                      ? 'bg-cyan/10 border-cyan shadow-glow-sm'
                      : 'bg-surface border-border hover:border-cyan/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-medium ${practiceFrequency === option.value ? 'text-cyan' : 'text-ice-white'}`}>
                        {option.label}
                      </p>
                      <p className="text-sm text-muted">{option.description}</p>
                    </div>
                    {practiceFrequency === option.value && (
                      <div className="w-6 h-6 rounded-full bg-cyan flex items-center justify-center">
                        <svg className="w-4 h-4 text-obsidian" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep('goals')} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep('equipment')} className="flex-1">
                Next →
              </Button>
            </div>
          </div>
        )}
        
        {/* Equipment Step */}
        {step === 'equipment' && (
          <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="text-5xl mb-6 block">🏌️</span>
            <h2 className="text-3xl font-display font-bold text-ice-white mb-3">
              What's in your bag?
            </h2>
            <p className="text-muted mb-8">
              Add your clubs to track performance by equipment (optional)
            </p>
            
            {!addingClub ? (
              <>
                {/* Selected Clubs List */}
                {selectedClubs.length > 0 && (
                  <div className="mb-6 space-y-2">
                    {selectedClubs.map((club) => {
                      const brand = getBrandById(club.brand_id)
                      return (
                        <div
                          key={club.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {CLUB_TYPES.find(t => t.type === club.club_type)?.icon || '⛳'}
                            </span>
                            <div className="text-left">
                              <p className="text-ice-white font-medium">{club.model_name}</p>
                              <p className="text-xs text-muted">{brand?.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveClub(club.id)}
                            className="p-2 text-muted hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Add Club Button */}
                <Card padding="lg" className="mb-6">
                  <button
                    onClick={() => setAddingClub(true)}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-cyan/50 transition-colors text-center group"
                  >
                    <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">➕</span>
                    <p className="text-muted group-hover:text-cyan transition-colors">
                      {selectedClubs.length === 0 ? 'Add your first club' : 'Add another club'}
                    </p>
                  </button>
                  
                  {selectedClubs.length === 0 && (
                    <p className="text-xs text-muted mt-4 text-center">
                      You can add clubs later from the "My Bag" page
                    </p>
                  )}
                </Card>
              </>
            ) : (
              <Card padding="lg" className="mb-6 text-left">
                {/* Brand Selection */}
                {clubStep === 'brand' && (
                  <div className="animate-in fade-in duration-300">
                    <p className="text-sm font-medium text-ice-white mb-4">Select Brand</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-2">
                      {GOLF_BRANDS.filter(b => b.categories.includes('clubs')).map((brand) => (
                        <button
                          key={brand.id}
                          onClick={() => {
                            setSelectedBrand(brand)
                            setClubStep('type')
                          }}
                          className="p-3 rounded-xl border border-border hover:border-cyan/50 bg-surface hover:bg-cyan/5 transition-all text-center"
                        >
                          <div 
                            className="h-6 mb-1 flex items-center justify-center text-ice-white"
                            dangerouslySetInnerHTML={{ __html: brand.logo }}
                          />
                          <p className="text-xs text-muted truncate">{brand.name}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCancelAddClub}
                      className="mt-4 text-sm text-muted hover:text-cyan transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {/* Club Type Selection */}
                {clubStep === 'type' && selectedBrand && (
                  <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        onClick={() => setClubStep('brand')}
                        className="text-muted hover:text-cyan"
                      >
                        ←
                      </button>
                      <p className="text-sm font-medium text-ice-white">
                        {selectedBrand.name} - Select Type
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {CLUB_TYPES.map((type) => (
                        <button
                          key={type.type}
                          onClick={() => {
                            setSelectedType(type.type)
                            setClubStep('model')
                          }}
                          className="p-4 rounded-xl border border-border hover:border-cyan/50 bg-surface hover:bg-cyan/5 transition-all text-left"
                        >
                          <span className="text-2xl block mb-1">{type.icon}</span>
                          <p className="text-sm text-ice-white">{type.label}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCancelAddClub}
                      className="mt-4 text-sm text-muted hover:text-cyan transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {/* Model Selection */}
                {clubStep === 'model' && selectedBrand && selectedType && (
                  <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        onClick={() => setClubStep('type')}
                        className="text-muted hover:text-cyan"
                      >
                        ←
                      </button>
                      <p className="text-sm font-medium text-ice-white">
                        {selectedBrand.name} {CLUB_TYPES.find(t => t.type === selectedType)?.label}
                      </p>
                    </div>
                    
                    {/* Popular Models */}
                    {POPULAR_CLUB_MODELS[selectedBrand.id]?.filter(m => m.type === selectedType).length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted mb-2">Popular Models</p>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_CLUB_MODELS[selectedBrand.id]
                            ?.filter(m => m.type === selectedType)
                            .map((model) => (
                              <button
                                key={model.name}
                                onClick={() => setSelectedModel(model.name)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                  selectedModel === model.name
                                    ? 'bg-cyan text-obsidian font-medium'
                                    : 'bg-surface border border-border text-muted hover:border-cyan/30'
                                }`}
                              >
                                {model.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom Model Input */}
                    <div className="space-y-3">
                      <Input
                        label="Model Name"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        placeholder="e.g. Stealth 2 Plus"
                      />
                      <Input
                        label="Label (optional)"
                        value={clubLabel}
                        onChange={(e) => setClubLabel(e.target.value)}
                        placeholder="e.g. 7 Iron, 56° Wedge"
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleCancelAddClub}
                        className="flex-1 py-2 text-sm text-muted hover:text-cyan transition-colors"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={handleAddClubToBag}
                        disabled={!selectedModel}
                        className="flex-1"
                      >
                        Add Club
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep('practice')} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep('complete')} className="flex-1">
                {selectedClubs.length > 0 ? 'Next →' : 'Skip for now →'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="text-5xl mb-6 block">🚀</span>
            <h2 className="text-3xl font-display font-bold text-ice-white mb-3">
              Your journey starts now!
            </h2>
            <p className="text-muted mb-8">
              Here's your roadmap to becoming a better golfer
            </p>
            
            <Card padding="lg" className="mb-8">
              {/* Encouraging message */}
              {getEncouragingMessage() && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan/10 to-emerald-500/10 border border-cyan/20">
                  <p className="text-lg font-medium text-ice-white">{getEncouragingMessage()?.title}</p>
                  <p className="text-sm text-muted mt-1">{getEncouragingMessage()?.subtitle}</p>
                </div>
              )}
              
              {/* Goals Overview */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Current */}
                <div className="text-center p-4 rounded-xl bg-graphite">
                  <p className="text-xs text-muted mb-1">Now</p>
                  <p className="text-2xl font-display font-bold text-ice-white">
                    {handicap || '—'}
                  </p>
                  {handicap && (
                    <p className={`text-xs mt-1 ${getHandicapTier(parseFloat(handicap)).color}`}>
                      {getHandicapTier(parseFloat(handicap)).tier}
                    </p>
                  )}
                </div>
                
                {/* Season Goal */}
                <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-emerald-400 mb-1">{new Date().getFullYear()} Goal</p>
                  <p className="text-2xl font-display font-bold text-emerald-400">
                    {seasonGoal || '—'}
                  </p>
                  {journey?.seasonWeeks && (
                    <p className="text-xs text-muted mt-1">
                      ~{Math.ceil(journey.seasonWeeks / 4)} mo
                    </p>
                  )}
                </div>
                
                {/* Dream Goal */}
                <div className="text-center p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                  <p className="text-xs text-yellow-400 mb-1">Dream</p>
                  <p className="text-2xl font-display font-bold text-yellow-400">
                    {dreamGoal || '—'}
                  </p>
                  {dreamGoal && parseFloat(dreamGoal) === 0 && (
                    <p className="text-xs text-muted mt-1">🏆 Scratch</p>
                  )}
                </div>
              </div>
              
              {/* Journey Milestones */}
              {journey?.milestones && journey.milestones.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-ice-white mb-3 text-left">Your milestones along the way</p>
                  <div className="space-y-2">
                    {journey.milestones.slice(0, 4).map((milestone, index) => {
                      const months = Math.ceil(milestone.weeks / 4.3)
                      const targetDate = new Date(Date.now() + milestone.weeks * 7 * 24 * 60 * 60 * 1000)
                      const isFirstMilestone = index === 0
                      
                      return (
                        <div 
                          key={milestone.handicap}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isFirstMilestone 
                              ? 'bg-cyan/10 border border-cyan/30' 
                              : 'bg-surface border border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isFirstMilestone ? 'bg-cyan text-obsidian' : 'bg-graphite text-muted'
                            }`}>
                              {milestone.handicap}
                            </div>
                            <span className={`text-sm ${isFirstMilestone ? 'text-cyan font-medium' : 'text-muted'}`}>
                              {milestone.label}
                            </span>
                          </div>
                          <span className={`text-sm ${isFirstMilestone ? 'text-cyan' : 'text-muted'}`}>
                            {months <= 12 
                              ? `~${months} month${months > 1 ? 's' : ''}`
                              : `~${Math.round(months / 12)} year${Math.round(months / 12) > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )
                    })}
                    {journey.milestones.length > 4 && (
                      <p className="text-xs text-muted text-center py-2">
                        +{journey.milestones.length - 4} more milestones on your journey
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Practice Commitment */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {PRACTICE_OPTIONS.find(p => p.value === practiceFrequency)?.emoji || '⛳'}
                  </span>
                  <div className="text-left">
                    <p className="text-ice-white font-medium">
                      {PRACTICE_OPTIONS.find(p => p.value === practiceFrequency)?.label || 'Practice'} practice
                    </p>
                    <p className="text-xs text-muted">
                      ~{Math.round((journey?.weeklyRate || 0.06) * 52)} strokes/year potential
                    </p>
                  </div>
                </div>
                <Badge variant="cyan" size="sm">Committed</Badge>
              </div>
              
              {/* Equipment Summary */}
              {selectedClubs.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">🎒</span>
                    <p className="text-ice-white font-medium">Your Bag</p>
                    <Badge variant="default" size="sm">{selectedClubs.length} clubs</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedClubs.slice(0, 4).map((club) => {
                      const brand = getBrandById(club.brand_id)
                      return (
                        <div 
                          key={club.id}
                          className="px-3 py-1.5 rounded-lg bg-graphite border border-border flex items-center gap-2"
                        >
                          {brand && (
                            <div 
                              className="w-8 h-4 flex items-center"
                              style={{ color: brand.color }}
                              dangerouslySetInnerHTML={{ __html: brand.logo }}
                            />
                          )}
                          <span className="text-xs text-muted">{club.club_label || club.model_name}</span>
                        </div>
                      )
                    })}
                    {selectedClubs.length > 4 && (
                      <div className="px-3 py-1.5 rounded-lg bg-graphite border border-border text-xs text-muted">
                        +{selectedClubs.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Motivational footer */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted italic">
                  "The most important shot in golf is the next one." — Ben Hogan
                </p>
              </div>
            </Card>
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep('equipment')} className="flex-1">
                ← Back
              </Button>
              <Button 
                onClick={handleComplete} 
                isLoading={updateProfile.isPending || savingClubs}
                className="flex-1"
              >
                Let's Go! 🚀
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
