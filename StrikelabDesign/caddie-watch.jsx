// Apple Watch — Caddie. StrikeLab branded. Black bay aesthetic, Signal Lime accent.

const WATCH_W = 184;
const WATCH_H = 224;

const WatchFrame = ({ children, time = '21:19', label = 'CADDIE' }) => (
  <div style={{
    width: WATCH_W + 36, padding: 0, position: 'relative',
    filter: 'drop-shadow(0 30px 80px rgba(0,0,0,0.6))',
  }}>
    {/* bezel */}
    <div style={{
      width: WATCH_W + 36, height: WATCH_H + 36,
      background: 'linear-gradient(160deg, #1d1f1e, #0a0b0a 60%, #0a0b0a)',
      borderRadius: 38,
      border: '1px solid #2a2c2b',
      padding: 18,
      position: 'relative',
    }}>
      {/* digital crown */}
      <div style={{ position: 'absolute', right: -3, top: 56, width: 8, height: 26, background: '#1a1c1b', border: '1px solid #2a2c2b', borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: -3, top: 100, width: 8, height: 18, background: '#1a1c1b', border: '1px solid #2a2c2b', borderRadius: 2 }} />
      {/* action button */}
      <div style={{ position: 'absolute', left: -3, top: 78, width: 8, height: 22, background: '#c95a1e', border: '1px solid #2a2c2b', borderRadius: 2 }} />

      {/* screen */}
      <div style={{
        width: WATCH_W, height: WATCH_H, background: '#000',
        borderRadius: 26, overflow: 'hidden', position: 'relative',
        color: 'var(--ink, #ede8de)', fontFamily: 'Geist, sans-serif',
      }}>
        {/* status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px 4px' }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.16em' }}>{label}</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink, #ede8de)', fontWeight: 500 }}>{time}</span>
        </div>
        <div style={{ padding: '0 10px 10px', height: 'calc(100% - 28px)', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

const Pill = ({ children, kind = 'primary' }) => {
  const styles = kind === 'primary' ? {
    background: 'var(--accent)', color: '#0a0b0a',
  } : kind === 'ghost' ? {
    background: 'transparent', color: 'var(--ink, #ede8de)', border: '1px solid #2d322f',
  } : {
    background: '#1a1c1b', color: 'var(--ink, #ede8de)',
  };
  return (
    <div style={{
      ...styles, borderRadius: 14, padding: '8px 0',
      fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      textAlign: 'center',
    }}>
      {children}
    </div>
  );
};

const Reticule = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ color }}>
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" />
    <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" strokeWidth="1.2" />
    <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="1.2" />
    <line x1="3" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.2" />
    <line x1="18" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

// SCREEN 01 — Hole overview / log shot home
const ScreenHome = () => (
  <WatchFrame time="14:08" label="· HOLE 04 · PAR 4">
    {/* Pin distance hero */}
    <div style={{ textAlign: 'center', marginTop: 4 }}>
      <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.2em' }}>TO PIN</div>
      <div style={{ fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 56, lineHeight: 1, letterSpacing: '-0.04em', marginTop: 2 }}>
        148
      </div>
      <div className="mono" style={{ fontSize: 9, color: '#b9b6ac', letterSpacing: '0.18em', marginTop: 2 }}>YDS · F 132 · B 158</div>
    </div>

    {/* Coach ribbon */}
    <div style={{ marginTop: 8, padding: '5px 8px', background: '#0e1110', border: '1px solid #1f2220', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
      <Reticule size={10} color="var(--accent)" />
      <span className="mono" style={{ fontSize: 9, color: '#b9b6ac', letterSpacing: '0.04em', lineHeight: 1.3 }}>
        <span style={{ color: 'var(--accent)' }}>9i</span> · choke ½ · aim L pin
      </span>
    </div>

    {/* Action */}
    <div style={{ marginTop: 'auto' }}>
      <Pill kind="primary">+ Log Shot</Pill>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 4 }}>
        <Pill kind="ghost">⌕</Pill>
        <Pill kind="ghost">●</Pill>
        <Pill kind="ghost">⚑</Pill>
      </div>
    </div>
  </WatchFrame>
);

