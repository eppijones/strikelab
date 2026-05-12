// Session detail — dispersion, trend charts, session log.

const SessionDetail = ({ mode = 'dark' }) => {
  return (
    <div className="sl-theme" data-mode={mode} style={{ width: 1440, background: 'var(--bg)', color: 'var(--ink)', minHeight: 900 }}>
      <style>{SL_THEME_CSS}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SLLogo size={18} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>HQ ›</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>SESSIONS ›</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink)' }}>S-047</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Tag>TRACKMAN</Tag>
          <Tag>RANGE</Tag>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>02 MAY · 16:42 · 88 MIN</span>
        </div>
      </div>

      <div style={{ padding: '32px 32px 56px' }}>
        {/* TITLE BLOCK */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className="micro">SESSION 047 · 02 MAY 2026</div>
            <h1 className="display" style={{ fontSize: 80, margin: '12px 0 0' }}>
              Driver, <em>focused.</em>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 12, maxWidth: 700 }}>
              88 shots across 4 clubs. Spin came down. Face stayed open on the right miss — work to do.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-strong)' }}>
            {['SHOTS','TRENDS','LOG','RAW'].map((x, i) => (
              <span key={x} className="mono" style={{ fontSize: 10, padding: '8px 16px', borderRight: i < 3 ? '1px solid var(--line-strong)' : 0, letterSpacing: '0.18em', cursor: 'pointer', background: i === 0 ? 'var(--surface-solid)' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--ink-3)' }}>{x}</span>
            ))}
          </div>
        </div>

        {/* TOP STATS STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, border: '1px solid var(--line-strong)', marginBottom: 24 }}>
          {[
            ['SHOTS', '88', '·'],
            ['CARRY', '284.6', 'YDS'],
            ['BALL', '171.2', 'MPH'],
            ['SMASH', '1.49', '·'],
            ['SPIN', '2,412', 'RPM'],
            ['σ', '4.8', 'YDS'],
          ].map(([l, v, u], i) => (
            <div key={l} style={{ padding: 18, borderRight: i < 5 ? '1px solid var(--line-strong)' : 0 }}>
              <div className="micro">{l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                <span className="num" style={{ fontSize: 30, fontWeight: 500 }}>{v}</span>
                <span className="micro">{u}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TWO-UP: DISPERSION + TRACER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel id="VIS 01" title="DISPERSION · DRIVER · 50 SHOTS">
            <BigDispersion />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <Tag>AVG L 1.4y</Tag>
              <Tag tone="warn">MISS R 68%</Tag>
              <Tag tone="accent">σ 4.8y</Tag>
              <Tag>n 50</Tag>
            </div>
          </Panel>

          <Panel id="VIS 02" title="LAUNCH WINDOW">
            <LaunchWindow />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
              <Stat label="LAUNCH" value="11.8°" size="sm" />
              <Stat label="AOA" value="-2.4°" size="sm" deltaTone="warn" />
              <Stat label="SPIN-X" value="+2.1°" size="sm" deltaTone="warn" />
            </div>
          </Panel>
        </div>

        {/* TRENDS + LOG */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel id="VIS 03" title="CARRY · BY SHOT">
            <CarryByShot />
          </Panel>
          <Panel id="LOG" title="SESSION LOG · SUBJECTIVE">
            <div style={{ display: 'grid', gap: 12 }}>
              <LogRow t="16:44" label="ENERGY" v="7" max="10" body="Slept well. Coffee. Range warm." />
              <LogRow t="17:02" label="FEEL" v="6" max="10" body="Driver feels heavy. Slowing transition." />
              <LogRow t="17:18" label="INTENT" v="—" max="" body="Hold face square through impact. Forget distance." />
              <LogRow t="17:34" label="FEEL" v="8" max="10" body="Found a rhythm. Shoulders quieter." accent />
              <LogRow t="17:51" label="ENERGY" v="6" max="10" body="Tired. Last set, 6 balls only." />
            </div>
          </Panel>
        </div>

        {/* SHOT TABLE */}
        <Panel id="DATA" title="SHOT TABLE · 88 ROWS · SHOWING 8" right={<button style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)', padding: '6px 12px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Export CSV</button>}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 70px 70px 70px 70px 70px 70px 70px 1fr', gap: 0, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line-strong)' }}>
            {['#','CLUB','CARRY','BALL','SMASH','LAUNCH','SPIN','FACE','PATH','NOTE'].map(h => <span key={h} className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>{h}</span>)}
          </div>
          {[
            ['41','DRV',286.3,171.4,1.49,11.6,2380,1.8,0.4,'good'],
            ['42','DRV',271.8,168.9,1.45,12.2,2520,2.6,0.6,'thin'],
            ['43','DRV',289.0,172.1,1.50,11.4,2360,1.4,0.2,'striped'],
            ['44','DRV',284.2,170.8,1.48,11.7,2410,1.9,0.5,''],
            ['45','DRV',279.5,169.3,1.46,11.9,2440,2.1,0.7,''],
            ['46','DRV',288.7,171.9,1.49,11.5,2380,1.6,0.3,''],
            ['47','DRV',285.0,170.9,1.48,11.8,2412,1.8,0.4,''],
            ['48','DRV',290.4,172.6,1.50,11.3,2330,1.2,0.1,'best'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 60px 70px 70px 70px 70px 70px 70px 70px 1fr', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r[0]}</span>
              <span className="mono" style={{ fontSize: 11 }}>{r[1]}</span>
              <span className="num" style={{ fontSize: 12 }}>{r[2]}</span>
              <span className="num" style={{ fontSize: 12 }}>{r[3]}</span>
              <span className="num" style={{ fontSize: 12 }}>{r[4]}</span>
              <span className="num" style={{ fontSize: 12 }}>{r[5]}</span>
              <span className="num" style={{ fontSize: 12 }}>{r[6]}</span>
              <span className="num" style={{ fontSize: 12, color: r[7] > 2 ? 'var(--warn)' : 'var(--ink)' }}>{r[7]}</span>
              <span className="num" style={{ fontSize: 12 }}>{r[8]}</span>
              <span className="mono" style={{ fontSize: 10, color: r[9] === 'best' ? 'var(--accent)' : r[9] === 'thin' ? 'var(--warn)' : 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{r[9]}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
};

const BigDispersion = () => {
  const dots = React.useMemo(() => Array.from({ length: 50 }, (_, i) => {
    const r1 = Math.sin(i * 13.37) * 0.5 + 0.5;
    const r2 = Math.cos(i * 7.21) * 0.5 + 0.5;
    const r3 = Math.sin(i * 3.1) * 0.5 + 0.5;
    return {
      x: 50 + (r1 - 0.45) * 28 + (r3 - 0.5) * 8,
      y: 70 - (r2) * 50,
      best: r3 > 0.92,
    };
  }), []);
  return (
    <svg width="100%" viewBox="0 0 100 80" style={{ height: 360 }}>
      <defs>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="var(--line)" strokeWidth="0.15" />
        </pattern>
      </defs>
      <rect width="100" height="80" fill="url(#grid)" opacity="0.6" />
      {/* fairway */}
      <path d="M 38 80 L 46 0 L 54 0 L 62 80 Z" fill="var(--surface-2)" opacity="0.5" />
      {/* yardage rings */}
      {[40, 60, 80].map((p, i) => (
        <line key={i} x1="0" x2="100" y1={80 - p * 0.7} y2={80 - p * 0.7} stroke="var(--line-strong)" strokeDasharray="0.4 0.8" strokeWidth="0.15" />
      ))}
      {[200, 250, 300].map((y, i) => (
        <text key={i} x="2" y={80 - (y - 200) * 0.5} fill="var(--ink-3)" fontSize="2" fontFamily="Geist Mono" letterSpacing="0.2">{y}</text>
      ))}
      {/* center line */}
      <line x1="50" x2="50" y1="0" y2="80" stroke="var(--line-strong)" strokeDasharray="0.4 0.8" strokeWidth="0.2" />
      {/* dispersion ellipse */}
      <ellipse cx="51" cy="20" rx="9" ry="14" fill="var(--accent)" opacity="0.08" stroke="var(--accent)" strokeWidth="0.2" />
      {/* shots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.best ? 1.0 : 0.7} fill={d.best ? 'var(--accent)' : 'var(--ink-2)'} opacity={d.best ? 1 : 0.7} />
      ))}
      {/* tee */}
      <circle cx="50" cy="78" r="1" fill="var(--ink)" />
      {/* target */}
      <g transform="translate(50 12)">
        <circle r="2" stroke="var(--accent)" fill="none" strokeWidth="0.3" />
        <line x1="-3" x2="3" y1="0" y2="0" stroke="var(--accent)" strokeWidth="0.2" />
        <line x1="0" x2="0" y1="-3" y2="3" stroke="var(--accent)" strokeWidth="0.2" />
      </g>
      <text x="98" y="78" fill="var(--ink-3)" fontSize="2" fontFamily="Geist Mono" textAnchor="end" letterSpacing="0.2">YDS</text>
    </svg>
  );
};

const LaunchWindow = () => {
  // Box plot: launch angle vs spin
  return (
    <svg width="100%" viewBox="0 0 100 80" style={{ height: 360 }}>
      <defs>
        <pattern id="grid2" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--line)" strokeWidth="0.15" />
        </pattern>
      </defs>
      <rect width="100" height="80" fill="url(#grid2)" />
      {/* optimal zone */}
      <rect x="35" y="28" width="30" height="20" fill="var(--accent)" opacity="0.07" stroke="var(--accent)" strokeWidth="0.2" strokeDasharray="0.4 0.8" />
      <text x="36" y="33" fill="var(--accent)" fontSize="2.4" fontFamily="Geist Mono" letterSpacing="0.2">OPTIMAL</text>
      {/* dots */}
      {Array.from({ length: 50 }).map((_, i) => {
        const x = 30 + Math.sin(i * 5.1) * 22 + Math.cos(i * 1.3) * 6;
        const y = 30 + Math.cos(i * 2.7) * 18 + Math.sin(i * 0.8) * 4;
        const inZ = x > 35 && x < 65 && y > 28 && y < 48;
        return <circle key={i} cx={x} cy={y} r="0.7" fill={inZ ? 'var(--accent)' : 'var(--ink-2)'} opacity="0.8" />;
      })}
      {/* axes labels */}
      <text x="50" y="78" fill="var(--ink-3)" fontSize="2" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.2">LAUNCH ANGLE °</text>
      <text x="2" y="40" fill="var(--ink-3)" fontSize="2" fontFamily="Geist Mono" letterSpacing="0.2" transform="rotate(-90 2 40)">SPIN RPM</text>
    </svg>
  );
};

const CarryByShot = () => {
  const data = Array.from({ length: 50 }, (_, i) => 268 + Math.sin(i * 0.5) * 8 + (i / 50) * 6 + (Math.cos(i * 1.3) * 4));
  const max = Math.max(...data), min = Math.min(...data);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Stat label="MEAN" value="284.6" size="sm" />
        <Stat label="MAX" value="291.4" size="sm" />
        <Stat label="MIN" value="271.8" size="sm" />
        <Stat label="TREND" value="↑" size="sm" delta="+1.2y/shot" />
      </div>
      <svg width="100%" viewBox="0 0 100 40" style={{ height: 200, marginTop: 8 }}>
        <line x1="0" x2="100" y1="20" y2="20" stroke="var(--line-strong)" strokeDasharray="0.4 0.8" strokeWidth="0.15" />
        {data.map((v, i) => {
          const x = (i / 49) * 100;
          const y = 40 - ((v - min) / (max - min)) * 36 - 2;
          return <line key={i} x1={x} x2={x} y1="40" y2={y} stroke="var(--accent)" strokeWidth="1.2" opacity="0.85" strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
};

const LogRow = ({ t, label, v, max, body, accent }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '50px 80px 70px 1fr', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t}</span>
    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '0.18em' }}>{label}</span>
    <span className="mono" style={{ fontSize: 13, color: accent ? 'var(--accent)' : 'var(--ink)' }}>{v}{max && <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>/{max}</span>}</span>
    <span style={{ fontSize: 13, color: 'var(--ink-2)' }} className="serif">"{body}"</span>
  </div>
);

window.SessionDetail = SessionDetail;
