// Booking sheet (group composition + add-ons + pricing) and Payment modal/screen.

const BookFlow = ({ lang, courseId = 'losby', slot, onBack, onComplete }) => {
  const t = window.useT(lang);
  const c = window.COURSES.find(x => x.id === courseId) || window.COURSES[0];
  const s = slot || { time: '15:30', price: 890, slope: 132, postable: true };

  const [groupIds, setGroupIds] = React.useState(['me','jb']);
  const [holes, setHoles] = React.useState(18);
  const [addons, setAddons] = React.useState({ cart: false, range: true, caddie: false, lunch: false });
  const [step, setStep] = React.useState('group'); // group | pay | done
  const [pay, setPay] = React.useState('vipps');
  const [split, setSplit] = React.useState(false);

  const players = groupIds.map(id => window.SAMPLE_PLAYERS.find(p => p.id === id)).filter(Boolean);

  const greenFee = s.price * players.length * (holes === 9 ? 0.6 : 1);
  const addonsTotal =
    (addons.cart ? 280 : 0) * players.length +
    (addons.range ? 80 : 0) * players.length +
    (addons.caddie ? 950 : 0) +
    (addons.lunch ? 195 : 0) * players.length;
  const fees = Math.round(greenFee * 0.025);
  const total = greenFee + addonsTotal + fees;

  return (
    <div style={{ padding: '32px 40px 80px', display: 'grid', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="mono click" onClick={onBack} style={{ fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', letterSpacing: '0.16em' }}>{c.name.toUpperCase()} ›</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink)', letterSpacing: '0.16em' }}>
          {step === 'group' ? (lang === 'no' ? 'BESTILL' : 'BOOK') : step === 'pay' ? (lang === 'no' ? 'BETAL' : 'PAY') : (lang === 'no' ? 'BEKREFTET' : 'CONFIRMED')} · {s.time}
        </span>
      </div>

      {/* Slot summary header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', border: '1px solid var(--line-strong)', background: 'var(--surface-solid)' }}>
        <SlotCell label={t('date')} v={lang === 'no' ? 'FRE 8 MAI' : 'FRI 8 MAY'} sub="2026" />
        <SlotCell label={lang === 'no' ? 'STARTTID' : 'TEE TIME'} v={s.time} sub={lang === 'no' ? '+ 4t 24m' : '+ 4h 24m'} accent />
        <SlotCell label={t('holes')} v={String(holes)} sub={holes === 18 ? (lang === 'no' ? '~4t 30m' : '~4h 30m') : (lang === 'no' ? '~2t 15m' : '~2h 15m')} />
        <SlotCell label={t('players')} v={String(players.length)} sub={lang === 'no' ? `${4 - players.length} ledige plasser` : `${4 - players.length} open spots`} />
        <SlotCell label={lang === 'no' ? 'POSTBAR' : 'POSTABLE'} v={s.postable ? (lang === 'no' ? 'JA' : 'YES') : (lang === 'no' ? 'NEI' : 'NO')} sub={`SLOPE ${s.slope}`} accent={s.postable} last />
      </div>

      {step === 'group' && (
        <GroupStep
          lang={lang} t={t} c={c} s={s}
          groupIds={groupIds} setGroupIds={setGroupIds}
          players={players}
          holes={holes} setHoles={setHoles}
          addons={addons} setAddons={setAddons}
          greenFee={greenFee} addonsTotal={addonsTotal} fees={fees} total={total}
          onContinue={() => setStep('pay')}
        />
      )}
      {step === 'pay' && (
        <PayStep
          lang={lang} t={t} players={players}
          greenFee={greenFee} addonsTotal={addonsTotal} fees={fees} total={total}
          pay={pay} setPay={setPay}
          split={split} setSplit={setSplit}
          onBack={() => setStep('group')} onPay={() => setStep('done')}
          addons={addons} holes={holes}
        />
      )}
      {step === 'done' && (
        <DoneStep lang={lang} t={t} c={c} s={s} players={players} total={total} onSeeCheckin={onComplete} />
      )}
    </div>
  );
};

const SlotCell = ({ label, v, sub, accent, last }) => (
  <div style={{ padding: 18, borderRight: last ? 0 : '1px solid var(--line-strong)' }}>
    <div className="micro">{label}</div>
    <div className="num" style={{ fontSize: 28, fontWeight: 500, marginTop: 6, color: accent ? 'var(--accent)' : 'var(--ink)', letterSpacing: '-0.03em' }}>{v}</div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{sub}</div>
  </div>
);

// ---- GROUP STEP -----------------------------------------------------------
const GroupStep = ({ lang, t, c, s, groupIds, setGroupIds, players, holes, setHoles, addons, setAddons, greenFee, addonsTotal, fees, total, onContinue }) => {
  const [searchQ, setSearchQ] = React.useState('');
  const all = window.SAMPLE_PLAYERS;
  const candidates = all.filter(p => !groupIds.includes(p.id));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      {/* LEFT: group + add-ons */}
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Group panel */}
        <window.Panel id="P 01" title={t('your_group').toUpperCase()} right={<span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{players.length}/4</span>}>
          <div style={{ display: 'grid', gap: 10 }}>
            {players.map((p, idx) => (
              <PlayerRow key={p.id} p={p} idx={idx + 1} lang={lang} onRemove={p.you ? null : () => setGroupIds(groupIds.filter(id => id !== p.id))} />
            ))}
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1fr 80px 80px', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px dashed var(--line-strong)', borderBottom: '1px dashed var(--line-strong)', opacity: 0.7 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{String(players.length + i + 1).padStart(2, '0')}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{lang === 'no' ? 'TOM PLASS' : 'EMPTY SEAT'}</span>
                <span />
                <span />
                <span />
                <window.TTButton kind="ghost" size="md" onClick={() => candidates[0] && setGroupIds([...groupIds, candidates[0].id])}>+ {t('add_player')}</window.TTButton>
              </div>
            ))}
          </div>

          {/* Add player picker */}
          <hr className="rule" style={{ margin: '16px 0' }} />
          <div className="micro" style={{ marginBottom: 10 }}>{lang === 'no' ? 'LEGG TIL FRA NETTVERK' : 'ADD FROM YOUR NETWORK'}</div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={lang === 'no' ? 'Søk navn, klubb, GIN...' : 'Search name, club, GIN...'} style={{
            background: 'var(--bg-2)', color: 'var(--ink)', border: '1px solid var(--line-strong)', outline: 'none',
            fontFamily: 'Geist', fontSize: 14, padding: '10px 12px', width: '100%',
          }} />
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {candidates.filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase())).map(p => (
              <div key={p.id} className="hover-line click" onClick={() => setGroupIds([...groupIds, p.id])}
                   style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto auto', gap: 12, alignItems: 'center', padding: '10px', border: '1px solid var(--line)' }}>
                <Avatar name={p.name} />
                <div>
                  <div style={{ fontSize: 14 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{p.club}</div>
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>HCP {p.hcp}</span>
                <span className="num" style={{ fontSize: 11, color: 'var(--accent)' }}>● {p.dialIn}</span>
                <window.Icon name="plus" size={16} />
              </div>
            ))}
            <div className="hover-line click" style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, alignItems: 'center', padding: '10px', border: '1px dashed var(--line-strong)' }}>
              <span style={{ width: 32, height: 32, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}><window.Icon name="user" /></span>
              <div>
                <div style={{ fontSize: 14 }}>{lang === 'no' ? 'Legg til gjest' : 'Add a guest'}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>
                  {lang === 'no' ? 'Navn + HCP — ingen StrikeLab-konto' : 'Name + HCP — no StrikeLab account'}
                </div>
              </div>
              <window.TTButton kind="ghost">{lang === 'no' ? 'Ny gjest' : 'New guest'}</window.TTButton>
            </div>
          </div>
        </window.Panel>

        {/* Holes + add-ons */}
        <window.Panel id="P 02" title={t('add_ons').toUpperCase()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <div className="micro" style={{ marginBottom: 8 }}>{t('holes')}</div>
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-strong)' }}>
                {[9, 18].map((h, i) => (
                  <button key={h} onClick={() => setHoles(h)} className="mono click" style={{
                    background: holes === h ? 'var(--accent)' : 'transparent',
                    color: holes === h ? 'var(--accent-ink)' : 'var(--ink-2)',
                    border: 0, borderRight: i === 0 ? '1px solid var(--line-strong)' : 0,
                    padding: '12px 22px', fontSize: 11, letterSpacing: '0.16em', cursor: 'pointer', flex: 1,
                  }}>{h} {t('holes').toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="micro" style={{ marginBottom: 8 }}>{lang === 'no' ? 'TEE-VALG' : 'TEE BOX'}</div>
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-strong)' }}>
                {['56', '60', '64', '67'].map((tee, i) => (
                  <button key={tee} className="mono click" style={{
                    background: i === 1 ? 'var(--surface-2)' : 'transparent',
                    color: i === 1 ? 'var(--ink)' : 'var(--ink-3)',
                    border: 0, borderRight: i < 3 ? '1px solid var(--line-strong)' : 0,
                    padding: '12px 12px', fontSize: 11, cursor: 'pointer', flex: 1,
                  }}>{tee}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 0, border: '1px solid var(--line-strong)' }}>
            <AddonRow icon="cart" label={t('cart')} sub={lang === 'no' ? 'Per spiller · 18 hull' : 'Per player · 18 holes'} price={280} unit={t('per_player')} on={addons.cart} onToggle={() => setAddons({ ...addons, cart: !addons.cart })} />
            <AddonRow icon="target" label={t('range_balls')} sub={lang === 'no' ? '50 baller før runden' : '50 balls before round'} price={80} unit={t('per_player')} on={addons.range} onToggle={() => setAddons({ ...addons, range: !addons.range })} />
            <AddonRow icon="user" label={t('caddie')} sub={lang === 'no' ? 'Klubbens caddiemester' : 'Club caddiemaster'} price={950} unit={lang === 'no' ? 'flat' : 'flat'} on={addons.caddie} onToggle={() => setAddons({ ...addons, caddie: !addons.caddie })} />
            <AddonRow icon="flag" label={lang === 'no' ? 'Lunsj på terrassen' : 'Clubhouse lunch'} sub={lang === 'no' ? 'Etter runden · 195 kr' : 'After round · 195 kr'} price={195} unit={t('per_player')} on={addons.lunch} onToggle={() => setAddons({ ...addons, lunch: !addons.lunch })} last />
          </div>
        </window.Panel>

        {/* Coach insight */}
        <window.Panel id="AI" title={lang === 'no' ? 'COACH · INNSIKT' : 'COACH · INSIGHT'}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
              <window.TTLogo size={18} />
            </div>
            <p className="serif" style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
              "{lang === 'no'
                ? 'Med 4 m/s SW spiller hull 7 og 11 lengre — nær din carrier-distanse med 7-jern. Slå opp én klubb. Vi forhåndsinnstiller bagen din i StrikeLab Caddie når du sjekker inn.'
                : 'With 4 m/s SW, holes 7 and 11 play long — right at your 7-iron carry. Club up one. Your bag will be pre-set in StrikeLab Caddie when you check in.'}"
            </p>
          </div>
        </window.Panel>
      </div>

      {/* RIGHT: cart / total */}
      <div style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', display: 'grid', gap: 12 }}>
        <window.Panel id="$ 01" title={lang === 'no' ? 'KVITTERING · UTKAST' : 'RECEIPT · DRAFT'}>
          <LineItem label={lang === 'no' ? `Greenfee · ${players.length}×${holes}` : `Green fee · ${players.length}×${holes}`} value={greenFee} />
          {addons.cart && <LineItem label={`${t('cart')} · ${players.length}`} value={280 * players.length} />}
          {addons.range && <LineItem label={`${t('range_balls')} · ${players.length}`} value={80 * players.length} />}
          {addons.caddie && <LineItem label={t('caddie')} value={950} />}
          {addons.lunch && <LineItem label={`${lang === 'no' ? 'Lunsj' : 'Lunch'} · ${players.length}`} value={195 * players.length} />}
          <hr className="rule" style={{ margin: '12px 0' }} />
          <LineItem label={lang === 'no' ? 'Booking-gebyr' : 'Booking fee'} value={fees} muted />
          <hr className="rule" style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span className="micro" style={{ fontSize: 11 }}>{t('total').toUpperCase()}</span>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontSize: 30, fontWeight: 500, color: 'var(--accent)', whiteSpace: 'nowrap', letterSpacing: '-0.03em' }}>{window.fmtKr(total)}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{window.fmtKr(Math.round(total / players.length))} {t('per_player').toUpperCase()}</div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <window.TTButton kind="primary" full size="lg" onClick={onContinue}>
              {t('reserve')} →
            </window.TTButton>
            <p className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', margin: 0, lineHeight: 1.5, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {t('policy')}
            </p>
          </div>
        </window.Panel>

        <window.Panel id="$ 02" title={lang === 'no' ? 'HOLDER PLASSEN' : 'HOLDING SLOT'}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="serif" style={{ fontSize: 15, color: 'var(--ink-2)' }}>"{lang === 'no' ? 'Vi holder denne tiden i 9 minutter mens du fullfører.' : 'We hold this slot for 9 minutes while you complete.'}"</span>
          </div>
          <div style={{ marginTop: 14, position: 'relative', height: 4, background: 'var(--bg-2)' }}>
            <div style={{ position: 'absolute', left: 0, width: '70%', height: '100%', background: 'var(--accent)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>06:18</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>{lang === 'no' ? 'GJENSTÅR' : 'REMAINING'}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>09:00</span>
          </div>
        </window.Panel>
      </div>
    </div>
  );
};

// Player row
const PlayerRow = ({ p, idx, lang, onRemove }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px 32px 1fr 70px 70px 90px 30px', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{String(idx).padStart(2, '0')}</span>
      <Avatar name={p.name} you={p.you} />
      <div>
        <div style={{ fontSize: 14 }}>{p.name} {p.you && <span className="mono" style={{ fontSize: 9, color: 'var(--accent)', marginLeft: 6, letterSpacing: '0.16em' }}>{lang === 'no' ? 'DEG' : 'YOU'}</span>}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{p.club}</div>
      </div>
      <Stat2 label="HCP" value={p.hcp} />
      <Stat2 label={lang === 'no' ? 'DIAL' : 'DIAL'} value={p.dialIn} accent />
      <Stat2 label={lang === 'no' ? 'TEE' : 'TEE'} value="60" sub={lang === 'no' ? 'GUL' : 'YEL'} />
      {onRemove ? (
        <button onClick={onRemove} className="click" style={{ background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-3)', width: 24, height: 24, fontSize: 11, cursor: 'pointer', padding: 0 }}>×</button>
      ) : <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.14em' }}>—</span>}
    </div>
  );
};

const Stat2 = ({ label, value, sub, accent }) => (
  <div>
    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</div>
    <div className="num" style={{ fontSize: 16, fontWeight: 500, color: accent ? 'var(--accent)' : 'var(--ink)', marginTop: 2 }}>{value}</div>
    {sub && <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{sub}</div>}
  </div>
);

const Avatar = ({ name, you }) => {
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

const AddonRow = ({ icon, label, sub, price, unit, on, onToggle, last }) => (
  <div className="click" onClick={onToggle} style={{
    display: 'grid', gridTemplateColumns: '36px 1fr auto 60px',
    gap: 14, alignItems: 'center', padding: '14px 14px',
    borderBottom: last ? 0 : '1px solid var(--line)',
    background: on ? 'var(--surface-2)' : 'transparent',
    cursor: 'pointer',
  }}>
    <span style={{ width: 36, height: 36, border: '1px solid', borderColor: on ? 'var(--accent)' : 'var(--line-strong)', color: on ? 'var(--accent)' : 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <window.Icon name={icon} size={18} />
    </span>
    <div>
      <div style={{ fontSize: 14 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{sub}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div className="num" style={{ fontSize: 16, color: 'var(--ink)' }}>{window.fmtKr(price)}</div>
      <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{unit}</div>
    </div>
    <span style={{
      width: 22, height: 22, border: '1px solid', borderColor: on ? 'var(--accent)' : 'var(--line-strong)',
      background: on ? 'var(--accent)' : 'transparent', color: 'var(--accent-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'end',
    }}>{on && <window.Icon name="check" size={14} />}</span>
  </div>
);

const LineItem = ({ label, value, muted }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: muted ? 'var(--ink-3)' : 'var(--ink-2)' }}>
    <span style={{ fontSize: 13 }}>{label}</span>
    <span className="num" style={{ fontSize: 13 }}>{window.fmtKr(value)}</span>
  </div>
);

// ---- PAY STEP -----------------------------------------------------------
const PayStep = ({ lang, t, players, greenFee, addonsTotal, fees, total, pay, setPay, split, setSplit, onBack, onPay, addons, holes }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Method */}
        <window.Panel id="$$ 01" title={t('pay_with').toUpperCase()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <PayMethod active={pay === 'vipps'} onClick={() => setPay('vipps')} title="Vipps" sub={lang === 'no' ? 'Mest brukt i Norge' : 'Most popular in Norway'} accent="#FF5B24" />
            <PayMethod active={pay === 'card'} onClick={() => setPay('card')} title={t('card')} sub="Visa · Mastercard · Amex" />
            <PayMethod active={pay === 'invoice'} onClick={() => setPay('invoice')} title={t('invoice')} sub={lang === 'no' ? 'For klubber & bedrifter' : 'For clubs & corporate'} />
          </div>

          {pay === 'vipps' && (
            <div style={{ marginTop: 18, padding: 16, border: '1px solid var(--line-strong)', background: 'var(--bg-2)' }}>
              <div className="micro" style={{ marginBottom: 10 }}>VIPPS · MOBILBETALING</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{lang === 'no' ? 'TELEFONNUMMER' : 'PHONE NUMBER'}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
                    <span className="num" style={{ fontSize: 18, color: 'var(--ink-3)' }}>+47</span>
                    <span className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>948 12 354</span>
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'right' }}>{lang === 'no' ? 'BEKREFT I VIPPS-APPEN' : 'CONFIRM IN VIPPS APP'}</div>
              </div>
            </div>
          )}
          {pay === 'card' && (
            <div style={{ marginTop: 18, padding: 16, border: '1px solid var(--line-strong)', background: 'var(--bg-2)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
              <CardField label={lang === 'no' ? 'KORTNUMMER' : 'CARD NUMBER'} v="•••• •••• •••• 4421" mono />
              <CardField label="CVC" v="•••" mono />
              <CardField label={lang === 'no' ? 'GYLDIG' : 'EXPIRES'} v="08/29" mono />
            </div>
          )}
          {pay === 'invoice' && (
            <div style={{ marginTop: 18, padding: 16, border: '1px solid var(--line-strong)', background: 'var(--bg-2)' }}>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }} className="serif">
                "{lang === 'no' ? 'Sendes til org.nr 998 412 333 — Hassan Consulting AS. Forfall 14 dager.' : 'Sent to org no. 998 412 333 — Hassan Consulting AS. Net 14 days.'}"
              </p>
            </div>
          )}
        </window.Panel>

        {/* Split */}
        <window.Panel id="$$ 02" title={t('split').toUpperCase()} right={<window.Tag tone={split ? 'accent' : 'default'}>{split ? 'ON' : 'OFF'}</window.Tag>}>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-strong)' }}>
            <button onClick={() => setSplit(false)} className="mono click" style={{
              background: !split ? 'var(--surface-2)' : 'transparent', color: !split ? 'var(--ink)' : 'var(--ink-3)',
              border: 0, borderRight: '1px solid var(--line-strong)', padding: '14px 18px', fontSize: 11, letterSpacing: '0.16em',
              cursor: 'pointer', flex: 1, textTransform: 'uppercase',
            }}>{t('pay_for_all')}</button>
            <button onClick={() => setSplit(true)} className="mono click" style={{
              background: split ? 'var(--surface-2)' : 'transparent', color: split ? 'var(--ink)' : 'var(--ink-3)',
              border: 0, padding: '14px 18px', fontSize: 11, letterSpacing: '0.16em',
              cursor: 'pointer', flex: 1, textTransform: 'uppercase',
            }}>{lang === 'no' ? 'Del likt' : 'Split equally'}</button>
          </div>
          {split && (
            <div style={{ display: 'grid', gap: 0, marginTop: 14, border: '1px solid var(--line)' }}>
              {players.map((p, i) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: i < players.length - 1 ? '1px solid var(--line)' : 0 }}>
                  <Avatar name={p.name} you={p.you} />
                  <span style={{ fontSize: 14 }}>{p.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>VIPPS · {p.you ? (lang === 'no' ? 'DEG' : 'YOU') : (lang === 'no' ? 'BE OM' : 'REQUEST')}</span>
                  <span className="num" style={{ fontSize: 14, color: 'var(--accent)' }}>{window.fmtKr(Math.round(total / players.length))}</span>
                </div>
              ))}
            </div>
          )}
        </window.Panel>
      </div>

      {/* RIGHT: total + pay button */}
      <div style={{ display: 'grid', gap: 12, alignSelf: 'flex-start' }}>
        <window.Panel id="$$ 03" title={lang === 'no' ? 'BETALER NÅ' : 'PAYING NOW'}>
          <LineItem label={lang === 'no' ? `Greenfee · ${players.length}×${holes}` : `Green fee · ${players.length}×${holes}`} value={greenFee} />
          <LineItem label={t('add_ons')} value={addonsTotal} />
          <LineItem label={lang === 'no' ? 'Booking-gebyr' : 'Booking fee'} value={fees} muted />
          <hr className="rule" style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span className="micro">{t('total').toUpperCase()}</span>
            <span className="num" style={{ fontSize: 32, fontWeight: 500, color: 'var(--accent)', whiteSpace: 'nowrap', letterSpacing: '-0.03em' }}>{window.fmtKr(total)}</span>
          </div>
          {split && (
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'right', marginTop: 6, letterSpacing: '0.14em' }}>
              {lang === 'no' ? `DU BETALER NÅ · ${window.fmtKr(Math.round(total / players.length))}` : `YOU PAY NOW · ${window.fmtKr(Math.round(total / players.length))}`}
            </div>
          )}
          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <window.TTButton kind="primary" full size="lg" onClick={onPay}>{t('pay_and_book')} →</window.TTButton>
            <window.TTButton kind="bare" full onClick={onBack}>← {lang === 'no' ? 'Tilbake' : 'Back'}</window.TTButton>
          </div>
        </window.Panel>
        <p className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', margin: 0, lineHeight: 1.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {lang === 'no' ? 'Sikker betaling · Stripe · 3DS · Vipps Mobilbetaling AS' : 'Secure payment · Stripe · 3DS · Vipps Mobilbetaling AS'}
        </p>
      </div>
    </div>
  );
};

