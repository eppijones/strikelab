import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSignIn } from '@clerk/clerk-react'
import { useLogin } from '@/api/auth'
import { Panel, SLLogo } from '@/components/ui'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useLogin()
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      if (signIn && isLoaded) {
        const result = await signIn.create({
          strategy: 'password',
          identifier: email,
          password,
        })
        if (result.status === 'complete' && result.createdSessionId) {
          await setActive({ session: result.createdSessionId })
          navigate('/')
          return
        }
        throw new Error('Additional verification is required. Finish it in Clerk, then try again.')
      }
      await login.mutateAsync({ email, password })
      navigate('/')
    } catch (e: any) {
      setErr(e?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/marketing" className="inline-flex items-center gap-2 text-ink hover:text-accent-fg">
            <SLLogo size={32} withWord wordSize={20} condensed />
          </Link>
          <div className="micro mt-4">BAY 01 / SECURE TERMINAL</div>
          <h1 className="display text-[40px] mt-3">
            Welcome <em>back.</em>
          </h1>
        </div>

        <Panel id="AUTH" title="SIGN IN">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="micro block mb-2">{t('auth.email').toUpperCase()}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
                placeholder="you@strikelab.golf"
              />
            </div>
            <div>
              <label className="micro block mb-2">{t('auth.password').toUpperCase()}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {err && <div className="mono text-[11px] text-bad">{err.toUpperCase()}</div>}

            <button
              type="submit"
              disabled={login.isPending || (isLoaded && !signIn)}
              className="w-full bg-accent text-accent-ink py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              {login.isPending ? t('auth.signingIn') : t('auth.login')}
            </button>
          </form>
        </Panel>

        <p className="text-center text-body text-ink-2">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-accent-fg mono uppercase tracking-micro text-[10px]">
            Create →
          </Link>
        </p>
      </div>
    </div>
  )
}
