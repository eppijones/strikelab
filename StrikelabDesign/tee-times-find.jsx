// Course finder — list with map preview, filters, conditions snapshot per course.

const FindCourse = ({ lang, onSelect, density = 'comfortable' }) => {
  const t = window.useT(lang);
  const [region, setRegion] = React.useState('all');
  const [holes, setHoles] = React.useState(18);
  const [date, setDate] = React.useState('today');

  const courses = window.COURSES;
  const dates = ['today','tomorrow','+2','+3','+4','+5','+6'];
  const dateLabels = {
    no: ['I dag','I morgen','Lør 09','Søn 10','Man 11','Tir 12','Ons 13'],
    en: ['Today','Tomorrow','Sat 09','Sun 10','Mon 11','Tue 12','Wed 13'],
  };
  const regions = [
    ['all', { no: 'Hele Norge', en: 'All of Norway' }],
    ['oslo', { no: 'Oslo', en: 'Oslo' }],
    ['akershus', { no: 'Akershus', en: 'Akershus' }],
    ['buskerud', { no: 'Buskerud', en: 'Buskerud' }],
    ['vestfold', { no: 'Vestfold', en: 'Vestfold' }],
    ['vestland', { no: 'Vestland', en: 'Vestland' }],
  ];

  return (
    <div style={{ padding: '40px 40px 80px', display: 'grid', gap: 24 }}>

      {/* HERO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'flex-end', borderBottom: '1px solid var(--line-strong)', paddingBottom: 32 }}>
        <div>
          <div className="micro" style={{ marginBottom: 14 }}>MODULE · 06 / TEE TIMES · LIVE</div>
          <h1 className="display" style={{ fontSize: 88, margin: 0 }}>
            {t('find_title_a')} <em>{t('find_title_b')}</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 16, maxWidth: 540 }}>
            {t('find_sub')}
          </p>
        </div>
        <div>
          <div className="micro" style={{ marginBottom: 12 }}>YOUR GAME · DIAL-IN 74 · HCP 7.2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: '1px solid var(--line-strong)' }}>
            <div style={{ padding: 14, borderRight: '1px solid var(--line-strong)' }}>
              <div className="micro">SLOTS NEAR YOU</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 500, marginTop: 6 }}>312</div>
            </div>
            <div style={{ padding: 14, borderRight: '1px solid var(--line-strong)' }}>
              <div className="micro">COURSES OPEN</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 500, marginTop: 6 }}>34<span className="micro" style={{ marginLeft: 4 }}>/142</span></div>
            </div>
            <div style={{ padding: 14 }}>
              <div className="micro">PEAK HOUR</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 500, marginTop: 6, color: 'var(--accent)' }}>15:00</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr 0.8fr auto', gap: 0, border: '1px solid var(--line-strong)' }}>
        <FilterCell label={t('search')} >
          <input
            placeholder={lang === 'no' ? 'Bane, by, region...' : 'Course, city, region...'}
            style={{ background: 'transparent', color: 'var(--ink)', border: 0, outline: 'none', fontFamily: 'Geist', fontSize: 16, width: '100%', padding: 0 }}
          />
        </FilterCell>
        <FilterCell label={t('region')}>
          <select value={region} onChange={e => setRegion(e.target.value)} style={selectStyle}>
            {regions.map(([k, l]) => <option key={k} value={k}>{l[lang]}</option>)}
          </select>
        </FilterCell>
        <FilterCell label={t('date')}>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {dates.map((d, i) => (
              <button key={d} onClick={() => setDate(d)} className="mono" style={{
                background: d === date ? 'var(--accent)' : 'transparent',
                color: d === date ? 'var(--accent-ink)' : 'var(--ink-3)',
                border: '1px solid', borderColor: d === date ? 'var(--accent)' : 'var(--line-strong)',
                padding: '4px 6px', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>{dateLabels[lang][i]}</button>
            ))}
          </div>
        </FilterCell>
        <FilterCell label={t('players')}>
          <Stepper value={2} />
        </FilterCell>
        <FilterCell label={t('holes')}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[9, 18].map(h => (
              <button key={h} onClick={() => setHoles(h)} className="mono" style={{
                background: holes === h ? 'var(--accent)' : 'transparent',
                color: holes === h ? 'var(--accent-ink)' : 'var(--ink-3)',
                border: '1px solid', borderColor: holes === h ? 'var(--accent)' : 'var(--line-strong)',
                padding: '5px 10px', fontSize: 10, cursor: 'pointer',
              }}>{h}</button>
            ))}
          </div>
        </FilterCell>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', borderLeft: '1px solid var(--line-strong)' }}>
          <window.TTButton kind="primary" size="lg" onClick={() => onSelect && onSelect('losby')}>
            {t('search_now')} →
          </window.TTButton>
        </div>
      </div>

      {/* RESULTS HEADER */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span className="micro">{t('results_for')}</span>
          <span className="display" style={{ fontSize: 24 }}>
            {lang === 'no' ? 'Fre 8 mai · 14:00–21:00' : 'Fri 8 May · 14:00–21:00'}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>· {t('showing')} 6 {t('of')} 34</span>
        </div>
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-strong)' }}>
          {[['list', lang === 'no' ? 'Liste' : 'List'], ['map', lang === 'no' ? 'Kart' : 'Map'], ['rec', lang === 'no' ? 'For deg' : 'For you']].map(([k, l], i) => (
            <span key={k} className="mono" style={{
              fontSize: 10, padding: '8px 16px', borderRight: i < 2 ? '1px solid var(--line-strong)' : 0,
              letterSpacing: '0.18em', cursor: 'pointer', textTransform: 'uppercase',
              background: i === 0 ? 'var(--surface-solid)' : 'transparent',
              color: i === 0 ? 'var(--ink)' : 'var(--ink-3)',
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* RESULTS LIST */}
      <div style={{ display: 'grid', gap: 12 }}>
        {courses.map((c, i) => (
          <CourseRow key={c.id} c={c} idx={i + 1} lang={lang} onClick={() => onSelect && onSelect(c.id)} />
        ))}
      </div>

      {/* COACH STRIP */}
      <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 18, marginTop: 8 }}>
        <div style={{ width: 36, height: 36, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <window.TTLogo size={18} />
        </div>
        <span className="serif" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
          {lang === 'no'
            ? '"Borre Golfbane spiller godt for ditt strikkemønster i dag — fast underlag, vind i ryggen på 13–17. 88 km, 13:20 ledig."'
            : '"Borre is set up for your shot pattern today — firm fairways, tailwind on 13–17. 88 km out, 13:20 open."'}
        </span>
        <window.TTButton kind="ghost" style={{ marginLeft: 'auto' }} onClick={() => onSelect && onSelect('borre')}>
          {lang === 'no' ? 'Vis Borre →' : 'See Borre →'}
        </window.TTButton>
      </div>
    </div>
  );
};

const selectStyle = {
  background: 'transparent', color: 'var(--ink)', border: 0, outline: 'none',
  fontFamily: 'Geist', fontSize: 16, width: '100%', padding: 0, appearance: 'none',
};

const FilterCell = ({ label, children }) => (
  <div style={{ padding: 14, borderRight: '1px solid var(--line-strong)', display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div className="micro">{label}</div>
    {children}
  </div>
);

const Stepper = ({ value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <button className="mono click" style={{ background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-2)', width: 20, height: 20, fontSize: 12, padding: 0, cursor: 'pointer' }}>−</button>
    <span className="num" style={{ fontSize: 18, fontWeight: 500 }}>{value}</span>
    <button className="mono click" style={{ background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-2)', width: 20, height: 20, fontSize: 12, padding: 0, cursor: 'pointer' }}>+</button>
  </div>
);

// ---- Course row (the card replacing GolfNow / GolfBox grids) ----
const CourseRow = ({ c, idx, lang, onClick }) => {
  const t = window.useT(lang);
  const wIcon = c.weather.code;
  return (
    <div className="click hover-line" onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: '32px 200px 1.2fr 1fr 1.1fr 0.9fr 1fr',
      gap: 0, alignItems: 'stretch',
      background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', borderRadius: 2,
      minHeight: 132,
    }}>
      {/* Index column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderRight: '1px solid var(--line-strong)' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{String(idx).padStart(2, '0')}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{c.tier === 'invited' ? t('members_only') : 'PUBLIC'}</span>
      </div>

      {/* Map preview / hero */}
      <CoursePreview c={c} />

      {/* Name & blurb */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--line-strong)' }}>
        <div>
          <div className="micro">{c.region.toUpperCase()} · {c.distanceKm} KM</div>
          <div className="display" style={{ fontSize: 26, marginTop: 4 }}>{c.name}</div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '8px 0 0', lineHeight: 1.4 }}>{c.blurb}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {c.tier === 'invited' && <window.Tag tone="warn">{t('members_only')}</window.Tag>}
          <window.Tag>PAR {c.par}</window.Tag>
          <window.Tag>{c.length}M</window.Tag>
          <window.Tag>SLOPE {c.slope}</window.Tag>
        </div>
      </div>

      {/* Conditions */}
      <div style={{ padding: 16, borderRight: '1px solid var(--line-strong)' }}>
        <div className="micro" style={{ marginBottom: 10 }}>{t('conditions').toUpperCase()}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <CondRow icon={wIcon === 'clear' ? 'sun' : wIcon === 'showers' ? 'drop' : 'cloud'} label={lang === 'no' ? t(c.weather.code) : t(c.weather.code)} value={`${c.weather.tempC}°C`} />
          <CondRow icon="wind" label={`${c.weather.windDir}`} value={`${c.weather.windMs} m/s`} tone={c.weather.windMs >= 6 ? 'warn' : 'default'} />
          <CondRow icon="drop" label={t('rain')} value={c.weather.rainMm > 0 ? `${c.weather.rainMm} mm` : '—'} tone={c.weather.rainMm >= 1 ? 'warn' : 'default'} />
        </div>
      </div>

      {/* Course form */}
      <div style={{ padding: 16, borderRight: '1px solid var(--line-strong)' }}>
        <div className="micro" style={{ marginBottom: 10 }}>{lang === 'no' ? 'BANENS FORM' : 'COURSE FORM'}</div>
        <FormBar label={t('firm')} value={c.firm} unit={`${c.firm}/100`} />
        <div style={{ marginTop: 10 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c.green.toUpperCase()}</div>
        </div>
        <p className="serif" style={{ fontSize: 12, color: 'var(--ink-2)', margin: '10px 0 0', lineHeight: 1.4 }}>"{c.note}"</p>
      </div>

      {/* Next available + price */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ width: '100%' }}>
          <div className="micro" style={{ textAlign: 'right' }}>{t('next_avail').toUpperCase()}</div>
          <div className="num" style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.04em', textAlign: 'right', marginTop: 2 }}>{c.next}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'right' }}>
            {c.openSlots} {t('slots_today').toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
          <span className="micro">FRA</span>
          <span className="num" style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent)' }}>{window.fmtKr(c.priceFrom)}</span>
        </div>
        <window.TTButton kind="primary" full size="md" onClick={(e) => { e.stopPropagation(); onClick(); }}>{t('view_times')} →</window.TTButton>
      </div>
    </div>
  );
};

const CondRow = ({ icon, label, value, tone = 'default' }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 8, alignItems: 'center' }}>
    <span style={{ color: tone === 'warn' ? 'var(--warn)' : 'var(--ink-3)' }}><window.Icon name={icon} /></span>
    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    <span className="num" style={{ fontSize: 13, color: tone === 'warn' ? 'var(--warn)' : 'var(--ink)' }}>{value}</span>
  </div>
);

const FormBar = ({ label, value, unit }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{label}</span>
      <span className="num" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{unit}</span>
    </div>
    <div style={{ position: 'relative', height: 4, background: 'var(--bg-2)' }}>
      <div style={{ width: `${value}%`, height: '100%', background: value >= 80 ? 'var(--accent)' : value >= 60 ? 'var(--ink-2)' : 'var(--warn)' }} />
    </div>
  </div>
);

// Diagrammatic course preview — abstract topo + hole layout
const CoursePreview = ({ c }) => {
  const seed = c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const tone = c.image === 'oslogk' ? 'oklch(0.30 0.04 145)' : 'oklch(0.22 0.05 130)';
  // Generate a fake routing polyline
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (seed + i * 1.7) % 6.283;
    const r = 30 + ((seed * (i + 1)) % 18);
    return [50 + Math.cos(a) * r * 0.6, 50 + Math.sin(a + i) * r * 0.6];
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <div style={{ position: 'relative', borderRight: '1px solid var(--line-strong)', overflow: 'hidden', background: tone }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* topo */}
        {[18, 30, 42, 54].map((r, i) => (
          <circle key={i} cx={30 + (seed % 30)} cy={45 + (seed % 20)} r={r} fill="none" stroke="var(--ink-4)" strokeWidth="0.2" opacity="0.6" />
        ))}
        {/* fairway band */}
        <path d={d} stroke="var(--accent)" strokeWidth="0.6" fill="none" opacity="0.85" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => i % 3 === 0 && <circle key={i} cx={x} cy={y} r="0.8" fill="var(--accent)" />)}
        {/* clubhouse */}
        <rect x={pts[0][0] - 1.5} y={pts[0][1] - 1.5} width="3" height="3" fill="var(--ink)" />
      </svg>
      <div style={{ position: 'absolute', top: 10, left: 10 }} className="micro">{c.id.toUpperCase()} / TOPO</div>
      <div style={{ position: 'absolute', bottom: 10, left: 10 }} className="micro">{c.holes} HOLES</div>
      <div style={{ position: 'absolute', bottom: 10, right: 10 }} className="micro">{c.distanceKm} KM</div>
    </div>
  );
};

window.FindCourse = FindCourse;
