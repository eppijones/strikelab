import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateProfile } from '@/api/auth'
import { useSettingsStore } from '@/stores/settingsStore'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge } from '@/components/ui'

const PRACTICE_OPTIONS = [
  { value: 'daily', label: 'Daily (7x/week)', description: 'Committed to daily practice' },
  { value: '4-5x_week', label: '4-5 times/week', description: 'Serious commitment' },
  { value: '2-3x_week', label: '2-3 times/week', description: 'Regular practice' },
  { value: 'weekly', label: 'Once a week', description: 'Weekend golfer' },
  { value: 'occasional', label: 'Occasional', description: 'When time allows' },
]

export default function Settings() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { language, setLanguage, units, setUnits } = useSettingsStore()
  const updateProfile = useUpdateProfile()
  
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [handicapIndex, setHandicapIndex] = useState(user?.handicapIndex?.toString() || '')
  const [goalHandicap, setGoalHandicap] = useState(user?.goalHandicap?.toString() || '')
  const [practiceFrequency, setPracticeFrequency] = useState(user?.practiceFrequency || '')
  const [saved, setSaved] = useState(false)
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName)
      setHandicapIndex(user.handicapIndex?.toString() || '')
      setGoalHandicap(user.goalHandicap?.toString() || '')
      setPracticeFrequency(user.practiceFrequency || '')
    }
  }, [user])
  
  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        handicap_index: handicapIndex ? parseFloat(handicapIndex) : undefined,
        goal_handicap: goalHandicap ? parseFloat(goalHandicap) : undefined,
        practice_frequency: practiceFrequency || undefined,
        language,
        units,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }
  
  // Calculate prediction
  const weeksToGoal = () => {
    if (!handicapIndex || !goalHandicap || !practiceFrequency) return null
    const current = parseFloat(handicapIndex)
    const goal = parseFloat(goalHandicap)
    if (goal >= current) return null
    
    const diff = current - goal
    const weeklyRate: Record<string, number> = {
      'daily': 0.15,
      '4-5x_week': 0.1,
      '2-3x_week': 0.06,
      'weekly': 0.03,
      'occasional': 0.01,
    }
    return Math.ceil(diff / (weeklyRate[practiceFrequency] || 0.03))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ice-white">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="text-muted mt-1">
          Manage your profile and preferences
        </p>
      </div>
      
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
          
          <div className="p-4 rounded-xl bg-graphite/50 border border-border">
            <p className="text-sm text-muted mb-1">Email</p>
            <p className="text-ice-white">{user?.email}</p>
            <p className="text-xs text-muted mt-2">Email cannot be changed</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Golf Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⛳</span>
            Golf Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Current Handicap"
              type="number"
              step="0.1"
              min="0"
              max="54"
              value={handicapIndex}
              onChange={(e) => setHandicapIndex(e.target.value)}
              placeholder="12.4"
            />
            
            <Input
              label="Goal Handicap"
              type="number"
              step="0.1"
              min="0"
              max={handicapIndex ? parseFloat(handicapIndex) : 54}
              value={goalHandicap}
              onChange={(e) => setGoalHandicap(e.target.value)}
              placeholder="8.0"
            />
          </div>
          
          {/* Practice Frequency */}
          <div>
            <label className="block text-sm font-medium text-ice-white mb-2">
              Practice Frequency
            </label>
            <div className="grid gap-2">
              {PRACTICE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPracticeFrequency(option.value)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    practiceFrequency === option.value
                      ? 'bg-cyan/10 border-cyan'
                      : 'bg-surface border-border hover:border-cyan/30'
                  }`}
                >
                  <div>
                    <p className={`font-medium ${practiceFrequency === option.value ? 'text-cyan' : 'text-ice-white'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-muted">{option.description}</p>
                  </div>
                  {practiceFrequency === option.value && (
                    <div className="w-5 h-5 rounded-full bg-cyan flex items-center justify-center">
                      <svg className="w-3 h-3 text-obsidian" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Goal Prediction */}
          {weeksToGoal() && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan/10 to-emerald-500/10 border border-cyan/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-ice-white font-medium">
                    Predicted to reach {goalHandicap} by{' '}
                    <span className="text-cyan">
                      {new Date(Date.now() + weeksToGoal()! * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </p>
                  <p className="text-sm text-muted">~{weeksToGoal()} weeks based on your practice frequency</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-ice-white mb-2">
              Language
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  language === 'en'
                    ? 'bg-cyan/10 border-cyan text-cyan'
                    : 'bg-surface border-border text-muted hover:border-cyan/30'
                }`}
              >
                <span className="text-2xl block mb-1">🇬🇧</span>
                <span className="text-sm font-medium">English</span>
              </button>
              <button
                onClick={() => setLanguage('no')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  language === 'no'
                    ? 'bg-cyan/10 border-cyan text-cyan'
                    : 'bg-surface border-border text-muted hover:border-cyan/30'
                }`}
              >
                <span className="text-2xl block mb-1">🇳🇴</span>
                <span className="text-sm font-medium">Norsk</span>
              </button>
            </div>
          </div>
          
          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-ice-white mb-2">
              Distance Units
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUnits('yards')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  units === 'yards'
                    ? 'bg-cyan/10 border-cyan text-cyan'
                    : 'bg-surface border-border text-muted hover:border-cyan/30'
                }`}
              >
                <span className="text-lg font-display font-bold block">YDS</span>
                <span className="text-sm">Yards</span>
              </button>
              <button
                onClick={() => setUnits('meters')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  units === 'meters'
                    ? 'bg-cyan/10 border-cyan text-cyan'
                    : 'bg-surface border-border text-muted hover:border-cyan/30'
                }`}
              >
                <span className="text-lg font-display font-bold block">M</span>
                <span className="text-sm">Meters</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleSave} 
          isLoading={updateProfile.isPending}
          className="flex-1"
        >
          {saved ? '✓ Saved!' : 'Save Changes'}
        </Button>
        {saved && (
          <Badge variant="success" className="animate-in fade-in">
            Changes saved successfully
          </Badge>
        )}
      </div>
      
      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <p className="text-muted text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="secondary" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
