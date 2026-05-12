// components.jsx — shared building blocks for the tee. prototype
// Brand mark, hero landscapes (SVG), condition chips, language toggle,
// formatting helpers, palette, etc.

// ─────────────────────────────────────────────────────────────
// Palette + tokens
// ─────────────────────────────────────────────────────────────
const TEE = {
  paper:   '#F4F0E8',
  cream:   '#FBFAF6',
  ink:     '#0E1410',
  ink2:    '#2A332B',
  graphite:'#5A615C',
  mute:    '#8B8E83',
  hairline:'rgba(14,20,16,0.10)',
  hairline2:'rgba(14,20,16,0.06)',
  moss:    '#2D4A2B',
  moss2:   '#5C7E4F',
  moss3:   '#A8BE9A',
  sand:    '#C9B894',
  sand2:   '#E8DDC4',
  sun:     '#E8B547',
  sunLite: '#F3D38A',
  rust:    '#B8542E',
  sky:     '#B8C6CC',
  fjord:   '#3E5562',
  // course type accents
  parkland:    '#3A5236',
  links:       '#647A6E',
  championship:'#2D4A2B',
  lakeside:    '#436B5C',
  farmland:    '#7A8A4D',
};

const FONT_DISPLAY = '"Newsreader", Georgia, serif';
const FONT_UI      = '"Geist", -apple-system, system-ui, sans-serif';
const FONT_MONO    = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

// ─────────────────────────────────────────────────────────────
// Brand mark
// ─────────────────────────────────────────────────────────────
function BrandMark({ size = 22, color = TEE.ink }) {
  return (
    <span style={{
      fontFamily: FONT_DISPLAY, fontSize: size, fontWeight: 500,
      letterSpacing: -0.02 * size, color, lineHeight: 1, fontStyle: 'italic',
    }}>tee<span style={{ color: TEE.moss, fontStyle:'normal' }}>.</span></span>
  );
}

