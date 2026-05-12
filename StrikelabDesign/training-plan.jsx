// Training Plan & Calendar.

const TrainingPlan = ({ mode = 'dark' }) => {
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const weeks = [
    { id: 'W1', label: 'BLOCK 01 · DRIVER PATH', days: ['range','rest','range','rest','course','range','rest'] },
    { id: 'W2', label: 'BLOCK 01 · DRIVER PATH', days: ['rest','range','rest','range','rest','course','rest'] },
    { id: 'W3', label: 'BLOCK 01 · DRIVER PATH', days: ['range','range','rest','range','rest','validate','rest'], current: true },
    { id: 'W4', label: 'BLOCK 02 · IRON COMPRESSION', days: ['rest','range','rest','range','rest','course','rest'] },
    { id: 'W5', label: 'BLOCK 02 · IRON COMPRESSION', days: ['range','rest','range','rest','range','rest','course'] },
    { id: 'W6', label: 'BLOCK 03 · WEDGE DIAL', days: ['rest','range','rest','range','rest','validate','rest'] },
    { id: 'W7', label: 'BLOCK 03 · WEDGE DIAL', days: ['range','rest','range','rest','rest','course','rest'] },
    { id: 'W8', label: 'BLOCK 04 · TOURNAMENT PREP', days: ['rest','range','rest','range','rest','tournament','rest'] },
  ];
  const colorOf = (k) => k === 'rest' ? 'var(--bg-2)' : k === 'range' ? 'var(--accent)' : k === 'course' ? 'var(--ink-2)' : k === 'validate' ? 'var(--warn)' : k === 'tournament' ? 'var(--bad)' : 'var(--ink-3)';

  return (
    <div className="sl-theme" data-mode={mode} style={{ width: 1440, background: 'var(--bg)', color: 'var(--ink)', minHeight: 900 }}>
      <style>{SL_THEME_CSS}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SLLogo size={18} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>PLAN ›</span>
          <span className="mono" style={{ fontSize: 11 }}>BLOCK 01—04 · 8 WEEKS</span>
        </div>
        <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '8px 14px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>+ Schedule Tee Time</button>
      </div>

      <div style={{ padding: '40px 32px 56px' }}>
        <div className="micro">PLAN · ADAPTIVE · GENERATED 28 APR</div>
        <h1 className="display" style={{ fontSize: 88, margin: '12px 0 0' }}>
          Eight weeks <em>to four.</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 720, lineHeight: 1.5, marginTop: 14 }}>
          Built from your last 14 sessions. Four blocks, sequenced by leverage. The plan re-shapes itself when you finish a block early — or miss one.
        </p>

        {/* OVERVIEW STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line-strong)', marginTop: 36 }}>
          <BlockCard num="01" name="Driver Path Reset" weeks="WK 1—3" status="ACTIVE" pct={0.62} />
          <BlockCard num="02" name="Iron Compression" weeks="WK 4—5" status="QUEUED" pct={0} />
          <BlockCard num="03" name="Wedge Dial" weeks="WK 6—7" status="QUEUED" pct={0} />
          <BlockCard num="04" name="Tournament Prep" weeks="WK 8" status="QUEUED" pct={0} last />
        </div>

        {/* CALENDAR — 8 WEEK GRID */}
        <div style={{ marginTop: 32, border: '1px solid var(--line-strong)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--line-strong)' }}>
            <span className="micro">CALENDAR · WK 1—8 · MAY—JUN 2026</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <Legend color="var(--accent)" label="RANGE" />
              <Legend color="var(--ink-2)" label="COURSE" />
              <Legend color="var(--warn)" label="VALIDATE" />
              <Legend color="var(--bad)" label="EVENT" />
              <Legend color="var(--bg-2)" label="REST" outline />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr) 90px', borderBottom: '1px solid var(--line-strong)' }}>
            <div style={{ padding: '10px 14px', borderRight: '1px solid var(--line-strong)' }}><span className="micro">WEEK</span></div>
            {days.map(d => <div key={d} style={{ padding: '10px 14px', borderRight: '1px solid var(--line-strong)', textAlign: 'center' }}><span className="micro">{d}</span></div>)}
            <div style={{ padding: '10px 14px', textAlign: 'right' }}><span className="micro">LOAD</span></div>
          </div>
          {weeks.map((w, wi) => (
            <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr) 90px', borderBottom: wi < weeks.length - 1 ? '1px solid var(--line)' : 0, background: w.current ? 'var(--surface-solid)' : 'transparent' }}>
              <div style={{ padding: '14px', borderRight: '1px solid var(--line-strong)' }}>
                <div className="mono" style={{ fontSize: 11, color: w.current ? 'var(--accent)' : 'var(--ink)' }}>{w.id}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.14em', marginTop: 4 }}>{w.label}</div>
              </div>
              {w.days.map((k, di) => (
                <div key={di} style={{ padding: 10, borderRight: '1px solid var(--line)', minHeight: 78, position: 'relative' }}>
                  {k !== 'rest' && (
                    <div style={{ height: '100%', background: colorOf(k), opacity: k === 'range' ? 0.85 : 0.75, padding: 8, color: k === 'range' ? 'var(--accent-ink)' : 'var(--bg)' }}>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block' }}>
                        {k === 'range' ? 'RANGE' : k === 'course' ? 'COURSE' : k === 'validate' ? 'CHECK' : 'EVENT'}
                      </span>
                      <span className="num" style={{ fontSize: 11, opacity: 0.8 }}>
                        {k === 'range' ? '60 min' : k === 'course' ? '18' : k === 'validate' ? 'S+1' : '36'}
                      </span>
                    </div>
                  )}
                  {w.current && di === 1 && (
                    <div style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, border: '1px solid var(--accent)', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: 2, right: 2 }} className="mono" style={{ fontSize: 8, color: 'var(--accent)' }}>● TODAY</div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ padding: '14px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ width: 10, height: 4, background: i <= (w.days.filter(x=>x!=='rest').length) ? 'var(--accent)' : 'var(--bg-2)' }} />
                  ))}
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{w.days.filter(d => d !== 'rest').length}/7</span>
              </div>
            </div>
          ))}
        </div>

        {/* TODAY'S BLOCK */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 24 }}>
          <Panel id="TODAY" title="TODAY · TUE 04 MAY · RANGE BLOCK 60 MIN">
            <div style={{ display: 'grid', gap: 0 }}>
              {[
                ['00:00','Warm-up','Wedge ladder · 30/60/90/120y · 16 balls', 'WARM'],
                ['00:12','Block A','Gate Drill · 3×6 · alignment sticks 4&quot;', 'DRILL'],
                ['00:30','Block B','Closed-Face Rehearsal · 3×4 · half speed', 'DRILL'],
                ['00:42','Block C','Stamina Set · 2×12 · 90s rest · track late σ', 'STAMINA'],
                ['00:58','Cooldown','3 putts · 20-footers · lag focus', 'COOL'],
              ].map(([t, b, body, tag], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 130px 1fr 90px', gap: 12, padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--line)' : 0, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{b}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{body}</span>
                  <Tag tone={tag === 'DRILL' ? 'accent' : 'default'}>{tag}</Tag>
                </div>
              ))}
            </div>
            <button style={{ marginTop: 18, background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '12px 20px', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Start Session →
            </button>
          </Panel>

          <Panel id="UPCOMING" title="UPCOMING · TEE TIMES">
            <div style={{ display: 'grid', gap: 12 }}>
              <TeeTime course="Pinehurst No. 2" when="SAT 08 MAY · 09:30" with="John, Mike" focus="face control · iron play" />
              <TeeTime course="Bandon Trails" when="SUN 16 MAY · 14:00" with="Solo" focus="course management" />
              <TeeTime course="Whistling Straits" when="SAT 22 MAY · 08:15" with="Espen, Stian" focus="green reading · short game" />
            </div>
            <hr className="rule" style={{ margin: '18px 0 14px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Stat label="UPCOMING" value="3" size="sm" />
              <Stat label="PAST 90D" value="18" size="sm" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

const BlockCard = ({ num, name, weeks, status, pct, last }) => (
  <div style={{ padding: 20, borderRight: last ? 0 : '1px solid var(--line-strong)', background: status === 'ACTIVE' ? 'var(--surface-solid)' : 'transparent' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
      <span className="mono" style={{ fontSize: 11, color: status === 'ACTIVE' ? 'var(--accent)' : 'var(--ink-3)' }}>BLOCK {num}</span>
      <span className="mono" style={{ fontSize: 9, color: status === 'ACTIVE' ? 'var(--accent)' : 'var(--ink-3)', letterSpacing: '0.18em' }}>· {status}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>{name}</div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.18em' }}>{weeks}</div>
    <div style={{ height: 3, background: 'var(--bg-2)', marginTop: 16, position: 'relative' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: 'var(--accent)' }} />
    </div>
  </div>
);

const Legend = ({ color, label, outline }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 10, height: 10, background: outline ? 'transparent' : color, border: outline ? '1px solid var(--line-strong)' : 0 }} />
    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.18em' }}>{label}</span>
  </div>
);

const TeeTime = ({ course, when, with: w, focus }) => (
  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{course}</span>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{when}</span>
    </div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.16em' }}>· WITH {w.toUpperCase()}</div>
    <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, fontStyle: 'italic' }} className="serif">"focus: {focus}"</div>
  </div>
);

window.TrainingPlan = TrainingPlan;
