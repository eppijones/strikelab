// Strikelab · iPhone screens
// 6 screens demonstrating the iPhone as homebase: home, round prep, live round,
// scorecard (the trophy), profile/data import, tee times BETA.

const IPH_W = 390;
const IPH_H = 844;

// ────────────────────────────────────────────────────────────────────────
// 01 · HOME — your golf life at a glance.
// "All your golf, in one place." Greeting + next moment + your rounds.
// ────────────────────────────────────────────────────────────────────────
const IphHome = () => (
  <ABoard w={IPH_W} h={IPH_H}>
    <IPhStatus time="08:52" />

    {/* Top — brand + settings */}
    <div style={{ padding: "14px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <SLogo size={20} color={SU.ink} />
        <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.ink }}>STRIKELAB</span>
      </div>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: SU.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.bell} size={15} color={SU.ink2} />
      </div>
    </div>

    {/* Greeting */}
    <div style={{ padding: "26px 22px 18px" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>FRE · 15 MAI · OSLO</div>
      <div className="su-display" style={{ fontSize: 40, marginTop: 8, color: SU.ink }}>
        God morgen,<br /><em>Espen.</em>
      </div>
    </div>

    {/* THE NEXT THING — one big card */}
    <div style={{ margin: "0 18px", borderRadius: 22, overflow: "hidden", background: SU.s2, border: `1px solid ${SU.line2}` }}>
      <div style={{ padding: "16px 18px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>NESTE · I DAG 14:50</div>
        <Pill color={SU.lime}>BOOKED</Pill>
      </div>
      <div style={{ padding: "4px 18px 16px" }}>
        <div className="su-display" style={{ fontSize: 30, color: SU.ink, marginTop: 2 }}>
          Losby GK<br /><span className="su-serif" style={{ color: SU.ink2, fontSize: 22 }}>18 hull · gul tee</span>
        </div>
      </div>
      {/* weather + course strip */}
      <div style={{ borderTop: `1px solid ${SU.line}`, display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          ["TEMP",   "14°"],
          ["WIND",   "SW · 4"],
          ["RAIN",   "0.0"],
          ["LIGHT",  "GOOD"],
        ].map(([k,v], i) => (
          <div key={k} style={{ padding: "10px 8px", borderRight: i < 3 ? `1px solid ${SU.line}` : 0, textAlign: "center" }}>
            <div className="su-mono" style={{ fontSize: 8, letterSpacing: "0.2em", color: SU.ink3 }}>{k}</div>
            <div className="su-mono" style={{ fontSize: 13, color: SU.ink, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <button style={{
        width: "100%", border: 0, background: SU.lime, color: SU.bg, padding: "14px",
        fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
      }}>
        <Ico d={ICONS.flag} size={13} color={SU.bg} sw={1.8} />
        Start runde
      </button>
    </div>

    {/* This week strip */}
    <div style={{ padding: "22px 22px 6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>DENNE UKEN</div>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>HCP 11.5 · ↓0.4</div>
    </div>
    <div style={{ padding: "0 18px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {[
        ["RUNDER",  "2",  SU.ink],
        ["ØKTER",   "1",  SU.ink],
        ["SLAG",    "186",SU.ink],
      ].map(([k,v,c]) => (
        <div key={k} style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, padding: "12px 14px" }}>
          <div className="su-mono" style={{ fontSize: 8, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
          <div className="su-mono" style={{ fontSize: 22, color: c, marginTop: 4, letterSpacing: "-0.02em" }}>{v}</div>
        </div>
      ))}
    </div>

    {/* Insight from the AI */}
    <div style={{ margin: "16px 18px 0", padding: "16px 18px", background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dot color={SU.lime} /> CADDIE · NOTAT</span>
        </div>
        <span className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.18em" }}>AUTO</span>
      </div>
      <p className="su-serif" style={{ fontSize: 17, color: SU.ink, margin: "10px 0 0", lineHeight: 1.35 }}>
        "Par-3 har vært ditt beste segment i mai — +0.4 i snitt. Hold på den."
      </p>
    </div>

    <IPhTabbar active="home" />
  </ABoard>
);

// ────────────────────────────────────────────────────────────────────────
// 02 · LIVE ROUND — phone mirror of the watch. Pure scorecard mode.
// Watch is the primary driver; phone is the bigger, calmer view of the
// same hole. Bottom dock = full scorecard, shot log, GPS.
// ────────────────────────────────────────────────────────────────────────
const IphLive = () => (
  <ABoard w={IPH_W} h={IPH_H}>
    <IPhStatus time="14:55" tracking />

    {/* Tiny header */}
    <div style={{ padding: "10px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: SU.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico d={ICONS.chev} size={11} color={SU.ink2} sw={2} style={{ transform: "rotate(180deg)" }} />
        </div>
        <div>
          <div className="su-mono" style={{ fontSize: 10, color: SU.ink2, letterSpacing: "0.2em" }}>LOSBY GK · GUL</div>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.18em" }}>RUNDE · 1.05.32</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Pill color={SU.lime}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><Dot color={SU.lime}/>WATCH</span></Pill>
      </div>
    </div>

    {/* HOLE HERO — mirrors watch */}
    <div style={{ padding: "18px 22px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.lime }}>HULL 7 · PAR 4</div>
        <div className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.ink3 }}>HCP 5</div>
      </div>
      <div className="su-display" style={{ fontSize: 220, color: SU.ink, marginTop: 6, lineHeight: 0.85, letterSpacing: "-0.06em", textAlign: "center" }}>
        4
      </div>
      <div className="su-mono" style={{ textAlign: "center", color: SU.ink2, fontSize: 13, marginTop: -8, letterSpacing: "0.18em" }}>
        PAR · 2 PUTTS · 7I
      </div>
    </div>

    {/* Distance strip — quick GPS */}
    <div style={{ margin: "22px 22px 0", border: `1px solid ${SU.line2}`, borderRadius: 14, overflow: "hidden", background: SU.s1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          ["FRONT",  "138"],
          ["MIDDLE", "147"],
          ["BACK",   "156"],
        ].map(([k,v], i) => (
          <div key={k} style={{ padding: "12px 8px", borderRight: i < 2 ? `1px solid ${SU.line2}` : 0, textAlign: "center" }}>
            <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
            <div className="su-mono" style={{ fontSize: 26, color: SU.ink, marginTop: 4, letterSpacing: "-0.02em" }}>{v}<span style={{fontSize:11, color: SU.ink3}}>m</span></div>
          </div>
        ))}
      </div>
    </div>

    {/* Front 9 chip row */}
    <div style={{ padding: "20px 22px 0" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>SCORE · FRONT 9</span>
        <span style={{ color: SU.lime }}>E · 1/18</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
        {[
          ["1","3","par"],["2","4","-1"],["3","5","par"],["4","3","par"],["5","-",""],["6","-",""],["7","4","cur"],["8","-",""],["9","-",""],
        ].map(([h,s,t]) => {
          const cur = t === "cur";
          const done = s !== "-";
          const eagle = t === "-1";
          return (
            <div key={h} style={{
              background: cur ? SU.lime : (done ? SU.s2 : SU.s1),
              border: `1px solid ${cur ? SU.lime : (done ? SU.line2 : SU.line)}`,
              borderRadius: 5, padding: "6px 0", textAlign: "center",
            }}>
              <div className="su-mono" style={{ fontSize: 8, color: cur ? SU.bg : SU.ink3, letterSpacing: "0.15em" }}>{h}</div>
              <div className="su-mono" style={{ fontSize: 14, color: cur ? SU.bg : (eagle ? SU.lime : SU.ink), marginTop: 2 }}>{s}</div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Shot log */}
    <div style={{ padding: "18px 22px 0" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginBottom: 8 }}>SHOT LOG · HULL 7</div>
      <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, overflow: "hidden" }}>
        {[
          ["1", "Driver",  "238m", "fairway"],
          ["2", "7-jern",  "147m", "green"],
          ["3", "Putter",  "4.2m", "lip"],
          ["4", "Putter",  "0.4m", "holed"],
        ].map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "20px 1fr 60px 70px",
            padding: "10px 14px", borderBottom: i < 3 ? `1px solid ${SU.line}` : 0,
            alignItems: "center",
          }}>
            <span className="su-mono" style={{ fontSize: 10, color: SU.ink3 }}>{r[0]}</span>
            <span style={{ fontSize: 13, color: SU.ink }}>{r[1]}</span>
            <span className="su-mono" style={{ fontSize: 12, color: SU.ink2, textAlign: "right" }}>{r[2]}</span>
            <span className="su-mono" style={{ fontSize: 9, color: r[3]==="holed" ? SU.lime : SU.ink3, letterSpacing: "0.18em", textAlign: "right", textTransform: "uppercase" }}>{r[3]}</span>
          </div>
        ))}
      </div>
    </div>

    <IPhTabbar active="home" />
  </ABoard>
);

// ────────────────────────────────────────────────────────────────────────
// 03 · ROUND PREP — refined course pick. Quieter, more confident than current.
// ────────────────────────────────────────────────────────────────────────
const IphPrep = () => (
  <ABoard w={IPH_W} h={IPH_H}>
    <IPhStatus time="08:52" />
    <div style={{ padding: "12px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: SU.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.chev} size={14} color={SU.ink2} sw={2} style={{ transform: "rotate(180deg)" }} />
      </div>
      <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.ink3 }}>NY RUNDE</span>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: SU.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.gear} size={14} color={SU.ink2} />
      </div>
    </div>

    <div style={{ padding: "22px 22px 0" }}>
      <div className="su-display" style={{ fontSize: 38, color: SU.ink }}>
        Hvor spiller<br /><em>du i dag?</em>
      </div>
    </div>

    {/* Search */}
    <div style={{ padding: "20px 18px 0" }}>
      <div style={{
        background: SU.lime, color: SU.bg, borderRadius: 14,
        padding: "16px 18px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <Ico d={ICONS.search} size={16} color={SU.bg} sw={2} />
        <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em" }}>SØK · 40 000+ BANER</span>
        <span style={{ marginLeft: "auto" }}>
          <Ico d={ICONS.globe} size={16} color={SU.bg} />
        </span>
      </div>
    </div>

    {/* Recent / saved courses */}
    <div style={{ padding: "22px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>MINE BANER</div>
      <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>+ EGEN</div>
    </div>

    <div style={{ padding: "0 18px", display: "grid", gap: 10 }}>
      {[
        { name: "Losby GK",     loc: "Lørenskog · 14 min",  par: 71, sel: true,  fav: true },
        { name: "Grini GK",     loc: "Bærum · 22 min",      par: 70, sel: false, fav: true },
        { name: "Oslo GK",      loc: "Bogstad · 9 min",     par: 72, sel: false, fav: false },
      ].map((c) => (
        <div key={c.name} style={{
          background: c.sel ? "rgba(170,210,90,0.05)" : SU.s1,
          border: `1px solid ${c.sel ? SU.lime : SU.line}`,
          borderRadius: 14,
          padding: "14px 16px",
          display: "grid", gridTemplateColumns: "1fr auto auto",
          alignItems: "center", gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 15, color: SU.ink, fontWeight: 500 }}>
              {c.name} <span className="su-mono" style={{ fontSize: 11, color: SU.ink3 }}>· PAR {c.par}</span>
            </div>
            <div className="su-mono" style={{ fontSize: 11, color: SU.ink3, marginTop: 4, letterSpacing: "0.08em" }}>{c.loc}</div>
          </div>
          {c.sel
            ? <div style={{ width: 22, height: 22, borderRadius: 11, background: SU.lime, display: "flex", alignItems: "center", justifyContent: "center" }}><Ico d={ICONS.check} size={11} color={SU.bg} sw={2.5} /></div>
            : <div style={{ width: 22, height: 22 }} />}
          <Ico d={ICONS.swing} size={16} color={c.fav ? SU.lime : SU.ink4} fill={c.fav ? SU.lime : "none"} />
        </div>
      ))}
    </div>

    {/* Tee + Format */}
    <div style={{ padding: "20px 22px 6px", display: "flex", justifyContent: "space-between" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>TEE</div>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>FORMAT</div>
    </div>
    <div style={{ padding: "0 18px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8 }}>
      <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, padding: "12px 14px" }}>
        <div className="su-mono" style={{ fontSize: 11, color: SU.ink, letterSpacing: "0.06em" }}>GUL · MEN</div>
        <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginTop: 6 }}>SLOPE 132 · CR 70.4</div>
      </div>
      {[["18","FULL"],["9","FRONT"]].map(([n, l], i) => (
        <div key={l} style={{
          background: i===0 ? SU.lime : SU.s1,
          border: `1px solid ${i===0 ? SU.lime : SU.line}`,
          borderRadius: 12, padding: "12px 0", textAlign: "center",
        }}>
          <div className="su-mono" style={{ fontSize: 18, color: i===0 ? SU.bg : SU.ink }}>{n}</div>
          <div className="su-mono" style={{ fontSize: 9, color: i===0 ? SU.bg : SU.ink3, letterSpacing: "0.22em", marginTop: 2 }}>{l}</div>
        </div>
      ))}
    </div>

    {/* Group strip */}
    <div style={{ padding: "20px 22px 0" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginBottom: 8 }}>GRUPPE · 1 / 4</div>
      <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, padding: "10px 14px", display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: SU.lime, color: SU.bg, fontFamily: "Geist Mono", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>EH</div>
          <div>
            <div style={{ fontSize: 14, color: SU.ink }}>Espen Horne</div>
            <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginTop: 2 }}>WATCH · BIO · SHOTS</div>
          </div>
          <span className="su-mono" style={{ fontSize: 13, color: SU.lime }}>11.5</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px dashed ${SU.line2}`, color: SU.lime }}>
          <Ico d={ICONS.plus} size={14} color={SU.lime} sw={2} />
          <span style={{ fontSize: 13 }}>Legg til gjest</span>
          <span className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginLeft: "auto" }}>SCORE ONLY</span>
        </div>
      </div>
    </div>

    {/* Big start */}
    <div style={{ position: "absolute", bottom: 96, left: 18, right: 18 }}>
      <button style={{
        width: "100%", background: SU.lime, color: SU.bg, border: 0, borderRadius: 14,
        padding: "16px", fontFamily: "Geist Mono", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        <Ico d={ICONS.flag} size={14} color={SU.bg} sw={1.8} />
        Start runde
        <Ico d={ICONS.arrow} size={14} color={SU.bg} sw={2} />
      </button>
    </div>

    <IPhTabbar active="home" />
  </ABoard>
);

// ────────────────────────────────────────────────────────────────────────
// 04 · SCORECARD — the trophy moment. The most beautiful screen in the app.
// ────────────────────────────────────────────────────────────────────────
const IphScorecard = () => {
  const front = [
    { h:1, par:3, sc:3, t:"par"},
    { h:2, par:3, sc:2, t:"bird"},
    { h:3, par:3, sc:4, t:"bog"},
    { h:4, par:3, sc:3, t:"par"},
    { h:5, par:3, sc:3, t:"par"},
    { h:6, par:3, sc:5, t:"dbog"},
    { h:7, par:3, sc:3, t:"par"},
    { h:8, par:3, sc:4, t:"bog"},
    { h:9, par:3, sc:3, t:"par"},
  ];
  const back = [
    { h:10, par:3, sc:3, t:"par"},
    { h:11, par:3, sc:3, t:"par"},
    { h:12, par:3, sc:4, t:"bog"},
    { h:13, par:3, sc:2, t:"bird"},
    { h:14, par:3, sc:3, t:"par"},
    { h:15, par:3, sc:3, t:"par"},
    { h:16, par:3, sc:5, t:"dbog"},
    { h:17, par:3, sc:3, t:"par"},
    { h:18, par:3, sc:3, t:"par"},
  ];
  const tone = (t) => ({
    par:  { ring: "transparent", color: SU.ink },
    bird: { ring: SU.lime,       color: SU.lime },
    bog:  { ring: SU.warn,       color: SU.warn },
    dbog: { ring: SU.bad,        color: SU.bad },
  }[t]);
  const sumPar = (xs) => xs.reduce((a,b)=>a+b.par,0);
  const sumSc  = (xs) => xs.reduce((a,b)=>a+b.sc,0);

  const Cell = ({h}) => {
    const c = tone(h.t);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <div className="su-mono" style={{ fontSize: 9, color: SU.ink3 }}>{h.h}</div>
        <div style={{
          width: 26, height: 26, borderRadius: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1.5px solid ${c.ring}`,
          background: h.t === "bird" ? "rgba(170,210,90,0.07)" : "transparent",
        }}>
          <span className="su-mono" style={{ fontSize: 13, color: c.color, fontWeight: 500 }}>{h.sc}</span>
        </div>
        <div className="su-mono" style={{ fontSize: 8, color: SU.ink4 }}>{h.par}</div>
      </div>
    );
  };

  return (
    <ABoard w={IPH_W} h={IPH_H}>
      <IPhStatus time="13:42" />

      <div style={{ padding: "10px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.lime }}>RUNDE · FERDIG</span>
        <Ico d={ICONS.share} size={16} color={SU.ink2} />
      </div>

      {/* Hero — the score */}
      <div style={{ padding: "16px 22px 0", textAlign: "center" }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>LOSBY GK · 15 MAI 2026 · GUL</div>
        <div className="su-display" style={{ fontSize: 140, color: SU.ink, marginTop: 4, lineHeight: 0.9, letterSpacing: "-0.06em" }}>
          84
        </div>
        <div style={{ marginTop: -10, display: "flex", justifyContent: "center", gap: 22 }}>
          <Stat2 k="TO PAR" v="+13" color={SU.warn} />
          <Stat2 k="NET" v="73" color={SU.lime} />
          <Stat2 k="STBLF" v="32" color={SU.ink} />
        </div>
      </div>

      {/* Spark sparkbar */}
      <div style={{ margin: "22px 22px 0" }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>HULL FOR HULL</span>
          <span>2 BIRD · 9 PAR · 5 BOG · 2 DBL</span>
        </div>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 14, padding: "14px 12px" }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink4, letterSpacing: "0.2em", marginBottom: 8, display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
            <span>F9 · 30 (+3)</span>
            <span>B9 · 29 (+2)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
            {front.map(h => <Cell key={h.h} h={h}/>)}
          </div>
          <div style={{ height: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
            {back.map(h => <Cell key={h.h} h={h}/>)}
          </div>
        </div>
      </div>

      {/* Streaks / detail */}
      <div style={{ margin: "16px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, padding: "12px 14px" }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>PUTTS</div>
          <div className="su-mono" style={{ fontSize: 24, color: SU.ink, marginTop: 4, letterSpacing: "-0.02em" }}>31</div>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginTop: 4 }}>1.72 / HULL</div>
        </div>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, padding: "12px 14px" }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>FAIRWAY</div>
          <div className="su-mono" style={{ fontSize: 24, color: SU.ink, marginTop: 4, letterSpacing: "-0.02em" }}>9<span style={{ fontSize: 13, color: SU.ink3 }}>/14</span></div>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginTop: 4 }}>64% TRUFFET</div>
        </div>
      </div>

      {/* Caddie line */}
      <div style={{ margin: "16px 22px 0", padding: "16px 18px", background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 14 }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em", display: "flex", alignItems: "center", gap: 6 }}>
          <Dot color={SU.lime}/> CADDIE
        </div>
        <p className="su-serif" style={{ fontSize: 17, margin: "10px 0 0", color: SU.ink, lineHeight: 1.35 }}>
          "Beste front-9 din i mai. Putten holdt seg. Hold på 7-jernet."
        </p>
      </div>

      {/* CTA strip */}
      <div style={{ position: "absolute", bottom: 96, left: 18, right: 18, display: "flex", gap: 8 }}>
        <button style={{
          flex: 1, background: SU.lime, color: SU.bg, border: 0, borderRadius: 14,
          padding: "14px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
        }}>SIGNER & LAGRE</button>
        <button style={{
          background: SU.s2, color: SU.ink, border: `1px solid ${SU.line2}`, borderRadius: 14,
          padding: "14px 18px",
        }}>
          <Ico d={ICONS.share} size={14} color={SU.ink} />
        </button>
      </div>

      <IPhTabbar active="score" />
    </ABoard>
  );
};

const Stat2 = ({ k, v, color }) => (
  <div style={{ textAlign: "center" }}>
    <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
    <div className="su-mono" style={{ fontSize: 16, color, marginTop: 4 }}>{v}</div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────
// 05 · PROFILE — "your golf, all in one place". Data sources + uploads.
// The thesis screen: this is where StrikeLab as homebase comes to life.
// ────────────────────────────────────────────────────────────────────────
const IphProfile = () => (
  <ABoard w={IPH_W} h={IPH_H}>
    <IPhStatus time="08:52" />

    <div style={{ padding: "10px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.ink3 }}>PROFIL</span>
      <Ico d={ICONS.gear} size={16} color={SU.ink2} />
    </div>

    {/* Identity */}
    <div style={{ padding: "20px 22px 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 28, background: SU.lime, color: SU.bg, fontFamily: "Geist Mono", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>EH</div>
      <div>
        <div className="su-display" style={{ fontSize: 24, color: SU.ink }}>Espen Horne</div>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginTop: 4 }}>OSLO GK · MEDLEM SIDEN 2021</div>
      </div>
    </div>

    {/* The big numbers — your golf */}
    <div style={{ margin: "22px 18px 0", border: `1px solid ${SU.line2}`, borderRadius: 16, overflow: "hidden", background: SU.s1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${SU.line2}` }}>
        <div style={{ padding: "16px 18px", borderRight: `1px solid ${SU.line2}` }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>HANDICAP</div>
          <div className="su-display" style={{ fontSize: 44, color: SU.ink, marginTop: 4 }}>11.5</div>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.2em", marginTop: 2 }}>↓ 0.4 / 30D</div>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>RUNDER · 2026</div>
          <div className="su-display" style={{ fontSize: 44, color: SU.ink, marginTop: 4 }}>12</div>
          <div className="su-mono" style={{ fontSize: 10, color: SU.ink2, letterSpacing: "0.2em", marginTop: 2 }}>SNITT 86.3</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[["SLAG","1 842"],["ØKTER","18"],["BANER","7"]].map(([k,v],i)=>(
          <div key={k} style={{ padding: "12px 12px", borderRight: i<2?`1px solid ${SU.line2}`:0, textAlign: "center" }}>
            <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
            <div className="su-mono" style={{ fontSize: 18, color: SU.ink, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Data sources — the homebase pitch */}
    <div style={{ padding: "20px 22px 6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>DATA · KILDER</div>
      <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>+ LEGG TIL</div>
    </div>
    <div style={{ padding: "0 18px", display: "grid", gap: 8 }}>
      {[
        { name: "Apple Watch Ultra",  status: "tilkoblet", sub: "1 842 slag · siden mars 2024", on: true,  tag: "PRIMÆR" },
        { name: "TrackMan · Miklagard", status: "siste · 12. mai", sub: "18 økter · 1 026 slag",  on: true,  tag: "RANGE" },
        { name: "Topgolf · Oslo",     status: "siste · 04. mai", sub: "3 sesjoner",            on: true,  tag: "CASUAL" },
        { name: "Golfbox · scorekort", status: "siste · 12. mai", sub: "32 runder importert",   on: true,  tag: "RUNDE" },
        { name: "Last opp scorekort", status: "manuell", sub: "PDF · bilde · CSV — vi leser det",       on: false, tag: "ANY" },
      ].map((s, i) => (
        <div key={s.name} style={{
          background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12,
          padding: "12px 14px", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: SU.bg,
            border: `1px solid ${s.on ? SU.line2 : SU.line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ico d={i===0?ICONS.watch:i===1?ICONS.target:i===2?ICONS.fire:i===3?ICONS.calendar:ICONS.upload} size={14} color={s.on?SU.lime:SU.ink3} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: SU.ink, display: "flex", alignItems: "center", gap: 8 }}>
              {s.name}
              <span className="su-mono" style={{ fontSize: 8, color: SU.ink3, letterSpacing: "0.2em", padding: "1px 5px", border: `1px solid ${SU.line2}`, borderRadius: 2 }}>{s.tag}</span>
            </div>
            <div className="su-mono" style={{ fontSize: 10, color: s.on?SU.ink2:SU.ink3, letterSpacing: "0.06em", marginTop: 3 }}>
              {s.status} · <span style={{ color: SU.ink3 }}>{s.sub}</span>
            </div>
          </div>
          {s.on
            ? <Dot color={SU.lime} size={7}/>
            : <Ico d={ICONS.plus} size={14} color={SU.lime} sw={2}/>}
        </div>
      ))}
    </div>

    <IPhTabbar active="me" />
  </ABoard>
);

// ────────────────────────────────────────────────────────────────────────
// 06 · TEE TIMES BETA — Golfbox preview. Pure list, calm, "coming soon".
// ────────────────────────────────────────────────────────────────────────
const IphTee = () => (
  <ABoard w={IPH_W} h={IPH_H}>
    <IPhStatus time="08:52" />

    <div style={{ padding: "10px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.ink3 }}>TEE-TIDER</span>
      <Pill color={SU.warn}>BETA · GOLFBOX</Pill>
    </div>

    <div style={{ padding: "16px 22px 0" }}>
      <div className="su-display" style={{ fontSize: 30, color: SU.ink }}>
        Bestill <em>direkte.</em>
      </div>
      <p style={{ fontSize: 13, color: SU.ink2, lineHeight: 1.5, marginTop: 8, maxWidth: 320 }}>
        Synkronisert med Golfbox. Vi finner ledig tid på banene du liker — og holder den varm.
      </p>
    </div>

    {/* When + where */}
    <div style={{ padding: "20px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[
        ["NÅR", "I dag · ettermiddag", ICONS.calendar],
        ["HVOR","Oslo · 20 km",        ICONS.pin],
      ].map(([k,v,ic]) => (
        <div key={k} style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, padding: "12px 14px" }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Ico d={ic} size={13} color={SU.ink2} />
            <span style={{ fontSize: 13, color: SU.ink }}>{v}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Available list */}
    <div style={{ padding: "20px 22px 8px", display: "flex", justifyContent: "space-between" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>LEDIG · 24 TIDER</div>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>SORTER ↓</div>
    </div>

    <div style={{ padding: "0 18px", display: "grid", gap: 8 }}>
      {[
        { t:"14:50", n:"Losby GK",     fee:"450",   p:"4/4", pri: true, hot: true },
        { t:"15:10", n:"Losby GK",     fee:"450",   p:"2/4", pri: true, hot: false },
        { t:"15:30", n:"Grini GK",     fee:"520",   p:"1/4", pri: false },
        { t:"16:00", n:"Tyrifjord GK", fee:"380",   p:"4/4", pri: false },
        { t:"16:20", n:"Oslo GK",      fee:"650",   p:"3/4", pri: false },
      ].map((r, i) => (
        <div key={i} style={{
          background: r.pri ? "rgba(170,210,90,0.04)" : SU.s1,
          border: `1px solid ${r.pri ? SU.lime : SU.line}`,
          borderRadius: 12, padding: "12px 14px",
          display: "grid", gridTemplateColumns: "62px 1fr auto auto", alignItems: "center", gap: 10,
        }}>
          <div>
            <div className="su-mono" style={{ fontSize: 20, color: r.pri ? SU.lime : SU.ink, letterSpacing: "-0.02em" }}>{r.t}</div>
            {r.hot && <div className="su-mono" style={{ fontSize: 8, color: SU.warn, letterSpacing: "0.22em", marginTop: 2 }}>HOT</div>}
          </div>
          <div>
            <div style={{ fontSize: 13, color: SU.ink }}>{r.n}</div>
            <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.1em", marginTop: 3 }}>
              {r.fee} kr · {r.p} spillere
            </div>
          </div>
          <Ico d={ICONS.chev} size={14} color={r.pri ? SU.lime : SU.ink3} />
        </div>
      ))}
    </div>

    {/* Shot planner teaser */}
    <div style={{ position: "absolute", bottom: 96, left: 18, right: 18 }}>
      <div style={{ background: SU.s2, border: `1px solid ${SU.line2}`, borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="su-mono" style={{ fontSize: 10, color: SU.warn, letterSpacing: "0.22em" }}>SHOT PLANNER · BETA</div>
          <div style={{ fontSize: 13, color: SU.ink, marginTop: 4 }}>Planlegg hvert slag før du går ut</div>
        </div>
        <Ico d={ICONS.arrow} size={16} color={SU.ink2} />
      </div>
    </div>

    <IPhTabbar active="tee" />
  </ABoard>
);

Object.assign(window, { IphHome, IphLive, IphPrep, IphScorecard, IphProfile, IphTee, IPH_W, IPH_H });
