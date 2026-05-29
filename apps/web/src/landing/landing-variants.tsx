import { useEffect, useState } from 'react'

import { StrikelabLogo, StrikelabMark, StrikelabWordmark } from './brand'
import {
  MiniPhone,
  MiniWatch,
  MiniWebTee,
  PhoneScreenLiveShot,
  PhoneScreenReview,
  PhoneScreenScorecard,
  PhoneScreenWindow,
  WatchScreenHandicap,
  WatchScreenShot,
  WatchScreenWindow,
} from './landing-devices'
import { FONT_DISPLAY, FONT_MONO, FONT_UI, SL, TEE } from './tokens'

export function Eyebrow({ children, color = SL.moss, dot = SL.sun }) {
  return (
    <div style={{
      fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
      textTransform: 'uppercase', color, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dot }}/>
      {children}
    </div>
  );
}

export function ChipLabel({ label, sub, accent = SL.moss, style }) {
  return (
    <div style={{
      ...style,
      background: SL.surface, padding: '8px 14px', borderRadius: 999,
      border: `1px solid ${SL.hairline2}`,
      boxShadow: '0 6px 18px -6px rgba(14,20,16,0.16)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: accent }}/>
      <div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.7,
          color: SL.ink, fontWeight: 600,
        }}>{label}</div>
        {sub && <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: SL.graphite,
          letterSpacing: 0.3, marginTop: 1,
        }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// A — "Signature 18th"
// An editorial topographic illustration of a par-5 finishing hole.
// A dashed shot trajectory draws across it on a loop.
// Tiny floating data callouts replace full device frames.
// ─────────────────────────────────────────────────────────────

export function TopographicHole({ animateKey = 0 }) {
  // viewBox 600 × 760 — portrait hole, tee at bottom, green at top.
  const W = 600, H = 760;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
         preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
      <defs>
        <linearGradient id="sg18-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EFE7D2"/>
          <stop offset="1" stopColor="#E8DDC4"/>
        </linearGradient>
        <radialGradient id="sg18-light" cx="0.7" cy="0.2" r="0.9">
          <stop offset="0" stopColor="rgba(232,181,71,0.22)"/>
          <stop offset="1" stopColor="rgba(232,181,71,0)"/>
        </radialGradient>
        <pattern id="sg18-grain" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.4" fill="#0E1410" fillOpacity="0.05"/>
        </pattern>
        <pattern id="sg18-water" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="3" x2="6" y2="3" stroke="#3E5562" strokeOpacity="0.35" strokeWidth="0.6"/>
        </pattern>
        <pattern id="sg18-rough" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.45" fill="#3A5236" fillOpacity="0.4"/>
        </pattern>
      </defs>

      {/* paper base */}
      <rect width={W} height={H} fill="url(#sg18-paper)"/>
      <rect width={W} height={H} fill="url(#sg18-grain)"/>
      <rect width={W} height={H} fill="url(#sg18-light)"/>

      {/* rough field */}
      <rect width={W} height={H} fill="url(#sg18-rough)" opacity="0.4"/>

      {/* contour lines — elevation falling toward the green */}
      {[80, 130, 190, 250, 320, 400, 490, 580, 670].map((y, i) => {
        const amp = 24 + i * 6;
        const skew = (i % 2 ? -1 : 1) * 30;
        const d = `M -20 ${y + skew}
                   Q ${W*0.25} ${y - amp + skew} ${W*0.5} ${y + skew*0.4}
                   T ${W+20} ${y - skew*0.6}`;
        return (
          <path key={i} d={d} fill="none"
                stroke="#5C7E4F" strokeOpacity={0.18 + (i%3)*0.04}
                strokeWidth={i === 4 ? 1.1 : 0.7} strokeDasharray={i === 4 ? '0' : '1 3'}/>
        );
      })}

      {/* fairway — dogleg right, tee bottom, green top-center */}
      <path d="M 240 700 C 250 580 200 500 200 420 C 200 340 240 270 320 230 C 380 200 430 180 460 150 C 470 130 460 110 440 100"
            fill="none" stroke="#A8BE9A" strokeWidth="120" strokeLinecap="round"/>
      <path d="M 240 700 C 250 580 200 500 200 420 C 200 340 240 270 320 230 C 380 200 430 180 460 150 C 470 130 460 110 440 100"
            fill="none" stroke="#8AA67E" strokeWidth="118" strokeLinecap="round" strokeOpacity="0.4"/>
      {/* fairway grain */}
      <path d="M 240 700 C 250 580 200 500 200 420 C 200 340 240 270 320 230 C 380 200 430 180 460 150 C 470 130 460 110 440 100"
            fill="none" stroke="#7A9A6E" strokeWidth="116" strokeLinecap="round"
            strokeDasharray="2 8" opacity="0.35"/>

      {/* lateral water hazard along the right of the dogleg */}
      <path d="M 360 600 Q 420 540 410 460 Q 400 380 440 320 Q 470 280 510 280 L 540 280 L 540 620 Q 480 660 420 640 Q 380 630 360 600 Z"
            fill="url(#sg18-water)" stroke="#3E5562" strokeOpacity="0.45" strokeWidth="1"/>

      {/* bunkers */}
      <ellipse cx="180" cy="500" rx="42" ry="14" fill="#E8DDC4" stroke="#C9B894" strokeWidth="1"/>
      <ellipse cx="310" cy="280" rx="34" ry="11" fill="#E8DDC4" stroke="#C9B894" strokeWidth="1"/>
      <ellipse cx="420" cy="140" rx="22" ry="9" fill="#E8DDC4" stroke="#C9B894" strokeWidth="1"/>
      <ellipse cx="490" cy="160" rx="28" ry="10" fill="#E8DDC4" stroke="#C9B894" strokeWidth="1"/>

      {/* green — circle with concentric rings */}
      <g transform="translate(450, 110)">
        <circle r="38" fill="#5C7E4F" opacity="0.95"/>
        <circle r="38" fill="none" stroke="#2A3A22" strokeOpacity="0.3" strokeWidth="0.8"/>
        <circle r="28" fill="none" stroke="#2A3A22" strokeOpacity="0.15" strokeWidth="0.6" strokeDasharray="1 2"/>
        <circle r="16" fill="none" stroke="#2A3A22" strokeOpacity="0.15" strokeWidth="0.6" strokeDasharray="1 2"/>
        {/* pin */}
        <line x1="0" y1="0" x2="0" y2="-26" stroke={SL.ink} strokeWidth="1"/>
        <path d="M 0 -26 L 11 -22 L 0 -18 Z" fill={SL.rust}/>
        <circle r="2" fill={SL.ink}/>
      </g>

      {/* tee box */}
      <g transform="translate(240, 700)">
        <rect x="-14" y="-6" width="28" height="12" rx="2" fill="#5C7E4F" stroke="#2A3A22" strokeOpacity="0.4"/>
        <circle r="2" fill={SL.ink}/>
      </g>

      {/* shot trajectory — three shots, drawn in sequence */}
      <g key={animateKey}>
        {/* shot 1: tee → fairway bend */}
        <path className="sg18-shot-1" id="sg18-shot1"
              d="M 240 700 Q 200 540 220 420"
              fill="none" stroke={SL.ink} strokeWidth="1.6"
              strokeDasharray="3 4" strokeLinecap="round"/>
        {/* shot 2: bend → near green */}
        <path className="sg18-shot-2"
              d="M 220 420 Q 280 280 410 160"
              fill="none" stroke={SL.ink} strokeWidth="1.6"
              strokeDasharray="3 4" strokeLinecap="round"/>
        {/* shot 3: approach to pin */}
        <path className="sg18-shot-3"
              d="M 410 160 Q 430 130 448 110"
              fill="none" stroke={SL.sun} strokeWidth="2.2"
              strokeDasharray="3 3" strokeLinecap="round"/>
        {/* landing dots */}
        <circle className="sg18-landing-1" cx="220" cy="420" r="4" fill={SL.moss} opacity="0"/>
        <circle className="sg18-landing-2" cx="410" cy="160" r="4" fill={SL.moss} opacity="0"/>
        <circle className="sg18-landing-3" cx="448" cy="110" r="5" fill={SL.sun} opacity="0"/>
        <circle className="sg18-landing-3" cx="448" cy="110" r="11" fill="none" stroke={SL.sun} strokeWidth="1" opacity="0"/>
      </g>

      {/* yardage labels */}
      <text x="200" y="540" fill={SL.graphite} fontFamily={FONT_MONO} fontSize="9.5" letterSpacing="0.4" transform="rotate(-78 200 540)">258 m · DRIVE</text>
      <text x="300" y="305" fill={SL.graphite} fontFamily={FONT_MONO} fontSize="9.5" letterSpacing="0.4" transform="rotate(-46 300 305)">214 m · 4-WOOD</text>
      <text x="436" y="142" fill="#C8913A" fontFamily={FONT_MONO} fontSize="9.5" letterSpacing="0.4" fontWeight="600">38 m · WEDGE</text>

      {/* compass + scale rose, top-left */}
      <g transform="translate(50, 70)">
        <circle r="22" fill="none" stroke={SL.ink} strokeOpacity="0.4" strokeWidth="0.8"/>
        <line x1="0" y1="-22" x2="0" y2="-26" stroke={SL.ink} strokeOpacity="0.6"/>
        <text y="-32" fill={SL.ink} fontFamily={FONT_MONO} fontSize="9" textAnchor="middle">N</text>
        <path d="M 0 -16 L 4 0 L 0 16 L -4 0 Z" fill={SL.ink} fillOpacity="0.6"/>
        <circle r="2" fill={SL.moss}/>
      </g>

      {/* hole metadata, bottom right */}
      <g transform="translate(560, 720)" textAnchor="end">
        <text fill={SL.graphite} fontFamily={FONT_MONO} fontSize="9.5" letterSpacing="0.8">HULL 18 · PAR 5 · 510 M</text>
        <text y="16" fill={SL.graphite} fontFamily={FONT_MONO} fontSize="8" letterSpacing="0.5">MIKLAGARD · NORGE</text>
      </g>

      {/* animation styles, scoped */}
      <style>{`
        @keyframes sg18-draw-1 { 0% { stroke-dashoffset: 380; opacity: 0.2; } 30% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes sg18-draw-2 { 0%, 35% { stroke-dashoffset: 320; opacity: 0; } 50% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes sg18-draw-3 { 0%, 65% { stroke-dashoffset: 100; opacity: 0; } 80% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes sg18-land { 0%, 80% { opacity: 0; transform: scale(0.2); } 88% { opacity: 1; transform: scale(1.3); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes sg18-land-3 { 0%, 88% { opacity: 0; transform: scale(0.2); } 96% { opacity: 1; transform: scale(1.4); } 100% { opacity: 1; transform: scale(1); } }
        .sg18-shot-1 { stroke-dasharray: 3 4; stroke-dashoffset: 380; animation: sg18-draw-1 5500ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .sg18-shot-2 { stroke-dasharray: 3 4; stroke-dashoffset: 320; animation: sg18-draw-2 5500ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .sg18-shot-3 { stroke-dasharray: 3 3; stroke-dashoffset: 100; animation: sg18-draw-3 5500ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .sg18-landing-1 { transform-box: fill-box; transform-origin: center; animation: sg18-land 5500ms cubic-bezier(0.4,0,0.2,1) forwards; animation-delay: 0ms; }
        .sg18-landing-2 { transform-box: fill-box; transform-origin: center; animation: sg18-land 5500ms cubic-bezier(0.4,0,0.2,1) forwards; animation-delay: 1500ms; }
        .sg18-landing-3 { transform-box: fill-box; transform-origin: center; animation: sg18-land-3 5500ms cubic-bezier(0.4,0,0.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .sg18-shot-1, .sg18-shot-2, .sg18-shot-3 { stroke-dashoffset: 0 !important; animation: none !important; opacity: 1 !important; }
          .sg18-landing-1, .sg18-landing-2, .sg18-landing-3 { opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>
    </svg>
  );
}

export function VariantSignature({ lang, t }) {
  // re-mount every cycle so the trajectory replays
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK(x => x + 1), 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <TopographicHole animateKey={k}/>

      {/* floating data callouts */}
      <div style={{
        position:'absolute', left: '6%', top: '14%',
        display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 10,
      }}>
        <ChipLabel label="HCP 11,2" sub="LIVE · WATCH" accent={SL.moss}/>
      </div>

      <div style={{
        position:'absolute', right: '6%', top: '12%',
        background: SL.ink, color: SL.surface,
        padding: '14px 16px', borderRadius: 14,
        boxShadow: '0 18px 36px -16px rgba(14,20,16,0.36)',
        minWidth: 168,
      }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 0.6, color: 'rgba(251,250,246,0.55)' }}>
          APPROACH · HULL 18
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontStyle: 'italic', fontWeight: 500, lineHeight: 1, marginTop: 4 }}>
          38 <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: SL.sun, fontStyle:'normal' }}>m</span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 0.4, color: 'rgba(251,250,246,0.5)', marginTop: 4 }}>
          PIN HIGH · UPHILL +2m
        </div>
      </div>

      <div style={{
        position:'absolute', right: '8%', bottom: '14%',
        background: SL.surface, padding: '14px 18px', borderRadius: 14,
        border: `1px solid ${SL.hairline2}`,
        boxShadow: '0 18px 36px -16px rgba(14,20,16,0.18)',
        maxWidth: 240,
      }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 0.6, color: SL.graphite }}>
          {lang === 'no' ? 'I DAG · 12:24 · GYLLENT VINDU' : 'TODAY · 12:24 · GOLDEN WINDOW'}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontStyle: 'italic', color: SL.ink, marginTop: 4, lineHeight: 1.3 }}>
          {lang === 'no'
            ? 'Reserver fra 480 kr.'
            : 'Book from 480 kr.'}
        </div>
      </div>

      <ChipLabel label="STRIKELAB TEE" sub="Booking · beta"
        accent={SL.amber}
        style={{ position:'absolute', left: '4%', bottom: '12%' }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// B — "A day in three"
// Right column cycles: booking → playing → reviewing. Headline rotates.
// ─────────────────────────────────────────────────────────────

export const DAY_FRAMES = [
  {
    time: '07:00', tag: { no:'BESTILL', en:'BOOK' },
    headline: { no:'Spillet ditt, planlagt.', en:'Your round, planned.' },
    sub: { no:'Tee finner det gyldne vinduet. Vær, vind, sol — automatisk.',
           en:'Tee finds the golden window. Weather, wind, sun — automatic.' },
  },
  {
    time: '14:30', tag: { no:'SPILL', en:'PLAY' },
    headline: { no:'Hvert slag, målt.', en:'Every shot, measured.' },
    sub: { no:'Watch teller slagene. Telefonen viser veien. Du spiller.',
           en:'Watch counts. Phone guides. You just play.' },
  },
  {
    time: '19:45', tag: { no:'GJENNOMGÅ', en:'REVIEW' },
    headline: { no:'Spillet ditt, lærer.', en:'A game that learns.' },
    sub: { no:'Handicap, spredning, beste klubb. Klart — uten tabell.',
           en:'Handicap, dispersion, best club. Clear — no spreadsheet.' },
  },
];

export function VariantDayInThree({ lang, t, frame, setFrame }) {
  // Auto-advance — but allow manual control via setFrame
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 3), 5200);
    return () => clearInterval(id);
  }, [setFrame]);

  const f = DAY_FRAMES[frame];

  return (
    <div style={{ position:'relative', width:'100%', height:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* radial glow */}
      <div style={{
        position:'absolute', inset:'8% 6%',
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${SL.mossSoft}, transparent 70%)`,
        pointerEvents:'none',
      }}/>

      {/* Frame stack — crossfade */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:'absolute', inset: 0,
          opacity: i === frame ? 1 : 0,
          transition: 'opacity 700ms cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: i === frame ? 'auto' : 'none',
        }}>
          {i === 0 && <FrameBook lang={lang}/>}
          {i === 1 && <FramePlay lang={lang}/>}
          {i === 2 && <FrameReview lang={lang}/>}
        </div>
      ))}

      {/* Cycle indicator — bottom */}
      <div style={{
        position:'absolute', left: 0, right: 0, bottom: 28,
        display:'flex', justifyContent:'center', gap: 18, zIndex: 10,
      }}>
        {DAY_FRAMES.map((_, i) => (
          <button key={i} onClick={() => setFrame(i)} style={{
            appearance:'none', border:'none', cursor:'pointer',
            background: 'transparent', padding: '6px 0',
            display:'flex', flexDirection:'column', alignItems:'center', gap: 8,
          }}>
            <div style={{ width: 44, height: 2, borderRadius: 2,
              background: i === frame ? SL.ink : SL.hairline,
              transition: 'background 200ms',
            }}/>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.6,
              color: i === frame ? SL.ink : SL.graphite,
              fontWeight: i === frame ? 600 : 400,
            }}>
              {DAY_FRAMES[i].time} · {DAY_FRAMES[i].tag[lang]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FrameBook({ lang }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* big tee-window card backdrop */}
      <div style={{
        position:'absolute', left:'8%', top:'10%', bottom:'18%', right:'34%',
        background: SL.surface, borderRadius: 22, border: `1px solid ${SL.hairline2}`,
        padding: '28px 30px',
        boxShadow: '0 26px 54px -28px rgba(14,20,16,0.22)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: 1.2, color: SL.graphite, textTransform: 'uppercase' }}>
          Vindu · Miklagard · I morgen
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontStyle:'italic', fontWeight: 500, color: SL.ink, marginTop: 6, lineHeight: 1 }}>
          Gyllent.
        </div>
        <div style={{ flex: 1, position:'relative', marginTop: 24 }}>
          <SunWindowChart/>
        </div>
        <div style={{
          marginTop: 16, display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.6, color: SL.graphite }}>BESTE</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontStyle:'italic', color: SL.ink }}>12:24 · 22°</div>
          </div>
          <div style={{
            background: SL.moss, color: SL.surface, padding: '10px 18px', borderRadius: 999,
            fontFamily: FONT_UI, fontSize: 12, fontWeight: 500,
          }}>{lang === 'no' ? 'Reserver — 480 kr' : 'Book — 480 kr'}</div>
        </div>
      </div>

      {/* Phone in foreground showing the same window */}
      <div style={{
        position:'absolute', right:'8%', top:'14%', bottom:'14%',
        filter: 'drop-shadow(0 30px 50px rgba(14,20,16,0.22))',
      }}>
        <div style={{ height: '100%', display:'flex' }}>
          <MiniPhone width={Math.max(220, 240)} screen={PhoneScreenWindow}
                     accent={SL.amber} time="07:00" tint={SL.surface}/>
        </div>
      </div>

      <ChipLabel label="STRIKELAB TEE" sub="Booking · beta" accent={SL.amber}
        style={{ position:'absolute', left:'6%', top:'5%' }}/>
    </div>
  );
}

