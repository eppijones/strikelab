export const landingEn = {
  lang: 'en',
  navLabel: 'Main navigation',
  nav: [
    { label: 'Caddie', href: '#caddie' },
    { label: 'Courses', href: '#courses' },
    { label: 'Tee (preview)', href: '#tee-preview' },
    { label: 'About', href: '#about' },
  ],
  languageToggle: { label: 'Norsk', href: '/' },
  hero: {
    eyebrow: 'STRIKELAB CADDIE · BETA · BUILT IN NORWAY',
    headline: {
      before: 'Your range numbers. Your round numbers.',
      emphasis: 'The same bag.',
    },
    subhead:
      'StrikeLab Caddie tracks rounds on Apple Watch, imports your Trackman and Foresight sessions, and builds the only bag profile that knows both. Norwegian courses. No subscription. No noise.',
    primaryCta: 'JOIN THE BETA',
    secondaryCta: 'HOW IT WORKS',
    visual: {
      label: 'MERGED BAG PROFILE',
      title: 'YOUR 7-IRON',
      stats: [
        { label: 'Carry', value: '142', unit: 'm' },
        { label: 'Course', value: '47', unit: 'shots' },
        { label: 'Range', value: '6', unit: 'sessions' },
      ],
      body: 'Trackman + course rounds in one club profile.',
      footer: 'Last updated after Losby, Friday 14:50',
    },
  },
  caddieToday: {
    id: 'caddie',
    eyebrow: '01 — WHAT CADDIE DOES TODAY',
    heading: {
      before: 'Four things.',
      emphasis: 'Actually shipped.',
    },
    cards: [
      {
        title: 'Apple Watch rounds',
        body: 'Track strokes, putts, and distances from your wrist. No phone in your pocket.',
      },
      {
        title: 'Scorecards on iPhone',
        body: 'Rounds sync to iPhone. Your full history in one place, no manual entry.',
      },
      {
        title: 'Range import',
        body: 'Bring in JSON exports from Trackman, Foresight, or iPhone Caddie. Every session counts.',
      },
      {
        title: 'A bag that learns',
        body: 'Per-club carry and dispersion, calculated from your actual shots — from range and course.',
      },
    ],
  },
  merge: {
    id: 'how-it-works',
    eyebrow: '02 — WHAT NO ONE ELSE DOES',
    heading: {
      before: 'Winter on the simulator. Summer on the course.',
      emphasis: 'The same numbers.',
    },
    body:
      'Most golf apps know either the range or the course. Caddie sees both. Your Trackman session in January and Apple Watch round in July land in the same club bag, so your 7-iron knows what it actually flies — in every season.',
    flow: [
      { label: 'Trackman session', value: 'January · 38 shots' },
      { label: 'Bag profile', value: '7-iron · 142 m' },
      { label: 'Course tracking', value: 'July · Losby' },
    ],
  },
  courses: {
    id: 'courses',
    eyebrow: '03 — COURSES',
    heading: 'Norwegian courses, entered by hand.',
    body:
      'Caddie starts with the courses I play myself, then expands from there. Missing your course? Send a note.',
    cta: 'SUGGEST A COURSE',
    ctaHref: 'mailto:hello@strikelab.golf?subject=Suggest%20a%20course',
  },
  tee: {
    id: 'tee-preview',
    eyebrow: '04 — COMING · IN DESIGN',
    badge: 'PREVIEW · REQUIRES NGF PARTNERSHIP',
    heading: 'Tee. Book less. Play more.',
    body:
      'Tee is StrikeLab’s future booking surface: windows in the day, not endless lists. It requires partnership with NGF and clubs before it becomes real. Until then, you can explore the demo.',
    cta: 'SEE DEMO',
    note: 'Concept demo with seeded data, not a live booking service.',
  },
  founder: {
    id: 'about',
    eyebrow: 'ABOUT',
    heading: 'Why I built this.',
    body: [
      'TODO: founder to write',
      'I play golf in Norway and spend the winter on simulators. None of the apps I have tried connect those two worlds — the range session in January and the round in July live in separate silos.',
      'Caddie is first and foremost for me and my golf group. If it works for us, we will open it to more players. For now: ten players, honest data, no noise.',
      '— [Name], founder',
    ],
  },
  footer: {
    copyright: '© 2026 STRIKELAB · STRIKELAB.GOLF',
    tagline: 'Caddie is in beta. Tee is in design. Both are built in Norway.',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Data security', href: '/security' },
      { label: 'Contact', href: 'mailto:hello@strikelab.golf' },
    ],
  },
} as const
