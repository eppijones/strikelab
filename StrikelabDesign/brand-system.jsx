// Brand system artboard — logo, type, color, motion, iconography.

const BrandSystem = () => {
  return (
    <div className="sl-theme" data-mode="dark" style={{ width: 1440, padding: 56, background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{SL_THEME_CSS}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid var(--line-strong)', paddingBottom: 24, marginBottom: 40 }}>
        <div>
          <div className="micro">FILE / 001 — IDENTITY</div>
          <h1 className="display" style={{ fontSize: 88, margin: '20px 0 0', maxWidth: 900 }}>
            A precision <em>instrument</em><br/>
            for the serious player.
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <SLLogo size={48} />
          <div className="micro" style={{ marginTop: 10 }}>BAY 01 / v0.1 / MAY 2026</div>
        </div>
      </div>

      {/* RATIONALE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
        <div>
          <div className="micro">DIRECTIONAL NORTH</div>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 10 }}>
            StrikeLab is reframed as a <span style={{ color: 'var(--ink)' }}>performance instrument</span>, not a SaaS dashboard. The interface borrows the discipline of a TrackMan bay, the typographic restraint of a high-end print magazine, and the craft of Linear. Every readout is a measurement; every chart is a protagonist.
          </p>
        </div>
        <div>
          <div className="micro">VOICE</div>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 10 }}>
            Direct. Diagnostic. Confident without bravado. Numbers carry the argument; copy stays out of the way. We say <span className="mono" style={{ color: 'var(--ink)' }}>"+2.4 yds carry"</span> not <span className="mono" style={{ color: 'var(--ink-3)' }}>"nice work!"</span>
          </p>
        </div>
        <div>
          <div className="micro">PROMISE</div>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 10 }}>
            Every session becomes a plan. Diagnose → prescribe → validate. The system shows its work, and so does the player.
          </p>
        </div>
      </div>

      {/* LOGO BLOCK */}
      <SectionHead num="01" label="MARK" title="Reticule + Wordmark" />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, marginBottom: 56 }}>
        <Panel id="01.A" title="PRIMARY">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 20, color: 'var(--ink)' }}>
            <SLLogo size={72} withWord wordSize={48} />
          </div>
          <hr className="rule" />
          <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span className="micro">CLEAR SPACE = 1× RING</span>
            <span className="micro">MIN HEIGHT 16PX</span>
          </div>
        </Panel>
        <Panel id="01.B" title="LOCKUP / CONDENSED">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14 }}>
            <SLLogo size={32} withWord wordSize={14} condensed />
          </div>
          <hr className="rule" />
          <div style={{ padding: 12 }}><span className="micro">USE: NAV, FOOTERS, FAVICONS</span></div>
        </Panel>
        <Panel id="01.C" title="MARK ALONE">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', gap: 28, color: 'var(--accent)' }}>
            <SLLogo size={40} />
            <SLLogo size={28} />
            <SLLogo size={20} />
            <SLLogo size={14} />
          </div>
          <hr className="rule" />
          <div style={{ padding: 12 }}><span className="micro">ACCENT MARK USED SPARINGLY</span></div>
        </Panel>
      </div>

      {/* TYPE */}
      <SectionHead num="02" label="TYPE" title="Geist + Geist Mono + Instrument Serif" />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 56 }}>
        <Panel id="02.A" title="DISPLAY / GEIST + INSTRUMENT SERIF">
          <div className="display" style={{ fontSize: 96, padding: '20px 0' }}>
            Get <em>dialed in.</em>
          </div>
          <div className="display" style={{ fontSize: 56, color: 'var(--ink-2)' }}>
            Every session<br/>becomes a <em>plan.</em>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 32, color: 'var(--ink-3)' }}>
            <span className="micro">96 / -4% TRK / 0.95 LH</span>
            <span className="micro">SERIF ITALIC FOR EMPHASIS ONLY</span>
          </div>
        </Panel>
        <Panel id="02.B" title="DATA / GEIST MONO">
          <div className="num" style={{ fontSize: 88, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>268.4</div>
          <div className="micro" style={{ marginTop: 6 }}>CARRY YDS · DRIVER · LAST 50</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 24 }}>
            <span className="num" style={{ fontSize: 32, fontWeight: 500 }}>+2.4</span>
            <span className="micro">YDS Δ vs prev session</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 12 }}>
            <span className="num" style={{ fontSize: 32, fontWeight: 500, color: 'var(--accent)' }}>1.49</span>
            <span className="micro">SMASH FACTOR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 12 }}>
            <span className="num" style={{ fontSize: 32, fontWeight: 500 }}>2 412</span>
            <span className="micro">SPIN RPM</span>
          </div>
        </Panel>
      </div>

      {/* TYPE SCALE */}
      <Panel id="02.C" title="SCALE" style={{ marginBottom: 56 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 110px', rowGap: 12, columnGap: 24, alignItems: 'baseline' }}>
          {[
            ['DISPLAY-XL', 'Bay 01', 96, 'Geist 500'],
            ['DISPLAY-L',  'Get dialed in.', 64, 'Geist 500'],
            ['DISPLAY-M',  'Driver Optimization', 40, 'Geist 500'],
            ['HEAD',       'Recent sessions', 24, 'Geist 500'],
            ['BODY',       'Your dispersion has tightened by 12% across the last three sessions.', 15, 'Geist 400'],
            ['MICRO',      'CARRY · YDS · LAST 50', 10, 'Geist Mono 500 / 0.18em'],
          ].map(([k, t, sz, m]) => (
            <React.Fragment key={k}>
              <span className="micro">{k}</span>
              <span style={{ fontSize: sz, fontFamily: k === 'MICRO' ? 'Geist Mono' : 'Geist', fontWeight: k === 'BODY' ? 400 : 500, letterSpacing: k === 'MICRO' ? '0.18em' : '-0.02em', textTransform: k === 'MICRO' ? 'uppercase' : 'none', color: k === 'MICRO' ? 'var(--ink-3)' : 'var(--ink)' }}>{t}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'right' }}>{m}</span>
            </React.Fragment>
          ))}
        </div>
      </Panel>

      {/* COLOR */}
      <SectionHead num="03" label="COLOR" title="Restrained palette · single hot accent" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          ['INK / BG',    '#0A0B0A', '#0a0b0a', 'var(--ink)'],
          ['SURFACE',     '#151816', '#151816', 'var(--ink)'],
          ['LINE',        '#2D322F', '#2d322f', 'var(--ink-2)'],
          ['BONE',        '#EDE8DE', '#ede8de', '#0a0b0a'],
          ['INK-2',       '#B9B6AC', '#b9b6ac', '#0a0b0a'],
          ['SIGNAL LIME', 'oklch(.88 .18 125)', 'oklch(0.88 0.18 125)', '#0a0b0a'],
        ].map(([n, hex, bg, fg]) => (
          <div key={n} style={{ background: bg, color: fg, padding: 16, borderRadius: 2, border: '1px solid var(--line-strong)', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8 }}>{n}</span>
            <span className="mono" style={{ fontSize: 11 }}>{hex}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 56 }}>
        {[
          ['SIGNAL ORANGE / WARN', 'oklch(.78 .16 65)'],
          ['SIGNAL RED / FAULT',   'oklch(.68 .20 28)'],
          ['DEEP GRAPHITE / 02',   '#1c1f1d'],
        ].map(([n, bg]) => (
          <div key={n} style={{ background: bg, padding: 16, borderRadius: 2, border: '1px solid var(--line-strong)', height: 80, display: 'flex', alignItems: 'flex-end' }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0a0b0a', mixBlendMode: 'difference', filter: 'invert(1)' }}>{n}</span>
          </div>
        ))}
      </div>

      {/* ICONS + MOTION */}
      <SectionHead num="04" label="ICONS" title="Drafted · 1px stroke · technical" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 56 }}>
        <Panel id="04.A" title="ICON SET">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0, padding: 0 }}>
            {ICONS.map(([name, svg]) => (
              <div key={name} style={{ borderRight: '1px solid var(--line-strong)', borderTop: '1px solid var(--line-strong)', padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ color: 'var(--ink)' }}>{svg}</div>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{name}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel id="04.B" title="MOTION LANGUAGE">
          <div style={{ padding: 4 }}>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', margin: '0 0 18px' }}>
              Movement borrows from ballistic decay — sharp launch, soft settle. Numbers count up like a rangefinder, lines draw like a shot tracer, panels admit no bounce.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <MotionRow label="LAUNCH" curve="cubic-bezier(0.2, 0.9, 0.3, 1)" t="240ms" />
              <MotionRow label="SETTLE" curve="cubic-bezier(0.16, 1, 0.3, 1)" t="480ms" />
              <MotionRow label="TRACE" curve="cubic-bezier(0.65, 0, 0.35, 1)" t="900ms" />
              <MotionRow label="MICRO" curve="ease-out" t="120ms" />
            </div>
          </div>
        </Panel>
      </div>

      {/* GRID + PHOTO */}
      <SectionHead num="05" label="LAYOUT" title="12-col · hairline grid · monospace coordinates" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Panel id="05.A" title="HAIRLINE GRID">
          <div style={{ position: 'relative', height: 220, border: '1px solid var(--line-strong)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)', backgroundSize: '1fr 24px', backgroundPositionY: '12px' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
              {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ borderRight: '1px solid var(--line)' }} />)}
            </div>
            <div style={{ position: 'absolute', top: 8, left: 8 }} className="micro">12 / 24PX BASELINE</div>
          </div>
        </Panel>
        <Panel id="05.B" title="PHOTOGRAPHIC TONE">
          <div style={{ height: 220, position: 'relative', overflow: 'hidden', background: 'repeating-linear-gradient(135deg, #1a1d1b, #1a1d1b 8px, #15181620 8px, #15181620 16px)', border: '1px solid var(--line-strong)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 11 }}>[ CLUB-FACE MACRO · 4:3 · GOLDEN HOUR ]</span>
            </div>
            <div style={{ position: 'absolute', top: 12, left: 12 }} className="micro">IMG.001</div>
            <div style={{ position: 'absolute', bottom: 12, right: 12 }} className="micro">f/2.8 · 1/2000</div>
          </div>
        </Panel>
      </div>

    </div>
  );
};

const SectionHead = ({ num, label, title }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 18 }}>
    <span className="mono" style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: '0.18em' }}>{num}</span>
    <span className="micro">{label}</span>
    <span style={{ flex: 1, height: 1, background: 'var(--line-strong)' }} />
    <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{title}</span>
  </div>
);

