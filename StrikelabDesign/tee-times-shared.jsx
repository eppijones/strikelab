// Shared primitives + i18n + dataset for the StrikeLab Tee Times module.
// Self-contained so this folder can be lifted into Claude Code as a single module.

const TT_THEME_CSS = `
.tt-theme {
  --bg: #0a0b0a;
  --bg-2: #111312;
  --surface: #15181680;
  --surface-solid: #151816;
  --surface-2: #1c1f1d;
  --line: #25292680;
  --line-strong: #2d322f;
  --ink: #ede8de;
  --ink-2: #b9b6ac;
  --ink-3: #76746b;
  --ink-4: #4a4842;
  --accent: oklch(0.88 0.18 125);
  --accent-ink: #0a0b0a;
  --accent-2: oklch(0.78 0.18 125);
  --warn: oklch(0.78 0.16 65);
  --bad: oklch(0.68 0.20 28);
  --info: oklch(0.78 0.10 230);
  background: var(--bg);
  color: var(--ink);
  font-family: "Geist", system-ui, -apple-system, sans-serif;
  font-feature-settings: "ss01","cv11";
  -webkit-font-smoothing: antialiased;
}
.tt-theme[data-mode="light"] {
  --bg: #ede8de;
  --bg-2: #e3ddd0;
  --surface: #f5f1e780;
  --surface-solid: #f5f1e7;
  --surface-2: #ebe5d6;
  --line: #c8c2b240;
  --line-strong: #b6af9c;
  --ink: #141614;
  --ink-2: #4a4842;
  --ink-3: #76746b;
  --ink-4: #b6af9c;
  --accent: oklch(0.62 0.18 145);
  --accent-ink: #ede8de;
  --accent-2: oklch(0.52 0.18 145);
  --warn: oklch(0.55 0.18 50);
  --bad: oklch(0.55 0.20 28);
  --info: oklch(0.45 0.12 230);
}
.tt-theme .mono { font-family: "Geist Mono", ui-monospace, monospace; font-feature-settings: "tnum","zero","ss01"; }
.tt-theme .serif { font-family: "Instrument Serif", serif; font-style: italic; }
.tt-theme .micro {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3);
}
.tt-theme .micro-sm {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--ink-3);
}
.tt-theme .display {
  font-family: "Geist", sans-serif;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 0.95;
}
.tt-theme .display em { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; letter-spacing: -0.02em; }
.tt-theme .num {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-feature-settings: "tnum","zero";
  font-variant-numeric: tabular-nums;
}
.tt-theme hr.rule { border: 0; border-top: 1px solid var(--line-strong); margin: 0; }
.tt-theme button { font-family: "Geist Mono", monospace; }
.tt-theme .hover-line:hover { background: var(--surface-2); }
.tt-theme .click { cursor: pointer; transition: background 120ms ease, color 120ms ease, border-color 120ms ease; }
@keyframes tt-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
.tt-theme .pulse { animation: tt-pulse 2s ease-in-out infinite; }
@keyframes tt-tracer { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
`;

// ---- StrikeLab logo (matches primitives.jsx) ----
const TTLogo = ({ size = 24, withWord = false, wordSize, condensed = false }) => {
  const s = size;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: withWord ? s * 0.45 : 0 }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-label="StrikeLab">
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="2" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="17.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="2" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="17.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
        <circle cx="13.5" cy="10.5" r="1.6" fill="currentColor" />
        <path d="M12 12 L13.5 10.5" stroke="currentColor" strokeWidth="1" />
      </svg>
      {withWord && (
        <span style={{
          fontFamily: 'Geist, sans-serif', fontWeight: 600,
          fontSize: wordSize || s * 0.8,
          letterSpacing: condensed ? '0.18em' : '0.02em',
          textTransform: condensed ? 'uppercase' : 'none',
        }}>{condensed ? 'STRIKELAB' : 'StrikeLab'}</span>
      )}
    </span>
  );
};

