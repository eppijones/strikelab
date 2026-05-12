import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, Stat, Tag, SLLogo, Spark } from '@/components/ui'

const INTEGRATIONS: Array<{
  name: string
  status: string
  statusNo: string
  tone: 'default' | 'accent' | 'warn'
}> = [
  { name: 'CSV', status: 'Ready', statusNo: 'Klar', tone: 'accent' },
  { name: 'Apple Watch', status: 'Caddie beta', statusNo: 'Caddie beta', tone: 'accent' },
  { name: 'Garmin R10', status: 'Import path', statusNo: 'Importløp', tone: 'default' },
  { name: 'TrackMan', status: 'Connector beta', statusNo: 'Kobling beta', tone: 'warn' },
  { name: 'Foresight', status: 'Planned', statusNo: 'Planlagt', tone: 'default' },
  { name: 'GSPro', status: 'Planned', statusNo: 'Planlagt', tone: 'default' },
  { name: 'SkyTrak', status: 'Planned', statusNo: 'Planlagt', tone: 'default' },
]

const HERO_STATS = [
  { label: 'NGF clubs indexed', labelNo: 'NGF-klubber', value: '156', unit: '' },
  { label: 'Loop', labelNo: 'Sløyfe', value: '3', unit: 'steps' },
  { label: 'First import', labelNo: 'Første import', value: 'CSV', unit: 'ready' },
]

const HOW_IT_WORKS = [
  {
    code: '01',
    title: 'Connect',
    titleNo: 'Koble til',
    body: 'Import CSV or connect the devices you already practice with.',
    bodyNo: 'Importer CSV eller koble til enhetene du allerede trener med.',
  },
  {
    code: '02',
    title: 'Diagnose',
    titleNo: 'Diagnostiser',
    body: 'StrikeLab turns shots, rounds, and notes into the fault that matters now.',
    bodyNo: 'StrikeLab gjør slag, runder og notater om til feilen som betyr mest nå.',
  },
  {
    code: '03',
    title: 'Train',
    titleNo: 'Tren',
    body: 'Follow focused drills with targets, sets, and measurable gates.',
    bodyNo: 'Følg målrettede øvelser med mål, sett og målbare krav.',
  },
  {
    code: '04',
    title: 'Validate',
    titleNo: 'Valider',
    body: 'Bring the change to the course, then let the next plan update from evidence.',
    bodyNo: 'Ta endringen ut på banen, og la neste plan bygges fra bevis.',
  },
]

const PILLARS = [
  {
    code: '01',
    title: 'Diagnose',
    titleNo: 'Diagnostiser',
    body:
      'Every shot becomes evidence. Path, face, dispersion, strokes gained, and notes combine into one priority.',
    bodyNo:
      'Hvert slag blir bevis. Sti, blade, spredning, strokes gained og notater blir én prioritet.',
  },
  {
    code: '02',
    title: 'Prescribe',
    titleNo: 'Foreskriv',
    body:
      'The report becomes a training block: intent, drill, target, success criteria, and next check-in.',
    bodyNo:
      'Rapporten blir en treningsblokk: hensikt, øvelse, mål, krav og neste sjekkpunkt.',
  },
  {
    code: '03',
    title: 'Validate',
    titleNo: 'Valider',
    body:
      'Course tests and Apple Watch rounds close the loop. The plan changes only when the numbers move.',
    bodyNo:
      'Tester på banen og Apple Watch-runder lukker sløyfen. Planen endres bare når tallene flytter seg.',
  },
]

const TIERS = [
  {
    id: 'range',
    name: 'Range',
    price: '0 kr',
    note: 'Start free',
    noteNo: 'Start gratis',
    bestFor: 'For players testing their first data loop.',
    bestForNo: 'For spillere som tester sin første dataløype.',
    bullets: ['Manual CSV import', 'Session log + tags', 'Weekly summary', 'Single-player history'],
    bulletsNo: ['Manuell CSV-import', 'Øktlogg + tags', 'Ukentlig oppsummering', 'Historikk for én spiller'],
  },
  {
    id: 'bay',
    name: 'Bay',
    price: '249 kr',
    note: 'per month · beta',
    noteNo: 'per måned · beta',
    bestFor: 'For serious players who want a plan after every session.',
    bestForNo: 'For seriøse spillere som vil ha en plan etter hver økt.',
    highlight: true,
    bullets: [
      'Connector beta access',
      'AI Coach Reports',
      'Adaptive 8-week plans',
      'Apple Watch Caddie',
      'Shot DNA',
      'Norway tee-time discovery',
    ],
    bulletsNo: [
      'Tilgang til koblingsbeta',
      'AI Coach-rapporter',
      'Adaptive 8-ukers planer',
      'Apple Watch Caddie',
      'Slag-DNA',
      'Starttidsøk i Norge',
    ],
  },
  {
    id: 'tour',
    name: 'Tour',
    price: '649 kr',
    note: 'per month · pilot',
    noteNo: 'per måned · pilot',
    bestFor: 'For coaches, academies, and players with a support team.',
    bestForNo: 'For trenere, akademier og spillere med støtteapparat.',
    bullets: ['Bay features', 'Coach seat', 'Export pack', 'API pilot', 'Priority onboarding'],
    bulletsNo: ['Alt i Bay', 'Trenersete', 'Eksportpakke', 'API-pilot', 'Prioritert oppsett'],
  },
]

