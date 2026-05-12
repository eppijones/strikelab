// StrikeLab · Swing Analysis · Apple Watch
// Black bay aesthetic. Signal Lime is the ONLY accent. Mono numbers. Hairline rules.
// Central metaphor: the range bar ├──|══●══|──┤. Your personal target window, not a tour pro's.

const ACCENT = "oklch(0.88 0.18 125)";
const INK = "#ede8de";
const INK2 = "#b9b6ac";
const INK3 = "#76746b";
const INK4 = "#4a4842";
const LINE = "#1f2220";
const LINE2 = "#2d322f";
const BG = "#000";

const SL_CSS = `
  .mono { font-family: "Geist Mono", ui-monospace, monospace; font-feature-settings: "tnum","zero"; font-variant-numeric: tabular-nums; }
  .serif { font-family: "Instrument Serif", serif; font-style: italic; }
  .display { font-family: "Geist", sans-serif; font-weight: 500; letter-spacing: -0.04em; }
  .display em { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; }
  .micro { font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${INK3}; }
  body { background: #0a0b0a; }
`;

// ───────────────────────────────────────────────────────────── Watch frame

const W = 184;
const H = 224;

const WatchFrame = ({ children, time = "14:08", label = "SWING" }) => (
  <div style={{ width: W + 36, filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.55))" }}>
    <div style={{
      width: W + 36, height: H + 36,
      background: "linear-gradient(160deg, #1d1f1e, #0a0b0a 60%, #0a0b0a)",
      borderRadius: 38, border: "1px solid #2a2c2b", padding: 18, position: "relative",
    }}>
      {/* digital crown + side button */}
      <div style={{ position: "absolute", right: -3, top: 56, width: 8, height: 26, background: "#1a1c1b", border: "1px solid #2a2c2b", borderRadius: 2 }} />
      <div style={{ position: "absolute", right: -3, top: 100, width: 8, height: 18, background: "#1a1c1b", border: "1px solid #2a2c2b", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: -3, top: 78, width: 8, height: 22, background: "#c95a1e", border: "1px solid #2a2c2b", borderRadius: 2 }} />
      {/* screen */}
      <div style={{
        width: W, height: H, background: BG, borderRadius: 26, overflow: "hidden",
        position: "relative", color: INK, fontFamily: "Geist, sans-serif",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px 4px" }}>
          <span className="mono" style={{ fontSize: 9, color: ACCENT, letterSpacing: "0.16em" }}>{label}</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{time}</span>
        </div>
        <div style={{ padding: "0 10px 10px", height: "calc(100% - 28px)", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

// ───────────────────────────────────────────────────────────── Range bar primitive
// The protagonist. ├──|══●══|──┤
// - outer brackets = absolute spread (your career range)
// - inner pipes = your personal target window
// - filled lime segment = the window
// - vertical tick + dot = current value
// - faint dots inside window = recent swings (optional)
//
// All inputs in the metric's natural units. Pass min/max for the visible axis.

const RangeBar = ({
  value, target, range, min, max,
  height = 30,
  showValueLabel = true,
  recent = null,            // array of recent values, plotted as small dots
  drift = false,            // when true, value rendered out-of-window in INK (no red)
  width = 164,
}) => {
  const pad = 8;
  const inner = width - pad * 2;
  const xFor = (v) => pad + ((v - min) / (max - min)) * inner;
  const [r0, r1] = range;
  const [t0, t1] = target;
  const cx = xFor(value);
  const inWindow = value >= t0 && value <= t1;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: "block" }}>
      {/* career-range axis */}
      <line x1={xFor(r0)} x2={xFor(r1)} y1={height * 0.65} y2={height * 0.65} stroke={LINE2} strokeWidth="1" />
      {/* career range caps */}
      <line x1={xFor(r0)} x2={xFor(r0)} y1={height * 0.55} y2={height * 0.75} stroke={INK3} strokeWidth="1" />
      <line x1={xFor(r1)} x2={xFor(r1)} y1={height * 0.55} y2={height * 0.75} stroke={INK3} strokeWidth="1" />
      {/* target window fill */}
      <line x1={xFor(t0)} x2={xFor(t1)} y1={height * 0.65} y2={height * 0.65} stroke={ACCENT} strokeWidth="2.5" />
      {/* target window pipes */}
      <line x1={xFor(t0)} x2={xFor(t0)} y1={height * 0.45} y2={height * 0.85} stroke={ACCENT} strokeWidth="1.2" />
      <line x1={xFor(t1)} x2={xFor(t1)} y1={height * 0.45} y2={height * 0.85} stroke={ACCENT} strokeWidth="1.2" />
      {/* recent swing dots */}
      {recent && recent.map((v, i) => (
        <circle key={i} cx={xFor(v)} cy={height * 0.65} r="1.2" fill={INK3} opacity={0.55 + (i / recent.length) * 0.35} />
      ))}
      {/* current value tick + dot */}
      <line x1={cx} x2={cx} y1={height * 0.1} y2={height * 0.65} stroke={inWindow ? ACCENT : INK} strokeWidth="1" />
      <circle cx={cx} cy={height * 0.65} r="2.6" fill={inWindow ? ACCENT : INK} />
      {showValueLabel && (
        <text x={cx} y={height * 0.06 + 1} textAnchor="middle" fill={inWindow ? ACCENT : INK} fontFamily="Geist Mono" fontSize="8" fontWeight="500" dominantBaseline="hanging">
          {typeof value === "number" ? value.toFixed(value < 10 ? 2 : 0) : value}
        </text>
      )}
    </svg>
  );
};

// Small inline range bar for stacked rows (Signature screen)
const MiniRange = ({ value, target, range, min, max, label, unit, width = 100, height = 14 }) => {
  const pad = 2;
  const inner = width - pad * 2;
  const xFor = (v) => pad + ((v - min) / (max - min)) * inner;
  const [t0, t1] = target;
  const inWindow = value >= t0 && value <= t1;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <line x1={xFor(range[0])} x2={xFor(range[1])} y1={height / 2} y2={height / 2} stroke={LINE2} strokeWidth="0.8" />
      <line x1={xFor(t0)} x2={xFor(t1)} y1={height / 2} y2={height / 2} stroke={ACCENT} strokeWidth="2" />
      <line x1={xFor(t0)} x2={xFor(t0)} y1={3} y2={height - 3} stroke={ACCENT} strokeWidth="0.8" />
      <line x1={xFor(t1)} x2={xFor(t1)} y1={3} y2={height - 3} stroke={ACCENT} strokeWidth="0.8" />
      <circle cx={xFor(value)} cy={height / 2} r="2" fill={inWindow ? ACCENT : INK} />
    </svg>
  );
};

// ───────────────────────────────────────────────────────────── Swing trace
// Acceleration / clubhead-speed curve over time. The actual signature of the swing.
// Shape: rises through backswing, brief pause, sharp rise into downswing, peak at impact, decay.

const TraceCurve = ({ width = 164, height = 56, impactX = 0.72, color = ACCENT, secondary = null, label = true }) => {
  // Sample points: t in [0,1] → speed
  const sample = (t, ix) => {
    // backswing rise to ~0.32 height
    if (t < 0.35) return 0.55 - 0.45 * (1 - Math.cos((t / 0.35) * Math.PI)) / 2 * 0.6;
    // pause at top
    if (t < 0.42) return 0.38;
    // downswing acceleration
    if (t < ix) {
      const k = (t - 0.42) / (ix - 0.42);
      return 0.38 - 0.36 * Math.pow(k, 1.6);
    }
    // impact spike + decay
    if (t < ix + 0.04) return 0.02 + (t - ix) * 2;
    return 0.1 + (t - ix - 0.04) * 0.6;
  };
  const N = 80;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = sample(t, impactX);
    pts.push([t * width, y * height + 2]);
  }
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  const sPts = secondary ? pts.map(([x, y], i) => {
    const t = i / N;
    const drift = Math.sin(t * Math.PI) * 4 * secondary;
    return [x, y + drift];
  }) : null;
  const sD = sPts ? sPts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") : null;

  return (
    <svg viewBox={`0 0 ${width} ${height + 6}`} width={width} height={height + 6} style={{ display: "block" }}>
      {/* baseline grid */}
      <line x1="0" x2={width} y1={height + 1} y2={height + 1} stroke={LINE} strokeWidth="0.6" />
      {/* impact line */}
      <line x1={impactX * width} x2={impactX * width} y1="0" y2={height + 1} stroke={INK3} strokeDasharray="1 2" strokeWidth="0.6" />
      {label && (
        <text x={impactX * width + 2} y="7" fill={INK3} fontFamily="Geist Mono" fontSize="6" letterSpacing="0.2">IMPACT</text>
      )}
      {/* your average ghost */}
      {sD && <path d={sD} fill="none" stroke={INK4} strokeWidth="0.8" strokeDasharray="1.5 1.5" />}
      {/* current trace */}
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" />
      {/* impact dot */}
      <circle cx={impactX * width} cy={sample(impactX, impactX) * height + 2} r="2" fill={color} />
    </svg>
  );
};