// ---- Panel (flat, hairline) ----
const Panel = ({ id, title, right, children, style, padded = true }) => (
  <div style={{
    background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', borderRadius: 2,
    position: 'relative', ...style,
  }}>
    {(id || title || right) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {id && <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10 }}>{id}</span>}
          {title && <span className="micro" style={{ color: 'var(--ink-2)', fontSize: 10 }}>{title}</span>}
        </div>
        {right}
      </div>
    )}
    <div style={{ padding: padded ? 14 : 0 }}>{children}</div>
  </div>
);

const Tag = ({ children, tone = 'default', size = 'sm' }) => {
  const palettes = {
    default: { color: 'var(--ink-2)', borderColor: 'var(--line-strong)' },
    accent:  { color: 'var(--accent)', borderColor: 'var(--accent)' },
    warn:    { color: 'var(--warn)', borderColor: 'var(--warn)' },
    bad:     { color: 'var(--bad)', borderColor: 'var(--bad)' },
    info:    { color: 'var(--info)', borderColor: 'var(--info)' },
    solid:   { color: 'var(--accent-ink)', background: 'var(--accent)', borderColor: 'var(--accent)' },
  };
  return (
    <span className="mono" style={{
      display: 'inline-block', padding: size === 'lg' ? '5px 10px' : '3px 7px', border: '1px solid', borderRadius: 2,
      fontSize: size === 'lg' ? 10 : 9, letterSpacing: '0.18em', textTransform: 'uppercase', ...palettes[tone],
    }}>{children}</span>
  );
};

