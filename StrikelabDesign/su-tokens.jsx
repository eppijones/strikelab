// Strikelab · shared design tokens + primitives
// Single brand system shared across iPhone, Watch and Web surfaces.

const SU = {
  // ── ink (dark surface) ───────────────────────────────────────────
  bg:     "#0a0b0a",
  bg2:    "#0e100f",
  surf:   "#13161408",   // not used, kept for parity
  s1:     "#111312",
  s2:     "#151816",
  s3:     "#1c1f1d",
  s4:     "#23272500",
  line:   "#1f2220",
  line2:  "#2d322f",
  line3:  "#3a403c",
  ink:    "#ede8de",
  ink2:   "#b9b6ac",
  ink3:   "#76746b",
  ink4:   "#4a4842",
  ink5:   "#2f312d",

  // ── bone (warm surface, for web product story) ───────────────────
  bone:   "#ede8de",
  bone2:  "#e3ddd0",
  bone3:  "#d6cfbd",
  boneInk:  "#141614",
  boneInk2: "#4a4842",
  boneInk3: "#76746b",
  boneLine: "#cbc4b1",

  // ── accents ──────────────────────────────────────────────────────
  lime:   "oklch(0.88 0.18 125)",
  limeDim:"oklch(0.74 0.16 125)",
  limeOn: "oklch(0.55 0.18 145)",     // lime on bone
  warn:   "oklch(0.78 0.16 65)",
  bad:    "oklch(0.68 0.20 28)",
  blue:   "oklch(0.78 0.14 245)",
};

// ── shared stylesheet (scoped class names) ──────────────────────────
const SU_CSS = `
  .su-mono { font-family: "Geist Mono", ui-monospace, monospace; font-feature-settings: "tnum","zero"; font-variant-numeric: tabular-nums; }
  .su-serif { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; }
  .su-display { font-family: "Geist", sans-serif; font-weight: 500; letter-spacing: -0.035em; line-height: 0.96; }
  .su-display em { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; letter-spacing: -0.015em; }
  .su-micro { font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; }
  .su-kicker { font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
  .su-tnum { font-feature-settings: "tnum","zero"; font-variant-numeric: tabular-nums; }
  .su-hairline { background: ${SU.line2}; height: 1px; border: 0; }
`;

// ── LOGO ────────────────────────────────────────────────────────────
const SLogo = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ color, display: "block" }}>
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1" />
    <line x1="12" y1="2"    x2="12"  y2="6.5" stroke="currentColor" strokeWidth="1" />
    <line x1="12" y1="17.5" x2="12"  y2="22"  stroke="currentColor" strokeWidth="1" />
    <line x1="2"  y1="12"   x2="6.5" y2="12"  stroke="currentColor" strokeWidth="1" />
    <line x1="17.5" y1="12" x2="22"  y2="12"  stroke="currentColor" strokeWidth="1" />
    <circle cx="13.5" cy="10.5" r="1.6" fill="currentColor" />
    <path d="M12 12 L13.5 10.5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// ── ICONS (line) ────────────────────────────────────────────────────
const Ico = ({ d, size = 16, sw = 1.5, color = "currentColor", fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", ...style }}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const ICONS = {
  flag:    "M5 21V4M5 4l11 3-3 4 3 4L5 12",
  hiker:   "M13 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10 22l2-7-3-3 1-5 4 2 3 4M14 15l3 7",
  target:  "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 11.5l.01 .01",
  putter:  "M14 4l-9 9 5 5 9-9M14 4l5 5M3 21h8",
  heart:   "M12 21s-7-4.5-9-9C1 7 5 3 8 5c1.5 1 2.5 2 4 4 1.5-2 2.5-3 4-4 3-2 7 2 5 7-2 4.5-9 9-9 9z",
  watch:   "M9 3h6l1 3M9 21h6l1-3M6 6h12v12H6z M12 9v3l2 1",
  iphone:  "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM10 19h4",
  globe:   "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-18c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9zM3 12h18",
  calendar:"M3 7h18M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7M3 7l1-3h16l1 3M8 3v6M16 3v6",
  cloud:   "M7 17a4 4 0 0 1 0-8 5 5 0 0 1 10 1 4 4 0 0 1 0 8H7z",
  wind:    "M3 8h12a3 3 0 1 0-3-3M3 12h17a3 3 0 1 1-3 3M3 16h10",
  rain:    "M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10 1 4 4 0 0 1 0 8M9 19l-1 2M13 19l-1 2M17 19l-1 2",
  arrow:   "M5 12h14M13 6l6 6-6 6",
  chev:    "M9 6l6 6-6 6",
  chevDn:  "M6 9l6 6 6-6",
  plus:    "M12 5v14M5 12h14",
  minus:   "M5 12h14",
  check:   "M5 12l4 4 10-10",
  upload:  "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  download:"M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  share:   "M12 4v12M7 9l5-5 5 5M4 20h16",
  search:  "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5.5 12.5L21 21",
  gear:    "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM19 12c0-.5-.05-1-.13-1.5l2.13-1.5-2-3.5-2.5 1a7 7 0 0 0-2.5-1.5L13.5 3h-3l-.5 2a7 7 0 0 0-2.5 1.5l-2.5-1-2 3.5L5.13 10.5C5.05 11 5 11.5 5 12s.05 1 .13 1.5L3 15l2 3.5 2.5-1a7 7 0 0 0 2.5 1.5l.5 2h3l.5-2a7 7 0 0 0 2.5-1.5l2.5 1 2-3.5-2.13-1.5c.08-.5.13-1 .13-1.5z",
  mic:     "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  pin:     "M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  spark:   "M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-5 4",
  swing:   "M3 21c4-4 8-6 12-6s8 2 12 6M9 13l3-6 3 6",
  bell:    "M6 16a6 6 0 0 1 12 0v2l2 2H4l2-2zM10 22h4",
  list:    "M4 6h16M4 12h16M4 18h16",
  user:    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  bag:     "M7 8h10l-1 13H8L7 8zM9 8V5a3 3 0 0 1 6 0v3M9 12v3M15 12v3",
  filter:  "M3 5h18l-7 9v6l-4-2v-4L3 5z",
  pen:     "M4 20l1-5L17 3l4 4L9 19l-5 1z",
  link:    "M9 15l6-6M8 8H6a4 4 0 0 0 0 8h2M16 16h2a4 4 0 0 0 0-8h-2",
  trash:   "M5 7h14M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6",
  trophy:  "M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3a3 3 0 0 0 3 3M19 4h2a3 3 0 0 1-3 3M9 16h6M8 21h8M12 13v8",
  qr:      "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3h-3M14 20h3v1M19 19h2v2",
  sun:     "M12 4v2M12 18v2M4 12h2M18 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
  weather: "M16 18a4 4 0 0 0 0-8 5 5 0 0 0-10 0M5 14h0M9 17h0M13 17h0",
  map:     "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14",
  fire:    "M12 22c-4 0-7-3-7-7 0-3 2-5 3-6 0 2 1 3 2 3 0-4 2-6 4-9 0 5 6 7 6 12 0 4-3 7-8 7z",
};

// ── small primitives ────────────────────────────────────────────────
const Pill = ({ children, color = SU.lime, bg, text }) => (
  <span className="su-mono" style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 7px",
    background: bg || "transparent",
    color: text || color,
    border: `1px solid ${color}`,
    borderRadius: 2,
    fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
  }}>{children}</span>
);

