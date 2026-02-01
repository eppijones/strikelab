import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useLogin } from '@/api/auth'
import { Button, Input, Card, FadeIn } from '@/components/ui'
import { AuroraGlow, DotGrid, NoiseTexture } from '@/components/ui/backgrounds'

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
    <div className="min-h-screen bg-theme-bg-primary relative overflow-hidden flex items-center justify-center p-4">
      {/* Background effects - Scandinavian subtle */}
      <DotGrid opacity={0.3} animate={false} />
      <AuroraGlow intensity="subtle" position="top" color="sage" />
      <NoiseTexture opacity={0.02} />

      <div className="w-full max-w-md relative">
        {/* Logo & Branding */}
        <FadeIn>
          <div className="text-center mb-10">
            <motion.div 
              className="inline-flex items-center justify-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-theme-accent flex items-center justify-center">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" strokeLinecap="round" />
                </svg>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-3xl font-semibold text-theme-text-primary mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Strike<span className="text-theme-accent">Lab</span>
            </motion.h1>
            
            <motion.p 
              className="text-theme-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {t('brand.tagline')}
            </motion.p>
          </div>
        </FadeIn>

        {/* Login Card */}
        <FadeIn delay={0.3}>
          <Card variant="elevated" padding="lg">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-theme-text-primary">
                {t('auth.welcomeBack', 'Welcome back')}
              </h2>
              <p className="text-sm text-theme-text-muted mt-1">
                Sign in to continue to StrikeLab
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-theme-error bg-theme-error-dim border border-theme-error/20 rounded-xl px-4 py-3"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                variant="primary"
                isLoading={login.isPending}
              >
                {login.isPending ? t('auth.signingIn', 'Signing in...') : t('auth.login')}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-theme-border text-center">
              <p className="text-theme-text-muted text-sm">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-theme-accent hover:underline font-medium">
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </Card>
        </FadeIn>

        {/* Demo hint */}
        <FadeIn delay={0.5}>
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-surface border border-theme-border">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-success animate-pulse" />
              <span className="text-xs text-theme-text-muted">
                Demo: <span className="font-mono text-theme-accent">demo@strikelab.golf</span> / <span className="font-mono text-theme-accent">demo123</span>
              </span>
            </div>
          </motion.div>
        </FadeIn>

        {/* Features hint */}
        <FadeIn delay={0.6}>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '🎯', label: 'Track' },
              { icon: '🧠', label: 'Analyze' },
              { icon: '📈', label: 'Improve' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="p-4 rounded-xl bg-theme-bg-card border border-theme-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <span className="text-xs text-theme-text-muted font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