// SCREEN 02 — Club picker (after Log Shot tapped)
const ScreenClub = () => (
  <WatchFrame time="14:08" label="· SELECT CLUB">
    <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.2em', marginTop: 2 }}>SUGGESTED · 148 YDS</div>
    <div style={{ marginTop: 4, display: 'grid', gap: 3, flex: 1 }}>
      {[
        ['9i',  155, true,  'in window'],
        ['PW',  138, false, '-10y'],
        ['8i',  168, false, '+20y'],
        ['7i',  178, false, '+30y'],
      ].map(([c, y, sel, n]) => (
        <div key={c} style={{
          display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 6,
          padding: '6px 8px',
          background: sel ? 'var(--accent)' : '#0e1110',
          color: sel ? '#0a0b0a' : '#ede8de',
          borderRadius: 4,
          border: sel ? 0 : '1px solid #1f2220',
        }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{c}</span>
          <span className="mono" style={{ fontSize: 11, fontWeight: 500 }}>{y}<span style={{ fontSize: 8, opacity: 0.7 }}> y</span></span>
          <span className="mono" style={{ fontSize: 8, opacity: sel ? 0.85 : 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{n}</span>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 4 }}>
      <Pill kind="primary">Confirm 9i</Pill>
    </div>
  </WatchFrame>
);

// SCREEN 03 — Live shot result (auto-detected via swing)
const ScreenShot = () => (
  <WatchFrame time="14:09" label="· SHOT 03 · LIVE">
    <div style={{ textAlign: 'center', marginTop: 6 }}>
      <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.2em' }}>CARRY</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 48, letterSpacing: '-0.04em', color: 'var(--accent)' }}>151</span>
        <span className="mono" style={{ fontSize: 9, color: '#76746b', letterSpacing: '0.18em' }}>YDS</span>
      </div>
    </div>
    {/* mini dispersion */}
    <svg viewBox="0 0 100 50" style={{ width: '100%', marginTop: 6 }}>
      <path d="M 40 50 L 46 0 L 54 0 L 60 50 Z" fill="#1a1c1b" />
      <line x1="50" x2="50" y1="0" y2="50" stroke="#2d322f" strokeDasharray="0.6 1" strokeWidth="0.3" />
      <circle cx="48" cy="6" r="1.6" fill="var(--accent)" />
      <circle cx="50" cy="48" r="0.9" fill="#ede8de" />
      <text x="98" y="48" fill="#76746b" fontSize="3" fontFamily="Geist Mono" textAnchor="end" letterSpacing="0.2">3y L</text>
    </svg>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 4 }}>
      <MiniStat l="BALL" v="142" />
      <MiniStat l="SMASH" v="1.34" />
      <MiniStat l="HR" v="62" />
    </div>
    <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      <Pill kind="ghost">Edit</Pill>
      <Pill kind="primary">Next</Pill>
    </div>
  </WatchFrame>
);

const MiniStat = ({ l, v }) => (
  <div style={{ background: '#0e1110', border: '1px solid #1f2220', borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
    <div className="mono" style={{ fontSize: 7, color: '#76746b', letterSpacing: '0.18em' }}>{l}</div>
    <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: '#ede8de', marginTop: 1 }}>{v}</div>
  </div>
);

// SCREEN 04 — Hole map (compact glance)
const ScreenMap = () => (
  <WatchFrame time="14:08" label="· HOLE 04 · MAP">
    <div style={{ flex: 1, position: 'relative', marginTop: 2 }}>
      <svg viewBox="0 0 100 140" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0 }}>
        {/* fairway */}
        <path d="M 38 140 Q 30 80 48 50 Q 60 30 55 8" stroke="#1a3a26" strokeWidth="22" fill="none" strokeLinecap="round" />
        {/* rough texture */}
        <path d="M 38 140 Q 30 80 48 50 Q 60 30 55 8" stroke="#1c4a30" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.7" />
        {/* hazards */}
        <ellipse cx="32" cy="80" rx="6" ry="9" fill="#3a3320" />
        <ellipse cx="64" cy="34" rx="5" ry="4" fill="#3a3320" />
        {/* green */}
        <ellipse cx="55" cy="10" rx="9" ry="7" fill="#27542f" stroke="var(--accent)" strokeWidth="0.6" />
        <circle cx="55" cy="10" r="1.6" fill="var(--accent)" />
        {/* aim arc */}
        <path d="M 50 120 Q 40 80 55 14" stroke="var(--accent)" strokeDasharray="2 2" strokeWidth="0.6" fill="none" />
        {/* player */}
        <circle cx="50" cy="120" r="2" fill="#ede8de" />
        {/* yardage tags */}
        <g fontFamily="Geist Mono" fontSize="5" fill="#ede8de" letterSpacing="0.2">
          <text x="6" y="64">200</text>
          <text x="6" y="42">150</text>
          <text x="6" y="22">100</text>
        </g>
      </svg>
      {/* overlay readouts */}
      <div style={{ position: 'absolute', top: 4, left: 4 }}>
        <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.18em' }}>PIN</div>
        <div style={{ fontFamily: 'Geist Mono', fontSize: 22, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-0.03em' }}>148</div>
      </div>
      <div style={{ position: 'absolute', bottom: 4, right: 4, textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.18em' }}>WIND</div>
        <div className="mono" style={{ fontSize: 11, color: '#ede8de' }}>↘ 7</div>
      </div>
    </div>
  </WatchFrame>
);

// SCREEN 05 — Round summary
const ScreenRound = () => (
  <WatchFrame time="17:42" label="· ROUND · 9 / 18">
    <div style={{ marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 46, letterSpacing: '-0.04em' }}>+2</span>
      <span className="mono" style={{ fontSize: 9, color: '#76746b', letterSpacing: '0.18em' }}>THRU 9</span>
    </div>
    <div className="mono" style={{ fontSize: 9, color: '#b9b6ac', marginTop: -2, letterSpacing: '0.04em' }}>38 · pinehurst no.2</div>

    {/* hole ribbon */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 1, marginTop: 8 }}>
      {[0,-1,1,0,2,0,-1,0,1].map((s, i) => {
        const c = s < 0 ? 'var(--accent)' : s === 0 ? '#ede8de' : s === 1 ? '#76746b' : '#c95a1e';
        return (
          <div key={i} style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 6, color: '#76746b' }}>{i+1}</div>
            <div className="mono" style={{ fontSize: 9, fontWeight: 600, color: c }}>{s > 0 ? `+${s}` : s === 0 ? 'E' : s}</div>
          </div>
        );
      })}
    </div>

    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
      <MiniStat l="GIR" v="6/9" />
      <MiniStat l="FIR" v="4/7" />
      <MiniStat l="PUTT" v="14" />
    </div>

    <div style={{ marginTop: 'auto' }}>
      <Pill kind="primary">Hole 10 →</Pill>
    </div>
  </WatchFrame>
);

// SCREEN 06 — Pre-shot intent (subjective log, fast)
const ScreenIntent = () => (
  <WatchFrame time="14:07" label="· PRE-SHOT">
    <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.2em', marginTop: 2 }}>INTENT · 9i · 148Y</div>
    <div style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 18, lineHeight: 1.15, color: '#ede8de', marginTop: 4 }}>
      "Stock draw.<br/>Land short.<br/>Release to pin."
    </div>
    {/* feel slider */}
    <div style={{ marginTop: 'auto' }}>
      <div className="mono" style={{ fontSize: 8, color: '#76746b', letterSpacing: '0.2em', marginBottom: 3 }}>FEEL · 7 / 10</div>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({length:10}).map((_,i)=>(
          <div key={i} style={{ flex:1, height: 6, background: i < 7 ? 'var(--accent)' : '#1f2220' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
        <Pill kind="ghost">Voice</Pill>
        <Pill kind="primary">Commit</Pill>
      </div>
    </div>
  </WatchFrame>
);

const Caddie = () => {
  return (
    <div style={{
      width: 1440, padding: '56px 56px 80px', background: 'var(--bg, #0a0b0a)',
      color: 'var(--ink, #ede8de)', fontFamily: 'Geist, sans-serif',
    }} className="sl-theme" data-mode="dark">
      <style>{SL_THEME_CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid #2d322f', paddingBottom: 24, marginBottom: 40 }}>
        <div>
          <div className="micro">FILE / 007 — STRIKELAB CADDIE · APPLE WATCH ULTRA</div>
          <h1 className="display" style={{ fontSize: 80, margin: '16px 0 0', maxWidth: 900 }}>
            The bay <em>on your wrist.</em>
          </h1>
          <p style={{ fontSize: 16, color: '#b9b6ac', maxWidth: 720, lineHeight: 1.5, marginTop: 14 }}>
            One-tap shot logging, AI club suggestions, and live carry feedback — without breaking your pre-shot routine. Black bay, mono readouts, Signal Lime as the only color that gets to speak.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <SLLogo size={36} />
          <div className="micro" style={{ marginTop: 10 }}>49MM · WATCHOS 11 · ALWAYS-ON</div>
        </div>
      </div>

      {/* Screens row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, justifyItems: 'center', marginBottom: 32 }}>
        <ScreenColumn n="01" label="HOLE OVERVIEW" body="Pin distance is the hero. AI Coach ribbon picks the club + line."><ScreenHome /></ScreenColumn>
        <ScreenColumn n="02" label="CLUB PICKER" body="Suggested club glows lime. Others ranked by distance fit."><ScreenClub /></ScreenColumn>
        <ScreenColumn n="03" label="PRE-SHOT INTENT" body="Two seconds. Serif italic frames the commitment."><ScreenIntent /></ScreenColumn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, justifyItems: 'center' }}>
        <ScreenColumn n="04" label="LIVE SHOT" body="Auto-detected swing. Carry, dispersion, smash, HR."><ScreenShot /></ScreenColumn>
        <ScreenColumn n="05" label="HOLE MAP" body="Glanceable. Crown to scroll up the fairway."><ScreenMap /></ScreenColumn>
        <ScreenColumn n="06" label="ROUND SUMMARY" body="Score, hole ribbon, GIR/FIR/Putt at a glance."><ScreenRound /></ScreenColumn>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        <Note num="A" title="One color that means something" body="Signal Lime only fires for: AI confidence, current selection, positive deltas. Everything else is bone, ink, or hairline grey. No flag red, no menu emoji." />
        <Note num="B" title="Mono readouts, big numbers" body="Yardages, carry, scores all in Geist Mono with tabular nums. Numbers are headlines, never sentence furniture." />
        <Note num="C" title="Crown is the protagonist" body="Scroll the hole map, dial through clubs, scrub through pre-shot intent. Tap is for commit, not for navigation." />
      </div>
    </div>
  );
};

const ScreenColumn = ({ n, label, body, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
    {children}
    <div style={{ width: '100%', maxWidth: 260, textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em' }}>{n} · {label}</div>
      <div style={{ fontSize: 12, color: '#b9b6ac', marginTop: 6, lineHeight: 1.5 }}>{body}</div>
    </div>
  </div>
);

const Note = ({ num, title, body }) => (
  <div style={{ borderTop: '1px solid #2d322f', paddingTop: 18 }}>
    <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.2em' }}>NOTE · {num}</div>
    <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 8 }}>{title}</div>
    <div style={{ fontSize: 13, color: '#b9b6ac', lineHeight: 1.55, marginTop: 6 }}>{body}</div>
  </div>
);

window.Caddie = Caddie;