// ───────────────────────────────────────────────────────────── Building blocks

const Pill = ({ children, kind = "primary" }) => {
  const sty = kind === "primary" ? { background: ACCENT, color: "#0a0b0a" }
    : kind === "ghost" ? { background: "transparent", color: INK, border: "1px solid " + LINE2 }
    : { background: "#1a1c1b", color: INK };
  return (
    <div style={{
      ...sty, borderRadius: 14, padding: "8px 0",
      fontFamily: "Geist Mono", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center",
    }}>{children}</div>
  );
};

const HeadRow = ({ left, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <span className="mono" style={{ fontSize: 8, color: INK3, letterSpacing: "0.2em" }}>{left}</span>
    {right && <span className="mono" style={{ fontSize: 8, color: INK3, letterSpacing: "0.2em" }}>{right}</span>}
  </div>
);

// ───────────────────────────────────────────────────────────── SCREENS

// 01 — Ready / at-rest, complication-style. Live signature, last swing peek.
const ScreenReady = () => (
  <WatchFrame time="14:06" label="· READY">
    <HeadRow left="TODAY · 12 SWINGS" right="7i" />
    <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
      <span className="mono" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1 }}>3.0</span>
      <span className="mono" style={{ fontSize: 14, color: INK3, letterSpacing: "0.1em" }}>:1</span>
      <span className="mono" style={{ fontSize: 9, color: INK3, letterSpacing: "0.18em", marginLeft: 4 }}>TEMPO</span>
    </div>
    <div style={{ marginTop: 4 }}>
      <RangeBar value={3.0} target={[2.9, 3.2]} range={[2.5, 3.6]} min={2.5} max={3.6} showValueLabel={false} recent={[2.95, 3.1, 3.05, 2.98, 3.0]} />
    </div>
    <div style={{ marginTop: 6, padding: "5px 7px", background: "#0e1110", border: "1px solid " + LINE, borderRadius: 3 }}>
      <span className="mono" style={{ fontSize: 8, color: INK3, letterSpacing: "0.18em" }}>SIGNATURE</span>
      <div style={{ marginTop: 2, fontFamily: "Geist Mono", fontSize: 10, color: INK2, letterSpacing: "0.04em" }}>
        4 / 5 <span style={{ color: INK3 }}>in window</span>
      </div>
    </div>
    <div style={{ marginTop: "auto" }}>
      <Pill kind="primary">Capture</Pill>
    </div>
  </WatchFrame>
);

