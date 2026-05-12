// Shared primitives for the StrikeLab redesign.
// Theme-aware via CSS vars. Light mode flips on [data-mode="light"] on .sl-theme.

const SL_THEME_CSS = `
.sl-theme {
  --bg: #0a0b0a;
  --bg-2: #111312;
  --surface: #15181650;
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

  background: var(--bg);
  color: var(--ink);
  font-family: "Geist", system-ui, -apple-system, sans-serif;
  font-feature-settings: "ss01","cv11";
  -webkit-font-smoothing: antialiased;
}
.sl-theme[data-mode="light"] {
  --bg: #ede8de;
  --bg-2: #e3ddd0;
  --surface: #f5f1e780;
  --surface-solid: #f5f1e7;
  --surface-2: #ebe5d6;
  --line: #c8c2b240;
  --line-strong: #b6af9c;
  --ink: #14161410;
  --ink: #141614;
  --ink-2: #4a4842;
  --ink-3: #76746b;
  --ink-4: #b6af9c;
  --accent: oklch(0.62 0.18 145);
  --accent-ink: #ede8de;
  --accent-2: oklch(0.52 0.18 145);
  --warn: oklch(0.55 0.18 50);
  --bad: oklch(0.55 0.20 28);
}
.sl-theme .mono { font-family: "Geist Mono", ui-monospace, monospace; font-feature-settings: "tnum","zero","ss01"; }
.sl-theme .serif { font-family: "Instrument Serif", serif; font-style: italic; }
.sl-theme .micro {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3);
}
.sl-theme .micro-sm {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--ink-3);
}
.sl-theme .display {
  font-family: "Geist", sans-serif;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 0.95;
}
.sl-theme .display em { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; letter-spacing: -0.02em; }
.sl-theme .num {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-feature-settings: "tnum","zero";
  font-variant-numeric: tabular-nums;
}
.sl-theme hr.rule { border: 0; border-top: 1px solid var(--line-strong); margin: 0; }
.sl-theme .reticule { stroke: currentColor; fill: none; stroke-width: 1; }
.sl-theme .glow {
  box-shadow: 0 0 0 1px var(--line-strong), 0 30px 80px -30px oklch(0.88 0.18 125 / 0.15);
}
`;

const SLLogo = ({ size = 24, color, withWord = false, wordSize, condensed = false }) => {
  const s = size;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: withWord ? s * 0.45 : 0, color: color || 'currentColor' }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-label="StrikeLab">
        {/* outer ring */}
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1" />
        {/* crosshair */}
        <line x1="12" y1="2" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="17.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="2" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="17.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
        {/* shot mark — slightly off-center to imply a real strike */}
        <circle cx="13.5" cy="10.5" r="1.6" fill="currentColor" />
        {/* trajectory tick */}
        <path d="M12 12 L13.5 10.5" stroke="currentColor" strokeWidth="1" />
      </svg>
      {withWord && (
        <span
          className=""
          style={{
            fontFamily: 'Geist, sans-serif',
            fontWeight: 600,
            fontSize: wordSize || s * 0.8,
            letterSpacing: condensed ? '0.18em' : '0.02em',
            textTransform: condensed ? 'uppercase' : 'none',
          }}
        >
          {condensed ? 'STRIKELAB' : 'StrikeLab'}
        </span>
      )}
    </span>
  );
};

// Generic measurement panel: micro label + big mono number + delta
const Stat = ({ label, value, unit, delta, deltaTone = 'good', size = 'md' }) => {
  const big = size === 'lg' ? 56 : size === 'sm' ? 28 : 40;
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

// Reticule corner brackets — used as panel chrome
const Brackets = ({ children, style, padding = 14 }) => (
  <div style={{ position: 'relative', padding, ...style }}>
    <Bracket pos="tl" /><Bracket pos="tr" /><Bracket pos="bl" /><Bracket pos="br" />
    {children}
  </div>
);
const Bracket = ({ pos }) => {
  const m = { tl: { top: 0, left: 0 }, tr: { top: 0, right: 0, transform: 'scaleX(-1)' }, bl: { bottom: 0, left: 0, transform: 'scaleY(-1)' }, br: { bottom: 0, right: 0, transform: 'scale(-1)' } }[pos];
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={{ position: 'absolute', color: 'var(--ink-4)', ...m }}>
      <path d="M0 0 L0 4 M0 0 L4 0" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
};

// Channel tag — tiny ALL CAPS chip
const Tag = ({ children, tone = 'default' }) => {
  const styles = {
    default: { color: 'var(--ink-2)', borderColor: 'var(--line-strong)' },
    accent:  { color: 'var(--accent)', borderColor: 'var(--accent)' },
    warn:    { color: 'var(--warn)', borderColor: 'var(--warn)' },
    bad:     { color: 'var(--bad)', borderColor: 'var(--bad)' },
  };
  return (
    <span className="mono" style={{
      display: 'inline-block', padding: '3px 7px', border: '1px solid', borderRadius: 2,
      fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', ...styles[tone],
    }}>{children}</span>
  );
};

// Panel — flat card with hairline border, no rounded corners. Optional ID badge.
const Panel = ({ id, title, right, children, style, padded = true }) => (
  <div style={{
    background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', borderRadius: 2,
    position: 'relative',
    ...style,
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

// Tiny sparkline
const Spark = ({ data, w = 120, h = 28, color = 'var(--accent)', strokeWidth = 1.25, fill = false }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / r) * (h - 2) - 1]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {fill && <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
};

Object.assign(window, { SL_THEME_CSS, SLLogo, Stat, Brackets, Tag, Panel, Spark });
