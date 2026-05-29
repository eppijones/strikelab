import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { StrikelabLogo } from '@/landing/brand'
import {
  DAY_FRAMES,
  Eyebrow,
  VariantConstellation,
  VariantDayInThree,
  VariantNumbers,
  VariantSignature,
} from '@/landing/landing-variants'
import { SL } from '@/landing/tokens'

const APP_STORE_URL = 'https://apps.apple.com/app/strikelab-caddie/id0000000000'
const INSTAGRAM_URL = 'https://www.instagram.com/strikelab.golf'

type Locale = 'no' | 'en'
type VariantId = 'signature' | 'day' | 'numbers' | 'constellation'
type HeadlineMode = 'static' | 'rotating'

const COPY = {
  no: {
    login: 'Logg inn',
    eyebrow: 'JOIN STRIKELAB',
    h1a: 'All golfen din',
    h1b: 'på ett sted.',
    sub: 'Gratis scorekort. Ingen abonnement. Laget av golfere, for golfere.',
    follow: 'Følg oss på Instagram',
    download: 'Last ned i App Store',
    downloadTop: 'Last ned i',
    downloadBig: 'App Store',
    teeCta: 'StrikeLab Tee · Live demo',
    feats: ['Scorekort, gjort skikkelig.', 'Trackman + Toppgolf range import.', 'Bag som lærer av slagene dine.'],
  },
  en: {
    login: 'Sign in',
    eyebrow: 'JOIN STRIKELAB',
    h1a: 'All your golf',
    h1b: 'in one place.',
    sub: 'Free scorecards. No subscription. Made by golfers, for golfers.',
    follow: 'Follow us on Instagram',
    download: 'Download on the App Store',
    downloadTop: 'Download on the',
    downloadBig: 'App Store',
    teeCta: 'StrikeLab Tee · Live demo',
    feats: ['Scorecards, done right.', 'Trackman + Topgolf range import.', 'A bag that learns from your shots.'],
  },
} as const

function copyForVariant(
  t: (typeof COPY)['no'],
  variant: VariantId,
  frame: number,
  mode: HeadlineMode,
  locale: Locale,
) {
  if (variant !== 'day' || mode !== 'rotating') return { h1a: t.h1a, h1b: t.h1b, sub: t.sub }
  const f = DAY_FRAMES[frame]
  const langKey = locale === 'no' ? 'no' : 'en'
  const headline = f.headline[langKey]
  const parts = headline.split(',')
  return {
    h1a: `${parts[0]},`,
    h1b: parts.slice(1).join(',').trim(),
    sub: f.sub[langKey],
  }
}

function AppStoreBadge({ height = 54, t }: { height?: number; t: (typeof COPY)['no'] }) {
  const W = (height / 56) * 168
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t.downloadTop} ${t.downloadBig}`}
      style={{ display: 'inline-block', lineHeight: 0 }}
    >
      <svg viewBox="0 0 168 56" width={W} height={height} style={{ display: 'block' }}>
        <rect x="0" y="0" width="168" height="56" rx="10" fill="#000" />
        <rect x="0.5" y="0.5" width="167" height="55" rx="9.5" fill="none" stroke="rgba(255,255,255,0.08)" />
        <g transform="translate(16, 13)">
          <path
            fill="#fff"
            d="M14.6 13.7c-.02-2.1 1.72-3.12 1.8-3.17-.98-1.43-2.5-1.62-3.04-1.65-1.29-.13-2.52.76-3.18.76-.68 0-1.68-.74-2.76-.72-1.42.02-2.73.82-3.46 2.09-1.47 2.55-.38 6.34 1.06 8.41.7 1.01 1.55 2.15 2.62 2.11 1.05-.04 1.45-.68 2.7-.68 1.27 0 1.62.68 2.72.66 1.13-.02 1.84-1.03 2.52-2.04.8-1.18 1.13-2.31 1.15-2.37-.03-.01-2.2-.84-2.22-3.33zM12.5 7.16c.57-.7.96-1.65.86-2.6-.83.04-1.83.55-2.42 1.25-.53.62-1 1.6-.88 2.52.92.07 1.86-.47 2.44-1.17z"
          />
        </g>
        <text
          x="46"
          y="22"
          fill="#fff"
          fontFamily="-apple-system, 'SF Pro Display', Helvetica, Arial"
          fontSize="9.5"
          letterSpacing="0.2"
        >
          {t.downloadTop}
        </text>
        <text
          x="46"
          y="42"
          fill="#fff"
          fontFamily="-apple-system, 'SF Pro Display', Helvetica, Arial"
          fontSize="20"
          fontWeight="600"
          letterSpacing="-0.4"
        >
          {t.downloadBig}
        </text>
      </svg>
    </a>
  )
}

function ArrowGlyph({ size = 14, color = 'currentColor', strokeWidth = 1.7 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InstagramGlyph({ size = 14, color = 'currentColor', strokeWidth = 1.5 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="17.5" cy="6.5" r="0.9" fill={color} />
    </svg>
  )
}

function TopBar({
  locale,
  onLocaleChange,
  t,
}: {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  t: (typeof COPY)['no']
}) {
  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 40px',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }} aria-label="StrikeLab home">
        <StrikelabLogo size={22} />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'inline-flex',
            border: `1px solid ${SL.hairline}`,
            borderRadius: 999,
            padding: 2,
            background: 'rgba(251,250,246,0.55)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {(['no', 'en'] as const).map((L) => (
            <button
              key={L}
              type="button"
              onClick={() => onLocaleChange(L)}
              style={{
                appearance: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 9px',
                borderRadius: 999,
                background: locale === L ? SL.ink : 'transparent',
                color: locale === L ? SL.surface : SL.graphite,
                fontFamily: '"Geist", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 10.5,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              {L}
            </button>
          ))}
        </div>
        <Link
          to="/login"
          style={{
            fontFamily: '"Geist", system-ui, sans-serif',
            fontSize: 13,
            color: SL.ink2,
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${SL.hairline}`,
            background: 'rgba(251,250,246,0.55)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {t.login}
        </Link>
      </div>
    </header>
  )
}