// 02 — Live capture. Curve forming in real-time.
const ScreenLive = () => (
  <WatchFrame time="14:08" label="· CAPTURING">
    <HeadRow left="SWING · DETECTING" />
    <div style={{ marginTop: 4 }}>
      <TraceCurve impactX={0.55} label={false} />
    </div>
    <div style={{ marginTop: 2, display: "flex", justifyContent: "space-between" }}>
      <span className="mono" style={{ fontSize: 8, color: INK3, letterSpacing: "0.18em" }}>BACKSWING</span>
      <span className="mono" style={{ fontSize: 8, color: ACCENT, letterSpacing: "0.18em" }}>● TRANSITION</span>
      <span className="mono" style={{ fontSize: 8, color: INK4, letterSpacing: "0.18em" }}>IMPACT</span>
    </div>
    {/* live numbers ticking */}
    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
      <LiveStat l="ROT" v="—" />
      <LiveStat l="TIME" v="0.84s" pulse />
    </div>
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4,
            background: i < 13 ? ACCENT : LINE,
            opacity: i < 13 ? 1 : 1,
          }} />
        ))}
      </div>
      <div className="mono" style={{ fontSize: 8, color: INK3, marginTop: 4, letterSpacing: "0.18em" }}>SAMPLING · 1KHZ</div>
    </div>
    <div style={{ marginTop: "auto" }}>
      <Pill kind="ghost">Cancel</Pill>
    </div>
  </WatchFrame>
);

