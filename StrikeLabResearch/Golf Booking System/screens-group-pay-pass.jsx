// screens-group-pay-pass.jsx — Group, Pay, and Pass screens combined

// ─────────────────────────────────────────────────────────────
// Group screen — fill 4 player slots, choose pay split
// ─────────────────────────────────────────────────────────────
function PlayerSlot({ player, lang, t, onAdd, idx, isLast }) {
  const empty = !player;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 12,
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : `1px solid ${TEE.hairline2}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 999,
        background: empty ? 'transparent' : (player.you ? TEE.moss : TEE.sand2),
        border: empty ? `1.5px dashed ${TEE.hairline}` : 'none',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: empty ? TEE.graphite : (player.you ? TEE.cream : TEE.ink),
        fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 500, letterSpacing: -0.2,
      }}>
        {empty ? <Icon kind="plus" size={16} color={TEE.graphite} strokeWidth={1.4}/> : player.initials}
      </div>
      <div style={{ flex: 1 }}>
        {empty ? (
          <button onClick={onAdd} style={{
            appearance:'none', border:'none', background:'none', padding: 0, cursor:'pointer',
            fontFamily: FONT_UI, fontSize: 14, color: TEE.ink2, fontWeight: 500,
          }}>
            {t('addPlayer')} <span style={{ color: TEE.graphite, fontWeight: 400 }}>· {idx + 1}</span>
          </button>
        ) : (
          <>
            <div style={{ fontFamily: FONT_UI, fontSize: 14.5, fontWeight: 500, color: TEE.ink, display:'flex', alignItems:'center', gap: 6 }}>
              {player.name}
              {player.you && (
                <span style={{
                  fontSize: 9.5, fontWeight: 600, letterSpacing: 0.8, textTransform:'uppercase',
                  padding: '2px 6px', borderRadius: 4, background: TEE.moss, color: TEE.cream,
                }}>{lang==='no'?'Du':'You'}</span>
              )}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite, marginTop: 2 }}>
              {t('handicap')} {player.hcp.toFixed(1)}
            </div>
          </>
        )}
      </div>
      {!empty && !player.you && (
        <button style={{
          appearance:'none', border:'none', background:'transparent', cursor:'pointer',
          padding: 6, color: TEE.graphite,
        }}>
          <Icon kind="close" size={14} strokeWidth={1.5}/>
        </button>
      )}
    </div>
  );
}

function GroupScreen({ courseId = 'miklagard', lang, setLang, onBack, onContinue }) {
  const course = TEE_DATA.courses.find(c => c.id === courseId) || TEE_DATA.courses[2];
  const t = (k) => TEE_DATA.i18n[lang][k] || k;
  const players = TEE_DATA.players; // 4 filled
  const time = '12:24';
  const pricePer = 1100;
  const total = pricePer * 4;
  const [splitMode, setSplitMode] = React.useState('together');

  return (
    <div style={{
      background: TEE.paper, color: TEE.ink, fontFamily: FONT_UI,
      minHeight: '100%', position:'relative', paddingBottom: 110,
    }}>
      {/* Top */}
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
        <div style={{ fontFamily: FONT_UI, fontSize: 11.5, color: TEE.graphite, letterSpacing: 0.4, textTransform:'uppercase' }}>
          2 / 3
        </div>
        <LangToggle lang={lang} setLang={setLang}/>
      </div>

      <div style={{ padding: '14px 18px 0' }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 400,
          letterSpacing: -1, lineHeight: 1.0, margin: 0,
        }}>
          {lang==='no' ? <>Hvem er <span style={{ fontStyle:'italic', color: TEE.moss }}>med</span>?</> :
                          <>Who's <span style={{ fontStyle:'italic', color: TEE.moss }}>in</span>?</>}
        </h1>

        {/* Trip recap card */}
        <div style={{
          marginTop: 16, padding: '12px 14px',
          background: TEE.cream, borderRadius: 14,
          border: `1px solid ${TEE.hairline2}`,
          display:'flex', alignItems:'center', gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, overflow:'hidden', flexShrink: 0 }}>
            <HeroLandscape kind={course.hero} height={44}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 500, color: TEE.ink }}>{course.name}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite, marginTop: 2 }}>
              {todayLabel(lang)} · {time}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite }}>{t('perPlayer')}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 500, color: TEE.ink, marginTop: 1 }}>
              {fmtKr(pricePer)}
            </div>
          </div>
        </div>

        {/* Player slots */}
        <div style={{
          marginTop: 18, background: TEE.cream, borderRadius: 18,
          border: `1px solid ${TEE.hairline2}`, overflow:'hidden',
        }}>
          {[0,1,2,3].map(i => (
            <PlayerSlot key={i} idx={i} player={players[i]} lang={lang} t={t} isLast={i === 3}/>
          ))}
        </div>

        {/* Friends suggestions */}
        <div style={{ marginTop: 22 }}>
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom: 10,
          }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite }}>
              {lang==='no'?'Nylig spilt med':'Recently played with'}
            </div>
            <span style={{ fontFamily: FONT_UI, fontSize: 12, color: TEE.moss, fontWeight: 500 }}>
              {lang==='no'?'Inviter via lenke':'Invite via link'}
            </span>
          </div>
          <div style={{ display:'flex', gap: 8, overflowX:'auto', scrollbarWidth:'none' }}>
            {TEE_DATA.friends.slice(0, 4).map(f => (
              <div key={f.id} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap: 6,
                flex: '0 0 64px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 999,
                  background: TEE.sand2, color: TEE.ink2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500,
                }}>{f.name.split(' ').map(s => s[0]).join('')}</div>
                <div style={{ fontFamily: FONT_UI, fontSize: 11, color: TEE.ink2, textAlign:'center' }}>
                  {f.name.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Split toggle */}
        <div style={{
          marginTop: 22, padding: 4, borderRadius: 12,
          background: TEE.cream, border: `1px solid ${TEE.hairline2}`,
          display:'flex', gap: 4,
        }}>
          {[
            { k:'together', label:t('payTogether') },
            { k:'split', label:t('payIndividually') },
          ].map(o => (
            <button key={o.k} onClick={() => setSplitMode(o.k)} style={{
              flex: 1, appearance:'none', border:'none', cursor:'pointer',
              padding: '10px 0', borderRadius: 9,
              fontFamily: FONT_UI, fontSize: 13, fontWeight: 500,
              background: splitMode === o.k ? TEE.ink : 'transparent',
              color: splitMode === o.k ? TEE.cream : TEE.ink2,
            }}>{o.label}</button>
          ))}
        </div>

        {/* Total */}
        <div style={{
          marginTop: 16, display:'flex', alignItems:'baseline', justifyContent:'space-between',
          padding: '10px 4px',
        }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 13, color: TEE.graphite }}>
            {t('total')} · 4 × {fmtKr(pricePer)}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 500, color: TEE.ink, letterSpacing: -0.5 }}>
            {fmtKr(total)}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 18px 28px',
        background: 'linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.96) 30%)',
      }}>
        <button onClick={onContinue} style={{
          width: '100%', height: 56, borderRadius: 999,
          background: TEE.ink, color: TEE.cream,
          fontFamily: FONT_UI, fontSize: 15, fontWeight: 500,
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: '0 6px 0 22px',
          boxShadow: '0 12px 32px -10px rgba(14,20,16,0.4)',
        }}>
          <span>{lang==='no'?'Til betaling':'Continue to pay'}</span>
          <span style={{
            width: 44, height: 44, borderRadius: 999, background: TEE.cream, color: TEE.ink,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500,
          }}>{fmtKr(total).replace(' kr','')}</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pay screen — Vipps first (Norway), Apple Pay, Card
// ─────────────────────────────────────────────────────────────
function PayMethod({ id, label, sub, icon, selected, onSelect, accent }) {
  return (
    <button onClick={() => onSelect(id)} style={{
      appearance:'none', cursor:'pointer', width: '100%',
      background: TEE.cream,
      border: selected ? `2px solid ${accent || TEE.ink}` : `1px solid ${TEE.hairline2}`,
      borderRadius: 16, padding: 14,
      display:'flex', alignItems:'center', gap: 14, textAlign:'left',
      margin: selected ? '-1px' : 0,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: accent || TEE.ink, color: TEE.cream,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, letterSpacing: -0.2,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT_UI, fontSize: 14.5, fontWeight: 500, color: TEE.ink }}>{label}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        border: selected ? 'none' : `1.5px solid ${TEE.hairline}`,
        background: selected ? TEE.ink : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: TEE.cream,
      }}>
        {selected && <Icon kind="check" size={13} strokeWidth={2.2}/>}
      </div>
    </button>
  );
}

function PayScreen({ courseId = 'miklagard', lang, setLang, onBack, onPaid }) {
  const course = TEE_DATA.courses.find(c => c.id === courseId) || TEE_DATA.courses[2];
  const t = (k) => TEE_DATA.i18n[lang][k] || k;
  const total = 1100 * 4;
  const [method, setMethod] = React.useState('vipps');

  return (
    <div style={{
      background: TEE.paper, color: TEE.ink, fontFamily: FONT_UI,
      minHeight: '100%', position:'relative', paddingBottom: 110,
    }}>
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
        <div style={{ fontFamily: FONT_UI, fontSize: 11.5, color: TEE.graphite, letterSpacing: 0.4, textTransform:'uppercase' }}>
          3 / 3
        </div>
        <LangToggle lang={lang} setLang={setLang}/>
      </div>

      <div style={{ padding: '14px 18px 0' }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 400,
          letterSpacing: -1, lineHeight: 1.0, margin: 0,
        }}>
          {lang==='no' ? <>Sist <span style={{ fontStyle:'italic', color: TEE.moss }}>steg</span>.</> :
                          <>One last <span style={{ fontStyle:'italic', color: TEE.moss }}>step</span>.</>}
        </h1>

        {/* Receipt card */}
        <div style={{
          marginTop: 18, padding: 16, background: TEE.cream, borderRadius: 18,
          border: `1px solid ${TEE.hairline2}`,
        }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: TEE.ink }}>{course.name}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: TEE.graphite }}>12:24</div>
          </div>
          <div style={{
            display:'flex', flexDirection:'column', gap: 8,
            fontFamily: FONT_MONO, fontSize: 12, color: TEE.ink2,
            paddingTop: 12, borderTop: `1px solid ${TEE.hairline2}`,
          }}>
            {[
              { l: '4 × ' + (lang==='no'?'greenfee':'green fee'), v: fmtKr(1100*4) },
              { l: lang==='no'?'Plattformavgift':'Service', v: fmtKr(0) },
              { l: t('cancelFree'), v: '✓', muted: true },
            ].map((r,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', color: r.muted ? TEE.graphite : TEE.ink2 }}>
                <span>{r.l}</span>
                <span>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{
            display:'flex', alignItems:'baseline', justifyContent:'space-between',
            marginTop: 14, paddingTop: 12, borderTop: `1px solid ${TEE.hairline2}`,
          }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 13, color: TEE.ink2, fontWeight: 500 }}>{t('total')}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 500, color: TEE.ink, letterSpacing: -0.5 }}>{fmtKr(total)}</div>
          </div>
        </div>

        {/* Methods */}
        <div style={{
          marginTop: 22, fontFamily: FONT_UI, fontSize: 10.5,
          letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite,
          marginBottom: 10,
        }}>
          {lang==='no'?'Betalingsmåte':'Pay with'}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          <PayMethod id="vipps" label="Vipps" sub="+47 ••• 12 34" icon="V" selected={method==='vipps'} onSelect={setMethod} accent="#FF5B24"/>
          <PayMethod id="apple" label="Apple Pay" sub={lang==='no'?'Visa •• 4082':'Visa •• 4082'} icon=""
            selected={method==='apple'} onSelect={setMethod} accent={TEE.ink}/>
          <PayMethod id="card"  label={t('card')} sub={lang==='no'?'Legg til nytt kort':'Add new card'} icon="+"
            selected={method==='card'} onSelect={setMethod} accent={TEE.graphite}/>
        </div>
      </div>

      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 18px 28px',
        background: 'linear-gradient(180deg, rgba(244,240,232,0) 0%, rgba(244,240,232,0.96) 30%)',
      }}>
        <button onClick={onPaid} style={{
          width: '100%', height: 56, borderRadius: 999,
          background: method === 'vipps' ? '#FF5B24' : TEE.ink,
          color: TEE.cream,
          fontFamily: FONT_UI, fontSize: 15, fontWeight: 500,
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
          boxShadow: '0 12px 32px -10px rgba(14,20,16,0.4)',
        }}>
          <span>{t('payNow')} {fmtKr(total)}</span>
          <Icon kind="arrow-right" size={16} strokeWidth={1.7}/>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pass / Confirmation — day-of mobile pass
// ─────────────────────────────────────────────────────────────
function PassScreen({ courseId = 'miklagard', lang, setLang, onBack }) {
  const course = TEE_DATA.courses.find(c => c.id === courseId) || TEE_DATA.courses[2];
  const t = (k) => TEE_DATA.i18n[lang][k] || k;
  const players = TEE_DATA.players;
  const time = '12:24';

  return (
    <div style={{
      background: TEE.ink, color: TEE.cream, fontFamily: FONT_UI,
      minHeight: '100%', position:'relative', paddingBottom: 30,
      backgroundImage: `radial-gradient(ellipse 600px 400px at 50% -10%, rgba(232,181,71,0.15), transparent 70%)`,
    }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding: '54px 14px 10px',
      }}>
        <button onClick={onBack} style={{
          appearance:'none', border:'none', cursor:'pointer',
          width: 38, height: 38, borderRadius: 999,
          background: 'rgba(251,250,246,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color: TEE.cream,
        }}>
          <Icon kind="close" size={16} strokeWidth={1.6}/>
        </button>
        <BrandMark color={TEE.cream}/>
        <button style={{
          appearance:'none', border:'none', cursor:'pointer',
          width: 38, height: 38, borderRadius: 999,
          background: 'rgba(251,250,246,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color: TEE.cream,
        }}>
          <Icon kind="share" size={15} strokeWidth={1.6}/>
        </button>
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, color: TEE.sun, marginBottom: 10 }}>
          <Icon kind="check" size={14} color={TEE.sun} strokeWidth={2}/>
          <span style={{ fontFamily: FONT_UI, fontSize: 11, letterSpacing: 0.8, textTransform:'uppercase', fontWeight: 600 }}>{t('booked')}</span>
        </div>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 400,
          letterSpacing: -1.2, lineHeight: 0.95, margin: 0,
          color: TEE.cream,
        }}>
          {lang === 'no' ? <>Du er <span style={{ fontStyle:'italic', color: TEE.sun }}>inne</span>.</> :
                            <>You're <span style={{ fontStyle:'italic', color: TEE.sun }}>in</span>.</>}
        </h1>
        <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: 'rgba(251,250,246,0.7)' }}>
          {lang==='no'?'Vi sender en påminnelse 1 time før':"We'll remind you 1 hour before"}
        </div>
      </div>

      {/* Big ticket card */}
      <div style={{ padding: '24px 18px 0' }}>
        <div style={{
          background: TEE.cream, color: TEE.ink, borderRadius: 22, overflow:'hidden',
          position: 'relative',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
        }}>
          {/* Mini hero */}
          <div style={{ position:'relative', height: 80 }}>
            <HeroLandscape kind={course.hero} height={80}/>
          </div>

          <div style={{ padding: '18px 18px 0' }}>
            <div style={{
              fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase',
              color: TEE.graphite,
            }}>{course.location} · {course.region}</div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 500,
              letterSpacing: -0.5, marginTop: 2, color: TEE.ink,
            }}>{course.name}</div>

            {/* Time & countdown */}
            <div style={{
              marginTop: 18, padding: '14px 0',
              borderTop: `1px solid ${TEE.hairline2}`,
              borderBottom: `1px solid ${TEE.hairline2}`,
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite }}>{t('yourTeeTime')}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 500, letterSpacing: -1, color: TEE.ink }}>{time}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: TEE.graphite }}>· {todayLabel(lang)}</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite }}>{t('readyIn')}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 500, color: TEE.moss, marginTop: 2 }}>2t 18m</div>
              </div>
            </div>

            {/* Players */}
            <div style={{
              padding: '14px 0',
              borderBottom: `1px solid ${TEE.hairline2}`,
              display:'flex', alignItems:'center', gap: 10,
            }}>
              <div style={{ display:'flex' }}>
                {players.map((p, i) => (
                  <div key={p.id} style={{
                    width: 32, height: 32, borderRadius: 999,
                    background: p.you ? TEE.moss : TEE.sand2,
                    color: p.you ? TEE.cream : TEE.ink,
                    fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border: `2px solid ${TEE.cream}`,
                    marginLeft: i === 0 ? 0 : -10,
                  }}>{p.initials}</div>
                ))}
              </div>
              <div style={{ flex: 1, fontFamily: FONT_UI, fontSize: 12.5, color: TEE.ink2 }}>
                {players.map(p => p.name).join(', ')}
              </div>
              <Icon kind="chevron-right" size={14} color={TEE.graphite}/>
            </div>

            {/* Forecast at tee time */}
            <div style={{
              padding: '14px 0',
              display:'flex', alignItems:'center', gap: 12,
              fontFamily: FONT_MONO, fontSize: 11.5, color: TEE.ink2, letterSpacing: 0,
            }}>
              <Icon kind="sun" size={14} color={TEE.sun} strokeWidth={1.6}/>
              <span>22°</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <Icon kind="wind" size={14} color={TEE.graphite} strokeWidth={1.4}/>
              <span>6 m/s NW</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: TEE.moss }}>{lang==='no'?'Tørt':'Dry'}</span>
            </div>
          </div>

          {/* Perforated divider */}
          <div style={{ position:'relative', height: 22, background: TEE.cream }}>
            <div style={{ position:'absolute', left: -10, top: 4, width: 20, height: 20, borderRadius: 999, background: TEE.ink }}/>
            <div style={{ position:'absolute', right: -10, top: 4, width: 20, height: 20, borderRadius: 999, background: TEE.ink }}/>
            <div style={{
              position:'absolute', left: 14, right: 14, top: 13,
              borderTop: `1.5px dashed ${TEE.hairline}`,
            }}/>
          </div>

          {/* QR + check-in code */}
          <div style={{ padding: '8px 18px 22px', display:'flex', alignItems:'center', gap: 16 }}>
            <FauxQR/>
            <div>
              <div style={{ fontFamily: FONT_UI, fontSize: 10.5, letterSpacing: 0.8, textTransform:'uppercase', color: TEE.graphite }}>{t('shareCode')}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 500, color: TEE.ink, letterSpacing: 4, marginTop: 4 }}>
                MK·24
              </div>
              <div style={{ fontFamily: FONT_UI, fontSize: 11, color: TEE.graphite, marginTop: 6 }}>
                {lang==='no'?'Vis i pro shop':'Show at pro shop'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{ padding: '20px 18px 0', display:'flex', gap: 10 }}>
        <ActionPill icon="wallet" label={t('addToWallet')}/>
        <ActionPill icon="car" label={`${t('driveTime')} 36 min`}/>
      </div>

      {/* Footer fine print */}
      <div style={{
        padding: '20px 22px 0',
        fontFamily: FONT_MONO, fontSize: 10.5, color: 'rgba(251,250,246,0.45)',
        letterSpacing: 0, lineHeight: 1.6,
      }}>
        {t('cancelFree')} · MK·24 · 4 {t('players')}
      </div>
    </div>
  );
}

function ActionPill({ icon, label }) {
  return (
    <button style={{
      flex: 1, appearance:'none', cursor:'pointer',
      background: 'rgba(251,250,246,0.08)', backdropFilter:'blur(8px)',
      border: `1px solid rgba(251,250,246,0.12)`, borderRadius: 14,
      padding: '12px 14px',
      display:'flex', alignItems:'center', gap: 10,
      color: TEE.cream,
      fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 500,
    }}>
      <Icon kind={icon} size={15} color={TEE.cream} strokeWidth={1.4}/>
      {label}
    </button>
  );
}

function FauxQR({ size = 88, color = TEE.ink }) {
  // Deterministic-looking QR with finder squares
  const cells = 17;
  const cellSize = size / cells;
  const seed = 1; let n = seed;
  const rnd = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
  const fill = (x, y) => {
    // finder positions
    const inFinder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
    if (inFinder) {
      // outer ring
      if (x === 0 || y === 0 || x === 6 || y === 6 ||
          x === cells - 7 || x === cells - 1 ||
          y === cells - 7 || y === cells - 1 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= cells - 5 && x <= cells - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= cells - 5 && y <= cells - 3)) {
        return true;
      }
      return false;
    }
    return rnd() > 0.55;
  };
  const rects = [];
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if (fill(x, y)) rects.push(<rect key={`${x}-${y}`} x={x*cellSize} y={y*cellSize} width={cellSize} height={cellSize} fill={color}/>);
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {rects}
    </svg>
  );
}

Object.assign(window, { GroupScreen, PayScreen, PassScreen, FauxQR });
