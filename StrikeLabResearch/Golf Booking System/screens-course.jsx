// screens-course.jsx — Course detail screen
// Full-bleed hero → live conditions panel → today's window preview → signature hole → CTA

function ConditionsPanel({ course, lang, t }) {
  const c = course.conditions;
  const cur = course.hourly?.find(h => h.h === 14) || {};
  const items = [
    {
      label: t('greens'),
      value: c.greenSpeed.toFixed(1),
      sub: 'Stimp',
      kind: 'green',
    },
    {
      label: t('fairway'),
      value: t(c.fairway),
      sub: `${c.mowedHrsAgo}${t('hourAgo')}`,
      kind: 'mowed',
    },
    {
      label: lang==='no'?'Vind':'Wind',
      value: `${cur.w || 5}`,
      sub: `m/s · ${cur.dir||'SW'}`,
      kind: 'wind',
    },
    {
      label: lang==='no'?'Temp':'Temp',
      value: `${cur.t || 18}°`,
      sub: cur.cloud > 0.4 ? (lang==='no'?'Skyet':'Cloudy') : (lang==='no'?'Sol':'Sunny'),
      kind: cur.cloud > 0.4 ? 'cloud' : 'sun',
    },
  ];
  return (
    <div style={{
      background: TEE.cream, borderRadius: 18, padding: 16,
      border: `1px solid ${TEE.hairline2}`,
    }}>
      <div style={{
        fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8,
        textTransform: 'uppercase', color: TEE.graphite, marginBottom: 12,
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span>{t('conditions')}</span>
        <span style={{ display:'flex', alignItems:'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#3CC07A' }}/>
          {lang === 'no' ? 'Live · oppdatert nå' : 'Live · just now'}
        </span>
      </div>
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr', gap: 0,
      }}>
        {items.map((x, i) => (
          <div key={i} style={{
            padding: '12px 0',
            borderBottom: i < 2 ? `1px solid ${TEE.hairline2}` : 'none',
            paddingRight: i % 2 === 0 ? 14 : 0,
            paddingLeft:  i % 2 === 1 ? 14 : 0,
            borderLeft:   i % 2 === 1 ? `1px solid ${TEE.hairline2}` : 'none',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 4 }}>
              <Icon kind={x.kind} size={13} color={TEE.graphite} strokeWidth={1.3}/>
              <span style={{ fontFamily: FONT_UI, fontSize: 11, color: TEE.graphite, letterSpacing: 0.3, textTransform:'uppercase' }}>{x.label}</span>
            </div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 500,
              letterSpacing: -0.6, lineHeight: 1, color: TEE.ink,
            }}>{x.value}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: TEE.graphite, marginTop: 4, letterSpacing: 0 }}>{x.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniWindowStrip({ course, lang, t }) {
  // Compact horizontal day strip showing sun arc + best window
  const W = 340, H = 76;
  const hours = course.hourly;
  if (!hours?.length) return null;
  const x = (h) => 12 + ((h - 5) / 16) * (W - 24);
  // Arc path from sun intensity
  let arcPath = `M ${x(5)} ${H-12}`;
  hours.forEach(p => {
    const px = x(p.h);
    const py = (H - 14) - p.sun * (H - 30);
    arcPath += ` L ${px} ${py}`;
  });
  arcPath += ` L ${x(21)} ${H-12} Z`;

  return (
    <div style={{
      background: TEE.cream, borderRadius: 18, padding: '14px 12px 10px',
      border: `1px solid ${TEE.hairline2}`,
    }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding: '0 4px 8px',
      }}>
        <div style={{
          fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8,
          textTransform: 'uppercase', color: TEE.graphite,
        }}>{t('todaysWindow')}</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: TEE.graphite,
        }}>{course.sunrise} ↗ ↘ {course.sunset}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display:'block', width: '100%', height: H }}>
        <defs>
          <linearGradient id={`mw-${course.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TEE.sun} stopOpacity="0.4"/>
            <stop offset="1" stopColor={TEE.sun} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        {/* day arc */}
        <path d={arcPath} fill={`url(#mw-${course.id})`}/>
        {/* baseline ticks */}
        {[6, 9, 12, 15, 18, 21].map(h => (
          <g key={h}>
            <line x1={x(h)} y1={H-12} x2={x(h)} y2={H-9} stroke={TEE.hairline} strokeWidth="1"/>
            <text x={x(h)} y={H-2} fill={TEE.graphite} fontSize="9" fontFamily={FONT_MONO} textAnchor="middle" letterSpacing="0">{String(h).padStart(2,'0')}</text>
          </g>
        ))}
        {/* best window band */}
        <rect x={x(course.window.start)} y={6} width={x(course.window.end) - x(course.window.start)} height={H-22} fill={TEE.moss} fillOpacity="0.08" rx="4"/>
        <rect x={x(course.window.start)} y={6} width={x(course.window.end) - x(course.window.start)} height={H-22} fill="none" stroke={TEE.moss} strokeOpacity="0.4" strokeDasharray="2 3" rx="4"/>
        {/* tee time dots */}
        {course.teeTimes.filter(tt => tt.avail > 0).filter((_,i) => i % 3 === 0).map((tt,i) => {
          const px = x(tt.h + tt.m / 60);
          const py = H - 14 - (course.hourly.find(h=>h.h===tt.h)?.sun || 0.5) * (H - 30);
          return <circle key={i} cx={px} cy={py} r="1.6" fill={TEE.ink}/>;
        })}
        {/* "best now" marker */}
        <g transform={`translate(${x(course.window.start + 0.5)}, ${H - 14 - 0.85*(H-30)})`}>
          <circle r="4" fill={TEE.sun} stroke={TEE.ink} strokeWidth="0.8"/>
          <circle r="8" fill="none" stroke={TEE.sun} strokeOpacity="0.4" strokeWidth="1"/>
        </g>
      </svg>
    </div>
  );
}