const LiveStat = ({ l, v, pulse }) => (
  <div style={{ background: "#0e1110", border: "1px solid " + LINE, padding: "4px 6px", borderRadius: 3 }}>
    <div className="mono" style={{ fontSize: 7, color: INK3, letterSpacing: "0.18em" }}>{l}</div>
    <div className="mono" style={{ fontSize: 12, color: pulse ? ACCENT : INK, fontWeight: 500 }}>{v}</div>
  </div>
);

// 03 — Result · In window. The hero shot.
const ScreenResultIn = () => (
  <WatchFrame time="14:08" label="· SWING 13">
    <HeadRow left="TEMPO · 7i" right="IN WINDOW" />
    <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 6 }}>
      <span className="mono" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 0.95, color: ACCENT }}>3.04</span>
      <span className="mono" style={{ fontSize: 10, color: INK3, letterSpacing: "0.18em" }}>:1</span>
    </div>
    <div style={{ marginTop: 6 }}>
      <RangeBar value={3.04} target={[2.9, 3.2]} range={[2.5, 3.6]} min={2.5} max={3.6} />
    </div>
    <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
      <span className="mono" style={{ fontSize: 7, color: INK3 }}>2.5</span>
      <span className="mono" style={{ fontSize: 7, color: INK3 }}>3.6</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
      <LiveStat l="BACK" v="0.96s" />
      <LiveStat l="DOWN" v="0.32s" />
    </div>
    <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
      <Pill kind="ghost">Detail</Pill>
      <Pill kind="primary">Next</Pill>
    </div>
  </WatchFrame>
);

// 04 — Result · Out of window. Single line of feedback. Restrained, no red.
const ScreenResultOut = () => (
  <WatchFrame time="14:12" label="· SWING 17">
    <HeadRow left="TEMPO · 7i" right="QUICK" />
    <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 6 }}>
      <span className="mono" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 0.95, color: INK }}>2.71</span>
      <span className="mono" style={{ fontSize: 10, color: INK3, letterSpacing: "0.18em" }}>:1</span>
    </div>
    <div style={{ marginTop: 6 }}>
      <RangeBar value={2.71} target={[2.9, 3.2]} range={[2.5, 3.6]} min={2.5} max={3.6} drift />
    </div>
    <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
      <span className="mono" style={{ fontSize: 7, color: INK3 }}>2.5</span>
      <span className="mono" style={{ fontSize: 7, color: INK3 }}>3.6</span>
    </div>
    {/* serif coach line — the only sentence StrikeLab will say */}
    <div className="serif" style={{ fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.15 }}>
      "Transition is rushing.<br/>Count one at the top."
    </div>
    <div style={{ marginTop: "auto" }}>
      <Pill kind="primary">Try again</Pill>
    </div>
  </WatchFrame>
);

// 05 — Swing trace vs your average.
const ScreenTrace = () => (
  <WatchFrame time="14:12" label="· TRACE">
    <HeadRow left="CLUBHEAD SPEED" right="MPH" />
    <div style={{ marginTop: 4 }}>
      <TraceCurve impactX={0.72} secondary={1.0} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
      <span className="mono" style={{ fontSize: 7, color: INK3 }}>0.0</span>
      <span className="mono" style={{ fontSize: 7, color: INK3 }}>1.4s</span>
    </div>
    <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
      <span className="mono" style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.04em", color: ACCENT }}>87.4</span>
      <span className="mono" style={{ fontSize: 9, color: INK3, letterSpacing: "0.18em" }}>PEAK · MPH</span>
    </div>
    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
      <span className="mono" style={{ fontSize: 8, color: ACCENT, letterSpacing: "0.18em" }}>━━ THIS</span>
      <span className="mono" style={{ fontSize: 8, color: INK4, letterSpacing: "0.18em" }}>┄┄ AVG 84.1</span>
    </div>
    <div style={{ marginTop: "auto" }}>
      <Pill kind="ghost">Detail</Pill>
    </div>
  </WatchFrame>
);

