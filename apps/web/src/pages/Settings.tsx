import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateProfile } from '@/api/auth'
import { useSettingsStore } from '@/stores/settingsStore'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui'

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
  const { language, setLanguage, units, setUnits, theme, setTheme } = useSettingsStore()
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
        <h1 className="text-2xl font-display font-bold text-theme-text-primary">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="text-theme-text-muted mt-1">
          Manage your profile and preferences
        </p>
      </div>
      
      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`relative p-4 rounded-xl border text-center transition-all ${
                  theme === 'dark'
                    ? 'bg-theme-accent-dim border-theme-accent'
                    : 'bg-theme-bg-surface border-theme-border hover:border-theme-accent/30'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#0A0A0F] border border-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#23D5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <p className={`font-medium ${theme === 'dark' ? 'text-theme-accent' : 'text-theme-text-primary'}`}>
                  Dark
                </p>
                <p className="text-xs text-theme-text-muted mt-1">Cyan accents</p>
                {theme === 'dark' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-theme-accent flex items-center justify-center">
                    <svg className="w-3 h-3 text-theme-text-inverted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`relative p-4 rounded-xl border text-center transition-all ${
                  theme === 'light'
                    ? 'bg-theme-accent-dim border-theme-accent'
                    : 'bg-theme-bg-surface border-theme-border hover:border-theme-accent/30'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#F8FAF9] border border-black/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#10A37F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className={`font-medium ${theme === 'light' ? 'text-theme-accent' : 'text-theme-text-primary'}`}>
                  Light
                </p>
                <p className="text-xs text-theme-text-muted mt-1">Golf green accents</p>
                {theme === 'light' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-theme-accent flex items-center justify-center">
                    <svg className="w-3 h-3 text-theme-text-inverted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          
          <div className="p-4 rounded-xl bg-theme-bg-elevated border border-theme-border">
            <p className="text-sm text-theme-text-muted mb-1">Email</p>
            <p className="text-theme-text-primary">{user?.email}</p>
            <p className="text-xs text-theme-text-muted mt-2">Email cannot be changed</p>
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
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
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
                      ? 'bg-theme-accent-dim border-theme-accent'
                      : 'bg-theme-bg-surface border-theme-border hover:border-theme-accent/30'
                  }`}
                >
                  <div>
                    <p className={`font-medium ${practiceFrequency === option.value ? 'text-theme-accent' : 'text-theme-text-primary'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-theme-text-muted">{option.description}</p>
                  </div>
                  {practiceFrequency === option.value && (
                    <div className="w-5 h-5 rounded-full bg-theme-accent flex items-center justify-center">
                      <svg className="w-3 h-3 text-theme-text-inverted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="p-4 rounded-xl bg-gradient-to-r from-theme-accent-dim to-emerald-500/10 border border-theme-accent/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-theme-text-primary font-medium">
                    Predicted to reach {goalHandicap} by{' '}
                    <span className="text-theme-accent">
                      {new Date(Date.now() + weeksToGoal()! * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </p>
                  <p className="text-sm text-theme-text-muted">~{weeksToGoal()} weeks based on your practice frequency</p>
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
            <svg className="w-5 h-5 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Language
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  language === 'en'
                    ? 'bg-theme-accent-dim border-theme-accent text-theme-accent'
                    : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:border-theme-accent/30'
                }`}
              >
                <span className="text-2xl block mb-1">🇬🇧</span>
                <span className="text-sm font-medium">English</span>
              </button>
              <button
                onClick={() => setLanguage('no')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  language === 'no'
                    ? 'bg-theme-accent-dim border-theme-accent text-theme-accent'
                    : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:border-theme-accent/30'
                }`}
              >
                <span className="text-2xl block mb-1">🇳🇴</span>
                <span className="text-sm font-medium">Norsk</span>
              </button>
            </div>
          </div>
          
          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Distance Units
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUnits('yards')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  units === 'yards'
                    ? 'bg-theme-accent-dim border-theme-accent text-theme-accent'
                    : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:border-theme-accent/30'
                }`}
              >
                <span className="text-lg font-display font-bold block">YDS</span>
                <span className="text-sm">Yards</span>
              </button>
              <button
                onClick={() => setUnits('meters')}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  units === 'meters'
                    ? 'bg-theme-accent-dim border-theme-accent text-theme-accent'
                    : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:border-theme-accent/30'
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