// ─────────────────────────────────────────────────────────────
// Language toggle (NO / EN)
// ─────────────────────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 0,
      fontFamily: FONT_UI, fontSize: 11, fontWeight: 500,
      letterSpacing: 0.6, textTransform: 'uppercase',
      border: `1px solid ${TEE.hairline}`, borderRadius: 999, padding: 2,
      background: TEE.cream,
    }}>
      {['no','en'].map(L => (
        <button key={L} onClick={() => setLang(L)} style={{
          appearance:'none', border:'none', cursor:'pointer',
          padding: '4px 9px', borderRadius: 999,
          background: lang===L ? TEE.ink : 'transparent',
          color: lang===L ? TEE.cream : TEE.ink,
          fontFamily: FONT_UI, fontWeight: 500, fontSize: 10.5, letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}>{L}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG hero landscapes — one per course type
// All use a 400×220 viewBox. Editorial, painted-paper feel.
// ─────────────────────────────────────────────────────────────
function HeroLandscape({ kind = 'parkland', height = 220, ...rest }) {
  const W = 400, H = 220;
  const renderers = {
    parkland: ParklandHero,
    links: LinksHero,
    championship: ChampionshipHero,
    lakeside: LakesideHero,
    farmland: FarmlandHero,
  };
  const R = renderers[kind] || ParklandHero;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
         style={{ display: 'block', width: '100%', height, ...rest.style }}>
      <R W={W} H={H} />
    </svg>
  );
}

function ParklandHero({ W, H }) {
  return (
    <>
      <defs>
        <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8DDC4"/>
          <stop offset="1" stopColor="#F3E9D2"/>
        </linearGradient>
        <linearGradient id="pl-fwy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A8BE9A"/>
          <stop offset="1" stopColor="#7A9A6E"/>
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pl-sky)"/>
      {/* far hills */}
      <path d="M0,150 C80,130 140,140 220,135 C290,130 340,150 400,140 L400,220 L0,220 Z" fill="#5C7E4F" opacity="0.6"/>
      {/* mid hills */}
      <path d="M0,165 C70,155 140,170 200,160 C280,150 340,175 400,165 L400,220 L0,220 Z" fill="#3A5236"/>
      {/* fairway */}
      <path d="M0,200 C100,190 200,210 300,195 C340,190 380,205 400,200 L400,220 L0,220 Z" fill="url(#pl-fwy)"/>
      {/* tree silhouettes */}
      {[40, 90, 320, 365].map((cx, i) => (
        <g key={i} opacity={0.85}>
          <ellipse cx={cx} cy={150 - (i%2)*8} rx={18 - (i%2)*3} ry={28 - (i%2)*4} fill="#2A3A22"/>
          <rect x={cx-1} y={150} width={2} height={18} fill="#2A3A22"/>
        </g>
      ))}
      {/* small flag on green */}
      <g transform="translate(255,178)">
        <line x1="0" y1="0" x2="0" y2="-22" stroke="#0E1410" strokeWidth="1"/>
        <path d="M0,-22 L9,-19 L0,-15 Z" fill="#B8542E"/>
        <circle cx="0" cy="2" r="3" fill="#3A5236" stroke="#0E1410" strokeOpacity="0.2"/>
      </g>
    </>
  );
}

function LinksHero({ W, H }) {
  return (
    <>
      <defs>
        <linearGradient id="lk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D6DDD9"/>
          <stop offset="1" stopColor="#EDE5D2"/>
        </linearGradient>
        <linearGradient id="lk-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5E7783"/>
          <stop offset="1" stopColor="#3E5562"/>
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#lk-sky)"/>
      {/* sea */}
      <rect x="0" y="120" width={W} height="40" fill="url(#lk-sea)"/>
      {/* sea horizon line */}
      <line x1="0" y1="120" x2={W} y2="120" stroke="#0E1410" strokeOpacity="0.15"/>
      {/* foam */}
      <path d="M0,156 C80,162 140,158 220,164 C290,168 340,160 400,162 L400,162 L0,162 Z" fill="#F4F0E8" opacity="0.7"/>
      {/* dunes */}
      <path d="M0,170 C60,160 120,180 180,168 C240,156 320,182 400,170 L400,220 L0,220 Z" fill="#C9B894"/>
      <path d="M0,186 C70,182 130,196 220,184 C290,176 360,196 400,188 L400,220 L0,220 Z" fill="#A89A78"/>
      {/* sea grass tufts */}
      {[60, 110, 210, 280, 340].map((x, i) => (
        <g key={i} stroke="#5C7E4F" strokeWidth="0.8" opacity="0.7">
          <line x1={x} y1={172} x2={x-2} y2={166}/>
          <line x1={x+2} y1={172} x2={x+1} y2={163}/>
          <line x1={x+4} y1={172} x2={x+5} y2={167}/>
        </g>
      ))}
      {/* flag in distance */}
      <g transform="translate(295,176)">
        <line x1="0" y1="0" x2="0" y2="-18" stroke="#0E1410" strokeWidth="0.8"/>
        <path d="M0,-18 L7,-15 L0,-12 Z" fill="#B8542E"/>
      </g>
    </>
  );
}

function ChampionshipHero({ W, H }) {
  return (
    <>
      <defs>
        <linearGradient id="ch-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9D6CC"/>
          <stop offset="1" stopColor="#E8DDC4"/>
        </linearGradient>
        <linearGradient id="ch-fwy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A8BE9A"/>
          <stop offset="1" stopColor="#5C7E4F"/>
        </linearGradient>
        <radialGradient id="ch-lake" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#7E94A0"/>
          <stop offset="1" stopColor="#3E5562"/>
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ch-sky)"/>
      {/* far horizon */}
      <path d="M0,140 C100,130 200,138 300,132 C350,128 380,140 400,135 L400,220 L0,220 Z" fill="#647A6E" opacity="0.7"/>
      {/* mid */}
      <path d="M0,158 C100,150 200,168 320,154 C360,150 390,162 400,160 L400,220 L0,220 Z" fill="#3A5236"/>
      {/* lake (oval) */}
      <ellipse cx="200" cy="195" rx="120" ry="14" fill="url(#ch-lake)"/>
      <ellipse cx="200" cy="195" rx="120" ry="14" fill="none" stroke="#0E1410" strokeOpacity="0.12"/>
      {/* island green */}
      <ellipse cx="200" cy="194" rx="22" ry="6" fill="url(#ch-fwy)"/>
      <g transform="translate(200,189)">
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#0E1410" strokeWidth="0.8"/>
        <path d="M0,-20 L8,-17 L0,-14 Z" fill="#B8542E"/>
      </g>
      {/* bunkers */}
      <ellipse cx="80" cy="208" rx="22" ry="4" fill="#E8DDC4"/>
      <ellipse cx="330" cy="210" rx="28" ry="5" fill="#E8DDC4"/>
      {/* trees */}
      {[20, 50, 360, 388].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={148} rx={14} ry={20} fill="#2A3A22"/>
          <rect x={cx-1} y={148} width={2} height={12} fill="#2A3A22"/>
        </g>
      ))}
    </>
  );
}

