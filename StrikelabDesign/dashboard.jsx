// Dashboard / Command Center.

const Dashboard = ({ mode = 'dark' }) => {
  return (
    <div className="sl-theme" data-mode={mode} style={{ width: 1440, background: 'var(--bg)', color: 'var(--ink)', minHeight: 900 }}>
      <style>{SL_THEME_CSS}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <SLLogo size={20} withWord wordSize={12} condensed />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>BAY 01</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>● LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-strong)' }}>
          {['HQ','SESSIONS','REPORTS','PLAN','BAG','DATA'].map((x, i) => (
            <span key={x} className="mono" style={{ fontSize: 10, padding: '8px 18px', borderRight: i < 5 ? '1px solid var(--line-strong)' : 0, letterSpacing: '0.2em', cursor: 'pointer', background: i === 0 ? 'var(--surface-solid)' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--ink-3)' }}>
              {x}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>03 · MAY · 2026</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }} className="mono">DH</div>
        </div>
      </div>

      <div style={{ padding: '32px 32px 56px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* LEFT RAIL — player profile + dial-in */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel id="P 01" title="PLAYER" padded={false}>
            <div style={{ padding: 16 }}>
              <div className="micro">PLAYER</div>
              <div className="display" style={{ fontSize: 28, marginTop: 6 }}>D. Hassan</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>HCP 7.2 · TARGET 4.0</div>
            </div>
            <hr className="rule" />
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Stat label="DIAL-IN" value="74" unit="/100" delta="+6 / 14d" size="md" />
              <Stat label="STREAK" value="11" unit="DAYS" delta="active" />
            </div>
            <hr className="rule" />
            <div style={{ padding: 16 }}>
              <div className="micro" style={{ marginBottom: 10 }}>BREAKDOWN</div>
              {[['Tee', 78, '+2'], ['Approach', 71, '+5'], ['Short', 80, '+1'], ['Putt', 67, '-3']].map(([n, v, d]) => (
                <div key={n} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 36px 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-2)' }}>{n.toUpperCase()}</span>
                  <div style={{ height: 4, background: 'var(--bg-2)' }}>
                    <div style={{ width: `${v}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                  <span className="num" style={{ fontSize: 13 }}>{v}</span>
                  <span className="mono" style={{ fontSize: 10, color: d.startsWith('-') ? 'var(--bad)' : 'var(--accent)', textAlign: 'right' }}>{d}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel id="P 02" title="ACTIVE BAG">
            <div style={{ display: 'grid', gap: 10 }}>
              {[['DRV', 268, 1.49, true], ['3W', 248, 1.46, true], ['7i', 162, 1.39, true], ['PW', 125, 1.27, false], ['SW', 92, 1.21, true], ['PUT', 0, 0, false]].map(([c, y, s, ok]) => (
                <div key={c} style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', alignItems: 'center', gap: 12 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>{c}</span>
                  <span className="num" style={{ fontSize: 16 }}>{y || '—'}<span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>{y ? 'YDS' : ''}</span></span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? 'var(--accent)' : 'var(--warn)' }} />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* MAIN COLUMN */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* HERO MISSION */}
          <Panel id="MISSION" title="PRIORITY · TODAY" right={<span className="micro">EXPIRES 23:59</span>} padded={false}>
            <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Tag tone="warn">FAULT · OPEN FACE</Tag>
                  <Tag>DRIVER</Tag>
                  <Tag>WEEK 03</Tag>
                </div>
                <h2 className="display" style={{ fontSize: 56, margin: 0 }}>
                  Tighten the <em>face.</em>
                </h2>
                <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 14, maxWidth: 480 }}>
                  Dispersion grew 12% across your last three sessions. Face-to-path is opening 1.8°. Run the <span className="mono" style={{ color: 'var(--ink)' }}>Gate Drill</span> — 3 sets, 6 balls, alignment sticks 4" apart.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '12px 20px', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Begin Drill →
                  </button>
                  <button style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)', padding: '12px 20px', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    See Diagnosis
                  </button>
                </div>
              </div>

              {/* progress to target */}
              <div style={{ borderLeft: '1px solid var(--line-strong)', paddingLeft: 24 }}>
                <div className="micro" style={{ marginBottom: 14 }}>HCP · TRAJECTORY</div>
                <div style={{ position: 'relative', height: 4, background: 'var(--bg-2)', marginBottom: 4 }}>
                  <div style={{ position: 'absolute', left: 0, width: '38%', height: '100%', background: 'var(--accent)' }} />
                  {/* milestones */}
                  {[0, 38, 70, 100].map((p, i) => (
                    <div key={i} style={{ position: 'absolute', left: `${p}%`, top: -3, width: 1, height: 10, background: 'var(--ink-3)' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>NOW</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>M1</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>M2</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>TGT</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 24 }}>
                  <Stat label="CURRENT" value="7.2" size="md" />
                  <Stat label="PROJECTION" value="4.0" size="md" delta="DEC 2026" />
                </div>
              </div>
            </div>
          </Panel>

          {/* GRID OF METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Panel id="M 01" title="CARRY · DRV">
              <Stat label="LAST 50" value="284.6" unit="YDS" delta="+2.4" />
              <div style={{ marginTop: 14 }}><Spark data={[270,272,278,275,280,278,283,281,284,282,287,285]} w={220} h={42} fill /></div>
            </Panel>
            <Panel id="M 02" title="DISPERSION">
              <Stat label="σ · 7i · L+R" value="4.8" unit="YDS" delta="-0.6" deltaTone="good" />
              <div style={{ marginTop: 14 }}><Spark data={[7.1,6.8,7.0,6.4,5.9,5.6,5.3,5.1,5.0,4.9,4.7,4.8]} w={220} h={42} fill /></div>
            </Panel>
            <Panel id="M 03" title="GIR · LAST 5">
              <Stat label="GREENS REG" value="82" unit="%" delta="+2.4%" />
              <div style={{ marginTop: 14 }}><Spark data={[72,76,74,78,80,77,82,79,84,82,85,82]} w={220} h={42} fill /></div>
            </Panel>
            <Panel id="M 04" title="STROKES GAINED">
              <Stat label="vs HCP 7" value="+1.8" delta="approach driven" />
              <div style={{ marginTop: 14 }}><Spark data={[0.4,0.6,0.8,0.5,1.0,1.2,1.0,1.4,1.6,1.5,1.7,1.8]} w={220} h={42} fill /></div>
            </Panel>
          </div>

          {/* SESSIONS + PLAN */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Panel id="LOG" title="RECENT SESSIONS" right={<span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>SHOWING 5 / 38</span>}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 80px 1fr 60px 60px 60px 60px 16px', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line-strong)', marginBottom: 6 }}>
                {['#','DATE','SESSION','SHOTS','DIAL','Δ','SOURCE',''].map(h => <span key={h} className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>{h}</span>)}
              </div>
              {[
                ['047','MAY 02','Range — Driver focus', 88, 74, '+3', 'TRACKMAN', 'good'],
                ['046','APR 30','Course — Pinehurst No.2', 72, 71, '+1', 'GSPRO', 'good'],
                ['045','APR 28','Range — Iron compression', 120, 70, '+0', 'FORESIGHT', 'flat'],
                ['044','APR 26','Range — Wedge dial', 96, 73, '+4', 'CSV', 'good'],
                ['043','APR 24','Course — Bandon Trails', 78, 68, '-2', 'TOPGOLF', 'bad'],
              ].map(([id, d, t, sh, di, dl, src, tone]) => (
                <div key={id} style={{ display: 'grid', gridTemplateColumns: '50px 80px 1fr 60px 60px 60px 60px 16px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{id}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{d}</span>
                  <span style={{ fontSize: 14 }}>{t}</span>
                  <span className="num" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{sh}</span>
                  <span className="num" style={{ fontSize: 14 }}>{di}</span>
                  <span className="mono" style={{ fontSize: 11, color: tone === 'bad' ? 'var(--bad)' : tone === 'flat' ? 'var(--ink-3)' : 'var(--accent)' }}>{dl}</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>{src}</span>
                  <span style={{ color: 'var(--ink-3)' }}>›</span>
                </div>
              ))}
            </Panel>

            <Panel id="PLAN" title="TRAINING · WEEK 03 / 08">
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 6, background: i < 3 ? 'var(--accent)' : 'var(--bg-2)' }} />
                ))}
              </div>
              <h3 className="display" style={{ fontSize: 28, margin: 0 }}>Iron Compression</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 16px' }}>3 sessions remaining this block. Target: AOA -3.0° → -4.5°.</p>
              <hr className="rule" style={{ margin: '12px 0' }} />
              <div className="micro" style={{ marginBottom: 8 }}>NEXT BLOCK</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15 }}>Driver Path Reset</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>05 · MAY</span>
              </div>
            </Panel>
          </div>

          {/* AI COACH STRIP */}
          <Panel id="COACH" title="AI · ALWAYS THERE" padded={false}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 18 }}>
              <div style={{ width: 36, height: 36, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <SLLogo size={18} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }} className="serif">"Three things would move your handicap fastest right now: face control with the driver, AOA on mid-irons, and lag putting from 12–25 ft. Want me to build a 4-week block?"</span>
              <button style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '10px 18px', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Build Block →
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