export function SunWindowChart() {
  return (
    <svg viewBox="0 0 280 160" width="100%" height="100%" preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id="sun-grad-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SL.sun} stopOpacity="0.45"/>
          <stop offset="1" stopColor={SL.sun} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="M 6 130 Q 140 -10 274 130 L 274 144 L 6 144 Z" fill="url(#sun-grad-frame)"/>
      {/* best window */}
      <rect x="110" y="20" width="60" height="124" fill={SL.sun} fillOpacity="0.10"
            stroke={SL.sun} strokeOpacity="0.55" strokeDasharray="2 3"/>
      {/* hour ticks */}
      {[6, 9, 12, 15, 18, 21].map((h, i) => {
        const x = 6 + (i / 5) * 268;
        return (
          <g key={h}>
            <line x1={x} y1="144" x2={x} y2="148" stroke={SL.graphite}/>
            <text x={x} y="160" fill={SL.graphite} fontFamily={FONT_MONO} fontSize="9" textAnchor="middle">{String(h).padStart(2,'0')}</text>
          </g>
        );
      })}
      {Array.from({length: 16}, (_,i) => {
        const t = i / 15;
        const x = 6 + t * 268;
        const sunV = 1 - Math.abs((t - 0.5) * 2);
        const y = 130 - sunV * 110;
        const isBest = i === 9;
        return (
          <g key={i}>
            {isBest && <circle cx={x} cy={y} r="10" fill="none" stroke={SL.sun} strokeOpacity="0.6"/>}
            <circle cx={x} cy={y} r={isBest ? 5 : 1.8} fill={isBest ? SL.sun : SL.ink}/>
          </g>
        );
      })}
    </svg>
  );
}