const PROOF_BLOCKS = [
  {
    id: 'REPORT',
    title: 'Sample coach report',
    titleNo: 'Eksempel på coach-rapport',
    body:
      'Diagnosis, prescription, and validation live in the same report, so practice stops becoming a loose note.',
    bodyNo:
      'Diagnose, resept og validering ligger i samme rapport, så trening slutter å bli løse notater.',
    tags: ['Face control', '7i dispersion', 'Next drill'],
    tagsNo: ['Facekontroll', '7i-spredning', 'Neste øvelse'],
  },
  {
    id: 'WATCH',
    title: 'Apple Watch caddie',
    titleNo: 'Apple Watch caddie',
    body:
      'On-course rounds feed the same player profile: yardage, intent, club, result, and pressure context.',
    bodyNo:
      'Runder på banen mater samme spillerprofil: avstand, intensjon, kølle, resultat og press.',
    tags: ['Yardage', 'Intent', 'Shot DNA'],
    tagsNo: ['Avstand', 'Intensjon', 'Slag-DNA'],
  },
  {
    id: 'TEE',
    title: 'Norway course layer',
    titleNo: 'Norsk banelag',
    body:
      'The catalog starts with 156 NGF member clubs, then adds course context to practice and booking.',
    bodyNo:
      'Katalogen starter med 156 NGF-klubber, og legger banekontekst inn i trening og booking.',
    tags: ['156 clubs', 'Facilities', 'Tee beta'],
    tagsNo: ['156 klubber', 'Fasiliteter', 'Tee beta'],
  },
]

const TRUST_LINKS = [
  { label: 'Privacy', labelNo: 'Personvern', href: '/privacy' },
  { label: 'Terms', labelNo: 'Vilkår', href: '/terms' },
  { label: 'Data security', labelNo: 'Datasikkerhet', href: '/security' },
  { label: 'Contact', labelNo: 'Kontakt', href: 'mailto:hello@strikelab.golf' },
]

