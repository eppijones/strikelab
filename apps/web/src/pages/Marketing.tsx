import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, SLLogo, Stat, Tag } from '@/components/ui'

const PILLARS = [
  {
    id: 'courses',
    title: 'Courses',
    titleNo: 'Baner',
    body: 'Norwegian courses, facilities, scorecards, and favorites. Find where you play and keep the history there.',
    bodyNo: 'Norske baner, fasiliteter, scorekort og favoritter. Finn stedet du spiller, og behold historikken der.',
  },
  {
    id: 'watch',
    title: 'Scorecards + Watch',
    titleNo: 'Scorekort + Watch',
    body: 'Track rounds with iPhone and Apple Watch, then review the scorecard when the round is done.',
    bodyNo: 'Spor runder med iPhone og Apple Watch, og se scorekortet når runden er ferdig.',
  },
  {
    id: 'practice',
    title: 'Range sessions',
    titleNo: 'Rangeøkter',
    body: 'Upload sessions from Caddie or launch monitor exports. Keep shots, clubs, and notes in one place.',
    bodyNo: 'Last opp økter fra Caddie eller launch monitor-eksporter. Samle slag, køller og notater på ett sted.',
  },
  {
    id: 'bag',
    title: 'Your bag',
    titleNo: 'Din bag',
    body: 'Build the clubs you actually carry. Average carry and consistency fill in as you practice.',
    bodyNo: 'Bygg bagen du faktisk spiller med. Carry og konsistens fylles inn etter hvert som du trener.',
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
  const sectionPad = 'px-5 sm:px-8 py-16 sm:py-24 max-w-[1440px] mx-auto'
  const primaryLink =
    'inline-flex items-center justify-center bg-accent text-accent-ink px-5 sm:px-6 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-fg'
  const secondaryLink =
    'inline-flex items-center justify-center bg-transparent text-ink-2 border border-line-strong px-5 sm:px-6 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3 hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent-fg'

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line-strong">
        <div className="px-5 sm:px-8 min-h-14 py-3 flex items-center justify-between gap-4 max-w-[1440px] mx-auto">
          <Link to="/" className="flex items-center gap-2.5 text-ink hover:text-accent-fg" aria-label="StrikeLab home">
            <SLLogo size={20} withWord wordSize={12} condensed />
          </Link>
          <nav className="hidden lg:flex gap-8 mono text-[10px] uppercase tracking-micro text-ink-3" aria-label="Marketing sections">
            <a href="#courses" className="hover:text-ink">{isNo ? 'Baner' : 'Courses'}</a>
            <a href="#watch" className="hover:text-ink">Watch</a>
            <a href="#practice" className="hover:text-ink">{isNo ? 'Trening' : 'Practice'}</a>
            <a href="#bag" className="hover:text-ink">Bag</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro">
              {isNo ? 'Logg inn' : 'Login'}
            </Link>
            <Link to="/register" className="bg-accent text-accent-ink px-3 sm:px-4 py-2 mono text-[10px] uppercase tracking-micro hover:bg-accent-2">
              {isNo ? 'Kom i gang' : 'Get started'} →
            </Link>
          </div>
        </div>
      </header>

      <section className={`${sectionPad} pb-12 sm:pb-16`}>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-end">
          <div>
            <div className="micro">STRIKELAB · {isNo ? 'BYGD I NORGE' : 'BUILT IN NORWAY'}</div>
            <h1 className="display text-[clamp(4rem,12vw,9.5rem)] mt-6 leading-[0.86] max-w-[980px]">
              {isNo ? (
                <>
                  All golfen din. <em>På ett sted.</em>
                </>
              ) : (
                <>
                  Your golf, all in <em>one place.</em>
                </>
              )}
            </h1>
            <p className="text-[18px] sm:text-[20px] text-ink-2 max-w-[720px] mt-8 leading-[1.55]">
              {isNo
                ? 'Baner, scorekort, Apple Watch-runder, rangeøkter og bagen din samlet i én rolig golfbase.'
                : 'Courses, scorecards, Apple Watch rounds, range sessions, and your bag in one calm golf homebase.'}
            </p>
            <div className="flex gap-3 mt-10 flex-wrap">
              <Link to="/register" className={primaryLink}>
                {isNo ? 'Kom i gang' : 'Get started'} →
              </Link>
              <a href="#courses" className={secondaryLink}>
                {isNo ? 'Se hva du får' : 'See what you get'} →
              </a>
            </div>
          </div>

          <Panel id="LIVE 01" title={isNo ? 'GOLFBASEN' : 'GOLF HOMEBASE'} className="glow">
            <div className="grid grid-cols-3 gap-3">
              <Stat label={isNo ? 'NGF-KLUBBER' : 'NGF CLUBS'} value="156" size="sm" />
              <Stat label="WATCH" value="SE" unit="+" size="sm" />
              <Stat label="BAG" value="14" unit={isNo ? 'køller' : 'clubs'} size="sm" />
            </div>
            <div className="mt-5 border border-line-strong p-4">
              <div className="micro mb-2">{isNo ? 'NESTE TING' : 'NEXT THING'}</div>
              <div className="display text-[28px]">{isNo ? 'Losby, fredag 14:50' : 'Losby, Friday 14:50'}</div>
              <p className="text-body text-ink-2 mt-2">
                {isNo ? 'Scorekortet ligger klart. Bagen husker avstandene dine.' : 'Scorecard is ready. Your bag remembers your distances.'}
              </p>
            </div>
          </Panel>
        </div>
      </section>

      <section id="courses" className={`border-t border-line-strong ${sectionPad}`}>
        <div className="micro">01 — {isNo ? 'Hva du får' : 'What you get'}</div>
        <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
          {isNo ? <>Fire ting. <em>Ingen støy.</em></> : <>Four things. <em>No noise.</em></>}
        </h2>
        <p className="text-body text-ink-2 max-w-[680px] mt-6">
          {isNo
            ? 'StrikeLab starter med det du allerede gjør: spiller baner, fører score, trener på range og velger kølle.'
            : 'StrikeLab starts with what you already do: play courses, keep score, practice on the range, and choose a club.'}
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PILLARS.map((p, i) => (
            <Panel key={p.id} id={String(i + 1).padStart(2, '0')} title={(isNo ? p.titleNo : p.title).toUpperCase()}>
              <div className="display text-[34px]">{isNo ? p.titleNo : p.title}</div>
              <p className="text-body text-ink-2 mt-3 leading-[1.55]">{isNo ? p.bodyNo : p.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section id="watch" className="border-t border-line-strong bg-[#ede8de] text-[#141614]">
        <div className={sectionPad}>
          <div className="micro !text-[#4a4842]">02 — APPLE WATCH + IPHONE</div>
          <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
            {isNo ? <>Spor runden uten å <em>styre.</em></> : <>Track the round without <em>fiddling.</em></>}
          </h2>
          <p className="text-[17px] text-[#4a4842] leading-[1.6] max-w-[720px] mt-6">
            {isNo
              ? 'Apple Watch tar slag, putter og avstander når du spiller. iPhone husker runden, scorekortet og historikken etterpå.'
              : 'Apple Watch handles strokes, putts, and distances while you play. iPhone remembers the round, scorecard, and history afterward.'}
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              [isNo ? 'På banen' : 'On course', isNo ? 'Avstander, score og enkle valg på håndleddet.' : 'Distances, score, and simple choices on the wrist.'],
              [isNo ? 'Etterpå' : 'Afterward', isNo ? 'Scorekort, hull og runder samlet på web og iPhone.' : 'Scorecards, holes, and rounds kept on web and iPhone.'],
              [isNo ? 'Rolig' : 'Quiet', isNo ? 'Caddien snakker når det trengs, ikke hele tiden.' : 'The caddie speaks when needed, not all the time.'],
            ].map(([title, body]) => (
              <div key={title} className="border border-[#b6af9c] p-5">
                <div className="display text-[28px]">{title}</div>
                <p className="text-[14px] text-[#4a4842] mt-3 leading-[1.55]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="practice" className={`border-t border-line-strong ${sectionPad}`}>
        <div className="micro">03 — {isNo ? 'Range og bag' : 'Practice and bag'}</div>
        <h2 className="display text-[clamp(2.75rem,7vw,5.25rem)] mt-4">
          {isNo ? <>Få dine egne <em>køllelengder.</em></> : <>Know your own <em>club distances.</em></>}
        </h2>
        <p className="text-body text-ink-2 max-w-[720px] mt-6">
          {isNo
            ? 'Bygg bagen din, last opp rangeøkter, og se carry og spredning per kølle etter hvert som du trener.'
            : 'Build your bag, upload range sessions, and see carry and dispersion per club as you practice.'}
        </p>
        <div id="bag" className="mt-10 grid lg:grid-cols-[1fr_1fr] gap-4">
          <Panel id="BAG" title={isNo ? 'DIN BAG' : 'YOUR BAG'} className="glow">
            <div className="display text-[36px]">{isNo ? 'Driver. 7W. 5-PW. Wedger.' : 'Driver. 7W. 5-PW. Wedges.'}</div>
            <p className="text-body text-ink-2 mt-4">
              {isNo
                ? 'Ingen tvungen standardbag. Legg inn akkurat det du spiller med, også 4W, 7W, hybrider eller ekstra wedger.'
                : 'No forced standard set. Add exactly what you play, including 4W, 7W, hybrids, or extra wedges.'}
            </p>
          </Panel>
          <Panel id="DATA" title={isNo ? 'FRA ØKT TIL AVSTAND' : 'FROM SESSION TO DISTANCE'}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="7I" value="142" unit="m" size="sm" />
              <Stat label="DRV" value="218" unit="m" size="sm" />
              <Stat label="56" value="74" unit="m" size="sm" />
            </div>
            <p className="text-body text-ink-2 mt-4">
              {isNo ? 'Tallene blir dine når du logger økter.' : 'The numbers become yours as you log sessions.'}
            </p>
          </Panel>
        </div>
      </section>

      <section className={`border-t border-line-strong ${sectionPad}`}>
        <Panel id="START" title={isNo ? 'KOM I GANG' : 'GET STARTED'} className="glow">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8">
            <div>
              <div className="micro">{isNo ? 'Første steg' : 'First step'}</div>
              <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)] mt-4">
                {isNo ? <>Klar for første <em>runde?</em></> : <>Ready to bring your <em>golf together?</em></>}
              </h2>
            </div>
            <div className="space-y-4">
              {[
                [isNo ? 'Velg en bane' : 'Pick a course', isNo ? 'Finn en norsk bane og lagre den som favoritt.' : 'Find a Norwegian course and save it as a favorite.'],
                [isNo ? 'Bygg bagen' : 'Build your bag', isNo ? 'Legg inn køllene du faktisk spiller med.' : 'Add the clubs you actually play.'],
                [isNo ? 'Logg en runde eller økt' : 'Log a round or session', isNo ? 'Apple Watch, iPhone eller rangeeksport holder historikken i gang.' : 'Apple Watch, iPhone, or range export keeps the history moving.'],
              ].map(([title, body]) => (
                <div key={title} className="border border-line-strong p-4">
                  <div className="micro">{title}</div>
                  <p className="text-body text-ink-2 mt-2">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="border-t border-line-strong px-5 sm:px-8 py-16 sm:py-24 max-w-[1440px] mx-auto text-center">
        <h2 className="display text-[clamp(3rem,9vw,7rem)]">
          {isNo ? <>All golfen din. <em>På ett sted.</em></> : <>Your golf, all in <em>one place.</em></>}
        </h2>
        <Link to="/register" className="inline-flex mt-10 bg-accent text-accent-ink px-8 py-4 mono text-[12px] uppercase tracking-micro hover:bg-accent-2">
          {isNo ? 'Kom i gang' : 'Get started'} →
        </Link>
      </section>

      <footer className="border-t border-line-strong px-5 sm:px-8 py-8 max-w-[1440px] mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mono text-[10px] uppercase tracking-micro text-ink-4">© 2026 STRIKELAB · STRIKELAB.GOLF</div>
            <p className="text-body text-ink-3 mt-3 max-w-[680px]">
              {isNo
                ? 'StrikeLab samler baner, scorekort, Watch-runder, rangeøkter og bagdata for norske golfere.'
                : 'StrikeLab brings courses, scorecards, Watch rounds, range sessions, and bag data together for Norwegian golfers.'}
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