export function FramePlay({ lang }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* fairway aerial behind, faint */}
      <div style={{
        position:'absolute', inset:'12% 8%', opacity: 0.5,
        background: `
          radial-gradient(ellipse 60% 50% at 40% 50%, rgba(168,190,154,0.7) 0%, transparent 60%),
          radial-gradient(ellipse 40% 70% at 70% 30%, rgba(92,126,79,0.55) 0%, transparent 65%)
        `,
        borderRadius: 32, filter: 'blur(8px)',
      }}/>

      {/* phone — primary, right */}
      <div style={{
        position:'absolute', right:'10%', top:'8%', bottom:'8%',
        filter: 'drop-shadow(0 30px 50px rgba(14,20,16,0.26))',
      }}>
        <div style={{ height: '100%', display:'flex' }}>
          <MiniPhone width={240} screen={PhoneScreenLiveShot} accent={SL.moss} time="14:30" tint={SL.surface}/>
        </div>
      </div>

      {/* watch — front-left */}
      <div style={{
        position:'absolute', left:'14%', bottom:'18%',
        filter: 'drop-shadow(0 18px 30px rgba(14,20,16,0.30))',
        zIndex: 2,
      }}>
        <MiniWatch width={132} screen={WatchScreenShot} time="14:30"/>
      </div>

      <ChipLabel label="STRIKELAB CADDIE" sub="iPhone + Watch" accent={SL.moss}
        style={{ position:'absolute', left:'6%', top:'8%' }}/>

      {/* dispersion data note */}
      <div style={{
        position:'absolute', left:'8%', top:'30%',
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.5, color: SL.graphite,
        maxWidth: 200, lineHeight: 1.6, textTransform: 'uppercase',
      }}>
        <span style={{ color: SL.moss, fontWeight: 600 }}>·</span> 148 m til flagget<br/>
        <span style={{ color: SL.moss, fontWeight: 600 }}>·</span> 8-jern · avg 151 m<br/>
        <span style={{ color: SL.moss, fontWeight: 600 }}>·</span> Vind 2 m/s, fra venstre
      </div>
    </div>
  );
}

