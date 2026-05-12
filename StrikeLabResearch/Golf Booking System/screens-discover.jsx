// screens-discover.jsx — Home / Discover screen
// Editorial greeting → "Today's window" cards → course list with conditions

function CourseCard({ course, lang, t, onClick }) {
  const cur = course.hourly?.find(h => h.h === 14) || {};
  const winLabel = lang === 'no'
    ? `Vinduet ${pad(course.window.start)}–${pad(course.window.end)}`
    : `Window ${pad(course.window.start)}–${pad(course.window.end)}`;
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', textAlign: 'left', padding: 0,
      background: TEE.cream, borderRadius: 18, overflow: 'hidden',
      cursor: 'pointer', width: '100%',
      boxShadow: '0 1px 0 rgba(14,20,16,0.04), 0 8px 24px -16px rgba(14,20,16,0.18)',
      border: `1px solid ${TEE.hairline2}`,
    }}>
      {/* hero */}
      <div style={{ position: 'relative' }}>
        <HeroLandscape kind={course.hero} height={132}/>
        {/* window pill on hero */}
        <div style={{ position:'absolute', left: 12, bottom: 12, display:'flex', gap: 6 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap: 6,
            padding: '5px 10px 5px 8px', borderRadius: 999,
            background: 'rgba(14,20,16,0.78)', backdropFilter: 'blur(6px)',
            color: TEE.cream, fontFamily: FONT_UI, fontSize: 11.5, fontWeight: 500,
            letterSpacing: 0.1,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: TEE.sun }}/>
            {winLabel}
          </span>
        </div>
        {/* drive pill */}
        <div style={{ position: 'absolute', right: 12, bottom: 12 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap: 4,
            padding: '5px 9px', borderRadius: 999,
            background: 'rgba(251,250,246,0.82)', backdropFilter: 'blur(4px)',
            fontFamily: FONT_MONO, fontSize: 10.5, color: TEE.ink2,
            border: `0.5px solid ${TEE.hairline}`,
          }}>
            <Icon kind="car" size={11} strokeWidth={1.4} color={TEE.graphite}/>
            {course.driveMin}{t('mins')}
          </span>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '14px 14px 14px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap: 8 }}>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 500,
            color: TEE.ink, letterSpacing: -0.4, lineHeight: 1.1,
          }}>{course.name}</div>
          <div style={{
            display:'flex', alignItems:'center', gap: 3,
            fontFamily: FONT_MONO, fontSize: 11.5, color: TEE.ink2,
          }}>
            <Icon kind="star" size={11} color={TEE.ink2}/>
            {course.rating}
          </div>
        </div>
        <div style={{
          fontFamily: FONT_UI, fontSize: 12.5, color: TEE.graphite,
          marginTop: 2, letterSpacing: 0,
        }}>{course.location} · {course.holes} {lang==='no'?'hull':'holes'} · {course.par === 71 ? 'Par 71' : 'Par 72'}</div>

        <div style={{ height: 12 }}/>
        <ConditionsRow course={course} t={t}/>

        <div style={{
          display:'flex', alignItems:'baseline', justifyContent:'space-between',
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${TEE.hairline2}`,
        }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, color: TEE.graphite }}>
            {t('from')} <span style={{ fontFamily: FONT_MONO, color: TEE.ink, fontWeight: 500 }}>{fmtKr(course.priceOff)}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 4, fontFamily: FONT_UI, fontSize: 12.5, color: TEE.ink2, fontWeight: 500 }}>
            {t('seeAvailability')}
            <Icon kind="arrow-right" size={13}/>
          </div>
        </div>
      </div>
    </button>
  );
}

function pad(n) { return String(n).padStart(2,'0') + ':00'; }

function WindowCard({ course, lang, t }) {
  const cur = course.hourly?.find(h => h.h === course.window.start) || {};
  const labelMap = {
    'golden':         { en: 'Golden window',    no: 'Gylden time' },
    'calm-after-wind':{ en: 'Calm after wind',  no: 'Stille etter vind' },
    'morning-calm':   { en: 'Morning calm',     no: 'Morgenstille' },
    'midday':         { en: 'Midday',           no: 'Midt på dagen' },
    'morning':        { en: 'Morning',          no: 'Morgen' },
  };
  const lbl = labelMap[course.window.label]?.[lang] || course.window.label;
  return (
    <div style={{
      flex: '0 0 220px', scrollSnapAlign: 'start',
      background: TEE.ink, color: TEE.cream, borderRadius: 18, overflow: 'hidden',
      position: 'relative', height: 220,
      boxShadow: '0 8px 24px -16px rgba(14,20,16,0.4)',
    }}>
      <div style={{ position:'absolute', inset: 0, opacity: 0.6 }}>
        <HeroLandscape kind={course.hero} height={220}/>
      </div>
      <div style={{
        position:'absolute', inset: 0,
        background: `linear-gradient(180deg, rgba(14,20,16,0) 0%, rgba(14,20,16,0.85) 75%)`,
      }}/>
      <div style={{ position:'absolute', top: 14, left: 14, right: 14, display:'flex', justifyContent:'space-between' }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap: 5,
          padding: '4px 9px', borderRadius: 999,
          background: 'rgba(251,250,246,0.18)', backdropFilter:'blur(6px)',
          color: TEE.cream, fontFamily: FONT_UI, fontSize: 10.5, fontWeight: 500, letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: TEE.sun }}/>
          {lbl}
        </span>
      </div>
      <div style={{ position:'absolute', left: 14, right: 14, bottom: 14 }}>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 500,
          letterSpacing: -0.3, lineHeight: 1.05,
        }}>{course.name}</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, color: 'rgba(251,250,246,0.72)',
          marginTop: 6, letterSpacing: 0,
        }}>
          {pad(course.window.start)}–{pad(course.window.end)} · {cur.t}° · {cur.w} m/s
        </div>
      </div>
    </div>
  );
}

function DiscoverScreen({ lang, setLang, onPickCourse }) {
  const t = (k) => TEE_DATA.i18n[lang][k] || k;
  const courses = TEE_DATA.courses;
  const me = TEE_DATA.players[0];

  return (
    <div style={{
      background: TEE.paper, color: TEE.ink, fontFamily: FONT_UI,
      minHeight: '100%', paddingBottom: 90,
    }}>
      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: '54px 18px 14px',
      }}>
        <BrandMark size={22}/>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap: 4,
            fontFamily: FONT_UI, fontSize: 12, color: TEE.ink2,
            padding: '5px 9px', borderRadius: 999,
            background: TEE.cream, border: `1px solid ${TEE.hairline2}`,
          }}>
            <Icon kind="pin" size={12} color={TEE.graphite} strokeWidth={1.3}/>
            Oslo
          </div>
          <LangToggle lang={lang} setLang={setLang}/>
        </div>
      </div>

      {/* Editorial greeting */}
      <div style={{ padding: '8px 18px 0' }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 400,
          letterSpacing: -1, lineHeight: 1.02, color: TEE.ink,
          margin: 0, fontStyle: 'normal',
        }}>
          {lang === 'no' ? 'Hvor skal du spille,' : 'Where to play,'}
          <br/>
          <span style={{ fontStyle: 'italic', color: TEE.moss }}>{me.name}?</span>
        </h1>
        <div style={{
          marginTop: 14, display:'flex', alignItems:'center', gap: 10,
          fontFamily: FONT_MONO, fontSize: 11.5, color: TEE.graphite, letterSpacing: 0,
        }}>
          <span>{todayLabel(lang)}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>18° · 5 m/s SW</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{t('sunset')} 21:12</span>
        </div>
      </div>

      {/* Today's windows — horizontal scroll */}
      <div style={{ marginTop: 28 }}>
        <div style={{
          padding: '0 18px', display:'flex', alignItems:'baseline',
          justifyContent:'space-between', marginBottom: 12,
        }}>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500,
            letterSpacing: -0.3, margin: 0, color: TEE.ink,
          }}>{t('todaysWindow')}</h2>
          <div style={{ fontFamily: FONT_UI, fontSize: 11.5, color: TEE.graphite, letterSpacing: 0.3, textTransform:'uppercase' }}>
            {lang === 'no' ? 'Anbefalt for deg' : 'Picked for you'}
          </div>
        </div>
        <div style={{
          display:'flex', gap: 12, overflowX:'auto', padding: '0 18px 4px',
          scrollSnapType: 'x mandatory', scrollbarWidth:'none',
        }}>
          {courses.slice(0, 3).map(c => (
            <WindowCard key={c.id} course={c} lang={lang} t={t}/>
          ))}
        </div>
      </div>

      {/* Filters strip */}
      <div style={{
        display:'flex', gap: 8, padding: '24px 18px 14px',
        overflowX:'auto', scrollbarWidth:'none',
      }}>
        {[
          { k:'now', label: t('bestNow'), active: true },
          { k:'tonight', label: t('tonight') },
          { k:'tomorrow', label: lang==='no' ? 'I morgen' : 'Tomorrow' },
          { k:'weekend', label: lang==='no' ? 'Helgen' : 'Weekend' },
          { k:'twilight', label: t('twilight') },
        ].map(f => (
          <span key={f.k} style={{
            padding: '7px 12px', borderRadius: 999,
            fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 500,
            background: f.active ? TEE.ink : 'transparent',
            color: f.active ? TEE.cream : TEE.ink2,
            border: f.active ? '1px solid '+TEE.ink : '1px solid '+TEE.hairline,
            whiteSpace: 'nowrap',
          }}>{f.label}</span>
        ))}
      </div>

      {/* Course list */}
      <div style={{ padding: '0 18px', display:'flex', flexDirection:'column', gap: 14 }}>
        {courses.map(c => (
          <CourseCard key={c.id} course={c} lang={lang} t={t} onClick={() => onPickCourse?.(c.id)}/>
        ))}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 18px 30px',
        background: 'linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.95) 30%)',
        display:'flex', justifyContent:'space-around', alignItems:'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-around',
          background: TEE.ink, borderRadius: 999, padding: '8px 8px',
          width: '100%', boxShadow: '0 12px 32px -10px rgba(14,20,16,0.4)',
          pointerEvents: 'auto',
        }}>
          {[
            { k:'discover', label:t('discover'), active:true, icon:'compass' },
            { k:'trips', label: lang==='no'?'Runder':'Rounds', icon:'flag' },
            { k:'friends', label: lang==='no'?'Venner':'Friends', icon:'people' },
            { k:'profile', label: lang==='no'?'Profil':'Profile', icon:'walking' },
          ].map(tab => (
            <div key={tab.k} style={{
              display:'flex', alignItems:'center', gap: 6,
              padding: tab.active ? '7px 14px' : '7px 10px',
              borderRadius: 999,
              background: tab.active ? TEE.cream : 'transparent',
              color: tab.active ? TEE.ink : 'rgba(251,250,246,0.7)',
              fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 500,
            }}>
              <Icon kind={tab.icon} size={15} strokeWidth={1.5}/>
              {tab.active && <span>{tab.label}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DiscoverScreen, CourseCard, WindowCard });
