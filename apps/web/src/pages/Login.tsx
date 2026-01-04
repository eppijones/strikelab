import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLogin } from '@/api/auth'
import { Button, Input, Card } from '@/components/ui'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login.mutateAsync({ email, password })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-obsidian bg-precision-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-graphite border border-border flex items-center justify-center relative">
              <div className="absolute w-8 h-8 rounded-full border border-white/10" />
              <div className="absolute w-6 h-6 rounded-full border border-white/8" />
              <div className="absolute w-4 h-4 rounded-full border border-white/6" />
              <div className="absolute w-2 h-2 rounded-full bg-cyan shadow-glow translate-x-0.5 -translate-y-0.5" />
            </div>
            <span className="font-display font-bold text-2xl text-ice-white">
              Strike<span className="text-cyan">Lab</span>
            </span>
          </div>
          <p className="text-muted">{t('brand.tagline')}</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-button px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={login.isPending}
            >
              {t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted text-sm">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-cyan hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo login hint */}
        <p className="text-center text-muted text-xs mt-4">
          Demo: demo@strikelab.golf / demo123
        </p>
      </div>
    </div>
  )
}