export function FrameReview({ lang }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* big chart card */}
      <div style={{
        position:'absolute', left:'10%', top:'12%', bottom:'18%', right:'36%',
        background: SL.ink, color: SL.surface, borderRadius: 22,
        padding: '28px 32px',
        boxShadow: '0 26px 54px -28px rgba(14,20,16,0.34)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: 1.2, color: 'rgba(251,250,246,0.55)', textTransform:'uppercase' }}>
          Handicap · 8 mnd
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 56, fontWeight: 500, letterSpacing: -2, lineHeight: 1, marginTop: 6, color: SL.surface }}>
          11,2 <span style={{ color: SL.sun, fontFamily: FONT_MONO, fontSize: 18, fontWeight: 500, letterSpacing: 0 }}>−11,2</span>
        </div>
        <div style={{ flex: 1, marginTop: 22, position:'relative' }}>
          <HandicapChartLarge/>
        </div>
      </div>

      {/* phone preview */}
      <div style={{
        position:'absolute', right:'8%', top:'14%', bottom:'14%',
        filter: 'drop-shadow(0 30px 50px rgba(14,20,16,0.22))',
      }}>
        <div style={{ height: '100%', display:'flex' }}>
          <MiniPhone width={232} screen={PhoneScreenReview} accent={SL.moss} time="19:45" tint={SL.surface}/>
        </div>
      </div>

      <ChipLabel label="STRIKELAB CADDIE" sub="iPhone + Watch" accent={SL.moss}
        style={{ position:'absolute', left:'6%', top:'5%' }}/>
    </div>
  );
}