function LakesideHero({ W, H }) {
  return (
    <>
      <defs>
        <linearGradient id="lks-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8DBC8"/>
          <stop offset="1" stopColor="#EAE2C8"/>
        </linearGradient>
        <linearGradient id="lks-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7E94A0"/>
          <stop offset="1" stopColor="#436B5C"/>
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#lks-sky)"/>
      {/* far hills with reflections */}
      <path d="M0,135 C80,115 160,135 240,120 C320,105 380,130 400,125 L400,165 L0,165 Z" fill="#3A5236" opacity="0.85"/>
      {/* water */}
      <rect x="0" y="165" width={W} height={H-165} fill="url(#lks-water)"/>
      {/* water highlights */}
      {[180, 195, 205].map((y, i) => (
        <line key={i} x1="20" y1={y} x2={W-20} y2={y} stroke="#F4F0E8" strokeOpacity={0.15 - i*0.04} strokeWidth="0.7"/>
      ))}
      {/* near shore fairway */}
      <path d="M0,210 C80,202 200,214 320,206 C360,202 390,212 400,210 L400,220 L0,220 Z" fill="#7A9A6E"/>
      {/* trees */}
      {[15, 50, 95, 340, 380].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={130 - (i%2)*4} rx={10} ry={16} fill="#2A3A22"/>
        </g>
      ))}
    </>
  );
}

