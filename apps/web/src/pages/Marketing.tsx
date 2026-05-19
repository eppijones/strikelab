import { Link } from 'react-router-dom'
import { Panel, SLLogo, Stat } from '@/components/ui'
import { landingEn } from '@/content/landing.en'
import { landingNo } from '@/content/landing.no'
import { DEMO_TEE_COURSES } from '@/lib/teeDemoData'

type LandingContent = typeof landingNo | typeof landingEn

const betaHref = import.meta.env.VITE_BETA_URL || 'mailto:beta@strikelab.golf?subject=Caddie%20Beta'
const sectionPad = 'px-5 sm:px-8 py-16 sm:py-24 max-w-[1440px] mx-auto'
const ctaClass =
  'tee-cta inline-flex items-center justify-center px-5 sm:px-6 py-3 mono text-[11px] uppercase tracking-micro focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-fg'
const outlineClass =
  'tee-pill inline-flex items-center justify-center px-5 sm:px-6 py-3 mono text-[11px] uppercase tracking-micro focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-fg'

export default function Marketing({ locale = 'no' }: { locale?: 'no' | 'en' }) {
  const content = locale === 'en' ? landingEn : landingNo

  return (
    <div className="tee-editorial min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-ink hover:text-accent-fg" aria-label="StrikeLab home">
            <SLLogo size={16} withWord wordSize={13} condensed animated />
          </Link>
          <nav className="hidden gap-8 mono text-[10px] uppercase tracking-micro text-ink-3 lg:flex" aria-label={content.navLabel}>
            {content.nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to={content.languageToggle.href} className="tee-pill px-3 py-1.5 mono text-[10px] uppercase tracking-micro">
              {content.languageToggle.label}
            </Link>
            <a href={betaHref} className="tee-cta px-3 py-2 mono text-[10px] uppercase tracking-micro">
              {content.hero.primaryCta} →
            </a>
          </div>
        </div>
      </header>

      <main>
        <HeroSection content={content} />
        <CaddieTodaySection content={content} />
        <MergeSection content={content} />
        <CoursesSection content={content} />
        <TeePreviewSection content={content} />
        <FounderSection content={content} />
      </main>

      <LandingFooter content={content} />
    </div>
  )
}

function HeroSection({ content }: { content: LandingContent }) {
  return (
    <section className={`${sectionPad} pb-12 sm:pb-16`} aria-labelledby="landing-hero-title">
      <div className="grid items-end gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div>
          <div className="micro">{content.hero.eyebrow}</div>
          <h1 id="landing-hero-title" className="display mt-6 max-w-[1040px] text-[clamp(3.8rem,11vw,9.25rem)] leading-[0.86]">
            {content.hero.headline.before} <em>{content.hero.headline.emphasis}</em>
          </h1>
          <p className="mt-8 max-w-[760px] text-[18px] leading-[1.55] text-ink-2 sm:text-[20px]">{content.hero.subhead}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={betaHref} className={ctaClass}>
              {content.hero.primaryCta} →
            </a>
            <a href="#how-it-works" className={outlineClass}>
              {content.hero.secondaryCta}
            </a>
          </div>
        </div>

        <Panel id="LIVE 01" title={content.hero.visual.label} className="glow">
          <div className="border border-line-strong p-4">
            <div className="micro mb-2">{content.hero.visual.label}</div>
            <div className="display text-[44px] leading-none">{content.hero.visual.title}</div>
            <p className="mt-3 text-body leading-[1.55] text-ink-2">{content.hero.visual.body}</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {content.hero.visual.stats.map((stat) => (
              <Stat key={stat.label} label={stat.label} value={stat.value} unit={stat.unit} size="sm" />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <MiniSourceCard label="Trackman" value="Range" />
            <div className="mono text-[18px] text-accent-fg">→</div>
            <MiniSourceCard label="Apple Watch" value={content.lang === 'no' ? 'Bane' : 'Course'} />
          </div>
          <p className="mt-5 border-t border-line pt-4 mono text-[10px] uppercase tracking-micro text-ink-3">
            {content.hero.visual.footer}
          </p>
        </Panel>
      </div>
    </section>
  )
}

function MiniSourceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="tee-card p-3 text-left">
      <div className="micro">{label}</div>
      <div className="display mt-1 text-[24px]">{value}</div>
    </div>
  )
}

function CaddieTodaySection({ content }: { content: LandingContent }) {
  return (
    <section id={content.caddieToday.id} className={`border-t border-line ${sectionPad}`} aria-labelledby="caddie-today-title">
      <div className="micro">{content.caddieToday.eyebrow}</div>
      <h2 id="caddie-today-title" className="display mt-4 text-[clamp(2.75rem,7vw,5.25rem)]">
        {content.caddieToday.heading.before} <em>{content.caddieToday.heading.emphasis}</em>
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {content.caddieToday.cards.map((card, index) => (
          <Panel key={card.title} id={String(index + 1).padStart(2, '0')} title={card.title.toUpperCase()}>
            <div className="display text-[34px] leading-none">{card.title}</div>
            <p className="mt-3 text-body leading-[1.55] text-ink-2">{card.body}</p>
          </Panel>
        ))}
      </div>
    </section>
  )
}

function MergeSection({ content }: { content: LandingContent }) {
  return (
    <section id={content.merge.id} className="border-t border-line bg-surface/35 text-ink" aria-labelledby="merge-title">
      <div className={sectionPad}>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="micro">{content.merge.eyebrow}</div>
            <h2 id="merge-title" className="display mt-4 text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.95]">
              {content.merge.heading.before} <em>{content.merge.heading.emphasis}</em>
            </h2>
            <p className="mt-6 max-w-[760px] text-[17px] leading-[1.6] text-ink-2">{content.merge.body}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
            {content.merge.flow.map((step, index) => (
              <MergeStep key={step.label} step={step} showArrow={index < content.merge.flow.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MergeStep({
  step,
  showArrow,
}: {
  step: { label: string; value: string }
  showArrow: boolean
}) {
  return (
    <>
      <div className="tee-card p-5">
        <div className="micro">{step.label}</div>
        <div className="display mt-4 text-[30px] leading-none">{step.value}</div>
      </div>
      {showArrow && <div className="hidden items-center justify-center mono text-[24px] text-accent-fg md:flex">→</div>}
    </>
  )
}

function CoursesSection({ content }: { content: LandingContent }) {
  return (
    <section id={content.courses.id} className={`border-t border-line ${sectionPad}`} aria-labelledby="courses-title">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="micro">{content.courses.eyebrow}</div>
          <h2 id="courses-title" className="display mt-4 text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.95]">
            {content.courses.heading}
          </h2>
          <p className="mt-6 max-w-[680px] text-body leading-[1.6] text-ink-2">{content.courses.body}</p>
          <a href={content.courses.ctaHref} className={`${outlineClass} mt-8`}>
            {content.courses.cta} →
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {DEMO_TEE_COURSES.map((course) => (
            <div key={course.id} className="tee-card p-5">
              <div className="micro">{[course.city, course.region].filter(Boolean).join(' · ')}</div>
              <div className="display mt-2 text-[30px] leading-none">{course.name}</div>
              <p className="mt-4 mono text-[10px] uppercase tracking-micro text-ink-3">
                {course.holes_count} {content.lang === 'no' ? 'hull' : 'holes'} · Par {course.par}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeePreviewSection({ content }: { content: LandingContent }) {
  return (
    <section id={content.tee.id} className="border-t border-line bg-surface/35" aria-labelledby="tee-preview-title">
      <div className={sectionPad}>
        <Panel
          id="TEE"
          title={content.tee.eyebrow}
          className="glow"
          right={<span className="tee-pill px-3 py-1 mono text-[10px] uppercase tracking-micro">{content.tee.badge}</span>}
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h2 id="tee-preview-title" className="display text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.95]">
                {content.tee.heading}
              </h2>
              <p className="mt-6 max-w-[760px] text-body leading-[1.6] text-ink-2">{content.tee.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/tee" className={outlineClass}>
                  {content.tee.cta} →
                </Link>
                <span className="mono text-[10px] uppercase tracking-micro text-ink-3">{content.tee.note}</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <PreviewStat label="Window" value="18:10" />
              <PreviewStat label="Club" value="NGF" />
              <PreviewStat label="Status" value="Preview" />
            </div>
          </div>
        </Panel>
      </div>
    </section>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="tee-card p-4">
      <div className="micro">{label}</div>
      <div className="display mt-2 text-[28px]">{value}</div>
    </div>
  )
}

function FounderSection({ content }: { content: LandingContent }) {
  return (
    <section id={content.founder.id} className={`border-t border-line ${sectionPad}`} aria-labelledby="founder-title">
      <div className="mx-auto max-w-[920px]">
        <div className="micro">{content.founder.eyebrow}</div>
        <h2 id="founder-title" className="display mt-4 text-[clamp(2.75rem,7vw,5.25rem)]">
          {content.founder.heading}
        </h2>
        <div className="mt-8 space-y-5 border-l border-line-strong pl-6 text-[18px] leading-[1.65] text-ink-2">
          {content.founder.body.map((paragraph, index) => (
            <p key={paragraph} className={index === 0 ? 'mono text-[10px] uppercase tracking-micro text-ink-4' : undefined}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

function LandingFooter({ content }: { content: LandingContent }) {
  return (
    <footer className="mx-auto max-w-[1440px] border-t border-line px-5 py-8 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mono text-[10px] uppercase tracking-micro text-ink-4">{content.footer.copyright}</div>
          <p className="mt-3 max-w-[680px] text-body text-ink-3">{content.footer.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-4 mono text-[10px] uppercase tracking-micro text-ink-3" aria-label="Legal and contact">
          {content.footer.links.map((link) =>
            link.href.startsWith('mailto:') ? (
              <a key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} to={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  )
}