function Hero({
  locale,
  t,
  variant,
}: {
  locale: Locale
  t: (typeof COPY)['no']
  variant: VariantId
}) {
  const [dayFrame, setDayFrame] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const headlineMode: HeadlineMode = 'static'

  useEffect(() => {
    if (variant === 'numbers' || variant === 'constellation') {
      const id = setInterval(() => setCycleKey((k) => k + 1), 7200)
      return () => clearInterval(id)
    }
  }, [variant])

  const headlines = copyForVariant(t, variant, dayFrame, headlineMode, locale)
  const isNumbers = variant === 'numbers'

  return (
    <main
      style={{
        height: '100vh',
        width: '100vw',
        display: 'grid',
        gridTemplateColumns: isNumbers ? 'minmax(0, 0.85fr) minmax(0, 1.15fr)' : 'minmax(0, 1fr) minmax(0, 1.05fr)',
        position: 'relative',
        background: `
        radial-gradient(ellipse 600px 400px at 12% 88%, rgba(26,61,46,0.08), transparent 60%),
        radial-gradient(ellipse 500px 350px at 90% 12%, rgba(232,181,71,0.10), transparent 60%),
        ${SL.bg}
      `,
      }}
    >
      <section
        style={{
          padding: '110px 56px 70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 720,
        }}
      >
        <Eyebrow>{t.eyebrow}</Eyebrow>

        <h1
          style={{
            fontFamily: '"Newsreader", Georgia, serif',
            fontSize: 'clamp(54px, 6.2vw, 96px)',
            fontWeight: 400,
            letterSpacing: -3.2,
            lineHeight: 0.95,
            margin: '24px 0 0',
            color: SL.ink,
            textWrap: 'balance',
          }}
        >
          {headlines.h1a}
          <br />
          <span style={{ fontStyle: 'italic', color: SL.moss, fontWeight: 400 }}>{headlines.h1b}</span>
        </h1>

        <p
          style={{
            fontFamily: '"Newsreader", Georgia, serif',
            fontSize: 'clamp(17px, 1.5vw, 21px)',
            fontStyle: 'italic',
            color: SL.ink2,
            lineHeight: 1.45,
            margin: '24px 0 0',
            maxWidth: 540,
          }}
        >
          {headlines.sub}
        </p>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '28px 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 520,
          }}
        >
          {t.feats.map((f, i) => (
            <li
              key={f}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: 15,
                color: SL.ink2,
              }}
            >
              <span
                style={{
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 11,
                  color: SL.graphite,
                  letterSpacing: 0.4,
                  minWidth: 22,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <AppStoreBadge height={54} t={t} />
          <Link
            to="/tee"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              height: 54,
              padding: '0 22px',
              borderRadius: 10,
              background: 'transparent',
              border: `1px solid ${SL.ink}`,
              color: SL.ink,
              fontFamily: '"Geist", system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {t.teeCta}
            <ArrowGlyph size={14} color={SL.ink} strokeWidth={1.7} />
          </Link>
        </div>
      </section>

      <section style={{ position: 'relative', padding: '90px 24px 70px' }}>
        {variant === 'signature' && <VariantSignature lang={locale} t={t} />}
        {variant === 'day' && (
          <VariantDayInThree lang={locale} t={t} frame={dayFrame} setFrame={setDayFrame} />
        )}
        {variant === 'numbers' && <VariantNumbers lang={locale} t={t} cycleKey={cycleKey} />}
        {variant === 'constellation' && <VariantConstellation lang={locale} t={t} cycleKey={cycleKey} />}
      </section>

      <footer
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '18px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 11,
          color: SL.graphite,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          borderTop: `1px solid ${SL.hairline2}`,
          background: 'rgba(242,237,224,0.55)',
          backdropFilter: 'blur(8px)',
          zIndex: 20,
        }}
      >
        <span>© 2026 STRIKELAB · strikelab.golf</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: SL.ink2 }}
          >
            <ArrowGlyph size={12} color="currentColor" strokeWidth={1.7} />
            {t.download}
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: SL.ink2 }}
          >
            <InstagramGlyph size={14} />
            {t.follow} — @strikelab.golf
          </a>
        </div>
      </footer>
    </main>
  )
}

export default function Marketing({ locale = 'no' }: { locale?: Locale }) {
  const navigate = useNavigate()
  const t = COPY[locale]
  const variant: VariantId = 'constellation'

  useEffect(() => {
    document.documentElement.lang = locale === 'no' ? 'no' : 'en'
    document.documentElement.dataset.theme = 'light'
    document.title =
      locale === 'no'
        ? 'StrikeLab — All golfen din på ett sted.'
        : 'StrikeLab — All your golf in one place.'
    return () => {
      const theme = localStorage.getItem('strikelab-theme') || 'light'
      document.documentElement.dataset.theme = theme
    }
  }, [locale])

  const onLocaleChange = (next: Locale) => {
    navigate(next === 'en' ? '/en' : '/')
  }

  return (
    <div className="sl-landing" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TopBar locale={locale} onLocaleChange={onLocaleChange} t={t} />
      <Hero locale={locale} t={t} variant={variant} />
    </div>
  )
}
