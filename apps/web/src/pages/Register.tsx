import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRegister } from '@/api/auth'
import { Button, Input, Card } from '@/components/ui'
import { useSettingsStore } from '@/stores/settingsStore'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const register = useRegister()
  const language = useSettingsStore((state) => state.language)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      await register.mutateAsync({
        email,
        password,
        display_name: displayName,
        language,
        units: 'yards',
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-theme-bg-primary bg-precision-grid flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-theme-bg-secondary border border-theme-border flex items-center justify-center relative">
              <div className="absolute w-8 h-8 rounded-full border border-theme-text-muted/20" />
              <div className="absolute w-6 h-6 rounded-full border border-theme-text-muted/15" />
              <div className="absolute w-4 h-4 rounded-full border border-theme-text-muted/10" />
              <div className="absolute w-2 h-2 rounded-full bg-theme-accent shadow-glow translate-x-0.5 -translate-y-0.5" />
            </div>
            <span className="font-display font-bold text-2xl text-theme-text-primary">
              Strike<span className="text-theme-accent">Lab</span>
            </span>
          </div>
          <p className="text-theme-text-muted">{t('brand.secondary')}</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('auth.displayName')}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />

            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-sm text-theme-error bg-theme-error-dim border border-theme-error/30 rounded-button px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={register.isPending}
            >
              {t('auth.register')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-theme-text-muted text-sm">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-theme-accent hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