export default function Marketing() {
  const { i18n } = useTranslation()
  const isNo = i18n.language === 'no'
  const cta = isNo ? 'Bli med i betaen' : 'Join the beta'
  const sectionPad = 'px-5 sm:px-8 py-16 sm:py-24 max-w-[1440px] mx-auto'
  const primaryLink =
    'inline-flex items-center justify-center bg-accent text-accent-ink px-5 sm:px-6 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-fg'
  const secondaryLink =
    'inline-flex items-center justify-center bg-transparent text-ink-2 border border-line-strong px-5 sm:px-6 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3 hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-fg'

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* NAV */}
      <header className="border-b border-line-strong">
        <div className="px-5 sm:px-8 min-h-14 py-3 flex items-center justify-between gap-4 max-w-[1440px] mx-auto">
          <Link to="/" className="flex items-center gap-2.5 text-ink hover:text-accent-fg" aria-label="StrikeLab home">
            <SLLogo size={20} withWord wordSize={12} condensed />
          </Link>
          <nav className="hidden lg:flex gap-8 mono text-[10px] uppercase tracking-micro text-ink-3" aria-label="Marketing sections">
            <a href="#system" className="hover:text-ink">{isNo ? 'System' : 'System'}</a>
            <a href="#proof" className="hover:text-ink">{isNo ? 'Bevis' : 'Proof'}</a>
            <a href="#method" className="hover:text-ink">{isNo ? 'Metode' : 'Method'}</a>
            <a href="#pricing" className="hover:text-ink">{isNo ? 'Priser' : 'Pricing'}</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro"
            >
              {isNo ? 'Logg inn' : 'Login'}
            </Link>
            <Link
              to="/register"
              className="bg-accent text-accent-ink px-3 sm:px-4 py-2 mono text-[10px] uppercase tracking-micro hover:bg-accent-2"
            >
              {cta} →
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="system" className={`${sectionPad} pb-12 sm:pb-16`}>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-end">
          <div>
            <div className="micro">STRIKELAB · {isNo ? 'NORGE BETA' : 'NORWAY BETA'}</div>
            <h1 className="display text-[clamp(4rem,12vw,9.5rem)] mt-6 leading-[0.86] max-w-[960px]">
              {isNo ? (
                <>
                  Bli <em>presis.</em>
                </>
              ) : (
                <>
                  Get <em>dialed in.</em>
                </>
              )}
            </h1>
            <p className="text-[18px] sm:text-[20px] text-ink-2 max-w-[720px] mt-8 leading-[1.55]">
              {isNo
                ? 'StrikeLab gjør rangeøkter, runder og enhetsdata om til én plan: diagnostiser feilen, tren med hensikt, og valider endringen på banen.'
                : 'StrikeLab turns range sessions, rounds, and device data into one plan: diagnose the fault, train with intent, and validate the change on course.'}
            </p>
            <div className="flex gap-3 mt-10 flex-wrap">
              <Link to="/register" className={primaryLink}>
                {cta} →
              </Link>
              <a href="#sample-report" className={secondaryLink}>
                {isNo ? 'Se eksempelrapport' : 'View sample report'} →
              </a>
            </div>
          </div>
          <Panel id="LIVE 01" title={isNo ? 'SPILLERPROFIL' : 'PLAYER PROFILE'} className="glow">
            <div className="grid grid-cols-3 gap-3">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="border border-line-strong p-3">
                  <div className="micro">{isNo ? stat.labelNo : stat.label}</div>
                  <div className="num text-[28px] sm:text-[36px] tracking-display mt-2">{stat.value}</div>
                  {stat.unit && <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mt-1">{stat.unit}</div>}
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="micro mb-3">{isNo ? 'Siste 12 økter' : 'Last 12 sessions'}</div>
              <Spark data={[58, 57, 59, 62, 61, 65, 66, 68, 67, 71, 73, 76]} w={520} h={80} fill />
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <Stat label={isNo ? 'PRIORITET' : 'PRIORITY'} value={isNo ? '7i' : '7i'} delta={isNo ? 'Face lukker sent' : 'Face closes late'} />
              <Stat label={isNo ? 'NESTE TEST' : 'NEXT TEST'} value="9" unit={isNo ? 'hull' : 'holes'} delta={isNo ? 'Valider fredag' : 'Validate Friday'} />
            </div>
          </Panel>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-line-strong">
        <div className={`${sectionPad} py-12 sm:py-14`}>
          <div className="micro">{isNo ? 'Slik fungerer det' : 'How it works'}</div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <Panel key={step.code} id={step.code} title={(isNo ? step.titleNo : step.title).toUpperCase()}>
                <div className="display text-[30px] sm:text-[36px]">{isNo ? step.titleNo : step.title}</div>
                <p className="text-body text-ink-2 mt-3 leading-[1.55]">{isNo ? step.bodyNo : step.body}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="border-b border-line-strong py-6">
        <div className="px-5 sm:px-8 max-w-[1440px] mx-auto flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="micro flex-shrink-0">
            {isNo ? 'Koblinger' : 'Integrations'} /
          </span>
          {INTEGRATIONS.map((integration) => (
            <span key={integration.name} className="flex items-center gap-2 flex-shrink-0">
              <span className="mono text-[12px] text-ink-2 tracking-micro-tight uppercase">{integration.name}</span>
              <Tag tone={integration.tone}>{isNo ? integration.statusNo : integration.status}</Tag>
            </span>
          ))}
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section id="who" className={sectionPad}>
        <div className="micro">01 — {isNo ? 'For hvem' : "Who it's for"}</div>
        <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
          {isNo ? (
            <>
              Tre <em>moduser.</em> Samme sløyfe.
            </>
          ) : (
            <>
              Three <em>modes.</em> One loop.
            </>
          )}
        </h2>
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel id="A" title={(isNo ? 'Ny i golf' : 'New to golf').toUpperCase()}>
            <div className="display text-[28px]">{isNo ? 'Ny i golf' : 'New to golf'}</div>
            <p className="text-body text-ink-2 mt-3 leading-[1.55]">
              {isNo
                ? 'Finn baner, logg score og forstå hva tallene betyr uten sjargong.'
                : 'Find courses, log scores, and understand what the numbers mean without the jargon.'}
            </p>
          </Panel>
          <Panel id="B" title={(isNo ? 'Vil bli bedre' : 'Getting better').toUpperCase()}>
            <div className="display text-[28px]">{isNo ? 'Vil bli bedre' : 'Getting better'}</div>
            <p className="text-body text-ink-2 mt-3 leading-[1.55]">
              {isNo
                ? 'Se handicapet bevege seg, følg enkle planer og spill mer med folk som pusher deg.'
                : 'Watch your handicap move, follow simple plans, and play more with people who push you.'}
            </p>
          </Panel>
          <Panel id="C" title={(isNo ? 'Skal lavt' : 'Going low').toUpperCase()}>
            <div className="display text-[28px]">{isNo ? 'Skal lavt' : 'Going low'}</div>
            <p className="text-body text-ink-2 mt-3 leading-[1.55]">
              {isNo
                ? 'Full cockpit: spredning, strokes gained, coach-rapporter, Slag-DNA og validering på banen.'
                : 'Full cockpit: dispersion, strokes gained, coach reports, Shot DNA, and on-course validation.'}
            </p>
          </Panel>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof" className={`border-t border-line-strong ${sectionPad}`}>
        <div className="micro">02 — {isNo ? 'Produktbevis' : 'Product proof'}</div>
        <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
          {isNo ? (
            <>
              Vis <em>systemet.</em>
            </>
          ) : (
            <>
              Show the <em>system.</em>
            </>
          )}
        </h2>
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PROOF_BLOCKS.map((proof) => (
            <Panel key={proof.id} id={proof.id} title={(isNo ? proof.titleNo : proof.title).toUpperCase()}>
              <div className="display text-[32px] sm:text-[40px]">{isNo ? proof.titleNo : proof.title}</div>
              <p className="text-body text-ink-2 mt-4 leading-[1.55]">{isNo ? proof.bodyNo : proof.body}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(isNo ? proof.tagsNo : proof.tags).map((tag) => (
                  <Tag key={tag} tone={proof.id === 'TEE' ? 'warn' : 'accent'}>{tag}</Tag>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* METHOD */}
      <section id="method" className={`border-t border-line-strong ${sectionPad}`}>
        <div className="micro">03 — {isNo ? 'Metode' : 'Method'}</div>
        <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
          {isNo ? (
            <>
              Diagnose. Foreskriv. <em>Valider.</em>
            </>
          ) : (
            <>
              Diagnose. Prescribe. <em>Validate.</em>
            </>
          )}
        </h2>
        <p className="text-body text-ink-2 max-w-[640px] mt-6">
          {isNo
            ? 'Lukket sløyfe for golfutvikling. Hver måling peker mot en øvelse, hver øvelse mot et mål, og hver runde validerer om planen virker.'
            : 'Closed-loop performance for golf. Every metric ladders to a drill, every drill to a target, and every round validates whether the plan works.'}
        </p>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <Panel key={p.code} id={p.code} title={(isNo ? p.titleNo : p.title).toUpperCase()}>
              <div className="display text-[40px]">{isNo ? p.titleNo : p.title}</div>
              <p className="text-body text-ink-2 mt-3 leading-[1.55]">
                {isNo ? p.bodyNo : p.body}
              </p>
            </Panel>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className={`border-t border-line-strong ${sectionPad}`}
      >
        <div className="micro">04 — {isNo ? 'Priser' : 'Pricing'}</div>
        <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
          {isNo ? (
            <>
              Norge-beta, priset i <em>NOK.</em>
            </>
          ) : (
            <>
              Norway beta, priced in <em>NOK.</em>
            </>
          )}
        </h2>
        <p className="text-body text-ink-2 max-w-[680px] mt-6">
          {isNo
            ? 'Betaling og booking åpnes gradvis. Prisene er beta-priser, og alle betalte nivåer får tydelig avbestilling før fakturering.'
            : 'Payments and booking are opening gradually. These are beta prices, and paid tiers include clear cancellation before billing.'}
        </p>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <Panel
              key={tier.id}
              id={tier.id.toUpperCase()}
              title={tier.name.toUpperCase()}
              padded
              className={tier.highlight ? 'border-accent-fg' : ''}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="display text-[52px] sm:text-[56px]">{tier.price}</div>
                  <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mt-1">{isNo ? tier.noteNo : tier.note}</div>
                </div>
                {tier.highlight && <Tag tone="accent">{isNo ? 'Anbefalt' : 'Recommended'}</Tag>}
              </div>
              <p className="text-body text-ink-2 mt-5 leading-[1.55]">{isNo ? tier.bestForNo : tier.bestFor}</p>
              <ul className="mt-6 space-y-2">
                {(isNo ? tier.bulletsNo : tier.bullets).map((b) => (
                  <li key={b} className="text-body text-ink-2 flex items-start gap-3">
                    <span className="text-accent-fg mono text-[12px] mt-1">›</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center mt-8 px-5 py-3 mono text-[11px] uppercase tracking-micro ${
                  tier.highlight
                    ? 'bg-accent text-accent-ink hover:bg-accent-2'
                    : 'bg-transparent text-ink border border-line-strong hover:border-accent-fg'
                }`}
              >
                {isNo ? `Velg ${tier.name}` : `Choose ${tier.name}`} →
              </Link>
            </Panel>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-body text-ink-2">
          <div className="border border-line-strong p-4">{isNo ? 'Ingen binding i beta.' : 'No beta lock-in.'}</div>
          <div className="border border-line-strong p-4">{isNo ? 'Vipps/Stripe merkes som beta før betaling.' : 'Vipps/Stripe are labeled beta before payment.'}</div>
          <div className="border border-line-strong p-4">{isNo ? 'Du eier importene og rundedataene dine.' : 'You own your imports and round data.'}</div>
        </div>
      </section>

      {/* CTA */}
      <section id="sample-report" className={`border-t border-line-strong ${sectionPad}`}>
        <Panel id="SAMPLE" title={isNo ? 'COACH-RAPPORT' : 'COACH REPORT'} className="glow">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8">
            <div>
              <div className="micro">{isNo ? 'Eksempel' : 'Sample'}</div>
              <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)] mt-4">
                {isNo ? (
                  <>
                    Neste beste <em>trekk.</em>
                  </>
                ) : (
                  <>
                    Next best <em>move.</em>
                  </>
                )}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="border border-line-strong p-4">
                <div className="micro">{isNo ? 'Diagnose' : 'Diagnosis'}</div>
                <p className="text-body text-ink-2 mt-2">
                  {isNo
                    ? '7i-spredning er ikke avstandsproblem. Face er 2.4 grader mer åpen når tempoet går over 3.2:1.'
                    : '7i dispersion is not a distance problem. Face is 2.4 degrees more open when tempo drifts above 3.2:1.'}
                </p>
              </div>
              <div className="border border-line-strong p-4">
                <div className="micro">{isNo ? 'Resept' : 'Prescription'}</div>
                <p className="text-body text-ink-2 mt-2">
                  {isNo
                    ? 'Tre 8-min blokker: startlinje-gate, halv finish, deretter 9 hull med ett valideringsmål.'
                    : 'Three 8-minute blocks: start-line gate, half-finish constraint, then 9 holes with one validation target.'}
                </p>
              </div>
              <div className="border border-line-strong p-4">
                <div className="micro">{isNo ? 'Validering' : 'Validation'}</div>
                <p className="text-body text-ink-2 mt-2">
                  {isNo
                    ? 'Målet er under 6 yards venstre/høyre sigma med samme carry. Hvis ikke, bytter planen fokus.'
                    : 'Target is under 6 yards left/right sigma with the same carry. If it misses, the plan changes focus.'}
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <section className="border-t border-line-strong px-5 sm:px-8 py-16 sm:py-24 max-w-[1440px] mx-auto text-center">
        <h2 className="display text-[clamp(3rem,9vw,7rem)]">
          {isNo ? (
            <>
              Klar for første <em>import?</em>
            </>
          ) : (
            <>
              Ready for your first <em>import?</em>
            </>
          )}
        </h2>
        <Link
          to="/register"
          className="inline-flex mt-10 bg-accent text-accent-ink px-8 py-4 mono text-[12px] uppercase tracking-micro hover:bg-accent-2"
        >
          {cta} →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line-strong px-5 sm:px-8 py-8 max-w-[1440px] mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mono text-[10px] uppercase tracking-micro text-ink-4">© 2026 STRIKELAB · STRIKELAB.GOLF</div>
            <p className="text-body text-ink-3 mt-3 max-w-[680px]">
              {isNo
                ? 'StrikeLab håndterer golfdata, runder og enhetsimport med tydelige beta-merker for betaling og leverandørkoblinger.'
                : 'StrikeLab handles golf data, rounds, and device imports with clear beta labels for payments and provider connections.'}
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 mono text-[10px] uppercase tracking-micro text-ink-3" aria-label="Legal and contact">
            {TRUST_LINKS.map((link) =>
              link.href.startsWith('mailto:') ? (
                <a key={link.href} href={link.href} className="hover:text-ink">
                  {isNo ? link.labelNo : link.label}
                </a>
              ) : (
                <Link key={link.href} to={link.href} className="hover:text-ink">
                  {isNo ? link.labelNo : link.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </footer>
    </div>
  )
}