const PayMethod = ({ active, onClick, title, sub, accent }) => (
  <button onClick={onClick} className="click" style={{
    padding: '18px 16px', textAlign: 'left', cursor: 'pointer',
    background: active ? 'var(--surface-2)' : 'var(--bg-2)',
    border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--line-strong)',
    color: 'var(--ink)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{
        width: 14, height: 14, borderRadius: '50%',
        border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--line-strong)',
        background: active ? 'var(--accent)' : 'transparent',
      }} />
      {accent && <span style={{ width: 24, height: 10, background: accent, borderRadius: 1 }} />}
    </div>
    <div style={{ fontSize: 18 }}>{title}</div>
    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{sub}</div>
  </button>
);

const CardField = ({ label, v }) => (
  <div>
    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{v}</div>
  </div>
);

// ---- DONE STEP -----------------------------------------------------------
const DoneStep = ({ lang, t, c, s, players, total, onSeeCheckin }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
    <window.Panel id="OK" title={lang === 'no' ? 'BEKREFTET' : 'CONFIRMED'} right={<span style={{ whiteSpace: 'nowrap' }}><window.Tag tone="solid">BOOKED</window.Tag></span>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <span style={{ width: 44, height: 44, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <window.Icon name="check" size={26} />
        </span>
        <div>
          <div className="micro">{lang === 'no' ? 'BOOKING-NR' : 'BOOKING'}</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>SL-2026-08471-LSB</div>
        </div>
      </div>
      <h2 className="display" style={{ fontSize: 48, margin: '0 0 12px' }}>
        {c.name.split(' ')[0]}, <em>{lang === 'no' ? 'fredag' : 'Friday'}.</em>
      </h2>
      <p className="serif" style={{ fontSize: 16, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
        "{lang === 'no' ? `Du står på 1. tee kl. ${s.time}. Vi sender en påminnelse 2 timer før — og åpner StrikeLab Caddie automatisk når du sjekker inn.` : `You're on the 1st tee at ${s.time}. We'll remind you 2 hours before — and StrikeLab Caddie opens automatically when you check in.`}"
      </p>
      <hr className="rule" style={{ margin: '20px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Stat2 label={lang === 'no' ? 'KVITTERING' : 'RECEIPT'} value={`#${Math.floor(Math.random() * 9000) + 1000}`} sub={window.fmtKr(total)} />
        <Stat2 label={lang === 'no' ? 'SPILLERE' : 'PLAYERS'} value={`${players.length}`} sub={lang === 'no' ? `${players.length === 4 ? 'Full ball' : 'plass for ' + (4 - players.length)}` : `${4 - players.length} open`} accent />
      </div>
    </window.Panel>

    <window.Panel id="NXT" title={lang === 'no' ? 'NESTE STEG' : 'NEXT STEPS'}>
      <NextStep n="01" t={lang === 'no' ? 'Lagt i kalender' : 'Added to your calendar'} sub="strikelab.app · Apple · Google" done />
      <NextStep n="02" t={lang === 'no' ? 'Spillere varslet' : 'Players notified'} sub={players.map(p => p.name).join(' · ')} done />
      <NextStep n="03" t={lang === 'no' ? 'Caddie Watch klargjort' : 'Caddie Watch prepared'} sub={lang === 'no' ? 'Hullkart, vind, pin-posisjon' : 'Hole map, wind, pin sheet'} />
      <NextStep n="04" t={lang === 'no' ? 'Innsjekk åpner 2t før' : 'Check-in opens 2h before'} sub={lang === 'no' ? '13:30 · QR + 1. tee status' : '13:30 · QR + 1st tee status'} />
      <hr className="rule" style={{ margin: '14px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <window.TTButton kind="primary" full size="lg" onClick={onSeeCheckin}>{lang === 'no' ? 'Til innsjekk' : 'To check-in'} →</window.TTButton>
        <window.TTButton kind="ghost" full>{lang === 'no' ? 'Del booking' : 'Share booking'}</window.TTButton>
      </div>
    </window.Panel>
  </div>
);

const NextStep = ({ n, t, sub, done }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
    <span className="mono" style={{ fontSize: 10, color: done ? 'var(--accent)' : 'var(--ink-4)', letterSpacing: '0.18em' }}>{n}</span>
    <div>
      <div style={{ fontSize: 14 }}>{t}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{sub}</div>
    </div>
    <span className="mono" style={{ fontSize: 10, color: done ? 'var(--accent)' : 'var(--ink-3)', textAlign: 'right', letterSpacing: '0.16em' }}>
      {done ? '● DONE' : '○ PENDING'}
    </span>
  </div>
);

window.BookFlow = BookFlow;
