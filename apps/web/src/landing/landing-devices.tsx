import type { ReactNode } from 'react'

import { FONT_DISPLAY, FONT_MONO, FONT_UI, TEE } from './tokens'

// ─────────────────────────────────────────────────────────────
// Mini iPhone — fits whatever screen we want to show inside it.
// `screen` is a render function that returns an SVG group (or a JSX fragment).
// ─────────────────────────────────────────────────────────────
export function MiniPhone({ width = 240, screen, accent = TEE.moss, time = '9:41', tint = TEE.cream }) {
  const H = width * (502/240);
  return (
    <svg viewBox={`0 0 240 502`} width={width} height={H} style={{ display:'block' }}>
      <defs>
        <clipPath id={`phone-clip-${width}`}>
          <rect x="13" y="13" width="214" height="476" rx="38"/>
        </clipPath>
      </defs>
      <rect x="3" y="3" width="234" height="496" rx="48" fill="#1B1F1A"/>
      <rect x="9" y="9" width="222" height="484" rx="42" fill={TEE.ink}/>
      <rect x="13" y="13" width="214" height="476" rx="38" fill={tint}/>
      <g clipPath={`url(#phone-clip-${width})`}>
        {screen ? screen({ accent, tint }) : null}
      </g>
      {/* notch + status bar */}
      <rect x="89" y="22" width="62" height="20" rx="10" fill={TEE.ink}/>
      <text x="34" y="36" fill={TEE.ink} fontFamily={FONT_UI} fontSize="10" fontWeight="600">{time}</text>
      <g transform="translate(184, 30)">
        <rect x="0" y="0" width="22" height="9" rx="2" stroke={TEE.ink} strokeOpacity="0.5" fill="none"/>
        <rect x="2" y="2" width="14" height="5" rx="1" fill={accent}/>
      </g>
      {/* home indicator */}
      <rect x="90" y="476" width="60" height="3" rx="1.5" fill={TEE.ink} fillOpacity="0.35"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini Apple Watch
// ─────────────────────────────────────────────────────────────
export function MiniWatch({ width = 168, screen, time = '9:41' }) {
  const H = width * (200/168);
  return (
    <svg viewBox="0 0 168 200" width={width} height={H} style={{ display:'block' }}>
      <defs>
        <clipPath id={`watch-clip-${width}`}>
          <rect x="16" y="16" width="130" height="168" rx="30"/>
        </clipPath>
      </defs>
      {/* crown + button */}
      <rect x="156" y="76" width="6" height="24" rx="3" fill="#383C36"/>
      <rect x="156" y="106" width="4" height="12" rx="2" fill="#383C36"/>
      {/* case + bezel */}
      <rect x="6" y="6" width="150" height="188" rx="40" fill="#1B1F1A"/>
      <rect x="12" y="12" width="138" height="176" rx="34" fill={TEE.ink}/>
      <rect x="16" y="16" width="130" height="168" rx="30" fill="#0A0A0A"/>
      <g clipPath={`url(#watch-clip-${width})`}>
        {screen ? screen() : null}
      </g>
      {/* status */}
      <text x="80" y="38" fill="#fff" fontFamily={FONT_UI} fontSize="11" fontWeight="600" textAnchor="middle">{time}</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Phone screens — small, focused product moments.
// Each returns the inner SVG group for MiniPhone.
// ─────────────────────────────────────────────────────────────

// Live-round dashboard (post 9 holes)
export function PhoneScreenScorecard({ accent }) {
  return (
    <>
      <g transform="translate(28, 64)">
        <text x="0" y="0" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.5">RUNDE 14 · I DAG</text>
        <text x="0" y="24" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="22" fontWeight="500" fontStyle="italic">Miklagard</text>
      </g>
      <g transform="translate(20, 118)">
        <rect width="200" height="86" rx="14" fill="#EBE4D2" stroke={TEE.hairline2}/>
        <text x="14" y="22" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.6">ETTER 9 HULL</text>
        <text x="14" y="54" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="32" fontWeight="500" letterSpacing="-1">38</text>
        <text x="54" y="54" fill={accent} fontFamily={FONT_MONO} fontSize="13" fontWeight="500">+2</text>
        <text x="14" y="74" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.3">GIR 5 · FW 4 · PUTTS 16</text>
        <g transform="translate(118, 22)">
          <polyline points="0,46 10,42 22,44 34,32 46,34 58,24 70,22 82,16"
                    fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round"/>
          {[[0,46],[10,42],[22,44],[34,32],[46,34],[58,24],[70,22],[82,16]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="1.5" fill={accent}/>
          ))}
        </g>
      </g>
      <g transform="translate(20, 220)">
        <text x="0" y="0" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.6">HULL FOR HULL</text>
        {Array.from({ length: 8 }, (_, i) => {
          const par = [4,5,3,4,4,3,5,4][i];
          const score = [4,5,4,4,3,3,6,5][i];
          const diff = score - par;
          const color = diff === 0 ? TEE.ink2 : diff < 0 ? accent : TEE.rust;
          return (
            <g key={i} transform={`translate(0, ${18 + i * 22})`}>
              <text x="0" y="12" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="9">{String(i + 1).padStart(2,'0')}</text>
              <text x="22" y="12" fill={TEE.ink} fontFamily={FONT_UI} fontSize="10">Par {par}</text>
              <rect x="90" y="2" width="80" height="14" rx="3" fill="#EBE4D2"/>
              <text x="100" y="12" fill={color} fontFamily={FONT_MONO} fontSize="9" fontWeight="600">
                {score}{diff === 0 ? '' : diff > 0 ? ` +${diff}` : ` ${diff}`}
              </text>
              <line x1="0" y1="20" x2="200" y2="20" stroke={TEE.hairline2}/>
            </g>
          );
        })}
      </g>
    </>
  );
}

// On-course "live shot" screen — distance + club + dispersion mini-map
export function PhoneScreenLiveShot({ accent }) {
  return (
    <>
      <g transform="translate(28, 64)">
        <text x="0" y="0" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.5">HULL 7 · PAR 4</text>
        <text x="0" y="24" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="22" fontWeight="500" fontStyle="italic">2. slag</text>
      </g>
      {/* distance hero */}
      <g transform="translate(20, 110)">
        <rect width="200" height="118" rx="14" fill={TEE.ink}/>
        <text x="16" y="24" fill="rgba(251,250,246,0.55)" fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.5">TIL FLAGGET</text>
        <text x="16" y="76" fill={TEE.cream} fontFamily={FONT_DISPLAY} fontSize="58" fontWeight="500" letterSpacing="-2">148</text>
        <text x="130" y="76" fill={TEE.sun} fontFamily={FONT_MONO} fontSize="13" fontWeight="500">m</text>
        <line x1="16" y1="88" x2="184" y2="88" stroke="rgba(251,250,246,0.12)"/>
        <text x="16" y="106" fill="rgba(251,250,246,0.7)" fontFamily={FONT_MONO} fontSize="8.5" letterSpacing="0.4">FRONT 142 · MIDT 148 · BAK 156</text>
      </g>
      {/* club suggestion */}
      <g transform="translate(20, 242)">
        <rect width="200" height="48" rx="14" fill={TEE.cream} stroke={TEE.hairline2}/>
        <text x="14" y="20" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.5">FORESLÅTT</text>
        <text x="14" y="38" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="18" fontWeight="500" fontStyle="italic">8-jern</text>
        <text x="120" y="38" fill={accent} fontFamily={FONT_MONO} fontSize="10" fontWeight="500">avg 151m</text>
      </g>
      {/* dispersion map */}
      <g transform="translate(20, 302)">
        <rect width="200" height="148" rx="14" fill="#EBE4D2" stroke={TEE.hairline2}/>
        <text x="14" y="22" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.5">SPREDNING · 8-JERN · SISTE 24</text>
        {/* fairway shape */}
        <path d="M 100 132 Q 92 90 80 50 Q 95 38 120 38 Q 145 38 160 50 Q 148 90 140 132 Z"
              fill="#A8BE9A" fillOpacity="0.45" stroke={accent} strokeOpacity="0.4" strokeDasharray="2 3"/>
        {/* dispersion dots */}
        {[[100,58],[112,62],[96,72],[108,68],[118,76],[92,82],[104,78],[114,72],[122,82],[88,90],[110,86],[124,68],[100,86],[116,90],[94,64]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2" fill={accent} fillOpacity="0.55"/>
        ))}
        {/* target ring */}
        <circle cx="110" cy="62" r="10" fill="none" stroke={TEE.sun} strokeWidth="1.4"/>
        <circle cx="110" cy="62" r="2" fill={TEE.sun}/>
        {/* pin */}
        <g transform="translate(110, 44)">
          <line x1="0" y1="0" x2="0" y2="-12" stroke={TEE.ink} strokeWidth="0.8"/>
          <path d="M0,-12 L7,-9 L0,-6 Z" fill={TEE.rust}/>
        </g>
      </g>
    </>
  );
}

// Tee Window / booking moment
export function PhoneScreenWindow({ accent }) {
  return (
    <>
      <g transform="translate(28, 64)">
        <text x="0" y="0" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.5">VINDU · MIKLAGARD</text>
        <text x="0" y="24" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="22" fontWeight="500" fontStyle="italic">I morgen</text>
      </g>
      {/* sun curve window */}
      <g transform="translate(20, 110)">
        <rect width="200" height="180" rx="14" fill={TEE.cream} stroke={TEE.hairline2}/>
        <defs>
          <linearGradient id="window-sun-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TEE.sun} stopOpacity="0.45"/>
            <stop offset="1" stopColor={TEE.sun} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <path d="M 16 140 Q 100 -20 184 140 L 184 156 L 16 156 Z" fill="url(#window-sun-grad)"/>
        {/* best window band */}
        <rect x="76" y="34" width="52" height="122" fill={TEE.sun} fillOpacity="0.10"
              stroke={TEE.sun} strokeOpacity="0.5" strokeDasharray="2 3"/>
        {/* hour ticks */}
        {[6, 9, 12, 15, 18, 21].map((h, i) => {
          const x = 16 + (i / 5) * 168;
          return (
            <g key={h}>
              <line x1={x} y1="156" x2={x} y2="160" stroke={TEE.graphite}/>
              <text x={x} y="172" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7.5" textAnchor="middle">{String(h).padStart(2,'0')}</text>
            </g>
          );
        })}
        {/* tee slots */}
        {Array.from({length: 14}, (_,i) => {
          const t = i / 13;
          const x = 16 + t * 168;
          const sunV = 1 - Math.abs((t - 0.5) * 2);
          const y = 140 - sunV * 102;
          const isBest = i === 7;
          return (
            <g key={i}>
              {isBest && <circle cx={x} cy={y} r="9" fill="none" stroke={TEE.sun} strokeOpacity="0.6"/>}
              <circle cx={x} cy={y} r={isBest ? 4.5 : 1.8} fill={isBest ? TEE.sun : TEE.ink}/>
            </g>
          );
        })}
      </g>
      {/* best now card */}
      <g transform="translate(20, 306)">
        <rect width="200" height="60" rx="14" fill={TEE.ink}/>
        <text x="14" y="22" fill="rgba(251,250,246,0.55)" fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.5">BESTE VINDU</text>
        <text x="14" y="46" fill={TEE.cream} fontFamily={FONT_DISPLAY} fontSize="20" fontWeight="500" fontStyle="italic">12:24</text>
        <text x="76" y="46" fill={TEE.sun} fontFamily={FONT_MONO} fontSize="11" fontWeight="500">22° · 2 m/s</text>
        <text x="14" y="56" fill="rgba(251,250,246,0.45)" fontFamily={FONT_MONO} fontSize="6.5" letterSpacing="0.3"></text>
      </g>
      <g transform="translate(20, 376)">
        <rect width="200" height="40" rx="14" fill={TEE.moss}/>
        <text x="100" y="26" fill={TEE.cream} fontFamily={FONT_UI} fontSize="12" fontWeight="500" textAnchor="middle">Reserver — fra 480 kr</text>
      </g>
    </>
  );
}

// Post-round handicap-trending review
export function PhoneScreenReview({ accent }) {
  // 8-month handicap trend, decreasing.
  const points = [22.4, 20.1, 18.6, 17.2, 15.8, 14.1, 12.6, 11.2];
  const months = ['SEP','OKT','NOV','DES','JAN','FEB','MAR','APR'];
  const minV = 10, maxV = 24;
  const W = 200, H = 130, padX = 14, padY = 16;
  return (
    <>
      <g transform="translate(28, 64)">
        <text x="0" y="0" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.5">SISTE 8 MND</text>
        <text x="0" y="24" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="22" fontWeight="500" fontStyle="italic">Handicap</text>
      </g>
      {/* big number */}
      <g transform="translate(20, 110)">
        <text x="0" y="40" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="68" fontWeight="500" letterSpacing="-3">11,2</text>
        <text x="148" y="40" fill={accent} fontFamily={FONT_MONO} fontSize="14" fontWeight="500">−11,2</text>
        <text x="0" y="58" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="8.5" letterSpacing="0.4">FRA 22,4 · −50%</text>
      </g>
      {/* chart */}
      <g transform="translate(20, 200)">
        <rect width={W} height={H} rx="14" fill="#EBE4D2"/>
        {/* grid */}
        {[0,1,2,3].map(i => (
          <line key={i} x1={padX} y1={padY + i * (H - padY*2)/3} x2={W-padX} y2={padY + i * (H - padY*2)/3}
                stroke={TEE.hairline} strokeDasharray="1 2"/>
        ))}
        {/* trend line */}
        <polyline points={points.map((v,i) => {
          const x = padX + (i / (points.length-1)) * (W - padX*2);
          const y = padY + ((v - minV) / (maxV - minV)) * (H - padY*2);
          return `${x},${y}`;
        }).join(' ')} fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((v,i) => {
          const x = padX + (i / (points.length-1)) * (W - padX*2);
          const y = padY + ((v - minV) / (maxV - minV)) * (H - padY*2);
          return <circle key={i} cx={x} cy={y} r={i === points.length-1 ? 3 : 1.6} fill={i === points.length-1 ? TEE.sun : accent}/>;
        })}
        {/* x labels */}
        {months.map((m,i) => {
          const x = padX + (i / (points.length-1)) * (W - padX*2);
          return <text key={m} x={x} y={H - 4} fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="6.5" textAnchor="middle">{m}</text>;
        })}
      </g>
      {/* stats grid */}
      <g transform="translate(20, 346)">
        {[
          { l: 'AVG DRIVE', v: '254m' },
          { l: 'RUNDER', v: '38' },
          { l: 'BEST', v: '78' },
        ].map((s, i) => (
          <g key={i} transform={`translate(${i*68}, 0)`}>
            <rect width="64" height="48" rx="10" fill={TEE.cream} stroke={TEE.hairline2}/>
            <text x="10" y="18" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7" letterSpacing="0.4">{s.l}</text>
            <text x="10" y="36" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="14" fontWeight="500">{s.v}</text>
          </g>
        ))}
      </g>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Watch screens
// ─────────────────────────────────────────────────────────────
export function WatchScreenShot() {
  return (
    <>
      <text x="80" y="68" fill={TEE.sun} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.6" textAnchor="middle">HULL 7 · PAR 4</text>
      <text x="80" y="108" fill="#fff" fontFamily={FONT_DISPLAY} fontSize="42" fontWeight="500" fontStyle="italic" textAnchor="middle">2</text>
      <text x="80" y="126" fill="rgba(255,255,255,0.5)" fontFamily={FONT_MONO} fontSize="7" letterSpacing="0.5" textAnchor="middle">SLAG</text>
      <circle cx="80" cy="158" r="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3"/>
      <circle cx="80" cy="158" r="20" fill="none" stroke={TEE.moss2} strokeWidth="3" strokeLinecap="round"
              strokeDasharray="86 130" transform="rotate(-90 80 158)"/>
      <text x="80" y="161" fill="#fff" fontFamily={FONT_MONO} fontSize="11" fontWeight="600" textAnchor="middle">148m</text>
    </>
  );
}

export function WatchScreenHandicap() {
  return (
    <>
      <text x="80" y="62" fill="rgba(255,255,255,0.45)" fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.5" textAnchor="middle">LIVE HCP</text>
      <text x="80" y="116" fill="#fff" fontFamily={FONT_DISPLAY} fontSize="46" fontWeight="500" fontStyle="italic" textAnchor="middle">11,2</text>
      <text x="80" y="138" fill={TEE.sun} fontFamily={FONT_MONO} fontSize="9" letterSpacing="0.5" textAnchor="middle">−0,3 i dag</text>
      {/* mini sparkline */}
      <polyline points="40,168 52,164 64,166 76,158 88,160 100,152 112,150 124,144"
                fill="none" stroke={TEE.sun} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="124" cy="144" r="2" fill={TEE.sun}/>
    </>
  );
}

export function WatchScreenWindow() {
  return (
    <>
      <text x="80" y="60" fill="rgba(255,255,255,0.5)" fontFamily={FONT_MONO} fontSize="7.5" letterSpacing="0.5" textAnchor="middle">BESTE NÅ</text>
      <text x="80" y="98" fill={TEE.sun} fontFamily={FONT_DISPLAY} fontSize="32" fontWeight="500" fontStyle="italic" textAnchor="middle">12:24</text>
      {/* sun arc */}
      <path d="M 36 150 Q 80 100 124 150" fill="none" stroke="rgba(232,181,71,0.35)" strokeWidth="1.4"/>
      <circle cx="80" cy="120" r="4" fill={TEE.sun}/>
      <text x="80" y="170" fill="#fff" fontFamily={FONT_MONO} fontSize="9" letterSpacing="0.4" textAnchor="middle">22° · 2 m/s</text>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Web / browser frame — for the "ecosystem" variants
// ─────────────────────────────────────────────────────────────
export function MiniWebTee({ width = 320 }) {
  const H = Math.round(width * (200/320));
  return (
    <svg viewBox={`0 0 320 200`} width={width} height={H} style={{ display:'block' }}>
      {/* window */}
      <rect x="0" y="0" width="320" height="200" rx="12" fill={TEE.cream} stroke={TEE.hairline2}/>
      {/* chrome */}
      <rect x="0" y="0" width="320" height="24" fill="#EBE4D2"/>
      <circle cx="12" cy="12" r="3.5" fill="#E06A4D"/>
      <circle cx="24" cy="12" r="3.5" fill="#E8B547"/>
      <circle cx="36" cy="12" r="3.5" fill="#7A9A6E"/>
      <rect x="60" y="6" width="180" height="12" rx="3" fill={TEE.cream} stroke={TEE.hairline2}/>
      <text x="68" y="15" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="6.5">tee.strikelab.golf</text>
      {/* content */}
      <text x="18" y="50" fill={TEE.graphite} fontFamily={FONT_MONO} fontSize="7" letterSpacing="0.5">ÅPNE TIDER · I DAG</text>
      <text x="18" y="76" fill={TEE.ink} fontFamily={FONT_DISPLAY} fontSize="22" fontWeight="500" fontStyle="italic">Miklagard</text>
      {/* time grid */}
      <g transform="translate(18, 96)">
        {Array.from({length:14}, (_,i) => {
          const x = (i % 7) * 41;
          const y = Math.floor(i / 7) * 30;
          const t = ['07:00','07:12','07:24','07:36','07:48','08:00','08:12',
                     '08:24','08:36','08:48','09:00','09:12','09:24','09:36'][i];
          const taken = [1,4,6,9,11].includes(i);
          const best = i === 7;
          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <rect width="36" height="22" rx="5"
                    fill={taken ? '#EBE4D2' : (best ? TEE.moss : TEE.cream)}
                    stroke={TEE.hairline2}/>
              <text x="18" y="14" textAnchor="middle"
                    fill={taken ? TEE.mute : (best ? TEE.cream : TEE.ink)}
                    fontFamily={FONT_MONO} fontSize="7" fontWeight={best?600:400}>{t}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// Make components available globally for other babel scripts.
