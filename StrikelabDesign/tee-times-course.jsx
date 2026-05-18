// Course detail with conditions strip + tee time ladder.

const CourseDetail = ({ lang, courseId = 'losby', onBook, onBack }) => {
  const t = window.useT(lang);
  const c = window.COURSES.find(x => x.id === courseId) || window.COURSES[0];
  const [partOfDay, setPartOfDay] = React.useState('all');
  const [holes, setHoles] = React.useState(18);
  const [players, setPlayers] = React.useState(2);
  const [showFull, setShowFull] = React.useState(false);

  const slots = window.SCHEDULE.filter(s => {
    const m = s.minutes;
    if (!showFull && s.status === 'full') return false;
    if (partOfDay === 'morning' && m >= 12 * 60) return false;
    if (partOfDay === 'afternoon' && (m < 12 * 60 || m >= 17 * 60)) return false;
    if (partOfDay === 'evening' && m < 17 * 60) return false;
    return true;
  });

  // Day "ladder" — group by hour for visual rhythm
  const byHour = React.useMemo(() => {
    const map = {};
    slots.forEach(s => {
      const h = s.time.slice(0, 2);
      (map[h] = map[h] || []).push(s);
    });
    return map;
  }, [slots]);

  const dates = ['today','tomorrow','+2','+3','+4','+5','+6'];
  const dateLabels = {
    no: ['I dag · Fre 8','I morgen · Lør 9','Søn 10','Man 11','Tir 12','Ons 13','Tor 14'],
    en: ['Today · Fri 8','Tomorrow · Sat 9','Sun 10','Mon 11','Tue 12','Wed 13','Thu 14'],
  };
  const [date, setDate] = React.useState('today');

  return (
    <div style={{ padding: '32px 40px 80px', display: 'grid', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="mono click" onClick={onBack} style={{ fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', letterSpacing: '0.16em' }}>{t('hq')} ›</span>
        <span className="mono click" onClick={onBack} style={{ fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', letterSpacing: '0.16em' }}>{t('tee_times').toUpperCase()} ›</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink)', letterSpacing: '0.16em' }}>{c.name.toUpperCase()}</span>
      </div>

      {/* HERO BLOCK */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Left: name + meta */}
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', padding: 28 }}>
          <div className="micro">{c.region.toUpperCase()} · {c.distanceKm} KM</div>
          <h1 className="display" style={{ fontSize: 80, margin: '12px 0 0' }}>
            {c.name.split(' ').slice(0, -1).join(' ')} <em>{c.name.split(' ').slice(-1)}</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 14, maxWidth: 560 }}>{c.blurb}.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <window.Tag tone="accent">{lang === 'no' ? 'POSTBAR' : 'HCP-POSTABLE'}</window.Tag>
            <window.Tag>PAR {c.par}</window.Tag>
            <window.Tag>{c.length}M</window.Tag>
            <window.Tag>SLOPE {c.slope}</window.Tag>
            <window.Tag>CR {c.rating}</window.Tag>
          </div>
        </div>

        {/* Right: conditions */}
        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-strong)' }}>
            <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10 }}>READOUT 01</span>
            <span className="micro">{lang === 'no' ? 'FORHOLD · NÅ' : 'CONDITIONS · NOW'}</span>
            <span className="mono pulse" style={{ fontSize: 10, color: 'var(--accent)' }}>● LIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <CondCell label={t('temp')} value={`${c.weather.tempC}°`} sub={lang === 'no' ? t(c.weather.code) : t(c.weather.code)} />
            <CondCell label={t('wind')} value={`${c.weather.windMs}`} sub={`${c.weather.windDir} M/S`} tone={c.weather.windMs >= 6 ? 'warn' : 'default'} />
            <CondCell label={t('rain')} value={c.weather.rainMm > 0 ? `${c.weather.rainMm}` : '0'} sub={lang === 'no' ? 'MM/T' : 'MM/H'} tone={c.weather.rainMm >= 1 ? 'warn' : 'default'} />
            <CondCell label={t('firm')} value={`${c.firm}`} sub={c.firm >= 80 ? (lang === 'no' ? 'FAST' : 'FIRM') : (lang === 'no' ? 'MYK' : 'SOFT')} tone={c.firm >= 80 ? 'accent' : 'default'} />
          </div>
          <hr className="rule" />
          {/* Sun arc */}
          <div style={{ padding: 14 }}>
            <SunArc sunrise={c.weather.sunrise} sunset={c.weather.sunset} now="14:08" lang={lang} />
          </div>
          <hr className="rule" />
          <div style={{ padding: 14 }}>
            <p className="serif" style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
              "{c.note}"
            </p>
          </div>
        </div>
      </div>

      {/* Filter strip — date + part of day + players + holes */}
      <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)' }}>
        {/* Date row */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: '1px solid var(--line-strong)' }}>
          <div style={{ padding: 14, borderRight: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center' }}>
            <span className="micro">{t('date')}</span>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {dates.map((d, i) => (
              <button key={d} onClick={() => setDate(d)} className="mono click" style={{
                background: d === date ? 'var(--accent)' : 'transparent',
                color: d === date ? 'var(--accent-ink)' : 'var(--ink-2)',
                border: 0, borderRight: i < dates.length - 1 ? '1px solid var(--line-strong)' : 0,
                padding: '12px 22px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
                whiteSpace: 'nowrap', flex: 1, textAlign: 'center',
              }}>{dateLabels[lang][i]}</button>
            ))}
          </div>
        </div>
        {/* Filter row */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 0.8fr 0.8fr 1fr', borderBottom: '1px solid var(--line-strong)' }}>
          <div style={{ padding: 14, borderRight: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center' }}>
            <span className="micro">{lang === 'no' ? 'FILTER' : 'FILTER'}</span>
          </div>
          <FilterTabs
            value={partOfDay} onChange={setPartOfDay}
            options={[
              ['all', lang === 'no' ? 'Hele dagen' : 'All day'],
              ['morning', lang === 'no' ? 'Morgen' : 'Morning'],
              ['afternoon', lang === 'no' ? 'Ettermiddag' : 'Afternoon'],
              ['evening', lang === 'no' ? 'Kveld' : 'Evening'],
            ]}
          />
          <div style={{ padding: '10px 14px', borderRight: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="micro">{t('players')}</span>
            <CountStepper value={players} onChange={setPlayers} max={4} />
          </div>
          <div style={{ padding: '10px 14px', borderRight: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="micro">{t('holes')}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[9, 18].map(h => (
                <button key={h} onClick={() => setHoles(h)} className="mono click" style={{
                  background: holes === h ? 'var(--ink)' : 'transparent',
                  color: holes === h ? 'var(--bg)' : 'var(--ink-3)',
                  border: '1px solid', borderColor: holes === h ? 'var(--ink)' : 'var(--line-strong)',
                  padding: '4px 10px', fontSize: 10, cursor: 'pointer',
                }}>{h}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRight: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="micro">{lang === 'no' ? 'SHOW FULLE' : 'SHOW FULL'}</span>
            <Toggle value={showFull} onChange={setShowFull} />
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="micro">{lang === 'no' ? 'SORTERING' : 'SORT'}</span>
            <span className="mono click" style={{ fontSize: 11, color: 'var(--ink), cursor: pointer' }}>
              {lang === 'no' ? 'TID ↑' : 'TIME ↑'}
            </span>
          </div>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: '1px solid var(--line-strong)' }}>
        {[
          [t('open_slots'), slots.filter(s => s.status === 'free').length, '/' + window.SCHEDULE.length],
          [lang === 'no' ? 'BILLIGSTE' : 'CHEAPEST', '490', 'KR'],
          [lang === 'no' ? 'PEAK' : 'PEAK', '14:00–17:00', '890 KR'],
          [t('twilight').toUpperCase(), '18:30+', '490 KR'],
          [lang === 'no' ? 'SISTE START' : 'LAST OFF', '19:50', ''],
        ].map(([l, v, u], i) => (
          <div key={l} style={{ padding: 16, borderRight: i < 4 ? '1px solid var(--line-strong)' : 0 }}>
            <div className="micro">{l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
              <span className="num" style={{ fontSize: 24, fontWeight: 500 }}>{v}</span>
              <span className="micro" style={{ fontSize: 9 }}>{u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* LADDER */}
      <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-strong)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>SCHEDULE 01</span>
            <span className="micro">{lang === 'no' ? 'STARTTIDER · 10-MIN INTERVALL' : 'TEE TIMES · 10-MIN INTERVALS'}</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <Legend dot="var(--ink-3)" label={t('free')} />
            <Legend dot="var(--accent)" label={t('partial')} />
            <Legend dot="var(--warn)" label={t('hold')} />
            <Legend dot="var(--ink-4)" label={t('full')} />
            <Legend dot="var(--info)" label={t('members_only')} />
          </div>
        </div>
        {/* Column header */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 80px 100px 1fr 90px 80px 110px', padding: '10px 14px', borderBottom: '1px solid var(--line-strong)', alignItems: 'center', gap: 12 }}>
          {[lang === 'no' ? 'TID' : 'TIME', lang === 'no' ? 'STATUS' : 'STATUS', lang === 'no' ? 'BALL' : 'GROUP', lang === 'no' ? 'TYPE' : 'TYPE', lang === 'no' ? 'NOTAT' : 'NOTE', lang === 'no' ? 'POSTBAR' : 'POSTABLE', lang === 'no' ? 'PRIS' : 'PRICE', ''].map((h, i) => (
            <span key={i} className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {/* Rows grouped by hour with subtle hour-header rule */}
        {Object.entries(byHour).map(([hh, rows]) => (
          <React.Fragment key={hh}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.2em' }}>{hh}:00 — {hh}:50</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 12px' }} />
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{rows.length} SLOTS</span>
            </div>
            {rows.map(s => <TeeRow key={s.time} s={s} lang={lang} onBook={() => onBook(s)} players={players} />)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const CondCell = ({ label, value, sub, tone = 'default' }) => {
  const color = tone === 'warn' ? 'var(--warn)' : tone === 'accent' ? 'var(--accent)' : 'var(--ink)';
  return (
    <div style={{ padding: 14, borderRight: '1px solid var(--line-strong)' }}>
      <div className="micro">{label}</div>
      <div className="num" style={{ fontSize: 30, fontWeight: 500, color, letterSpacing: '-0.04em', marginTop: 4 }}>{value}</div>
      <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>{sub}</div>
    </div>
  );
};

const SunArc = ({ sunrise, sunset, now, lang }) => {
  // Compute fraction of daylight passed
  const toMin = (s) => parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(3, 5));
  const sr = toMin(sunrise), ss = toMin(sunset), n = toMin(now);
  const frac = Math.max(0, Math.min(1, (n - sr) / (ss - sr)));
  return (
    <div>
      <div className="micro" style={{ marginBottom: 8 }}>{lang === 'no' ? 'DAGSLYS · SOL/SKUMRING' : 'DAYLIGHT · SUN ARC'}</div>
      <svg width="100%" viewBox="0 0 200 60" style={{ display: 'block', height: 56 }}>
        <path d="M 10 50 Q 100 -10 190 50" stroke="var(--line-strong)" strokeWidth="0.6" fill="none" />
        {/* twilight bands */}
        {[0.0, 0.06, 0.94, 1.0].map((f, i) => null)}
        {/* sun position */}
        {(() => {
          // approximate position on bezier via t
          const t = frac;
          const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190;
          const y = (1 - t) * (1 - t) * 50 + 2 * (1 - t) * t * (-10) + t * t * 50;
          return (
            <g>
              <line x1={x} x2={x} y1="0" y2="60" stroke="var(--accent)" strokeWidth="0.4" strokeDasharray="1 2" opacity="0.5" />
              <circle cx={x} cy={y} r="3.5" fill="var(--accent)" />
              <circle cx={x} cy={y} r="1.4" fill="var(--accent-ink)" />
            </g>
          );
        })()}
        {/* sunrise sunset markers */}
        <line x1="10" x2="10" y1="48" y2="56" stroke="var(--ink-3)" strokeWidth="0.4" />
        <line x1="190" x2="190" y1="48" y2="56" stroke="var(--ink-3)" strokeWidth="0.4" />
        <line x1="100" x2="100" y1="-8" y2="0" stroke="var(--ink-4)" strokeWidth="0.3" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <Mini label={lang === 'no' ? 'OPP' : 'RISE'} value={sunrise} />
        <Mini label={lang === 'no' ? 'NÅ' : 'NOW'} value={now} accent />
        <Mini label={lang === 'no' ? 'NED' : 'SET'} value={sunset} align="right" />
      </div>
    </div>
  );
};
const Mini = ({ label, value, accent, align = 'left' }) => (
  <div style={{ textAlign: align }}>
    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.2em' }}>{label}</div>
    <div className="num" style={{ fontSize: 13, color: accent ? 'var(--accent)' : 'var(--ink)' }}>{value}</div>
  </div>
);

const FilterTabs = ({ value, onChange, options }) => (
  <div style={{ display: 'flex', borderRight: '1px solid var(--line-strong)' }}>
    {options.map(([k, l], i) => (
      <button key={k} onClick={() => onChange(k)} className="mono click" style={{
        background: k === value ? 'var(--surface-2)' : 'transparent',
        color: k === value ? 'var(--ink)' : 'var(--ink-3)',
        border: 0, borderRight: i < options.length - 1 ? '1px solid var(--line-strong)' : 0,
        padding: '12px 18px', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
        flex: 1,
      }}>{l}</button>
    ))}
  </div>
);

const CountStepper = ({ value, onChange, max = 4, min = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <button onClick={() => onChange(Math.max(min, value - 1))} className="mono click" style={{ background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-2)', width: 22, height: 22, cursor: 'pointer' }}>−</button>
    <span className="num" style={{ fontSize: 16, fontWeight: 500, minWidth: 14, textAlign: 'center' }}>{value}</span>
    <button onClick={() => onChange(Math.min(max, value + 1))} className="mono click" style={{ background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-2)', width: 22, height: 22, cursor: 'pointer' }}>+</button>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)} className="click" style={{
    width: 36, height: 18, padding: 0, background: value ? 'var(--accent)' : 'var(--bg-2)',
    border: '1px solid var(--line-strong)', position: 'relative', cursor: 'pointer',
  }}>
    <span style={{ position: 'absolute', top: 1, left: value ? 19 : 1, width: 14, height: 14, background: value ? 'var(--accent-ink)' : 'var(--ink-3)', transition: 'left 120ms ease' }} />
  </button>
);

const Legend = ({ dot, label }) => (
  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 6, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
    <span style={{ width: 8, height: 8, background: dot, borderRadius: '50%', display: 'inline-block' }} />
    {label}
  </span>
);

// ---- The TEE ROW — replaces the "colored grid square + legend" pattern ----
const TeeRow = ({ s, lang, onBook, players }) => {
  const t = window.useT(lang);
  const statusColor = {
    free: 'var(--ink-3)', partial: 'var(--accent)', hold: 'var(--warn)', full: 'var(--ink-4)', members: 'var(--info)',
  }[s.status];
  const statusLabel = {
    free: t('free'), partial: t('partial'), hold: t('hold'), full: t('full'), members: t('members_only'),
  }[s.status];

  // Group composition viz — 4 small slots
  const groupViz = (
    <div style={{ display: 'flex', gap: 4 }}>
      {[0,1,2,3].map(i => (
        <span key={i} style={{
          width: 14, height: 14, border: '1px solid var(--line-strong)',
          background: i < s.filled ? 'var(--ink-2)' : 'transparent',
          display: 'inline-block',
        }} />
      ))}
    </div>
  );

  const isPeak = s.minutes >= 14 * 60 && s.minutes <= 17 * 60;
  const isTwilight = s.minutes >= 18 * 60 + 30;
  const note = isPeak ? (lang === 'no' ? 'Peak — sol bak' : 'Peak — sun behind') :
               isTwilight ? (lang === 'no' ? 'Skumring — siste runde 9 hull' : 'Twilight — last 9 holes only') :
               s.status === 'members' ? (lang === 'no' ? 'Reservert klubbmedlemmer til 10:30' : 'Reserved for members until 10:30') :
               '';

  const disabled = s.status === 'full' || s.status === 'members' || s.status === 'hold';

  return (
    <div className="hover-line"
      onClick={() => !disabled && onBook()}
      style={{
        display: 'grid', gridTemplateColumns: '60px 80px 80px 100px 1fr 90px 80px 110px',
        padding: '14px 14px', borderBottom: '1px solid var(--line)', alignItems: 'center', gap: 12,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}>
      <span className="num" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>{s.time}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{statusLabel}</span>
      </span>
      <span>{groupViz}</span>
      <span>
        {isPeak && <window.Tag tone="warn">PEAK</window.Tag>}
        {isTwilight && <window.Tag tone="info">TWILIGHT</window.Tag>}
        {!isPeak && !isTwilight && s.status !== 'members' && <window.Tag>{lang === 'no' ? 'STANDARD' : 'STANDARD'}</window.Tag>}
        {s.status === 'members' && <window.Tag tone="info">{t('members_only')}</window.Tag>}
      </span>
      <span style={{ fontSize: 13, color: 'var(--ink-2)' }} className="serif">{note ? `"${note}"` : ''}</span>
      <span className="mono" style={{ fontSize: 11, color: s.postable ? 'var(--accent)' : 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {s.postable ? (lang === 'no' ? '● JA' : '● YES') : (lang === 'no' ? '○ NEI' : '○ NO')}
      </span>
      <span className="num" style={{ fontSize: 16, fontWeight: 500 }}>{window.fmtKr(s.price)}</span>
      <span style={{ textAlign: 'right' }}>
        {!disabled
          ? <window.TTButton kind={isTwilight ? 'primary' : 'ghost'}>{lang === 'no' ? 'Velg' : 'Select'} →</window.TTButton>
          : <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.16em' }}>—</span>}
      </span>
    </div>
  );
};

window.CourseDetail = CourseDetail;