// 06 — Signature. Your 5-metric fingerprint as stacked range bars.
const ScreenSignature = () => {
  const rows = [
    { l: "TEMPO",      v: "3.04",  unit: ":1",  val: 3.04, target: [2.9, 3.2], range: [2.5, 3.6], min: 2.5, max: 3.6 },
    { l: "BACKSWING",  v: "0.96",  unit: "s",   val: 0.96, target: [0.9, 1.0], range: [0.7, 1.2], min: 0.7, max: 1.2 },
    { l: "ROTATION",   v: "92°",   unit: "",    val: 92,   target: [88, 96],   range: [78, 105],  min: 78,  max: 105 },
    { l: "TRANSITION", v: "42ms",  unit: "",    val: 42,   target: [35, 55],   range: [15, 80],   min: 15,  max: 80 },
    { l: "IMPACT",     v: "0.86",  unit: "g",   val: 0.74, target: [0.8, 1.0], range: [0.5, 1.2], min: 0.5, max: 1.2, drift: true },
  ];
  return (
    <WatchFrame time="14:13" label="· SIGNATURE">
      <HeadRow left="4 / 5 IN WINDOW" right="7i · 17 SW" />
      <div style={{ marginTop: 6, display: "grid", gap: 5, flex: 1 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr 28px", alignItems: "center", gap: 4 }}>
            <span className="mono" style={{ fontSize: 7, color: INK3, letterSpacing: "0.16em" }}>{r.l}</span>
            <MiniRange value={r.val} target={r.target} range={r.range} min={r.min} max={r.max} width={86} height={12} />
            <span className="mono" style={{ fontSize: 9, color: r.drift ? INK : ACCENT, fontWeight: 500, textAlign: "right" }}>{r.v}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}>
        <Pill kind="ghost">Compare</Pill>
      </div>
    </WatchFrame>
  );
};

// 07 — Drift alert. Trend of last 8 swings.
const ScreenDrift = () => {
  const swings = [3.02, 2.98, 3.05, 2.94, 2.88, 2.82, 2.78, 2.71];
  return (
    <WatchFrame time="14:15" label="· DRIFT">
      <HeadRow left="LAST 8 SWINGS" right="↓ QUICK" />
      <div style={{ marginTop: 4 }}>
        <DriftPlot values={swings} target={[2.9, 3.2]} range={[2.5, 3.6]} />
      </div>
      <div style={{ marginTop: 2, display: "flex", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 7, color: INK3 }}>−8</span>
        <span className="mono" style={{ fontSize: 7, color: INK3 }}>NOW</span>
      </div>
      <div className="serif" style={{ fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.15 }}>
        "Tempo trending<br/>quick by 0.18."
      </div>
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <Pill kind="ghost">Dismiss</Pill>
        <Pill kind="primary">Drill</Pill>
      </div>
    </WatchFrame>
  );
};

const DriftPlot = ({ values, target, range, width = 164, height = 64 }) => {
  const [r0, r1] = range;
  const [t0, t1] = target;
  const yFor = (v) => height - 4 - ((v - r0) / (r1 - r0)) * (height - 8);
  const xFor = (i) => 4 + (i / (values.length - 1)) * (width - 8);
  const d = values.map((v, i) => `${i ? "L" : "M"}${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: "block" }}>
      {/* target band */}
      <rect x="4" y={yFor(t1)} width={width - 8} height={yFor(t0) - yFor(t1)} fill={ACCENT} opacity="0.08" />
      <line x1="4" x2={width - 4} y1={yFor(t0)} y2={yFor(t0)} stroke={ACCENT} strokeWidth="0.6" strokeDasharray="2 2" />
      <line x1="4" x2={width - 4} y1={yFor(t1)} y2={yFor(t1)} stroke={ACCENT} strokeWidth="0.6" strokeDasharray="2 2" />
      {/* trail */}
      <path d={d} fill="none" stroke={INK} strokeWidth="1.2" />
      {/* points */}
      {values.map((v, i) => {
        const inWindow = v >= t0 && v <= t1;
        const isLast = i === values.length - 1;
        return (
          <circle key={i} cx={xFor(i)} cy={yFor(v)} r={isLast ? 2.6 : 1.6}
            fill={isLast ? INK : (inWindow ? ACCENT : INK3)} />
        );
      })}
      {/* labels */}
      <text x={width - 6} y={yFor(t1) - 2} fill={ACCENT} fontFamily="Geist Mono" fontSize="6" textAnchor="end" letterSpacing="0.2">WINDOW</text>
    </svg>
  );
};

// 08 — Drill mode. One metric. Last 5 swings inside the range bar.
const ScreenDrill = () => {
  const last5 = [2.71, 2.83, 2.91, 3.02, 3.06];
  return (
    <WatchFrame time="14:21" label="· DRILL · TEMPO">
      <HeadRow left="RECOVERING" right="5 / 5" />
      <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="mono" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1, color: ACCENT }}>3.06</span>
        <span className="mono" style={{ fontSize: 9, color: INK3, letterSpacing: "0.18em" }}>LAST</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <RangeBar value={3.06} target={[2.9, 3.2]} range={[2.5, 3.6]} min={2.5} max={3.6} recent={last5} />
      </div>
      <div style={{ marginTop: 4 }}>
        <DrillDots values={last5} target={[2.9, 3.2]} />
      </div>
      <div className="mono" style={{ fontSize: 8, color: INK3, marginTop: 2, letterSpacing: "0.18em" }}>
        ↑ 3 STRAIGHT IN
      </div>
      <div style={{ marginTop: "auto" }}>
        <Pill kind="primary">Capture</Pill>
      </div>
    </WatchFrame>
  );
};

const DrillDots = ({ values, target }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
    {values.map((v, i) => {
      const inW = v >= target[0] && v <= target[1];
      return (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", margin: "0 auto",
            background: inW ? ACCENT : "transparent",
            border: inW ? "none" : "1px solid " + INK3,
          }} />
          <div className="mono" style={{ fontSize: 7, color: INK3, marginTop: 2, letterSpacing: "0.1em" }}>
            {v.toFixed(2)}
          </div>
        </div>
      );
    })}
  </div>
);

// ───────────────────────────────────────────────────────────── Page

const SwingWatchPage = () => (
  <div style={{ width: 1440, margin: "0 auto", padding: "56px 56px 96px", background: "#0a0b0a", color: INK, fontFamily: "Geist, sans-serif" }}>
    <style>{SL_CSS}</style>

    {/* Header */}
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid " + LINE2, paddingBottom: 24, marginBottom: 36 }}>
      <div>
        <div className="micro">FILE / 008 — STRIKELAB SWING · APPLE WATCH ULTRA</div>
        <h1 className="display" style={{ fontSize: 76, margin: "16px 0 0", maxWidth: 980, lineHeight: 0.95 }}>
          One number,<br/><em>one window.</em>
        </h1>
        <p style={{ fontSize: 15, color: INK2, maxWidth: 760, lineHeight: 1.55, marginTop: 14 }}>
          Swing analysis on the wrist, without the gauge wall. Every screen reduces to a single question: <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>am I inside my window?</em> Signal Lime fires only when you are. No traffic lights. No emoji. The range bar — <span className="mono" style={{ fontSize: 13 }}>├──|══●══|──┤</span> — is the protagonist.
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="mono" style={{ fontSize: 10, color: INK3, letterSpacing: "0.2em" }}>49MM · WATCHOS 11 · WRIST IMU</div>
        <div className="mono" style={{ fontSize: 10, color: INK3, letterSpacing: "0.2em", marginTop: 4 }}>1KHZ · 6-AXIS · ALWAYS-ON</div>
      </div>
    </div>

    {/* Anatomy of the range bar */}
    <div style={{ marginBottom: 56, display: "grid", gridTemplateColumns: "320px 1fr", gap: 56, alignItems: "center", borderTop: "1px solid " + LINE, borderBottom: "1px solid " + LINE, padding: "32px 0" }}>
      <div>
        <div className="micro">ANATOMY · RANGE BAR</div>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 10, lineHeight: 1.2 }}>
          The window is <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>yours,</em> not a tour pro's.
        </div>
        <p style={{ fontSize: 13, color: INK2, marginTop: 10, lineHeight: 1.55 }}>
          Faint grey caps show your career spread. The lime band is your personal target — derived from your last 200 in-window swings. Recent attempts trail behind the dot.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: "#0e1110", border: "1px solid " + LINE, padding: 24, borderRadius: 2 }}>
          <RangeBar value={3.04} target={[2.9, 3.2]} range={[2.5, 3.6]} min={2.5} max={3.6} width={760} height={60} recent={[2.95, 3.0, 3.08, 2.98, 3.02]} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: INK3 }}>
            <span className="mono" style={{ fontSize: 9 }}>CAREER LOW · 2.5</span>
            <span className="mono" style={{ fontSize: 9, color: ACCENT }}>TARGET · 2.9 ─── 3.2</span>
            <span className="mono" style={{ fontSize: 9 }}>CAREER HIGH · 3.6</span>
          </div>
        </div>
      </div>
    </div>

    {/* 8 screens, 4 across */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28, justifyItems: "center", marginBottom: 36 }}>
      <ScreenCol n="01" label="READY" body="Complication-style at-rest. Today's signature, last swing peek."><ScreenReady /></ScreenCol>
      <ScreenCol n="02" label="CAPTURING" body="Live trace forms during the swing. 1 kHz sampling."><ScreenLive /></ScreenCol>
      <ScreenCol n="03" label="IN WINDOW" body="Number turns lime. No high-fives, no fireworks."><ScreenResultIn /></ScreenCol>
      <ScreenCol n="04" label="DRIFT" body="Out-of-window stays ink. Serif italic for the one line."><ScreenResultOut /></ScreenCol>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28, justifyItems: "center" }}>
      <ScreenCol n="05" label="TRACE" body="Your clubhead-speed curve vs. your own average ghost."><ScreenTrace /></ScreenCol>
      <ScreenCol n="06" label="SIGNATURE" body="5-metric fingerprint. The whole swing in one glance."><ScreenSignature /></ScreenCol>
      <ScreenCol n="07" label="DRIFT WARNING" body="Tempo trended quick over the last 8. Tap Drill."><ScreenDrift /></ScreenCol>
      <ScreenCol n="08" label="DRILL MODE" body="One metric, last five attempts inline. Stay in the band."><ScreenDrill /></ScreenCol>
    </div>

    {/* Design notes */}
    <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
      <Note num="A" title="No traffic lights — ever." body="GolfShot, Sportsbox, and Tour Sync paint screens red/yellow/green like a dashboard. We don't. Signal Lime fires only when you're inside your window. Everything else is bone, ink, or hairline grey. The eye knows what to look for, and the watch never panics at you mid-round." />
      <Note num="B" title="Your window, your fingerprint." body="The lime band isn't an idealized tour-pro range. It's derived from your last 200 in-window swings — the swings that worked. We coach you back to your own best, not toward someone else's." />
      <Note num="C" title="One line, italic, then silence." body="When feedback is necessary, you get a single sentence in Instrument Serif italic. No bullet list, no checklist, no nudges. A great coach says one thing and waits. The watch behaves the same." />
    </div>
  </div>
);

const ScreenCol = ({ n, label, body, children }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
    {children}
    <div style={{ width: "100%", maxWidth: 240, textAlign: "center" }}>
      <div className="mono" style={{ fontSize: 9, color: ACCENT, letterSpacing: "0.2em" }}>{n} · {label}</div>
      <div style={{ fontSize: 12, color: INK2, marginTop: 6, lineHeight: 1.5 }}>{body}</div>
    </div>
  </div>
);

const Note = ({ num, title, body }) => (
  <div style={{ borderTop: "1px solid " + LINE2, paddingTop: 18 }}>
    <div className="mono" style={{ fontSize: 10, color: ACCENT, letterSpacing: "0.2em" }}>NOTE · {num}</div>
    <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{title}</div>
    <div style={{ fontSize: 13, color: INK2, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<SwingWatchPage />);