const MotionRow = ({ label, curve, t }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px', alignItems: 'center', gap: 12 }}>
    <span className="micro">{label}</span>
    <div style={{ position: 'relative', height: 22, background: 'var(--bg-2)', border: '1px solid var(--line-strong)', overflow: 'hidden' }}>
      <div className="motion-dot" style={{ animationTimingFunction: curve, animationDuration: t.replace('ms', '') > 600 ? '1.8s' : '1.2s' }} />
    </div>
    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'right' }}>{t}</span>
  </div>
);

const ICONS = [
  ['REGISTER', <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><circle cx="12" cy="12" r="4" stroke="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>],
  ['DRIVER',   <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20 L20 4" stroke="currentColor"/><path d="M16 4 L20 4 L20 8" stroke="currentColor"/><circle cx="5" cy="19" r="2.4" stroke="currentColor"/></svg>],
  ['BALL',     <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><circle cx="9" cy="10" r="0.7" fill="currentColor"/><circle cx="13" cy="9" r="0.7" fill="currentColor"/><circle cx="11" cy="13" r="0.7" fill="currentColor"/><circle cx="15" cy="13" r="0.7" fill="currentColor"/></svg>],
  ['DISPERSION', <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22 L7 4 M12 22 L17 4 M12 22 L12 4" stroke="currentColor" strokeDasharray="2 2"/><circle cx="12" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="14" cy="11" r="1" fill="currentColor"/></svg>],
  ['SESSION',  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" stroke="currentColor"/><path d="M3 10 L21 10" stroke="currentColor"/><path d="M8 14 L11 17 L16 12" stroke="currentColor"/></svg>],
  ['TRACE',    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 20 Q 12 0 21 20" stroke="currentColor"/><circle cx="3" cy="20" r="1.4" fill="currentColor"/><circle cx="21" cy="20" r="1.4" fill="currentColor"/></svg>],
  ['DRILL',    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3 L12 21" stroke="currentColor"/><path d="M5 8 L19 8 M6 13 L18 13 M8 18 L16 18" stroke="currentColor"/></svg>],
  ['REPORT',   <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" stroke="currentColor"/><path d="M8 8 L16 8 M8 12 L16 12 M8 16 L13 16" stroke="currentColor"/></svg>],
  ['CALENDAR', <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" stroke="currentColor"/><path d="M3 10 L21 10 M8 3 L8 7 M16 3 L16 7" stroke="currentColor"/></svg>],
  ['CONNECT',  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="3" stroke="currentColor"/><circle cx="18" cy="12" r="3" stroke="currentColor"/><path d="M9 12 L15 12" stroke="currentColor"/></svg>],
  ['BAG',      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 8 L7 21 L17 21 L17 8" stroke="currentColor"/><path d="M9 8 L9 4 L15 4 L15 8" stroke="currentColor"/></svg>],
  ['COACH',    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3 L14 9 L20 10 L15.5 14 L17 20 L12 17 L7 20 L8.5 14 L4 10 L10 9 Z" stroke="currentColor"/></svg>],
  ['UPLOAD',   <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16 L12 4 M7 9 L12 4 L17 9" stroke="currentColor"/><path d="M4 20 L20 20" stroke="currentColor"/></svg>],
  ['SETTINGS', <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor"/><path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" stroke="currentColor"/></svg>],
  ['CHEVRON',  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6 L15 12 L9 18" stroke="currentColor"/></svg>],
  ['PLUS',     <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4 L12 20 M4 12 L20 12" stroke="currentColor"/></svg>],
];

// Animation for motion rows
if (!document.getElementById('motion-css')) {
  const css = document.createElement('style');
  css.id = 'motion-css';
  css.textContent = `
    @keyframes sl-launch { 0%{transform:translateX(0)} 100%{transform:translateX(calc(100% - 20px))} }
    .motion-dot { position:absolute; top:6px; left:4px; width:10px; height:10px; background: var(--accent); border-radius: 50%; animation: sl-launch 1.4s infinite alternate; }
  `;
  document.head.appendChild(css);
}

window.BrandSystem = BrandSystem;
