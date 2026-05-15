import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useClerk, useSignIn, useSignUp } from '@clerk/clerk-react'
import { useRegister } from '@/api/auth'
import { Panel, SLLogo } from '@/components/ui'

const REMEMBERED_EMAIL_KEY = 'strikelab-remembered-email'

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.7 3.3l6.5-6.5C35.3 2.7 30 0.5 24 0.5 14.7 0.5 6.7 5.8 2.8 13.5l7.9 6.1C12.5 13.7 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 7.2-9.4 7.2-16.2z" />
      <path fill="#FBBC05" d="M10.7 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.9-6.1C1.2 16.7.3 20.2.3 24s.9 7.3 2.5 10.5l7.9-6.1z" />
      <path fill="#34A853" d="M24 47.5c6 0 11.1-2 14.8-5.5l-7-5.4c-2 1.3-4.5 2-7.8 2-6.2 0-11.5-4.2-13.3-9.9l-7.9 6.1C6.7 42.2 14.7 47.5 24 47.5z" />
    </svg>
  )
}

function authErrorMessage(error: any) {
  const clerkError = error?.errors?.[0]
  const raw = clerkError?.longMessage || clerkError?.message || error?.message || ''
  const code = clerkError?.code || ''
  const lower = `${code} ${raw}`.toLowerCase()

  if (lower.includes('already') && lower.includes('exist')) {
    return 'You already have an account. Sign in with Google or use your email password.'
  }
  if (lower.includes('verification strategy') || lower.includes('strategy is not valid')) {
    return 'This email is connected with Google. Continue with Google to sign in.'
  }
  return raw || 'Registration failed. Please try again.'
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const register = useRegister()
  const clerk = useClerk()
  const { signUp, setActive, isLoaded } = useSignUp()
  const { signIn } = useSignIn()
  const { isSignedIn } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [socialPending, setSocialPending] = useState(false)
  const [rememberAccount, setRememberAccount] = useState(true)

  useEffect(() => {
    if (!rememberAccount) return
    const trimmed = email.trim()
    if (trimmed) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmed)
    }
  }, [email, rememberAccount])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    if (isSignedIn) {
      navigate('/onboarding', { replace: true })
      return
    }
    if (!verifying && !acceptedLegal) {
      setErr('You must accept the Terms and Privacy Policy to create an account.')
      return
    }
    try {
      if (signUp && isLoaded) {
        if (verifying) {
          const result = await signUp.attemptEmailAddressVerification({ code })
          if (result.status === 'complete' && result.createdSessionId) {
            await setActive({ session: result.createdSessionId })
            if (rememberAccount && email.trim()) {
              localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim())
            }
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
      setErr(authErrorMessage(e))
    }
  }

  async function continueWithGoogle() {
    if (!signIn || !isLoaded) return
    if (isSignedIn) {
      await clerk.signOut()
    }
    setErr(null)
    setSocialPending(true)
    if (rememberAccount && email.trim()) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim())
    }
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
        continueSignIn: true,
        oidcPrompt: 'select_account',
      })
    } catch (e: any) {
      setSocialPending(false)
      setErr(authErrorMessage(e))
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
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={!isLoaded || socialPending}
              className="w-full border border-line-strong bg-bg-2 text-ink py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <GoogleMark />
              <span>{socialPending ? 'CONNECTING GOOGLE...' : 'CONTINUE WITH GOOGLE'}</span>
            </button>
            {isLoaded && isSignedIn && (
              <button
                type="button"
                onClick={() => navigate('/onboarding', { replace: true })}
                className="w-full text-center mono text-[10px] uppercase tracking-micro text-accent-fg hover:text-accent-fg-hover"
              >
                Already signed in? Continue →
              </button>
            )}
            <div className="micro text-center text-ink-3">OR CREATE WITH EMAIL</div>
          </div>
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
            {!verifying && (
              <label className="flex gap-3 text-body text-ink-2 leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className="text-accent-fg hover:text-accent-fg-hover">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-accent-fg hover:text-accent-fg-hover">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}
            {!verifying && (
              <label className="flex gap-3 text-body text-ink-2 leading-relaxed">
                <input
                  type="checkbox"
                  checked={rememberAccount}
                  onChange={(e) => {
                    setRememberAccount(e.target.checked)
                    if (!e.target.checked) {
                      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
                    }
                  }}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>Remember this account on this device.</span>
              </label>
            )}
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
              disabled={register.isPending || (!verifying && !acceptedLegal)}
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
