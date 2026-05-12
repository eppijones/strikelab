// Marketing site — hero, story, feature pillars, pricing, CTA.

const Marketing = ({ mode = 'dark' }) => {
  return (
    <div className="sl-theme" data-mode={mode} style={{ width: 1440, background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{SL_THEME_CSS}</style>

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 56px', borderBottom: '1px solid var(--line-strong)' }}>
        <SLLogo size={20} withWord wordSize={13} condensed />
        <nav style={{ display: 'flex', gap: 28 }}>
          {['SYSTEM','METHOD','BAY','PRICING','LOGIN'].map(x => (
            <span key={x} className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-2)', cursor: 'pointer' }}>{x}</span>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>BAY 01 — LIVE</span>
          <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '10px 16px', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Enter the Bay →
          </button>
        </div>
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', padding: '80px 56px 100px', borderBottom: '1px solid var(--line-strong)' }}>
        {/* hairline grid backdrop */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none', backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px)', backgroundSize: 'calc((100% - 112px) / 12) 100%', backgroundPosition: '56px 0', maskImage: 'linear-gradient(to bottom, #000 30%, transparent)' }} />

        {/* coordinate header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 56 }}>
          <span className="micro">N · 38°54'17" · W · 77°02'12"</span>
          <span className="micro">SESSION 04 · MAY 03 · 2026</span>
          <span className="micro">REC · 240 SHOTS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'flex-end' }}>
          <div>
            <div className="micro" style={{ marginBottom: 28 }}>· A PERFORMANCE INSTRUMENT FOR THE SERIOUS PLAYER</div>
            <h1 className="display" style={{ fontSize: 156, margin: 0, lineHeight: 0.92 }}>
              Get<br/>
              dialed <em>in.</em>
            </h1>
            <p style={{ fontSize: 20, color: 'var(--ink-2)', maxWidth: 540, lineHeight: 1.45, marginTop: 36 }}>
              StrikeLab fuses launch-monitor data with the way a session <em style={{ fontFamily: 'Instrument Serif' }}>actually felt</em> — then turns every range hour into a coaching report and an adaptive plan.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 40 }}>
              <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '14px 22px', fontFamily: 'Geist Mono', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Begin Session →
              </button>
              <button style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line-strong)', padding: '14px 22px', fontFamily: 'Geist Mono', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Watch the System
              </button>
            </div>
          </div>

          {/* live readout panel — anchors the right column */}
          <Panel id="LIVE 01" title="DRIVER · SHOT 47">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Stat label="CARRY" value="284.6" unit="YDS" delta="+2.4 vs last" />
              <Stat label="BALL SPEED" value="171.2" unit="MPH" delta="+1.1" />
              <Stat label="SMASH" value="1.49" unit="·" delta="optimal" />
              <Stat label="SPIN" value="2,412" unit="RPM" delta="-180" deltaTone="warn" />
            </div>
            <hr className="rule" style={{ margin: '20px 0' }} />
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--accent)' }}>● COACH</span> · Face-to-path is opening 1.8°. Run the
              <span style={{ color: 'var(--ink)' }}> Gate Drill</span> — 3 sets, 6 balls.
            </div>
          </Panel>
        </div>

        {/* shot tracer SVG decoration */}
        <svg width="100%" height="120" style={{ position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none', opacity: 0.6 }}>
          <path d="M0 100 Q 720 -80 1440 100" stroke="var(--accent)" strokeWidth="1" fill="none" strokeDasharray="2 4" />
          <circle cx="0" cy="100" r="3" fill="var(--accent)" />
          <circle cx="1440" cy="100" r="3" fill="var(--accent)" />
        </svg>
      </section>

      {/* TICKER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 56px', borderBottom: '1px solid var(--line-strong)', overflow: 'hidden' }}>
        {['TRACKMAN','FORESIGHT','TOPGOLF','GSPRO','UNEEKOR','RAPSODO','SKYTRAK','CSV'].map(x => (
          <span key={x} className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--ink-3)' }}>{x}</span>
        ))}
      </div>

      {/* METHOD */}
      <section style={{ padding: '100px 56px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, marginBottom: 64 }}>
          <div>
            <div className="micro">SECTION / 02 — METHOD</div>
            <h2 className="display" style={{ fontSize: 72, margin: '20px 0 0' }}>
              Diagnose.<br/>
              Prescribe.<br/>
              <em>Validate.</em>
            </h2>
          </div>
          <p style={{ fontSize: 20, color: 'var(--ink-2)', lineHeight: 1.5, alignSelf: 'flex-end' }}>
            Three stages, in order, every session. The system reads your data, names the failure mode, hands you a drill, then watches the next session to see if the drill worked. No vibes. No platitudes. Just the loop.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <PillarCard num="01" title="Diagnose" stat="12 metrics" body="Carry, smash, face-to-path, attack angle, spin axis, club-path delta — read across 7 sessions to find the weakest link, not the loudest." accent />
          <PillarCard num="02" title="Prescribe" stat="220 drills" body="Each fault is matched to a drill from the StrikeLab library. Drills come with shot counts, success criteria, and the metric that should move." />
          <PillarCard num="03" title="Validate" stat="A / B sessions" body="Next session, the same shots are flagged. Did dispersion tighten? Did spin drop? Drills graduate or repeat. Nothing is theoretical." />
        </div>
      </section>

      {/* TRIPTYCH */}
      <section style={{ padding: '100px 56px', borderBottom: '1px solid var(--line-strong)' }}>
        <div className="micro" style={{ marginBottom: 24 }}>SECTION / 03 — INSIDE THE BAY</div>
        <h2 className="display" style={{ fontSize: 88, margin: '0 0 56px', maxWidth: 1100 }}>
          Charts as <em>protagonists.</em><br/>Numbers as headlines.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16 }}>
          {/* dispersion preview */}
          <Panel id="VIS 01" title="DISPERSION · 7i · 50 SHOTS">
            <DispersionMini />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <Tag>Avg L 1.4y</Tag>
              <Tag tone="accent">σ 4.8y</Tag>
              <Tag>n 50</Tag>
            </div>
          </Panel>

          <Panel id="VIS 02" title="CARRY DELTA · 12 SESSIONS">
            <div style={{ paddingTop: 6 }}>
              <Stat label="DRIVER" value="+8.2" unit="YDS" />
              <div style={{ marginTop: 12 }}><Spark data={[260,258,262,259,266,263,267,266,268,266,270,268]} w={300} h={50} /></div>
            </div>
          </Panel>

          <Panel id="VIS 03" title="DIAL-IN INDEX">
            <Stat label="COMPOSITE SCORE" value="74" unit="/100" delta="+6 in 14 days" />
            <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
              {[['Tee', 78], ['Approach', 71], ['Short', 80], ['Putt', 67]].map(([n, v]) => (
                <div key={n} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 30px', gap: 10, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{n.toUpperCase()}</span>
                  <div style={{ height: 6, background: 'var(--bg-2)', position: 'relative' }}>
                    <div style={{ width: `${v}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '100px 56px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
          <div>
            <div className="micro">SECTION / 04 — PRICING</div>
            <h2 className="display" style={{ fontSize: 72, margin: '20px 0 0' }}>Three loadouts.</h2>
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>BILLED ANNUALLY · USD</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--line-strong)' }}>
          <PriceCol name="Range" tier="01" price="0" feature={['1 connector','5 sessions / mo','Manual logs','Basic dispersion']} cta="Start Free" />
          <PriceCol name="Bay" tier="02" price="24" feature={['Unlimited sessions','All connectors','AI Coach Reports','Adaptive training plan','Equipment loadout']} cta="Choose Bay" highlight />
          <PriceCol name="Tour" tier="03" price="62" feature={['Everything in Bay','Coach handoff (PDF + share)','Tournament prep mode','Priority compute','API + CSV export']} cta="Choose Tour" />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 56px', textAlign: 'center', position: 'relative' }}>
        <SLLogo size={32} />
        <h2 className="display" style={{ fontSize: 120, margin: '24px 0 32px' }}>
          The bay is <em>open.</em>
        </h2>
        <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 560, margin: '0 auto 40px' }}>
          Bring your last range CSV. We'll have a diagnosis ready before you finish your coffee.
        </p>
        <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '18px 32px', fontFamily: 'Geist Mono', fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Begin Session →
        </button>
      </section>

      {/* FOOTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 56px', borderTop: '1px solid var(--line-strong)' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>© STRIKELAB · 2026 · BAY 01</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>STATUS · ALL SYSTEMS GO</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>BUILT FOR THE SERIOUS PLAYER</span>
      </div>
    </div>
  );
};

const PillarCard = ({ num, title, stat, body, accent }) => (
  <div style={{ border: '1px solid var(--line-strong)', padding: 28, position: 'relative', minHeight: 280, background: accent ? 'var(--surface-solid)' : 'transparent' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 60 }}>
      <span className="mono" style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: '0.18em' }}>{num}</span>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.18em' }}>{stat.toUpperCase()}</span>
    </div>
    <h3 className="display" style={{ fontSize: 40, margin: 0 }}>{title}</h3>
    <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 16 }}>{body}</p>
  </div>
);

const PriceCol = ({ name, tier, price, feature, cta, highlight }) => (
  <div style={{ padding: 32, borderRight: '1px solid var(--line-strong)', background: highlight ? 'var(--surface-solid)' : 'transparent', position: 'relative', minHeight: 480 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
      <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.18em' }}>{tier}</span>
      {highlight && <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.18em' }}>· RECOMMENDED</span>}
    </div>
    <h3 className="display" style={{ fontSize: 56, margin: '0 0 6px' }}>{name}</h3>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 32 }}>
      <span className="num" style={{ fontSize: 56, fontWeight: 500 }}>${price}</span>
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>/ MO</span>
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
      {feature.map(f => (
        <li key={f} style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--ink-2)' }}>
          <span style={{ color: 'var(--accent)' }}>+</span>{f}
        </li>
      ))}
    </ul>
    <button style={{ marginTop: 32, width: '100%', background: highlight ? 'var(--accent)' : 'transparent', color: highlight ? 'var(--accent-ink)' : 'var(--ink)', border: highlight ? 0 : '1px solid var(--line-strong)', padding: '14px 0', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
      {cta}
    </button>
  </div>
);

// Mini dispersion plot
const DispersionMini = () => {
  const dots = React.useMemo(() => Array.from({ length: 50 }, (_, i) => {
    const r1 = Math.sin(i * 13.37) * 0.5 + 0.5;
    const r2 = Math.cos(i * 7.21) * 0.5 + 0.5;
    return { x: 50 + (r1 - 0.5) * 30, y: 50 + (r2 - 0.4) * 60 };
  }), []);
  return (
    <svg width="100%" viewBox="0 0 100 100" style={{ height: 220 }}>
      {/* fairway */}
      <path d="M 35 100 L 45 0 L 55 0 L 65 100 Z" fill="var(--surface-2)" opacity="0.6" />
      {/* grid */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1="0" x2="100" y1={p * 100} y2={p * 100} stroke="var(--line)" strokeDasharray="0.5 1" />
      ))}
      {/* center line */}
      <line x1="50" x2="50" y1="0" y2="100" stroke="var(--line-strong)" strokeDasharray="1 1" />
      {/* dispersion ellipse */}
      <ellipse cx="50" cy="40" rx="14" ry="22" fill="var(--accent)" opacity="0.08" stroke="var(--accent)" strokeWidth="0.4" />
      {/* shots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="0.9" fill="var(--accent)" opacity="0.8" />
      ))}
      {/* shooter */}
      <circle cx="50" cy="98" r="1.4" fill="var(--ink)" />
    </svg>
  );
};

window.Marketing = Marketing;