export function HandicapChartLarge() {
  const points = [22.4, 20.1, 18.6, 17.2, 15.8, 14.1, 12.6, 11.2];
  const months = ['SEP','OKT','NOV','DES','JAN','FEB','MAR','APR'];
  const minV = 10, maxV = 24;
  return (
    <svg viewBox="0 0 380 220" width="100%" height="100%" preserveAspectRatio="none" style={{ display:'block' }}>
      {[0,1,2,3].map(i => (
        <line key={i} x1="10" y1={20 + i * 60} x2="370" y2={20 + i * 60}
              stroke="rgba(251,250,246,0.10)" strokeDasharray="1 3"/>
      ))}
      <polyline
        points={points.map((v,i) => {
          const x = 10 + (i / (points.length-1)) * 360;
          const y = 20 + ((v - minV) / (maxV - minV)) * 180;
          return `${x},${y}`;
        }).join(' ')}
        fill="none" stroke={SL.sun} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((v,i) => {
        const x = 10 + (i / (points.length-1)) * 360;
        const y = 20 + ((v - minV) / (maxV - minV)) * 180;
        const last = i === points.length - 1;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={last ? 5 : 2.4} fill={last ? SL.sun : 'rgba(251,250,246,0.6)'}/>
            {last && <circle cx={x} cy={y} r="12" fill="none" stroke={SL.sun} strokeOpacity="0.45"/>}
            <text x={x} y={216} fill="rgba(251,250,246,0.55)" fontFamily={FONT_MONO} fontSize="9" textAnchor="middle">{months[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// C — "Numbers"
// Big editorial ticking numbers. Sparse devices, max type.
// ─────────────────────────────────────────────────────────────

export function useTicker(from, to, duration = 1400, decimals = 0, deps = []) {
  const [v, setV] = useState(from);
  useEffect(() => {
    setV(from);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(from + (to - from) * eased);
      if (p >= 1) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, deps);
  return decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals));
}

export function NumberTile({ eyebrow, value, unit, footnote, dark, big, accent = SL.moss }) {
  return (
    <div style={{
      background: dark ? SL.ink : SL.surface,
      color: dark ? SL.surface : SL.ink,
      border: dark ? 'none' : `1px solid ${SL.hairline2}`,
      borderRadius: 22,
      padding: big ? '28px 32px 24px' : '20px 22px 18px',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      boxShadow: dark
        ? '0 18px 48px -24px rgba(14,20,16,0.34)'
        : '0 14px 36px -22px rgba(14,20,16,0.16)',
      minHeight: 0, overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.2,
        textTransform: 'uppercase', color: dark ? 'rgba(251,250,246,0.55)' : SL.graphite,
      }}>{eyebrow}</div>
      <div style={{
        fontFamily: FONT_DISPLAY, fontWeight: 500,
        fontSize: big ? 'clamp(56px, 6.5vw, 108px)' : 'clamp(36px, 3.6vw, 60px)',
        letterSpacing: big ? -3.6 : -1.8, lineHeight: 0.92,
        color: dark ? SL.surface : SL.ink,
        fontStyle: big ? 'italic' : 'normal',
        marginTop: big ? 16 : 8,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}{unit && <span style={{
          fontFamily: FONT_MONO, fontSize: big ? 18 : 14,
          fontStyle:'normal', fontWeight: 500, color: accent, marginLeft: 6,
          letterSpacing: 0,
        }}>{unit}</span>}
      </div>
      {footnote && <div style={{
        fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.5,
        color: dark ? 'rgba(251,250,246,0.5)' : SL.graphite,
        marginTop: big ? 14 : 8, textTransform:'uppercase',
      }}>{footnote}</div>}
    </div>
  );
}

export function VariantNumbers({ lang, t, cycleKey }) {
  // 4 tiles whose values animate on each cycleKey change.
  const hcp = useTicker(22.4, 11.2, 1800, 1, [cycleKey]);
  const drive = useTicker(180, 254, 1600, 0, [cycleKey]);
  const rounds = useTicker(0, 38, 1400, 0, [cycleKey]);
  // Window time encoded as minutes from midnight so we can format HH:MM.
  const windowMin = useTicker(11*60 + 30, 12*60 + 24, 1500, 0, [cycleKey]);

  const hcpStr = hcp.toFixed(1).replace('.', ',');
  const windowStr = `${Math.floor(windowMin/60)}:${String(Math.max(0, windowMin % 60)).padStart(2,'0')}`;

  return (
    <div style={{ width:'100%', height:'100%', padding:'5% 5% 8%',
                  display:'grid', gridTemplateColumns:'1.4fr 1fr', gridTemplateRows:'1.4fr 1fr',
                  gap: 14, position:'relative' }}>
      {/* huge faint mark backdrop */}
      <div style={{ position:'absolute', right:'-6%', top:'-6%', opacity: 0.06, pointerEvents:'none' }}>
        <StrikelabMark size={520} arcColor={SL.ink} ballColor={SL.sun} tickColor={SL.ink}/>
      </div>

      <div style={{ gridRow:'1 / 2', gridColumn:'1 / 2' }}>
        <NumberTile
          big dark
          eyebrow={lang === 'no' ? 'Handicap · 8 mnd' : 'Handicap · 8 mo'}
          value={hcpStr}
          footnote={lang === 'no' ? `Fra 22,4 · −11,2 slag` : `From 22.4 · −11.2 strokes`}
          accent={SL.sun}
        />
      </div>
      <div style={{ gridRow:'1 / 2', gridColumn:'2 / 3' }}>
        <NumberTile
          eyebrow={lang === 'no' ? 'Avg drive' : 'Avg drive'}
          value={drive} unit="m"
          footnote={lang === 'no' ? '254 m · sist 24 slag' : '254 m · last 24 shots'}
          accent={SL.moss}
        />
      </div>
      <div style={{ gridRow:'2 / 3', gridColumn:'1 / 2' }}>
        <NumberTile
          eyebrow={lang === 'no' ? 'Beste vindu · i dag' : "Today's window"}
          value={windowStr}
          footnote={lang === 'no' ? '22° · 2 m/s · gyllent' : '22° · 2 m/s · golden'}
          accent={SL.sun}
        />
      </div>
      <div style={{ gridRow:'2 / 3', gridColumn:'2 / 3' }}>
        <NumberTile
          eyebrow={lang === 'no' ? 'Runder spilt' : 'Rounds played'}
          value={rounds}
          footnote={lang === 'no' ? 'Sesongen · 7 baner' : 'This season · 7 courses'}
          accent={SL.moss}
        />
      </div>

      {/* tiny ecosystem strip */}
      <div style={{
        position:'absolute', right: '5%', bottom: 14,
        display:'flex', alignItems:'center', gap: 10,
        fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.5, color: SL.graphite,
      }}>
        <span style={{ textTransform:'uppercase' }}>{lang === 'no' ? 'Synces alt på' : 'Syncs everywhere'}</span>
        <MiniAppIcon size={20} bg={SL.moss} fg={SL.surface}/>
        <MiniAppIcon size={20} bg={SL.amber} fg={SL.ink}/>
        <MiniAppIcon size={20} bg={SL.ink} fg={SL.surface}/>
      </div>
    </div>
  );
}

export function MiniAppIcon({ size = 20, bg = SL.moss, fg = SL.surface }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.24),
      background: bg, display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow: '0 2px 6px -2px rgba(14,20,16,0.25)',
    }}>
      <StrikelabMark size={size * 0.66} arcColor={fg} ballColor={SL.sun}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// D — "Ecosystem constellation"
// Brand mark center; dimples extend outward as a real shot dispersion field.
// Phone, watch, web orbit around it; connecting trajectory lines.
// ─────────────────────────────────────────────────────────────

export function VariantConstellation({ lang, t, cycleKey }) {
  const caddieLabel = lang === 'no' ? 'iPhone + Apple Watch' : 'iPhone + Apple Watch';
  const teeLabel    = lang === 'no' ? 'Booking · web · beta' : 'Booking · web · beta';
  const platformLabel = lang === 'no' ? 'PLATTFORMEN' : 'THE PLATFORM';

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      {/* dispersion field backdrop */}
      <DispersionField key={`disp-${cycleKey}`}/>

      {/* connecting trajectory lines — two clear "branches" from the StrikeLab core
          to the Caddie cluster (up) and the Tee cluster (down-right). */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
        position:'absolute', inset: 0, width:'100%', height:'100%', pointerEvents:'none', zIndex: 1,
      }}>
        <defs>
          <marker id="dot-end" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5">
            <circle cx="1.5" cy="1.5" r="0.9" fill={SL.moss}/>
          </marker>
        </defs>
        {/* upward to phone */}
        <path d="M 50 50 Q 38 38 22 22" fill="none" stroke={SL.moss}
              strokeOpacity="0.35" strokeWidth="0.22" strokeDasharray="0.7 1.1"/>
        {/* upward to watch */}
        <path d="M 50 50 Q 65 38 82 22" fill="none" stroke={SL.moss}
              strokeOpacity="0.35" strokeWidth="0.22" strokeDasharray="0.7 1.1"/>
        {/* downward to web */}
        <path d="M 50 50 Q 65 65 82 80" fill="none" stroke={SL.amber}
              strokeOpacity="0.40" strokeWidth="0.22" strokeDasharray="0.7 1.1"/>
      </svg>

      {/* CENTER — StrikeLab the platform.
          Compact stack: mark + wordmark + tagline. */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        transform:'translate(-50%, -50%)', zIndex: 5,
        display:'flex', flexDirection:'column', alignItems:'center', gap: 8,
        padding: '16px 20px',
        background: 'radial-gradient(circle, rgba(242,237,224,1) 0%, rgba(242,237,224,0.94) 55%, rgba(242,237,224,0) 100%)',
      }}>
        <ReplayingMark size={92}/>
        <StrikelabWordmark size={18}/>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: 1.4, color: SL.graphite,
          textTransform: 'uppercase', marginTop: 2,
        }}>{platformLabel}</div>
      </div>

      {/* CADDIE CLUSTER — top half */}

      {/* StrikeLab · Caddie cluster label, centered above the devices */}
      <div style={{
        position:'absolute', left:'50%', top:'3%',
        transform:'translateX(-50%)', zIndex: 5,
        display:'flex', flexDirection:'column', alignItems:'center', gap: 4,
      }}>
        <div style={{
          background: SL.surface, padding: '8px 14px', borderRadius: 999,
          border: `1px solid ${SL.hairline2}`,
          boxShadow: '0 6px 18px -6px rgba(14,20,16,0.16)',
          display:'flex', alignItems:'center', gap: 10,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: SL.moss }}/>
          <span style={{
            fontFamily: FONT_DISPLAY, fontStyle:'italic', fontSize: 14,
            color: SL.graphite, fontWeight: 500,
          }}>Strike<span style={{
            fontFamily: FONT_UI, fontStyle:'normal', fontWeight: 700, color: SL.ink,
          }}>Lab</span><span style={{ color: SL.sun, fontFamily: FONT_UI, fontWeight: 700 }}>.</span>
          <span style={{ color: SL.graphite, marginLeft: 6 }}>Caddie</span>
          </span>
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.7,
          color: SL.graphite, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>{caddieLabel}</div>
      </div>

      {/* Phone — top-left */}
      <div style={{
        position:'absolute', left:'6%', top:'12%',
        transform: 'rotate(-5deg)',
        filter: 'drop-shadow(0 26px 40px rgba(14,20,16,0.22))', zIndex: 3,
      }}>
        <MiniPhone width={172} screen={PhoneScreenLiveShot} accent={SL.moss} time="9:41" tint={SL.surface}/>
      </div>

      {/* Watch — top-right */}
      <div style={{
        position:'absolute', right:'8%', top:'14%',
        transform: 'rotate(4deg)',
        filter: 'drop-shadow(0 18px 30px rgba(14,20,16,0.30))', zIndex: 3,
      }}>
        <MiniWatch width={130} screen={WatchScreenHandicap}/>
      </div>

      {/* TEE CLUSTER — bottom half */}

      {/* Web booking — bottom-right */}
      <div style={{
        position:'absolute', right:'4%', bottom:'22%',
        transform: 'rotate(-2deg)',
        filter: 'drop-shadow(0 22px 36px rgba(14,20,16,0.20))', zIndex: 3,
      }}>
        <MiniWebTee width={260}/>
      </div>

      {/* StrikeLab · Tee cluster label, anchored under the web booking */}
      <div style={{
        position:'absolute', right:'10%', bottom:'5%', zIndex: 5,
        display:'flex', flexDirection:'column', alignItems:'flex-end', gap: 4,
      }}>
        <div style={{
          background: SL.surface, padding: '8px 14px', borderRadius: 999,
          border: `1px solid ${SL.hairline2}`,
          boxShadow: '0 6px 18px -6px rgba(14,20,16,0.16)',
          display:'flex', alignItems:'center', gap: 10,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: SL.amber }}/>
          <span style={{
            fontFamily: FONT_DISPLAY, fontStyle:'italic', fontSize: 14,
            color: SL.graphite, fontWeight: 500,
          }}>Strike<span style={{
            fontFamily: FONT_UI, fontStyle:'normal', fontWeight: 700, color: SL.ink,
          }}>Lab</span><span style={{ color: SL.sun, fontFamily: FONT_UI, fontWeight: 700 }}>.</span>
          <span style={{ color: SL.graphite, marginLeft: 6 }}>Tee</span>
          </span>
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: 0.7,
          color: SL.graphite, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>{teeLabel}</div>
      </div>
    </div>
  );
}