const Dot = ({ color = SU.lime, size = 6 }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flex: "0 0 auto" }} />
);

// ── shared layouts (artboard chrome) ────────────────────────────────
const ABoard = ({ children, w = 390, h = 844, bg = SU.bg, radius = 44, pad = 0 }) => (
  <div style={{
    width: w, height: h, background: bg, color: SU.ink,
    borderRadius: radius, overflow: "hidden", padding: pad,
    position: "relative",
    fontFamily: "Geist, sans-serif",
  }}>{children}</div>
);

// ── iPhone status bar (faux) ────────────────────────────────────────
const IPhStatus = ({ time = "08:52", tint = SU.ink, tracking = false }) => (
  <div style={{
    height: 52, display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 32px", color: tint,
  }} className="su-mono">
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 500 }}>
      <span>{time}</span>
      {tracking && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill={SU.blue} style={{ transform: "rotate(40deg)" }}>
          <path d="M3 11l18-9-9 18-2-7-7-2z" />
        </svg>
      )}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width="17" height="11" viewBox="0 0 17 11" fill={tint}>
        <rect x="0"  y="6" width="3" height="5"/>
        <rect x="4"  y="4" width="3" height="7"/>
        <rect x="8"  y="2" width="3" height="9"/>
        <rect x="12" y="0" width="3" height="11"/>
      </svg>
      <span style={{ fontSize: 14, fontWeight: 600 }}>5G</span>
      <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={tint} />
        <rect x="24" y="4" width="1.5" height="4" fill={tint} rx="0.5"/>
        <rect x="2" y="2" width="14" height="8" rx="1.5" fill="oklch(0.78 0.18 145)"/>
        <text x="14" y="9" fontSize="7" fill="#0a0b0a" fontWeight="700" textAnchor="end" fontFamily="Geist Mono">25</text>
      </svg>
    </div>
  </div>
);

// ── iPhone tabbar (live nav) ────────────────────────────────────────
const IPhTabbar = ({ active = "home" }) => {
  const tabs = [
    ["home",     "Home",      ICONS.flag],
    ["tee",      "Tee",       ICONS.calendar],
    ["practice", "Practice",  ICONS.hiker],
    ["score",    "Rounds",    ICONS.list],
    ["me",       "Profile",   ICONS.user],
  ];
  return (
    <div style={{
      position: "absolute", bottom: 22, left: 16, right: 16,
      background: "rgba(20,22,21,0.72)", backdropFilter: "blur(20px)",
      borderRadius: 32, padding: "10px 14px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      border: `1px solid ${SU.line2}`,
    }}>
      {tabs.map(([id, label, icon]) => {
        const on = id === active;
        return (
          <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 4px", minWidth: 52 }}>
            <div style={{
              background: on ? SU.bg : "transparent",
              padding: on ? "5px 12px" : 0,
              borderRadius: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Ico d={icon} size={18} color={on ? SU.lime : SU.ink2} sw={1.6} />
            </div>
            <span style={{ fontSize: 10, color: on ? SU.lime : SU.ink2, fontWeight: 500, letterSpacing: 0.2 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// expose globals
Object.assign(window, { SU, SU_CSS, SLogo, Ico, ICONS, Pill, Dot, ABoard, IPhStatus, IPhTabbar });