const Stat = ({ label, value, unit, delta, deltaTone = 'good', size = 'md' }) => {
  const big = size === 'lg' ? 56 : size === 'sm' ? 24 : 36;
  const tone = deltaTone === 'bad' ? 'var(--bad)' : deltaTone === 'warn' ? 'var(--warn)' : 'var(--accent)';
  return (
    <div>
      <div className="micro">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span className="num" style={{ fontSize: big, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>{value}</span>
        {unit && <span className="micro" style={{ fontSize: 10 }}>{unit}</span>}
      </div>
      {delta && <div className="mono" style={{ fontSize: 11, color: tone, marginTop: 6 }}>{delta}</div>}
    </div>
  );
};

// Buttons
const TTButton = ({ children, onClick, kind = 'ghost', size = 'md', style = {}, full, disabled }) => {
  const base = {
    fontFamily: 'Geist Mono', fontSize: size === 'lg' ? 12 : 11, letterSpacing: '0.18em',
    textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 2,
    padding: size === 'lg' ? '14px 22px' : '10px 16px', width: full ? '100%' : 'auto',
    transition: 'all 120ms ease', whiteSpace: 'nowrap', opacity: disabled ? 0.4 : 1,
  };
  const kinds = {
    primary: { background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid var(--accent)' },
    ghost:   { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)' },
    bare:    { background: 'transparent', color: 'var(--ink-3)', border: '1px solid transparent' },
    danger:  { background: 'transparent', color: 'var(--bad)', border: '1px solid var(--bad)' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
};

// ---- i18n ----
const STRINGS = {
  // nav / module
  nav_module: { no: 'Modul · Starttid', en: 'Module · Tee Times' },
  nav_find: { no: 'Finn bane', en: 'Find course' },
  nav_book: { no: 'Bestill', en: 'Book' },
  nav_pay: { no: 'Betal', en: 'Pay' },
  nav_checkin: { no: 'Innsjekk', en: 'Check-in' },
  nav_my: { no: 'Mine runder', en: 'My rounds' },
  // top bar
  hq: { no: 'HQ', en: 'HQ' },
  tee_times: { no: 'Starttider', en: 'Tee Times' },
  live: { no: 'LIVE', en: 'LIVE' },
  // hero / find
  find_title_a: { no: 'Finn en', en: 'Find a' },
  find_title_b: { no: 'runde.', en: 'round.' },
  find_sub: {
    no: 'Live tilgjengelighet på 142 baner i Norge. Filtrert på din spillestyrke, været i sanntid, og banens form akkurat nå.',
    en: 'Live availability across 142 Norwegian courses. Filtered by your game, real-time weather, and how each course is playing right now.',
  },
  near_me: { no: 'Nær meg', en: 'Near me' },
  region: { no: 'Region', en: 'Region' },
  date: { no: 'Dato', en: 'Date' },
  players: { no: 'Spillere', en: 'Players' },
  holes: { no: 'Hull', en: 'Holes' },
  any: { no: 'Alle', en: 'Any' },
  search: { no: 'Søk baner', en: 'Search courses' },
  search_now: { no: 'Søk', en: 'Search' },
  // course list
  results_for: { no: 'Treff', en: 'Results' },
  showing: { no: 'Viser', en: 'Showing' },
  of: { no: 'av', en: 'of' },
  next_avail: { no: 'Neste ledig', en: 'Next open' },
  par: { no: 'Par', en: 'Par' },
  length: { no: 'Lengde', en: 'Length' },
  rating: { no: 'Slope', en: 'Slope' },
  conditions: { no: 'Forhold', en: 'Conditions' },
  firm: { no: 'Fastness', en: 'Firmness' },
  green: { no: 'Greener', en: 'Greens' },
  wind: { no: 'Vind', en: 'Wind' },
  temp: { no: 'Temp', en: 'Temp' },
  rain: { no: 'Regn', en: 'Rain' },
  daylight: { no: 'Dagslys', en: 'Daylight' },
  sunrise: { no: 'Soloppgang', en: 'Sunrise' },
  sunset: { no: 'Solnedgang', en: 'Sunset' },
  twilight: { no: 'Skumring', en: 'Twilight' },
  // tee times
  view_times: { no: 'Vis tider', en: 'View times' },
  open_slots: { no: 'Ledige tider', en: 'Open slots' },
  slots_today: { no: 'tider tilgjengelig', en: 'slots open' },
  free: { no: 'Ledig', en: 'Open' },
  full: { no: 'Fullt', en: 'Full' },
  partial: { no: 'Delvis', en: 'Partial' },
  hold: { no: 'Reservert', en: 'On hold' },
  members_only: { no: 'Medlemmer', en: 'Members' },
  // booking
  your_group: { no: 'Din ball', en: 'Your group' },
  add_player: { no: 'Legg til spiller', en: 'Add player' },
  guest: { no: 'Gjest', en: 'Guest' },
  hcp: { no: 'HCP', en: 'HCP' },
  cart: { no: 'Golfbil', en: 'Cart' },
  range_balls: { no: 'Rangeballer', en: 'Range balls' },
  caddie: { no: 'Caddie', en: 'Caddie' },
  add_ons: { no: 'Tillegg', en: 'Add-ons' },
  total: { no: 'Totalt', en: 'Total' },
  per_player: { no: 'per spiller', en: 'per player' },
  // payment
  pay_with: { no: 'Betal med', en: 'Pay with' },
  vipps: { no: 'Vipps', en: 'Vipps' },
  card: { no: 'Kort', en: 'Card' },
  invoice: { no: 'Faktura', en: 'Invoice' },
  split: { no: 'Del betaling', en: 'Split bill' },
  pay_for_all: { no: 'Betal for alle', en: 'Pay for all' },
  reserve: { no: 'Reserver tid', en: 'Reserve tee time' },
  pay_and_book: { no: 'Betal & bestill', en: 'Pay & book' },
  policy: { no: 'Avbestilling 24t før — gratis. Innen 24t — 50%.', en: 'Free cancellation up to 24h. Within 24h — 50%.' },
  // checkin
  ready_to_play: { no: 'Klar for runde.', en: 'Ready to play.' },
  on_tee_in: { no: 'På 1. tee om', en: 'On the 1st tee in' },
  min: { no: 'min', en: 'min' },
  group_status: { no: 'Ballen din', en: 'Your group' },
  ahead_of_you: { no: 'foran deg', en: 'ahead of you' },
  course_open: { no: 'Banen er åpen', en: 'Course open' },
  start_round: { no: 'Start runde i StrikeLab', en: 'Start round in StrikeLab' },
  open_session: { no: 'Åpne økt', en: 'Open session' },
  qr_label: { no: 'Vis denne ved 1. tee', en: 'Show this at the 1st tee' },
  ready: { no: 'Klar', en: 'Ready' },
  pending: { no: 'Venter', en: 'Pending' },
  // weather codes
  clear: { no: 'Klart', en: 'Clear' },
  cloudy: { no: 'Skyet', en: 'Cloudy' },
  partly: { no: 'Delvis sol', en: 'Partly sunny' },
  showers: { no: 'Regnbyger', en: 'Showers' },
};

const useT = (lang) => React.useCallback((key) => (STRINGS[key] && STRINGS[key][lang]) || key, [lang]);

// ---- Iconography (1px stroke, technical) ----
const Icon = ({ name, size = 14 }) => {
  const s = size;
  const paths = {
    pin: <><path d="M12 22 C 6 14 4 11 4 8 a8 8 0 0 1 16 0 c0 3 -2 6 -8 14 Z" stroke="currentColor" /><circle cx="12" cy="8" r="2.5" stroke="currentColor" /></>,
    wind: <><path d="M3 10 L13 10 a3 3 0 1 0 -3 -3 M3 14 L17 14 a3 3 0 1 1 -3 3" stroke="currentColor" /></>,
    drop: <><path d="M12 3 L17 11 a5 5 0 0 1 -10 0 Z" stroke="currentColor" /></>,
    sun:  <><circle cx="12" cy="12" r="4" stroke="currentColor" /><path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" stroke="currentColor" /></>,
    cloud: <><path d="M6 17 a4 4 0 0 1 -1 -7.8 a6 6 0 0 1 11.6 0 A4 4 0 0 1 16 17 Z" stroke="currentColor" /></>,
    flag: <><path d="M5 21 L5 4 M5 4 L17 4 L13 8 L17 12 L5 12" stroke="currentColor" /></>,
    cart: <><circle cx="7" cy="20" r="2" stroke="currentColor" /><circle cx="17" cy="20" r="2" stroke="currentColor" /><path d="M3 5 L6 5 L9 18 L18 18 L20 9 L8 9" stroke="currentColor" /></>,
    user: <><circle cx="12" cy="8" r="3.5" stroke="currentColor" /><path d="M5 20 c1 -4 4 -6 7 -6 s6 2 7 6" stroke="currentColor" /></>,
    plus: <path d="M12 4 L12 20 M4 12 L20 12" stroke="currentColor" />,
    chev: <path d="M9 6 L15 12 L9 18" stroke="currentColor" />,
    chevD: <path d="M6 9 L12 15 L18 9" stroke="currentColor" />,
    cal: <><rect x="3" y="5" width="18" height="16" stroke="currentColor" /><path d="M3 10 L21 10 M8 3 L8 7 M16 3 L16 7" stroke="currentColor" /></>,
    qr:  <><rect x="3" y="3" width="7" height="7" stroke="currentColor" /><rect x="14" y="3" width="7" height="7" stroke="currentColor" /><rect x="3" y="14" width="7" height="7" stroke="currentColor" /><path d="M14 14 L14 21 M17 14 L17 17 M21 14 L21 17 M14 17 L17 17 M17 21 L21 21 M21 17 L21 21" stroke="currentColor" /></>,
    check: <path d="M5 12 L10 17 L19 7" stroke="currentColor" />,
    target: <><circle cx="12" cy="12" r="9" stroke="currentColor" /><circle cx="12" cy="12" r="4" stroke="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
    map:  <><path d="M3 6 L9 4 L15 6 L21 4 L21 18 L15 20 L9 18 L3 20 Z" stroke="currentColor" /><path d="M9 4 L9 18 M15 6 L15 20" stroke="currentColor" /></>,
    arr:  <path d="M5 12 L19 12 M13 6 L19 12 L13 18" stroke="currentColor" />,
    home: <path d="M3 11 L12 3 L21 11 L21 21 L14 21 L14 14 L10 14 L10 21 L3 21 Z" stroke="currentColor" />,
    bell: <path d="M6 16 L6 11 a6 6 0 1 1 12 0 L18 16 L20 18 L4 18 Z M10 21 a2 2 0 0 0 4 0" stroke="currentColor" />,
    settings: <><circle cx="12" cy="12" r="3" stroke="currentColor"/><path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" stroke="currentColor" /></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>{paths[name]}</svg>;
};

// ---- DATA ---------------------------------------------------------------
const COURSES = [
  {
    id: 'losby',
    name: 'Losby Golfklubb',
    region: 'Akershus · Lørenskog',
    par: 72, length: 6248, slope: 132, rating: 73.2, holes: 18,
    next: '14:20', priceFrom: 690, openSlots: 14,
    blurb: 'Parkland · classic Hauger design',
    firm: 78, green: 'Stimp 10.4',
    weather: { code: 'partly', tempC: 14, windMs: 4, windDir: 'SW', rainMm: 0.4, sunrise: '04:22', sunset: '21:48' },
    distanceKm: 18, image: 'losby',
    note: 'Front 9 plays into the prevailing wind today.',
    tier: 'public',
  },
  {
    id: 'oslogk',
    name: 'Oslo Golfklubb',
    region: 'Oslo · Bogstad',
    par: 71, length: 5942, slope: 137, rating: 72.4, holes: 18,
    next: '15:10', priceFrom: 1450, openSlots: 6,
    blurb: 'Tight, tree-lined · members + invited guests',
    firm: 82, green: 'Stimp 11.1',
    weather: { code: 'clear', tempC: 16, windMs: 2, windDir: 'NE', rainMm: 0, sunrise: '04:18', sunset: '21:52' },
    distanceKm: 7, image: 'oslogk',
    note: 'Greens cut to 3.0 mm at 04:30 — fast running.',
    tier: 'invited',
  },
  {
    id: 'miklagard',
    name: 'Miklagard Golf',
    region: 'Akershus · Kløfta',
    par: 73, length: 6420, slope: 134, rating: 73.8, holes: 18,
    next: '13:50', priceFrom: 950, openSlots: 22,
    blurb: 'European Tour spec · long carries off the tee',
    firm: 71, green: 'Stimp 10.7',
    weather: { code: 'partly', tempC: 15, windMs: 5, windDir: 'W', rainMm: 0.2, sunrise: '04:24', sunset: '21:46' },
    distanceKm: 32, image: 'miklagard',
    note: 'Pin sheets posted 06:00 — back-right on 12 today.',
    tier: 'public',
  },
  {
    id: 'kongsberg',
    name: 'Kongsberg Golfklubb',
    region: 'Buskerud · Kongsberg',
    par: 72, length: 5810, slope: 128, rating: 71.6, holes: 18,
    next: '14:00', priceFrom: 590, openSlots: 18,
    blurb: 'Forest layout · forgiving fairways',
    firm: 64, green: 'Stimp 9.8',
    weather: { code: 'showers', tempC: 12, windMs: 6, windDir: 'NW', rainMm: 1.4, sunrise: '04:30', sunset: '21:40' },
    distanceKm: 71, image: 'kongsberg',
    note: 'Carts only on paths — ground saturated after morning showers.',
    tier: 'public',
  },
  {
    id: 'tyrifjord',
    name: 'Tyrifjord Golfklubb',
    region: 'Buskerud · Vikersund',
    par: 72, length: 6112, slope: 130, rating: 72.2, holes: 18,
    next: '12:40', priceFrom: 720, openSlots: 11,
    blurb: 'Lakeside · short par-3s, generous landing zones',
    firm: 75, green: 'Stimp 10.1',
    weather: { code: 'partly', tempC: 14, windMs: 3, windDir: 'S', rainMm: 0, sunrise: '04:26', sunset: '21:44' },
    distanceKm: 64, image: 'tyrifjord',
    note: 'Hole 14 (lake par-3) playing 152 m to a back pin.',
    tier: 'public',
  },
  {
    id: 'borre',
    name: 'Borre Golfbane',
    region: 'Vestfold · Horten',
    par: 71, length: 5620, slope: 124, rating: 70.8, holes: 18,
    next: '13:20', priceFrom: 650, openSlots: 9,
    blurb: 'Coastal links-feel · fast running fairways',
    firm: 88, green: 'Stimp 10.9',
    weather: { code: 'clear', tempC: 17, windMs: 7, windDir: 'SW', rainMm: 0, sunrise: '04:20', sunset: '21:50' },
    distanceKm: 88, image: 'borre',
    note: 'Strong sea breeze — bring an extra club into 7.',
    tier: 'public',
  },
];

// Tee time schedule for the selected course (Losby), realistic 10-min intervals
const buildSchedule = () => {
  const slots = [];
  const start = 6 * 60; // 06:00
  const end = 21 * 60;  // 21:00
  for (let m = start; m <= end; m += 10) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push({ time: `${hh}:${mm}`, minutes: m });
  }
  // Seeded "occupancy"
  return slots.map((s, i) => {
    const r1 = Math.sin(i * 1.31) * 0.5 + 0.5;
    const r2 = Math.cos(i * 0.91) * 0.5 + 0.5;
    const filled = Math.max(0, Math.min(4, Math.round(r1 * 4)));
    let status = filled === 4 ? 'full' : filled >= 1 ? 'partial' : 'free';
    if (i % 23 === 5) status = 'hold';
    if (s.minutes < 10 * 60 + 30 && r2 > 0.7) status = 'members';
    const pricePeak = s.minutes >= 14 * 60 && s.minutes <= 17 * 60;
    const priceTwilight = s.minutes >= 18 * 60 + 30;
    const price = priceTwilight ? 490 : pricePeak ? 890 : 690;
    return { ...s, filled, status, price, slope: 132, postable: status !== 'members' };
  });
};
const SCHEDULE = buildSchedule();

const SAMPLE_PLAYERS = [
  { id: 'me',   name: 'D. Hassan',     hcp: 7.2, club: 'StrikeLab',     dialIn: 74, you: true },
  { id: 'jb',   name: 'J. Berg',       hcp: 11.4, club: 'Losby GK',     dialIn: 62 },
  { id: 'es',   name: 'E. Solberg',    hcp: 4.8, club: 'Oslo GK',       dialIn: 81 },
  { id: 'mh',   name: 'M. Holm',       hcp: 18.6, club: 'Miklagard',    dialIn: 51 },
  { id: 'kn',   name: 'K. Nilsen',     hcp: 9.0, club: 'Kongsberg GK',  dialIn: 68 },
];

// Norwegian-friendly formatting
const fmtKr = (n) => `${new Intl.NumberFormat('no-NO').format(n)} kr`;

// Course card map dot generator (deterministic-ish)
const mapDot = (id) => {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { x: 10 + (seed % 70), y: 12 + ((seed * 7) % 68) };
};

Object.assign(window, {
  TT_THEME_CSS, TTLogo, Panel, Tag, Stat, TTButton,
  STRINGS, useT,
  Icon,
  COURSES, SCHEDULE, SAMPLE_PLAYERS,
  fmtKr, mapDot,
});
