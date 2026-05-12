// Coach Report — Diagnose → Prescribe → Validate.

const CoachReport = ({ mode = 'dark' }) => {
  return (
    <div className="sl-theme" data-mode={mode} style={{ width: 1440, background: 'var(--bg)', color: 'var(--ink)', minHeight: 900 }}>
      <style>{SL_THEME_CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SLLogo size={18} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>REPORT · R-038</span>
          <Tag tone="accent">FRESH · 4 MIN AGO</Tag>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)', padding: '8px 14px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Share with Coach</button>
          <button style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)', padding: '8px 14px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Export PDF</button>
          <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '8px 14px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Adopt Plan →</button>
        </div>
      </div>

      <div style={{ padding: '40px 32px 56px' }}>
        {/* Title */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, marginBottom: 40 }}>
          <div>
            <div className="micro">COACH REPORT · BASED ON SESSIONS 044—047 · 312 SHOTS</div>
            <h1 className="display" style={{ fontSize: 88, margin: '14px 0 0' }}>
              The driver is <em>opening.</em>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 700, lineHeight: 1.5, marginTop: 18 }}>
              Three sessions, one story. Carry is up <span className="mono" style={{ color: 'var(--accent)' }}>+8.2y</span> but dispersion is widening rightward as face-to-path opens. Spin is fine. The fix is small and mechanical.
            </p>
          </div>
          <Panel id="SUMMARY" title="DIAGNOSIS · ONE LINE">
            <div className="serif" style={{ fontSize: 22, lineHeight: 1.4, color: 'var(--ink)' }}>
              "An open clubface at impact, driven by an early hand release, is producing a right-miss pattern under fatigue."
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag tone="warn">FAULT · OPEN FACE</Tag>
              <Tag>CLUB · DRIVER</Tag>
              <Tag>CONFIDENCE · 0.86</Tag>
            </div>
          </Panel>
        </div>

        {/* DIAGNOSE / PRESCRIBE / VALIDATE — 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {/* DIAGNOSE */}
          <Panel id="01" title="· DIAGNOSE" padded={false}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--line-strong)' }}>
              <h3 className="display" style={{ fontSize: 32, margin: 0 }}>What the data <em>says</em></h3>
            </div>
            <div style={{ padding: 20 }}>
              <Evidence label="FACE-TO-PATH" value="+1.8°" tone="warn" body="Drift from +0.4° (S044) to +1.8° (S047)." />
              <Evidence label="DISPERSION σ" value="+12%" tone="warn" body="Right-side variance grew. Left side stable." />
              <Evidence label="CARRY" value="+8.2y" tone="good" body="Trend is positive — speed isn't the problem." />
              <Evidence label="SPIN" value="2 412 rpm" tone="good" body="Ideal window. Don't touch." />
              <Evidence label="FATIGUE GATE" value="shot 60+" tone="warn" body="Faults concentrate after shot 60. Stamina factor." last />
            </div>
          </Panel>

          {/* PRESCRIBE */}
          <Panel id="02" title="· PRESCRIBE" padded={false} style={{ borderColor: 'var(--accent)' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--line-strong)', background: 'var(--surface-solid)' }}>
              <h3 className="display" style={{ fontSize: 32, margin: 0 }}>The <em>prescription</em></h3>
            </div>
            <div style={{ padding: 20 }}>
              <Drill num="01" title="Gate Drill" sets="3 × 6" target="Face within 0.8°" body="Two alignment sticks 4&quot; apart, club must pass through clean." />
              <Drill num="02" title="Closed-Face Rehearsal" sets="3 × 4" target="Strong grip + slow swing" body="Knuckles +1, half-speed. Ingrain face position." />
              <Drill num="03" title="Stamina Set" sets="2 × 12" target="Hold form past shot 60" body="Two clusters of 12 with 90s rest. Track late-cluster σ." last />
            </div>
          </Panel>

          {/* VALIDATE */}
          <Panel id="03" title="· VALIDATE" padded={false}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--line-strong)' }}>
              <h3 className="display" style={{ fontSize: 32, margin: 0 }}>How we'll <em>know</em></h3>
            </div>
            <div style={{ padding: 20 }}>
              <Validate label="FACE-TO-PATH" current="+1.8°" target="≤ +0.8°" />
              <Validate label="σ DISPERSION" current="6.2y" target="≤ 5.0y" />
              <Validate label="LATE-CLUSTER σ" current="8.1y" target="≤ 5.5y" />
              <Validate label="GRADUATION" current="—" target="2 sessions in target" last />

              <div style={{ marginTop: 22, padding: 14, border: '1px dashed var(--accent)', background: 'var(--bg-2)' }}>
                <div className="micro" style={{ color: 'var(--accent)' }}>NEXT CHECK</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Session 048 · 05 May · Range</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>AUTOMATIC ON UPLOAD</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* CHARTS WIDE */}
        <Panel id="VIS" title="EVIDENCE · FACE-TO-PATH × DISPERSION · LAST 4 SESSIONS" style={{ marginBottom: 24 }}>
          <FaceTrend />
        </Panel>

        {/* COACH NOTES */}
        <Panel id="NOTES" title="AI COACH · LONG-FORM">
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 980, fontStyle: 'italic' }}>
            "You're swinging well. The carry numbers don't lie — there's speed in the bag. But the right-miss isn't a setup issue or a path issue; it's a face issue, and it shows up under fatigue. The Gate Drill is the cleanest input here. Do it before every range warm-up for ten days. Don't add reps. Don't add anything. The validation will be sharp: either σ tightens by session 049 or we revise. If we hit the target, we move to the next priority — which, by the way, is lag putting from 12—25 ft. That's where you're leaving strokes. We'll get there. One thing at a time."
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.18em', marginTop: 18 }}>· STRIKELAB COACH · MODEL v3.2 · CONFIDENCE 0.86</div>
        </Panel>
      </div>
    </div>
  );
};