function FarmlandHero({ W, H }) {
  return (
    <>
      <defs>
        <linearGradient id="fm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8DDC4"/>
          <stop offset="1" stopColor="#F3E9D2"/>
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#fm-sky)"/>
      {/* distant hills */}
      <path d="M0,135 C80,125 160,140 240,128 C320,116 380,138 400,130 L400,220 L0,220 Z" fill="#7A8A4D" opacity="0.6"/>
      {/* mid */}
      <path d="M0,162 C90,154 180,170 280,158 C340,150 390,164 400,162 L400,220 L0,220 Z" fill="#5C7E4F"/>
      {/* fairway stripes */}
      <path d="M0,195 L400,195 L400,220 L0,220 Z" fill="#A8BE9A"/>
      {[200, 205, 210, 215].map((y,i) => (
        <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="#7A9A6E" strokeOpacity={0.5 - i*0.1}/>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Glyphs — minimal, hairline icon set
// ─────────────────────────────────────────────────────────────
function Icon({ kind, size = 16, color = 'currentColor', strokeWidth = 1.4 }) {
  const s = { width: size, height: size, display: 'inline-block', flexShrink: 0 };
  const sw = strokeWidth;
  const stroke = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'sun':
      return (<svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="4" {...stroke}/>{[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180;const x1=12+Math.cos(r)*7,y1=12+Math.sin(r)*7,x2=12+Math.cos(r)*9.5,y2=12+Math.sin(r)*9.5;return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} {...stroke}/>;})}</svg>);
    case 'moon':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M20 14a8 8 0 1 1-9-11 7 7 0 0 0 9 11Z" {...stroke}/></svg>);
    case 'wind':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M3 9h12a3 3 0 1 0-3-3M3 15h16a3 3 0 1 1-3 3M3 12h9" {...stroke}/></svg>);
    case 'cloud':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11 .5A3.5 3.5 0 0 0 7 18Z" {...stroke}/></svg>);
    case 'rain':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11 .5A3.5 3.5 0 0 0 7 15ZM8 18l-1 3M13 18l-1 3M18 18l-1 3" {...stroke}/></svg>);
    case 'flag':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M5 21V4M5 5l8 1.5L11 11l8 1.5" {...stroke}/></svg>);
    case 'pin':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M12 21s7-7.5 7-12.5A7 7 0 1 0 5 8.5C5 13.5 12 21 12 21Z" {...stroke}/><circle cx="12" cy="9" r="2.2" {...stroke}/></svg>);
    case 'arrow-right':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M5 12h14M13 6l6 6-6 6" {...stroke}/></svg>);
    case 'arrow-left':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M19 12H5M11 18l-6-6 6-6" {...stroke}/></svg>);
    case 'check':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M5 12.5l4 4 10-10" {...stroke}/></svg>);
    case 'plus':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M12 5v14M5 12h14" {...stroke}/></svg>);
    case 'minus':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M5 12h14" {...stroke}/></svg>);
    case 'close':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M6 6l12 12M6 18L18 6" {...stroke}/></svg>);
    case 'thermo':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M14 14V5a2 2 0 0 0-4 0v9a4 4 0 1 0 4 0Z" {...stroke}/></svg>);
    case 'green':
      return (<svg viewBox="0 0 24 24" style={s}><ellipse cx="12" cy="14" rx="9" ry="3" {...stroke}/><circle cx="12" cy="14" r="1" fill={color}/><path d="M12 14V4M12 4l4 1.5" {...stroke}/></svg>);
    case 'walking':
      return (<svg viewBox="0 0 24 24" style={s}><circle cx="13" cy="4" r="2" {...stroke}/><path d="M9 21l3-7 2 3v4M12 14l-1-4 4-1 2 3 3 1" {...stroke}/></svg>);
    case 'car':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M4 16v-3l2-5h12l2 5v3M4 16h16M7 16v2M17 16v2" {...stroke}/><circle cx="8" cy="16" r="1.4" {...stroke}/><circle cx="16" cy="16" r="1.4" {...stroke}/></svg>);
    case 'star':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M12 3.5l2.6 5.4 5.9.7-4.4 4 1.2 5.9-5.3-3-5.3 3 1.2-5.9-4.4-4 5.9-.7Z" fill={color} stroke="none"/></svg>);
    case 'qr':
      return (<svg viewBox="0 0 24 24" style={s}><rect x="3" y="3" width="7" height="7" {...stroke}/><rect x="14" y="3" width="7" height="7" {...stroke}/><rect x="3" y="14" width="7" height="7" {...stroke}/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" {...stroke}/></svg>);
    case 'share':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" {...stroke}/></svg>);
    case 'wallet':
      return (<svg viewBox="0 0 24 24" style={s}><rect x="3" y="6" width="18" height="13" rx="2" {...stroke}/><path d="M16 12.5h3M3 9h18" {...stroke}/></svg>);
    case 'chevron-right':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M9 6l6 6-6 6" {...stroke}/></svg>);
    case 'chevron-down':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M6 9l6 6 6-6" {...stroke}/></svg>);
    case 'compass':
      return (<svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="9" {...stroke}/><path d="M15 9l-1.5 4.5L9 15l1.5-4.5L15 9Z" {...stroke}/></svg>);
    case 'mowed':
      return (<svg viewBox="0 0 24 24" style={s}><path d="M3 18h18M3 18l3-6h12l3 6M9 12V8m3 4V6m3 6V8" {...stroke}/></svg>);
    case 'people':
      return (<svg viewBox="0 0 24 24" style={s}><circle cx="9" cy="8" r="3" {...stroke}/><circle cx="17" cy="9" r="2.5" {...stroke}/><path d="M3 19c.5-3 3-5 6-5s5.5 2 6 5M14 14c2 0 5 1.5 5 5" {...stroke}/></svg>);
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Pill / chip
// ─────────────────────────────────────────────────────────────
function Chip({ children, variant = 'default', style }) {
  const styles = {
    default: { bg: 'transparent', color: TEE.ink2, border: TEE.hairline },
    solid:   { bg: TEE.ink, color: TEE.cream, border: 'transparent' },
    moss:    { bg: TEE.moss, color: TEE.cream, border: 'transparent' },
    sand:    { bg: TEE.sand2, color: TEE.ink, border: 'transparent' },
    sun:     { bg: TEE.sunLite, color: '#5A4017', border: 'transparent' },
    ghost:   { bg: TEE.cream, color: TEE.ink2, border: TEE.hairline },
  }[variant] || styles.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px', borderRadius: 999,
      fontFamily: FONT_UI, fontSize: 11.5, fontWeight: 500,
      letterSpacing: 0.1, lineHeight: 1,
      background: styles.bg, color: styles.color,
      border: `1px solid ${styles.border}`,
      whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Conditions row — temp / wind / greens / mowed
// ─────────────────────────────────────────────────────────────
function ConditionsRow({ course, t, compact = false }) {
  const cur = course.hourly?.find(h => h.h === 14) || course.hourly?.[8] || {};
  const items = [
    { i: 'thermo', v: `${cur.t || course.conditions?.temp || 18}°` },
    { i: 'wind',  v: `${cur.w || 5} ${t('windKmh')}` },
    { i: 'green', v: `${course.conditions.greenSpeed}` },
    { i: 'mowed', v: `${course.conditions.mowedHrsAgo}${t('hourAgo')}` },
  ];
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: compact ? 12 : 16,
      fontFamily: FONT_MONO, fontSize: 11.5, color: TEE.ink2, letterSpacing: 0,
    }}>
      {items.map((x, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap: 5 }}>
          <Icon kind={x.i} size={13} color={TEE.graphite} strokeWidth={1.3}/>
          <span>{x.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────
function fmtKr(n) {
  return new Intl.NumberFormat('nb-NO').format(n) + ' kr';
}

function todayLabel(lang) {
  const d = new Date(2025, 5, 24); // June 24, 2025 — long Norwegian summer day
  const opts = { weekday: 'long', day: 'numeric', month: 'short' };
  const s = d.toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-GB', opts);
  return s.replace('.', '');
}

Object.assign(window, {
  TEE, FONT_DISPLAY, FONT_UI, FONT_MONO,
  BrandMark, LangToggle, HeroLandscape, Icon, Chip, ConditionsRow,
  fmtKr, todayLabel,
});