function SignatureHole({ course, lang, t }) {
  return (
    <div style={{
      background: TEE.ink, color: TEE.cream, borderRadius: 18, overflow:'hidden',
      position: 'relative',
    }}>
      <div style={{ position:'relative', height: 140 }}>
        <HeroLandscape kind={course.hero} height={140}/>
        <div style={{
          position:'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(14,20,16,0) 30%, rgba(14,20,16,0.9))',
        }}/>
        <div style={{
          position:'absolute', left: 14, top: 12,
          fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8,
          textTransform: 'uppercase', color: 'rgba(251,250,246,0.75)',
        }}>{t('signature')}</div>
      </div>
      <div style={{ padding: '14px 16px 18px' }}>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500,
          letterSpacing: -0.2, lineHeight: 1.25,
          color: TEE.cream, fontStyle: 'italic',
        }}>{course.signature[lang]}</div>
      </div>
    </div>
  );
}

function CourseScreen({ courseId = 'miklagard', lang, setLang, onBack, onPickTime }) {
  const course = TEE_DATA.courses.find(c => c.id === courseId) || TEE_DATA.courses[2];
  const t = (k) => TEE_DATA.i18n[lang][k] || k;
  const cur = course.hourly?.find(h => h.h === 14) || {};

  return (
    <div style={{
      background: TEE.paper, color: TEE.ink, fontFamily: FONT_UI,
      minHeight: '100%', position:'relative', paddingBottom: 100,
    }}>
      {/* hero */}
      <div style={{ position:'relative' }}>
        <HeroLandscape kind={course.hero} height={300}/>
        <div style={{
          position:'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(14,20,16,0.18) 0%, rgba(14,20,16,0) 30%, rgba(244,240,232,0.4) 80%, rgba(244,240,232,1) 100%)',
        }}/>
        {/* top bar */}
        <div style={{
          position:'absolute', top: 54, left: 14, right: 14,
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <button onClick={onBack} style={{
            appearance:'none', border:'none', cursor:'pointer',
            width: 38, height: 38, borderRadius: 999,
            background: 'rgba(251,250,246,0.75)', backdropFilter: 'blur(10px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color: TEE.ink,
          }}>
            <Icon kind="arrow-left" size={17} strokeWidth={1.6}/>
          </button>
          <LangToggle lang={lang} setLang={setLang}/>
        </div>
      </div>

      {/* content pulled up */}
      <div style={{ position: 'relative', marginTop: -90, padding: '0 18px' }}>
        <div style={{
          display:'flex', alignItems:'center', gap: 8, marginBottom: 6,
          fontFamily: FONT_UI, fontSize: 11, letterSpacing: 0.6, textTransform:'uppercase',
          color: TEE.graphite,
        }}>
          <Icon kind="pin" size={12} color={TEE.graphite} strokeWidth={1.3}/>
          {course.location} · {course.region}
        </div>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 400,
          letterSpacing: -1, lineHeight: 1.0, margin: 0, color: TEE.ink,
        }}>{course.name}</h1>
        <div style={{
          display:'flex', alignItems:'center', gap: 12, marginTop: 10,
          fontFamily: FONT_MONO, fontSize: 11.5, color: TEE.ink2, letterSpacing: 0,
        }}>
          <span>Par {course.par}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{course.length} m</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{course.holes} {lang==='no'?'hull':'holes'}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap: 3 }}>
            <Icon kind="star" size={11} color={TEE.ink2}/>
            {course.rating} ({course.reviews})
          </span>
        </div>
        <p style={{
          fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 400,
          letterSpacing: -0.2, lineHeight: 1.35, margin: '16px 0 0',
          color: TEE.ink2, fontStyle: 'italic',
        }}>{course.blurb[lang]}</p>

        <div style={{ height: 22 }}/>
        <ConditionsPanel course={course} lang={lang} t={t}/>

        <div style={{ height: 14 }}/>
        <MiniWindowStrip course={course} lang={lang} t={t}/>

        <div style={{ height: 14 }}/>
        <SignatureHole course={course} lang={lang} t={t}/>

        <div style={{ height: 14 }}/>
        <div style={{
          background: TEE.cream, borderRadius: 18, padding: 16,
          border: `1px solid ${TEE.hairline2}`,
          display: 'flex', alignItems:'center', justifyContent: 'space-between', gap: 14,
        }}>
          <div>
            <div style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite }}>
              {lang==='no'?'Tilbud i kveld':'Twilight rate'}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, marginTop: 2, color: TEE.ink, letterSpacing: -0.3 }}>
              {fmtKr(course.priceOff)} <span style={{ color: TEE.graphite, fontSize: 13, fontFamily: FONT_UI }}>/ {t('perPlayer')}</span>
            </div>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite, textAlign:'right' }}>
            {lang==='no'?'Etter 17:00':'After 17:00'}
            <br/>
            {lang==='no'?'9 spillere igjen':'9 spots left'}
          </div>
        </div>
      </div>

      {/* sticky CTA */}
      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 18px 28px',
        background: 'linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.95) 30%)',
      }}>
        <button onClick={onPickTime} style={{
          width: '100%', height: 56, borderRadius: 999,
          background: TEE.ink, color: TEE.cream,
          fontFamily: FONT_UI, fontSize: 15, fontWeight: 500, letterSpacing: 0.1,
          border: 'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: '0 6px 0 22px',
          boxShadow: '0 12px 32px -10px rgba(14,20,16,0.4)',
        }}>
          <span>{t('seeAvailability')}</span>
          <span style={{
            width: 44, height: 44, borderRadius: 999, background: TEE.cream, color: TEE.ink,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon kind="arrow-right" size={17} strokeWidth={1.6}/>
          </span>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { CourseScreen, ConditionsPanel, MiniWindowStrip });