// Re-mounting wrapper for the StrikelabMark to keep the animation looping.
// First render is static (complete state) so the mark is visible immediately
// even if CSS animations are throttled. Subsequent interval ticks animate.
export function ReplayingMark({ size, intervalMs = 4400 }) {
  const [k, setK] = useState(0);
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setAnimated(true);
      setK(x => x + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return <StrikelabMark key={k} size={size} animate={animated}/>;
}

// A field of dots — golf-ball dimples that become a shot dispersion plot.
// Most dots are quiet; a handful gather around a target ring.
export function DispersionField() {
  const W = 100, H = 100;
  const rows = 18, cols = 28;
  const seed = (i, j) => {
    const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // dispersion clusters
  const clusters = [
    { cx: 50, cy: 50, r: 16, count: 32 },     // center cluster
  ];
  const dots = [];
  // grid base — quiet dimples
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = (j + (i % 2 ? 0.5 : 0)) * (W / cols);
      const y = i * (H / rows) + 1;
      const r = 0.18 + seed(i, j) * 0.06;
      if (seed(i, j) > 0.18) {
        dots.push({ x, y, r, opacity: 0.10 + seed(i, j) * 0.08, color: SL.ink });
      }
    }
  }
  // cluster dots
  clusters.forEach((c, ci) => {
    for (let k = 0; k < c.count; k++) {
      const angle = seed(ci, k) * Math.PI * 2;
      const dist = Math.pow(seed(ci, k + 7), 0.6) * c.r;
      const x = c.cx + Math.cos(angle) * dist;
      const y = c.cy + Math.sin(angle) * dist * 0.78;
      dots.push({ x, y, r: 0.4 + seed(ci, k + 13) * 0.4, opacity: 0.55, color: SL.moss });
    }
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
         style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={d.opacity}/>
      ))}
      {/* target ring around mark */}
      <circle cx="50" cy="50" r="18" fill="none" stroke={SL.moss} strokeOpacity="0.18" strokeWidth="0.18"/>
      <circle cx="50" cy="50" r="11" fill="none" stroke={SL.moss} strokeOpacity="0.28" strokeWidth="0.16" strokeDasharray="0.4 0.6"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────
