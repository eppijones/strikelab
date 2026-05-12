// screens-window.jsx — "The Window" tee time picker
// Vertical day-as-landscape: hour scale + sun/wind ribbon + tee time chips
// Plus "best windows" hero cards and a full slot list.

function WindowVisualization({ course, selectedIdx, onSelect, lang, t }) {
  // Vertical timeline. Y axis = hours 5..21 mapped over height
  const startH = 5, endH = 21;
  const H = (endH - startH) * 38; // 38px per hour
  const yFor = (h, m=0) => ((h + m/60) - startH) * 38;
  const ribbonW = 56;

  // Build a smooth sun-intensity gradient stop list
  const sunStops = course.hourly.map(p => ({ h: p.h, sun: p.sun, t: p.t, w: p.w, dir: p.dir }));

  // Wind path (vertical), x = wind speed scaled
  const maxWind = 14;
  const ribbonLeft = 16;
  const wpath = sunStops.map((p, i) => {
    const x = ribbonLeft + (p.w / maxWind) * (ribbonW - 8) + 4;
    const y = yFor(p.h);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Tee times grouped by hour, but render as chips with absolute Y position
  const slots = course.teeTimes;

  // Best window band
  const bandTop = yFor(course.window.start);
  const bandH = yFor(course.window.end) - bandTop;

  return (
    <div style={{ position: 'relative', padding: '0 0 0 0' }}>
      {/* Hour scale + ribbon + slots arranged in 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: `30px ${ribbonW}px 1fr`, gap: 0, position: 'relative' }}>

        {/* Best window band overlay */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: bandTop, height: bandH,
          background: 'linear-gradient(90deg, rgba(232,181,71,0.18) 0%, rgba(232,181,71,0.04) 100%)',
          border: `1px dashed ${TEE.sun}`, borderLeft: 'none', borderRight: 'none',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{
            position:'absolute', right: 8, top: 6,
            fontFamily: FONT_UI, fontSize: 9.5, letterSpacing: 0.6,
            textTransform:'uppercase', color: '#7A5F1A', fontWeight: 600,
          }}>
            ★ {t('perfectWindow')}
          </div>
        </div>

        {/* Hour ticks */}
        <div style={{ position: 'relative', height: H, fontFamily: FONT_MONO, fontSize: 10, color: TEE.graphite }}>
          {Array.from({length: endH-startH+1}, (_, i) => startH + i).map(h => (
            <div key={h} style={{
              position: 'absolute', top: yFor(h) - 6,
              left: 0, right: 4, textAlign: 'right',
              opacity: h % 3 === 0 ? 1 : 0.5,
              fontWeight: h % 3 === 0 ? 500 : 400,
            }}>{String(h).padStart(2,'0')}</div>
          ))}
        </div>

        {/* Atmospheric ribbon: sun gradient + wind line */}
        <div style={{ position: 'relative', height: H }}>
          <svg viewBox={`0 0 ${ribbonW} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: ribbonW, height: H }}>
            <defs>
              <linearGradient id={`sun-${course.id}`} x1="0" y1="0" x2="0" y2="1">
                {sunStops.map((p, i) => (
                  <stop key={i} offset={`${(i / (sunStops.length-1)) * 100}%`}
                        stopColor={`rgba(232,181,71,${0.05 + p.sun * 0.45})`}/>
                ))}
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={ribbonW} height={H} fill={`url(#sun-${course.id})`} rx="6"/>
            {/* hour gridlines */}
            {Array.from({length: endH-startH+1}, (_, i) => startH + i).map(h => (
              <line key={h} x1="0" y1={yFor(h)} x2={ribbonW} y2={yFor(h)} stroke={TEE.hairline} strokeOpacity="0.4"/>
            ))}
            {/* wind line */}
            <path d={wpath} fill="none" stroke={TEE.fjord} strokeWidth="1.4" strokeOpacity="0.7" strokeLinecap="round"/>
            {/* wind dots */}
            {sunStops.filter((_,i) => i % 2 === 0).map((p, i) => {
              const x = ribbonLeft + (p.w / maxWind) * (ribbonW - 8) + 4;
              return <circle key={i} cx={x} cy={yFor(p.h)} r="1.4" fill={TEE.fjord}/>;
            })}
            {/* sun arc marker (peak) */}
            {(() => {
              const peak = sunStops.reduce((a,b) => b.sun > a.sun ? b : a);
              return (
                <g transform={`translate(${ribbonW/2}, ${yFor(peak.h)})`}>
                  <circle r="6" fill={TEE.sun}/>
                  <circle r="10" fill="none" stroke={TEE.sun} strokeOpacity="0.4"/>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Tee time chips */}
        <div style={{ position: 'relative', height: H, paddingLeft: 14 }}>
          {slots.map((tt, i) => {
            const y = yFor(tt.h, tt.m);
            const isSel = i === selectedIdx;
            const taken = tt.avail === 0;
            return (
              <button key={i} onClick={() => !taken && onSelect?.(i)} disabled={taken} style={{
                appearance:'none', cursor: taken ? 'default' : 'pointer',
                position:'absolute', top: y - 11, left: 0, right: 0,
                height: 22, padding: '0 8px',
                display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8,
                background: isSel ? TEE.ink : (taken ? 'transparent' : TEE.cream),
                color: isSel ? TEE.cream : (taken ? TEE.mute : TEE.ink),
                border: isSel ? '1px solid '+TEE.ink : `0.5px solid ${taken ? 'transparent' : TEE.hairline}`,
                borderRadius: 6,
                fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: 0,
                opacity: taken ? 0.5 : 1,
                textDecoration: taken ? 'line-through' : 'none',
                transition: 'all .14s',
              }}>
                <span style={{ fontWeight: 500 }}>{tt.time}</span>
                <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
                  <SlotDots avail={tt.avail} color={isSel ? TEE.cream : (tt.golden ? TEE.sun : TEE.moss)}/>
                  <span style={{ opacity: 0.7 }}>{tt.price}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SlotDots({ avail, color }) {
  return (
    <span style={{ display:'inline-flex', gap: 2 }}>
      {[0,1,2,3].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: 999,
          background: i < avail ? color : 'transparent',
          border: i < avail ? 'none' : '0.5px solid currentColor',
          opacity: i < avail ? 1 : 0.4,
        }}/>
      ))}
    </span>
  );
}

function BestWindowCard({ label, range, conds, slots, lang, t, accent = TEE.moss }) {
  return (
    <div style={{
      flex: '0 0 220px', scrollSnapAlign:'start',
      background: TEE.cream, borderRadius: 16, padding: 14,
      border: `1px solid ${TEE.hairline2}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: accent }}/>
        <span style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, color: TEE.ink }}>
        {range}
      </div>
      <div style={{
        marginTop: 10, paddingTop: 10, borderTop: `1px solid ${TEE.hairline2}`,
        display:'flex', alignItems:'center', justifyContent: 'space-between',
        fontFamily: FONT_MONO, fontSize: 11, color: TEE.ink2, letterSpacing: 0,
      }}>
        <span>{conds}</span>
        <span style={{ color: TEE.graphite }}>{slots} {t('free')}</span>
      </div>
    </div>
  );
}

function WindowScreen({ courseId = 'miklagard', lang, setLang, onBack, onContinue }) {
  const course = TEE_DATA.courses.find(c => c.id === courseId) || TEE_DATA.courses[2];
  const t = (k) => TEE_DATA.i18n[lang][k] || k;
  // Default selection: a slot in the best window
  const defaultIdx = course.teeTimes.findIndex(s => s.h === course.window.start && s.avail >= 4);
  const [selIdx, setSelIdx] = React.useState(defaultIdx > -1 ? defaultIdx : 12);
  const sel = course.teeTimes[selIdx] || course.teeTimes[0];

  return (
    <div style={{
      background: TEE.paper, color: TEE.ink, fontFamily: FONT_UI,
      minHeight: '100%', position:'relative', paddingBottom: 110,
    }}>
      {/* Top bar */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding: '54px 14px 10px',
      }}>
        <button onClick={onBack} style={{
          appearance:'none', border:'none', cursor:'pointer',
          width: 38, height: 38, borderRadius: 999,
          background: TEE.cream, border: `1px solid ${TEE.hairline2}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon kind="arrow-left" size={17} strokeWidth={1.6}/>
        </button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500, letterSpacing: -0.2, color: TEE.ink }}>{course.name}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: TEE.graphite, marginTop: 2 }}>{todayLabel(lang)}</div>
        </div>
        <LangToggle lang={lang} setLang={setLang}/>
      </div>

      {/* Title */}
      <div style={{ padding: '14px 18px 6px' }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 400,
          letterSpacing: -1, lineHeight: 1.0, margin: 0, color: TEE.ink,
        }}>
          <span style={{ fontStyle: 'italic', color: TEE.moss }}>{t('window')}</span>
        </h1>
        <div style={{
          marginTop: 10, display:'flex', alignItems:'center', gap: 14,
          fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite,
        }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}>
            <Icon kind="sun" size={12} color={TEE.sun} strokeWidth={1.6}/>
            {course.sunrise}
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: TEE.sun }}/>
            {t('goldenHour')} {course.goldenStart}
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap: 5 }}>
            <Icon kind="moon" size={12} color={TEE.fjord} strokeWidth={1.4}/>
            {course.sunset}
          </span>
        </div>
      </div>

      {/* Best windows hero strip */}
      <div style={{ padding: '16px 0 14px' }}>
        <div style={{
          padding: '0 18px 10px', fontFamily: FONT_UI, fontSize: 10.5,
          letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite,
        }}>{lang==='no'?'Beste vinduer i dag':"Today's best windows"}</div>
        <div style={{
          display:'flex', gap: 10, overflowX:'auto', padding: '0 18px',
          scrollSnapType: 'x mandatory', scrollbarWidth:'none',
        }}>
          <BestWindowCard label={lang==='no'?'Morgenstille':'Morning calm'} range="08:00 — 11:00" conds="18° · 4 m/s · stimp 11.2" slots={11} lang={lang} t={t} accent={TEE.moss}/>
          <BestWindowCard label={lang==='no'?'Gylden time':'Golden hour'}    range="18:00 — 20:00" conds="19° · 3 m/s · stimp 11.2" slots={9}  lang={lang} t={t} accent={TEE.sun}/>
          <BestWindowCard label={t('twilight')}                                 range="20:00 — 21:00" conds="16° · 2 m/s · stimp 11.2" slots={5}  lang={lang} t={t} accent={TEE.fjord}/>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display:'flex', gap: 8, padding: '4px 18px 12px',
        overflowX:'auto', scrollbarWidth:'none', alignItems:'center',
      }}>
        <span style={{
          fontFamily: FONT_UI, fontSize: 11, letterSpacing: 0.6, textTransform:'uppercase',
          color: TEE.graphite, marginRight: 4,
        }}>{lang==='no'?'Spillere':'Players'}</span>
        {[1,2,3,4].map(n => (
          <span key={n} style={{
            width: 30, height: 30, borderRadius: 999,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500,
            background: n === 4 ? TEE.ink : 'transparent',
            color: n === 4 ? TEE.cream : TEE.ink2,
            border: n === 4 ? '1px solid '+TEE.ink : '1px solid '+TEE.hairline,
          }}>{n}</span>
        ))}
        <span style={{ width: 1, height: 18, background: TEE.hairline, margin: '0 6px' }}/>
        {[
          { k:'9', label:'9' },
          { k:'18', label:'18', active: true },
        ].map(b => (
          <span key={b.k} style={{
            padding: '6px 10px', borderRadius: 999,
            fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500,
            background: b.active ? TEE.ink : 'transparent',
            color: b.active ? TEE.cream : TEE.ink2,
            border: b.active ? '1px solid '+TEE.ink : '1px solid '+TEE.hairline,
          }}>{b.label}</span>
        ))}
      </div>

      {/* The Window viz */}
      <div style={{
        background: TEE.cream, margin: '0 14px', borderRadius: 22,
        border: `1px solid ${TEE.hairline2}`, padding: '18px 14px 16px',
        position: 'relative',
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'baseline',
          marginBottom: 14, padding: '0 4px',
        }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontStyle:'italic', color: TEE.ink, letterSpacing: -0.2 }}>
            {lang==='no'?'Dagen som landskap':'The day as landscape'}
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 9.5, letterSpacing: 0.6, textTransform:'uppercase', color: TEE.graphite }}>
            {lang==='no'?'Vind ↗ Sol':'Wind ↗ Sun'}
          </div>
        </div>
        <WindowVisualization course={course} selectedIdx={selIdx} onSelect={setSelIdx} lang={lang} t={t}/>
      </div>

      {/* Selected slot card (sticky bottom) */}
      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 14px 26px',
        background: 'linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.96) 30%)',
      }}>
        <div style={{
          background: TEE.ink, color: TEE.cream, borderRadius: 22, padding: '14px 16px',
          display:'flex', alignItems:'center', gap: 12,
          boxShadow: '0 16px 40px -10px rgba(14,20,16,0.4)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.6, textTransform:'uppercase', color: 'rgba(251,250,246,0.6)' }}>
              {t('yourTeeTime')}
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap: 10, marginTop: 2 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 500, letterSpacing: -0.6 }}>{sel.time}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: 'rgba(251,250,246,0.7)' }}>
                4 × {fmtKr(sel.price)} = {fmtKr(sel.price * 4)}
              </span>
            </div>
          </div>
          <button onClick={onContinue} style={{
            appearance:'none', border:'none', cursor:'pointer',
            width: 52, height: 52, borderRadius: 999,
            background: TEE.cream, color: TEE.ink,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon kind="arrow-right" size={20} strokeWidth={1.7}/>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WindowScreen, WindowVisualization, BestWindowCard });
