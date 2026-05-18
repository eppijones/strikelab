// Day-of check-in card.

const CheckinCard = ({ lang, onBack, onStart }) => {
  const t = window.useT(lang);
  const c = window.COURSES[0];
  const slot = { time: '15:30' };
  const players = window.SAMPLE_PLAYERS.slice(0, 2);

  // Animated countdown clock fragment
  const minsToTee = 24;

  return (
    <div style={{ padding: '32px 40px 80px', display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="mono click" onClick={onBack} style={{ fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', letterSpacing: '0.16em' }}>HQ ›</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink)', letterSpacing: '0.16em' }}>{t('nav_checkin').toUpperCase()} · {c.name.toUpperCase()}</span>
        <span className="mono pulse" style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 'auto', letterSpacing: '0.18em' }}>● DAY OF · 14:08 CET</span>
      </div>

      {/* HERO COUNTDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', padding: 32, position: 'relative', overflow: 'hidden' }}>
          {/* Faint topo bg */}
          <svg viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18, pointerEvents: 'none' }}>
            {[0,1,2,3,4,5].map(i => (
              <path key={i} d={`M -10 ${30 + i * 30} Q 100 ${10 + i * 30} 220 ${40 + i * 30} T 410 ${20 + i * 30}`} stroke="var(--accent)" strokeWidth="0.4" fill="none" />
            ))}
          </svg>
          <div className="micro" style={{ position: 'relative' }}>{t('on_tee_in').toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12, position: 'relative' }}>
            <span className="num" style={{ fontSize: 168, fontWeight: 500, letterSpacing: '-0.06em', lineHeight: 0.85 }}>{minsToTee}</span>
            <span className="mono" style={{ fontSize: 14, color: 'var(--ink-3)', letterSpacing: '0.18em' }}>{t('min').toUpperCase()}</span>
          </div>
          <h2 className="display" style={{ fontSize: 38, margin: '8px 0 0', position: 'relative' }}>
            {lang === 'no' ? 'Du er klar.' : 'You are ready.'} <em>{lang === 'no' ? 'Hull 1 venter.' : 'The 1st awaits.'}</em>
          </h2>
          <p className="serif" style={{ fontSize: 15, color: 'var(--ink-2)', margin: '12px 0 0', maxWidth: 480, position: 'relative', lineHeight: 1.55 }}>
            "{lang === 'no'
              ? 'Banen er åpen, ballen din er komplett, og StrikeLab Caddie venter på telefonen din. Vis QR-koden ved 1. tee.'
              : 'Course is open, your group is complete, and StrikeLab Caddie is standing by on your phone. Show the QR at the 1st tee.'}"
          </p>
        </div>

        {/* QR + status */}
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-strong)' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>QR · 01</span>
            <span className="micro">{t('qr_label').toUpperCase()}</span>
          </div>
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FakeQR seed="LSB1530" />
          </div>
          <hr className="rule" />
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="micro">BOOKING</div>
              <div className="num" style={{ fontSize: 14, marginTop: 4 }}>SL-08471-LSB</div>
            </div>
            <div>
              <div className="micro">{lang === 'no' ? 'TID' : 'TIME'}</div>
              <div className="num" style={{ fontSize: 14, marginTop: 4, color: 'var(--accent)' }}>15:30 · TEE 1</div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS GRID — readouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--line-strong)', background: 'var(--surface-solid)' }}>
        <Readout label={t('course_open').toUpperCase()} value="●" sub={lang === 'no' ? 'GREENS · TEES · ALLE OK' : 'GREENS · TEES · ALL OK'} accent live />
        <Readout label={lang === 'no' ? 'BALLEN FORAN' : 'GROUP AHEAD'} value="14:50" sub={lang === 'no' ? 'PÅ HULL 2 · 7 MIN BAK' : 'ON HOLE 2 · 7 MIN BEHIND'} />
        <Readout label={lang === 'no' ? 'PACE' : 'PACE'} value="4:14" sub={lang === 'no' ? 'GJ.SNITT 18 HULL · I DAG' : 'AVG 18 HOLES · TODAY'} />
        <Readout label={lang === 'no' ? 'VÆR PÅ TEE' : 'WX AT TEE'} value="14°" sub="SW 4 M/S · 0 MM" last />
      </div>

      {/* GROUP STATUS */}
      <window.Panel id="P 03" title={t('group_status').toUpperCase()} right={<window.Tag tone="accent">{players.length}/4 {t('ready').toUpperCase()}</window.Tag>}>
        <div style={{ display: 'grid', gap: 0, border: '1px solid var(--line)' }}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '32px 32px 1fr 80px 90px 100px 90px', gap: 12, alignItems: 'center', padding: '14px 14px', borderBottom: i < players.length - 1 ? '1px solid var(--line)' : 0 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{String(i + 1).padStart(2, '0')}</span>
              <Avatar2 name={p.name} you={p.you} />
              <div>
                <div style={{ fontSize: 14 }}>{p.name} {p.you && <span className="mono" style={{ fontSize: 9, color: 'var(--accent)', marginLeft: 6, letterSpacing: '0.16em' }}>{lang === 'no' ? 'DEG' : 'YOU'}</span>}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{p.club}</div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>HCP {p.hcp}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em' }}>● DIAL {p.dialIn}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{lang === 'no' ? 'TEE 60 (GUL)' : 'TEE 60 (YEL)'}</span>
              <window.Tag tone={i === 0 ? 'accent' : 'default'}>{i === 0 ? t('ready').toUpperCase() : (lang === 'no' ? 'PÅ VEI' : 'EN ROUTE')}</window.Tag>
            </div>
          ))}
        </div>
      </window.Panel>

      {/* TIMELINE */}
      <window.Panel id="T 01" title={lang === 'no' ? 'TIDSLINJE — NÅ TIL 1. TEE' : 'TIMELINE — NOW TO 1ST TEE'}>
        <div style={{ position: 'relative', height: 70 }}>
          {/* axis */}
          <div style={{ position: 'absolute', top: 38, left: 0, right: 0, height: 1, background: 'var(--line-strong)' }} />
          {[
            { p: 0,    label: 'NOW · 14:08',  sub: lang === 'no' ? 'Du er på vei' : "You're en route", done: true },
            { p: 0.18, label: '14:35 · ARRIVE', sub: lang === 'no' ? 'Klubbhus + parkering' : 'Clubhouse + parking', done: false, soon: true },
            { p: 0.42, label: '14:50 · RANGE', sub: lang === 'no' ? '50 baller booket' : '50 balls booked', done: false },
            { p: 0.7,  label: '15:15 · CHECK IN', sub: lang === 'no' ? 'Vis QR · få scorekort' : 'Show QR · pick scorecard', done: false },
            { p: 1.0,  label: '15:30 · TEE OFF', sub: lang === 'no' ? 'Hull 1 · gul tee' : 'Hole 1 · yellow tee', done: false, accent: true },
          ].map((m, i) => (
            <div key={i} style={{ position: 'absolute', left: `calc(${m.p * 100}% - 0px)`, top: 0, transform: i === 4 ? 'translateX(-100%)' : i === 0 ? 'none' : 'translateX(-50%)', textAlign: i === 4 ? 'right' : i === 0 ? 'left' : 'center' }}>
              <div className="mono" style={{ fontSize: 10, color: m.accent ? 'var(--accent)' : 'var(--ink-3)', letterSpacing: '0.16em', whiteSpace: 'nowrap' }}>{m.label}</div>
              <div style={{ height: 14, position: 'relative', margin: '6px 0', display: 'flex', justifyContent: i === 4 ? 'flex-end' : i === 0 ? 'flex-start' : 'center' }}>
                <span style={{
                  width: m.accent ? 14 : 8, height: m.accent ? 14 : 8,
                  borderRadius: '50%',
                  background: m.done ? 'var(--accent)' : m.accent ? 'var(--accent)' : 'var(--bg)',
                  border: '1px solid', borderColor: m.accent ? 'var(--accent)' : 'var(--line-strong)',
                }} />
              </div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </window.Panel>

      {/* CTA STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--accent)', color: 'var(--accent-ink)', padding: 22, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
             onClick={onStart}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', opacity: 0.6 }}>STRIKELAB CADDIE · WATCH + PHONE</div>
            <div className="display" style={{ fontSize: 28, marginTop: 6 }}>
              {lang === 'no' ? 'Start runde' : 'Start round'} →
            </div>
          </div>
          <window.TTLogo size={42} />
        </div>
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', padding: 16 }}>
          <div className="micro" style={{ marginBottom: 8 }}>{lang === 'no' ? 'PRE-RUNDE BAG' : 'PRE-ROUND BAG'}</div>
          <div className="serif" style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
            "{lang === 'no' ? '14 køller verifisert · ProV1, gul markør · Caddie låst.' : '14 clubs verified · ProV1, yellow mark · Caddie locked.'}"
          </div>
          <window.TTButton kind="ghost" full style={{ marginTop: 12 }}>{lang === 'no' ? 'Sjekk bag' : 'Check bag'}</window.TTButton>
        </div>
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', padding: 16 }}>
          <div className="micro" style={{ marginBottom: 8 }}>{lang === 'no' ? 'KLUBBHUS' : 'CLUBHOUSE'}</div>
          <div className="serif" style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
            "{lang === 'no' ? 'Lunsj reservert 19:50 · Terrasse · 2 personer.' : 'Lunch held 19:50 · Terrace · 2 covers.'}"
          </div>
          <window.TTButton kind="ghost" full style={{ marginTop: 12 }}>{lang === 'no' ? 'Endre bord' : 'Change table'}</window.TTButton>
        </div>
      </div>
    </div>
  );
};

const Readout = ({ label, value, sub, accent, live, last }) => (
  <div style={{ padding: 18, borderRight: last ? 0 : '1px solid var(--line-strong)', position: 'relative' }}>
    <div className="micro" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {live && <span className="pulse" style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} />}
      {label}
    </div>
    <div className="num" style={{ fontSize: 30, fontWeight: 500, color: accent ? 'var(--accent)' : 'var(--ink)', letterSpacing: '-0.03em', marginTop: 6 }}>{value}</div>
    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 }}>{sub}</div>
  </div>
);

const Avatar2 = ({ name, you }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('');
  return (
    <span style={{
      width: 32, height: 32, borderRadius: '50%',
      background: you ? 'var(--accent)' : 'var(--surface-2)',
      color: you ? 'var(--accent-ink)' : 'var(--ink)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.06em',
      border: '1px solid var(--line-strong)',
    }}>{initials}</span>
  );
};

// Procedurally drawn QR-ish glyph
const FakeQR = ({ seed = 'LSB' }) => {
  const SIZE = 25;
  const PX = 7;
  const cells = React.useMemo(() => {
    const seedNum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const out = [];
    for (let y = 0; y < SIZE; y++) {
      const row = [];
      for (let x = 0; x < SIZE; x++) {
        // finder squares in 3 corners
        const inFinder = (
          (x < 7 && y < 7) ||
          (x >= SIZE - 7 && y < 7) ||
          (x < 7 && y >= SIZE - 7)
        );
        let v = 0;
        if (inFinder) {
          const fx = x % SIZE >= SIZE - 7 ? x - (SIZE - 7) : x < 7 ? x : null;
          const fy = y >= SIZE - 7 ? y - (SIZE - 7) : y < 7 ? y : null;
          // big square ring + dot
          const ax = Math.min(x < 7 ? x : x - (SIZE - 7), 6);
          const ay = Math.min(y < 7 ? y : y - (SIZE - 7), 6);
          const onEdge = ax === 0 || ax === 6 || ay === 0 || ay === 6;
          const center = ax >= 2 && ax <= 4 && ay >= 2 && ay <= 4;
          v = (onEdge || center) ? 1 : 0;
        } else {
          v = Math.sin(x * 1.31 + y * 0.91 + seedNum) > 0.1 ? 1 : 0;
        }
        row.push(v);
      }
      out.push(row);
    }
    return out;
  }, [seed]);

  return (
    <div style={{ width: SIZE * PX + 24, height: SIZE * PX + 24, padding: 12, background: 'var(--ink)', display: 'inline-block', position: 'relative' }}>
      <svg width={SIZE * PX} height={SIZE * PX} style={{ display: 'block' }}>
        {cells.map((row, y) => row.map((v, x) => v ? (
          <rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill="var(--bg)" />
        ) : null))}
      </svg>
      <div style={{ position: 'absolute', inset: 12, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: PX * 5, height: PX * 5, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)' }}>
          <window.TTLogo size={PX * 3.4} />
        </span>
      </div>
    </div>
  );
};

window.CheckinCard = CheckinCard;
