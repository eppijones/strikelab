export const landingNo = {
  lang: 'no',
  navLabel: 'Hovednavigasjon',
  nav: [
    { label: 'Caddie', href: '#caddie' },
    { label: 'Baner', href: '#courses' },
    { label: 'Tee (preview)', href: '#tee-preview' },
    { label: 'Om', href: '#about' },
  ],
  languageToggle: { label: 'English', href: '/en' },
  hero: {
    eyebrow: 'STRIKELAB CADDIE · BETA · BUILT IN NORWAY',
    headline: {
      before: 'Rangetallene dine. Rundetallene dine.',
      emphasis: 'Samme bag.',
    },
    subhead:
      'StrikeLab Caddie sporer runder på Apple Watch, importerer Trackman- og Foresight-økter, og bygger den eneste køllebag-profilen som kjenner begge. Norske baner. Ingen abonnement. Ingen støy.',
    primaryCta: 'BLI MED I BETA',
    secondaryCta: 'SLIK FUNGERER DET',
    visual: {
      label: 'MERGET BAGPROFIL',
      title: 'DIN 7-JERN',
      stats: [
        { label: 'Carry', value: '142', unit: 'm' },
        { label: 'Bane', value: '47', unit: 'slag' },
        { label: 'Range', value: '6', unit: 'økter' },
      ],
      body: 'Trackman + bane i samme kølleprofil.',
      footer: 'Sist oppdatert etter Losby, fredag 14:50',
    },
  },
  caddieToday: {
    id: 'caddie',
    eyebrow: '01 — HVA CADDIE GJØR I DAG',
    heading: {
      before: 'Fire ting.',
      emphasis: 'Faktisk levert.',
    },
    cards: [
      {
        title: 'Apple Watch-runder',
        body: 'Spor slag, putter og avstander fra håndleddet. Ingen telefon i lomma.',
      },
      {
        title: 'Scorekort på iPhone',
        body: 'Rundene synces til iPhone. Hele historikken samlet, ingen manuell innføring.',
      },
      {
        title: 'Range-import',
        body: 'Slipp inn JSON-eksporter fra Trackman, Foresight eller iPhone Caddie. Hver økt teller.',
      },
      {
        title: 'Bag som lærer',
        body: 'Per-kølle carry og spredning, beregnet på dine faktiske slag — både fra range og bane.',
      },
    ],
  },
  merge: {
    id: 'how-it-works',
    eyebrow: '02 — DET INGEN ANDRE GJØR',
    heading: {
      before: 'Vinter på simulator. Sommer på banen.',
      emphasis: 'Samme tall.',
    },
    body:
      'De fleste golfapper kjenner enten range eller bane. Caddie ser begge. Trackman-økten i januar og Apple Watch-runden i juli havner i samme køllebag, slik at 7-jernet ditt vet hva det egentlig flyr — uansett årstid.',
    flow: [
      { label: 'Trackman-økt', value: 'Januar · 38 slag' },
      { label: 'Bagprofil', value: '7-jern · 142 m' },
      { label: 'Banetracking', value: 'Juli · Losby' },
    ],
  },
  courses: {
    id: 'courses',
    eyebrow: '03 — BANER',
    heading: 'Norske baner, lagt inn for hånd.',
    body:
      'Caddie starter med banene jeg spiller selv, og utvides etter hvert. Mangler banen din? Send en melding.',
    cta: 'FORESLÅ EN BANE',
    ctaHref: 'mailto:hello@strikelab.golf?subject=Foresl%C3%A5%20bane',
  },
  tee: {
    id: 'tee-preview',
    eyebrow: '04 — KOMMER · I DESIGN',
    badge: 'PREVIEW · KREVER NGF-PARTNERSKAP',
    heading: 'Tee. Bestill mindre. Spill mer.',
    body:
      'Tee er StrikeLabs framtidige bookingflate: vinduer i dagen, ikke endeløse lister. Den krever partnerskap med NGF og klubbene for å bli ekte. Inntil da kan du utforske demoen.',
    cta: 'SE DEMO',
    note: 'Konseptdemo med seedet data, ikke en live bookingtjeneste.',
  },
  founder: {
    id: 'about',
    eyebrow: 'OM',
    heading: 'Hvorfor jeg bygget dette.',
    body: [
      'TODO: founder to write',
      'Jeg spiller golf i Norge og bruker vinteren på simulator. Ingen av appene jeg har prøvd klarer å koble de to verdenene — range-økten i januar og runden i juli lever i hver sin silo.',
      'Caddie er først og fremst for meg og golfgjengen min. Hvis det funker for oss, åpner vi for flere. Inntil videre: ti spillere, ærlig data, ingen mas.',
      '— [Navn], grunnlegger',
    ],
  },
  footer: {
    copyright: '© 2026 STRIKELAB · STRIKELAB.GOLF',
    tagline: 'Caddie er i beta. Tee er i design. Begge bygges i Norge.',
    links: [
      { label: 'Personvern', href: '/privacy' },
      { label: 'Vilkår', href: '/terms' },
      { label: 'Datasikkerhet', href: '/security' },
      { label: 'Kontakt', href: 'mailto:hello@strikelab.golf' },
    ],
  },
} as const
