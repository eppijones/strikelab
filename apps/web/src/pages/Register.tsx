import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSignUp } from '@clerk/clerk-react'
import { useRegister } from '@/api/auth'
import { Panel, SLLogo } from '@/components/ui'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const register = useRegister()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      if (signUp && isLoaded) {
        if (verifying) {
          const result = await signUp.attemptEmailAddressVerification({ code })
          if (result.status === 'complete' && result.createdSessionId) {
            await setActive({ session: result.createdSessionId })
            navigate('/onboarding')
            return
          }
          throw new Error('Verification is not complete yet.')
        }

        await signUp.create({
          emailAddress: email,
          password,
          firstName: displayName,
          legalAccepted: true,
        })
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setVerifying(true)
        return
      }
      await register.mutateAsync({ display_name: displayName, email, password })
      navigate('/onboarding')
    } catch (e: any) {
      setErr(e?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/marketing" className="inline-flex items-center gap-2 text-ink hover:text-accent-fg">
            <SLLogo size={32} withWord wordSize={20} condensed />
          </Link>
          <div className="micro mt-4">BAY 01 / NEW PLAYER</div>
          <h1 className="display text-[40px] mt-3">
            Create <em>account.</em>
          </h1>
        </div>

        <Panel id="REG" title="REGISTER">
          <form onSubmit={onSubmit} className="space-y-4">
            {!verifying && <div>
              <label className="micro block mb-2">{t('auth.displayName').toUpperCase()}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
              />
            </div>}
            {!verifying && <div>
              <label className="micro block mb-2">{t('auth.email').toUpperCase()}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
              />
            </div>}
            {!verifying && <div>
              <label className="micro block mb-2">{t('auth.password').toUpperCase()}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
              />
            </div>}
            {verifying && (
              <div>
                <label className="micro block mb-2">EMAIL CODE</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
                />
                <p className="text-body text-ink-3 mt-2">
                  Check your email and enter the verification code.
                </p>
              </div>
            )}
            {err && <div className="mono text-[11px] text-bad">{err.toUpperCase()}</div>}
            <button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-accent text-accent-ink py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              {register.isPending ? t('auth.creatingAccount') : verifying ? 'VERIFY EMAIL' : t('auth.register')}
            </button>
          </form>
        </Panel>

        <p className="text-center text-body text-ink-2">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-accent-fg mono uppercase tracking-micro text-[10px]">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