const Evidence = ({ label, value, tone, body, last }) => (
  <div style={{ padding: '10px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>{label}</span>
      <span className="num" style={{ fontSize: 18, color: tone === 'warn' ? 'var(--warn)' : tone === 'bad' ? 'var(--bad)' : 'var(--accent)' }}>{value}</span>
    </div>
    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{body}</div>
  </div>
);

const Drill = ({ num, title, sets, target, body, last }) => (
  <div style={{ padding: '12px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>{num}</span>
        <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
      </div>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{sets}</span>
    </div>
    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>{body}</div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', marginTop: 6, letterSpacing: '0.16em', textTransform: 'uppercase' }}>· TARGET · {target}</div>
  </div>
);

const Validate = ({ label, current, target, last }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 0', borderBottom: last ? 0 : '1px solid var(--line)', alignItems: 'baseline' }}>
    <span className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>{label}</span>
    <div style={{ display: 'flex', gap: 10 }}>
      <span className="num" style={{ fontSize: 14, color: 'var(--warn)' }}>{current}</span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>→</span>
      <span className="num" style={{ fontSize: 14, color: 'var(--accent)' }}>{target}</span>
    </div>
  </div>
);

const FaceTrend = () => {
  const sessions = [
    { id: 'S044', face: 0.4, sigma: 4.2 },
    { id: 'S045', face: 0.8, sigma: 4.6 },
    { id: 'S046', face: 1.4, sigma: 5.5 },
    { id: 'S047', face: 1.8, sigma: 6.2 },
  ];
  return (
    <svg width="100%" viewBox="0 0 100 32" style={{ height: 240 }}>
      <defs>
        <pattern id="cgrid" width="5" height="4" patternUnits="userSpaceOnUse">
          <path d="M5 0 L0 0 0 4" fill="none" stroke="var(--line)" strokeWidth="0.1" />
        </pattern>
      </defs>
      <rect width="100" height="32" fill="url(#cgrid)" />
      {/* target band */}
      <rect x="0" y="20" width="100" height="6" fill="var(--accent)" opacity="0.06" />
      <text x="1" y="22" fill="var(--accent)" fontSize="1.6" fontFamily="Geist Mono" letterSpacing="0.16">TARGET ≤ 0.8°</text>

      {/* face line */}
      {(() => {
        const pts = sessions.map((s, i) => [10 + i * 27, 26 - s.face * 6]);
        const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
        return <>
          <path d={d} stroke="var(--warn)" strokeWidth="0.4" fill="none" />
          {pts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="0.7" fill="var(--warn)" />
              <text x={x} y={y - 1.5} fill="var(--warn)" fontSize="1.6" fontFamily="Geist Mono" textAnchor="middle">+{sessions[i].face}°</text>
            </g>
          ))}
        </>;
      })()}

      {/* sigma bars */}
      {sessions.map((s, i) => (
        <g key={s.id}>
          <rect x={6 + i * 27} y={32 - s.sigma * 0.7} width="8" height={s.sigma * 0.7} fill="var(--ink-4)" opacity="0.4" />
          <text x={10 + i * 27} y={31} fill="var(--ink-3)" fontSize="1.6" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.16">{s.id}</text>
        </g>
      ))}
      <text x="98" y="3" fill="var(--ink-3)" fontSize="1.6" fontFamily="Geist Mono" textAnchor="end">FACE °</text>
      <text x="98" y="6" fill="var(--ink-3)" fontSize="1.6" fontFamily="Geist Mono" textAnchor="end">σ YDS</text>
    </svg>
  );
};

window.CoachReport = CoachReport;
