// Strikelab · Web surfaces.
// 1) strikelab.golf — landing / homepage
// 2) strikelab.golf/home — your golf life on the big canvas
// 3) strikelab.golf/round/[id] — one round in detail

const WEB_W = 1440;
const WEB_H = 900;

// shared browser chrome (no real OS chrome, just a thin top bar)
const WebShell = ({ children, url = "strikelab.golf", w = WEB_W, h = WEB_H, bg = SU.bg }) => (
  <div style={{ width: w, height: h, background: bg, color: SU.ink, fontFamily: "Geist, sans-serif", overflow: "hidden", position: "relative" }}>
    <div style={{ height: 32, background: "#181a18", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderBottom: `1px solid ${SU.line}` }}>
      <div style={{ display: "flex", gap: 6 }}>
        {["#ed6a5e","#f5bf4f","#62c554"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }}/>)}
      </div>
      <div style={{ background: SU.bg, border: `1px solid ${SU.line2}`, color: SU.ink3, fontFamily: "Geist Mono", fontSize: 10, letterSpacing: "0.1em", padding: "3px 12px", borderRadius: 4, marginLeft: 14, minWidth: 280 }}>
        {url}
      </div>
    </div>
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────────────────
// 01 · LANDING — strikelab.golf
// "Your golf, all in one place." Dark editorial + bone story.
// ────────────────────────────────────────────────────────────────────────
const WebLanding = () => (
  <WebShell url="strikelab.golf">
    {/* NAV */}
    <div style={{ padding: "20px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${SU.line2}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SLogo size={22}/>
        <span className="su-mono" style={{ fontSize: 12, letterSpacing: "0.22em" }}>STRIKELAB</span>
      </div>
      <div style={{ display: "flex", gap: 36 }}>
        {["HVA DU FÅR","BANER","WATCH","TEE-TIDER","PRISER"].map(x => (
          <span key={x} className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>{x}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>LOGG INN</span>
        <span className="su-mono" style={{ background: SU.lime, color: SU.bg, padding: "9px 14px", fontSize: 10, letterSpacing: "0.22em" }}>LAST NED →</span>
      </div>
    </div>

    {/* HERO */}
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 0 }}>
      <div style={{ padding: "80px 56px 0", borderRight: `1px solid ${SU.line2}`, position: "relative" }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.24em", marginBottom: 16 }}>NORGE · BETA · MAI 2026</div>
        <h1 className="su-display" style={{ fontSize: 102, margin: 0, color: SU.ink }}>
          All golfen din.<br /><em>På ett sted.</em>
        </h1>
        <p style={{ fontSize: 16, color: SU.ink2, lineHeight: 1.55, marginTop: 22, maxWidth: 460 }}>
          Apple Watch sporer hvert slag og hver score. iPhone husker hver runde. Web-en gir deg hele bildet. Tee-tider, scorekort, treningsdata — i ett system.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
          <button style={{ background: SU.lime, color: SU.bg, border: 0, padding: "15px 22px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" }}>Last ned · gratis →</button>
          <button style={{ background: "transparent", color: SU.ink, border: `1px solid ${SU.line2}`, padding: "15px 22px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" }}>Se demo</button>
        </div>
        <div style={{ marginTop: 56, display: "flex", gap: 40, paddingBottom: 40 }}>
          <Stat label="NORSKE BANER" value="156" />
          <Stat label="APPLE WATCH" value="Ultra · S10 · SE" />
          <Stat label="PRIS" value="Gratis" sub="Pro fra 79 kr/mnd" />
        </div>
      </div>

      {/* Hero phone + watch composition */}
      <div style={{ background: "linear-gradient(180deg, #0e100f, #0a0b0a)", padding: "60px 36px", display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <div style={{ transform: "scale(0.74)", transformOrigin: "center" }}>
          <ABoard w={IPH_W} h={IPH_H}>
            <IPhStatus time="14:55" tracking />
            <div style={{ padding: "10px 22px 0" }}>
              <div className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.lime }}>HULL 7 · PAR 4</div>
            </div>
            <div className="su-display" style={{ fontSize: 220, color: SU.ink, textAlign: "center", lineHeight: 0.85, letterSpacing: "-0.06em", marginTop: 14 }}>4</div>
            <div className="su-mono" style={{ textAlign: "center", color: SU.ink2, fontSize: 13, marginTop: -2, letterSpacing: "0.18em" }}>PAR · 2 PUTTS · 7I</div>
            <div style={{ margin: "32px 22px 0", border: `1px solid ${SU.line2}`, borderRadius: 14, overflow: "hidden", background: SU.s1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
                {[["F","138"],["M","147"],["B","156"]].map(([k,v], i) => (
                  <div key={k} style={{ padding: "12px 8px", borderRight: i < 2 ? `1px solid ${SU.line2}` : 0, textAlign: "center" }}>
                    <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
                    <div className="su-mono" style={{ fontSize: 28, color: SU.ink, marginTop: 4 }}>{v}<span style={{fontSize:12, color: SU.ink3}}>m</span></div>
                  </div>
                ))}
              </div>
            </div>
          </ABoard>
        </div>
        <div style={{ transform: "translateY(-50px) scale(0.95)" }}>
          <WatchFrame w={200} h={240}>
            <WatchStrokes />
          </WatchFrame>
        </div>
      </div>
    </div>

    {/* BONE — three pillars */}
    <div style={{ background: SU.bone, color: SU.boneInk, padding: "72px 56px" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.boneInk2, letterSpacing: "0.24em" }}>HVA DU FÅR</div>
      <h2 className="su-display" style={{ fontSize: 56, margin: "14px 0 0", color: SU.boneInk, maxWidth: 880 }}>
        Tre ting. <em>Ingen flere.</em>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, marginTop: 48 }}>
        <Pillar tag="01 · WATCH" title="Sjelden caddie. Konstant score." body="Apple Watch teller hvert slag og hver putt — pluss klubb, GPS og puls. Du ser sjelden på telefonen mens du spiller. Strikelab er der likevel."/>
        <Pillar tag="02 · IPHONE" title="Alle rundene dine. Lagret pent." body="Hver runde havner her — Apple Watch, Trackman, Topgolf, eller et papir-scorekort du fotograferer. Vi leser det. Du eier dataen."/>
        <Pillar tag="03 · WEB" title="Det store bildet." body="Statistikk, trender og treningsdata på en større skjerm. Importer fra Golfbox eller dra inn en CSV. Klar når du har tid til å se nærmere."/>
      </div>
    </div>

    {/* Coming soon strip */}
    <div style={{ background: SU.bone2, padding: "32px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${SU.boneLine}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Pill color={SU.warn}>SOMMER 2026 · BETA</Pill>
        <span className="su-display" style={{ fontSize: 28, color: SU.boneInk }}>
          Tee-tider og shot planner <em>direkte i appen.</em>
        </span>
      </div>
      <span className="su-mono" style={{ fontSize: 11, color: SU.boneInk2, letterSpacing: "0.22em" }}>FÅ BESKJED →</span>
    </div>
  </WebShell>
);

const Stat = ({ label, value, sub }) => (
  <div>
    <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{label}</div>
    <div style={{ fontSize: 18, color: SU.ink, fontWeight: 500, marginTop: 6 }}>{value}</div>
    {sub && <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.18em", marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pillar = ({ tag, title, body }) => (
  <div style={{ borderTop: `1px solid ${SU.boneLine}`, paddingTop: 20 }}>
    <span className="su-mono" style={{ fontSize: 10, color: SU.limeOn, letterSpacing: "0.22em" }}>{tag}</span>
    <div className="su-display" style={{ fontSize: 28, color: SU.boneInk, marginTop: 14, lineHeight: 1.1 }}>{title}</div>
    <p style={{ fontSize: 14, color: SU.boneInk2, lineHeight: 1.6, marginTop: 12 }}>{body}</p>
  </div>
);

// ────────────────────────────────────────────────────────────────────────
// 02 · WEB DASHBOARD — strikelab.golf/home
// Your golf life on the big canvas. Reads as a quiet, premium command center.
// ────────────────────────────────────────────────────────────────────────
const WebDashboard = () => (
  <WebShell url="strikelab.golf/home">
    {/* APP NAV */}
    <div style={{ padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${SU.line2}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <SLogo size={20}/>
        <div style={{ display: "flex", gap: 28 }}>
          {[["HJEM",true],["RUNDER",false],["TRENING",false],["BANER",false],["TEE-TIDER · BETA",false]].map(([k,a])=>(
            <span key={k} className="su-mono" style={{
              fontSize: 11, letterSpacing: "0.22em",
              color: a ? SU.ink : SU.ink3,
              borderBottom: a ? `1px solid ${SU.lime}` : "1px solid transparent",
              paddingBottom: 6,
            }}>{k}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>FRE · 15 MAI</span>
        <div style={{ width: 28, height: 28, borderRadius: 14, background: SU.lime, color: SU.bg, fontFamily: "Geist Mono", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>EH</div>
      </div>
    </div>

    {/* HERO row — greeting + next thing */}
    <div style={{ padding: "40px 48px 24px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "flex-start" }}>
      <div>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>GOD ETTERMIDDAG · 14:08</div>
        <div className="su-display" style={{ fontSize: 64, marginTop: 10 }}>
          Espen, <em>klar for runde?</em>
        </div>
        <p style={{ fontSize: 15, color: SU.ink2, lineHeight: 1.5, marginTop: 12, maxWidth: 540 }}>
          Du har 14:50 på Losby. Vi gjør klar scorekortet og synker watch-en når du ankommer.
        </p>
      </div>

      <div style={{ background: SU.s1, border: `1px solid ${SU.lime}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>NESTE TEE · 14:50</div>
          <Pill color={SU.lime}>BOOKED</Pill>
        </div>
        <div className="su-display" style={{ fontSize: 32, marginTop: 10 }}>Losby GK</div>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.18em", marginTop: 6 }}>18 HULL · GUL TEE · 4-BALL</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: 14, gap: 0, borderTop: `1px solid ${SU.line}` }}>
          {[["TEMP","14°"],["VIND","SW · 4"],["NEDB.","0.0"],["LYS","GOOD"]].map(([k,v],i)=>(
            <div key={k} style={{ padding: "10px 6px", borderRight: i<3?`1px solid ${SU.line}`:0, textAlign: "center" }}>
              <div className="su-mono" style={{ fontSize: 8, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
              <div className="su-mono" style={{ fontSize: 13, color: SU.ink, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Stat strip */}
    <div style={{ padding: "0 48px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", border: `1px solid ${SU.line2}`, marginTop: 8 }}>
      {[
        ["HCP-INDEKS",  "11.5", "↓ 0.4 / 30 d", SU.lime],
        ["RUNDER · 2026","12",  "SNITT 86.3",   SU.ink],
        ["BESTE RUNDE",  "78",  "BORRE · 22.04",SU.ink],
        ["PUTTS / RUNDE","31",  "↓ 2 / mnd",    SU.lime],
        ["SLAG · 2026", "1 842","18 ØKTER",     SU.ink],
        ["BANER",       "7",    "AV 156 NGF",   SU.ink],
      ].map(([l,v,s,c], i) => (
        <div key={l} style={{ padding: "18px 20px", borderRight: i<5?`1px solid ${SU.line2}`:0 }}>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{l}</div>
          <div className="su-display" style={{ fontSize: 36, color: c, marginTop: 6 }}>{v}</div>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginTop: 6 }}>{s}</div>
        </div>
      ))}
    </div>

    {/* lower row — round log + sources + caddie */}
    <div style={{ padding: "28px 48px 32px", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
      {/* Round log */}
      <div style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${SU.line2}` }}>
          <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em" }}>RUNDER · 2026</span>
          <span className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>VIS ALLE →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "60px 110px 1fr 70px 70px 90px 80px 24px", padding: "10px 22px", borderBottom: `1px solid ${SU.line2}` }}>
          {["#","DATO","BANE","SCORE","Δ HCP","PUTTS","KILDE",""].map(h => <span key={h} className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em" }}>{h}</span>)}
        </div>
        {[
          ["12","12 MAI","Losby GK",     "87","↓0.2","31","WATCH",  SU.lime],
          ["11","10 MAI","Trackman · 7-jern (RANGE)","—","—", "—", "TRACKMAN", SU.warn],
          ["10","08 MAI","Tyrifjord GK", "92","↑0.1","34","WATCH",  SU.lime],
          ["09","06 MAI","Topgolf · Oslo (CASUAL)","—","—", "—", "TOPGOLF", SU.warn],
          ["08","03 MAI","Borre Golfbane","84","↓0.3","30","WATCH",  SU.lime],
          ["07","28 APR","Grini GK",     "89","↓0.1","32","SCORECARD UPL.", SU.ink3],
          ["06","22 APR","Borre Golfbane","78","↓0.5","27","WATCH",  SU.lime],
        ].map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 110px 1fr 70px 70px 90px 80px 24px", padding: "12px 22px", borderBottom: i<6?`1px solid ${SU.line}`:0, alignItems: "center" }}>
            <span className="su-mono" style={{ fontSize: 11, color: SU.ink3 }}>{r[0]}</span>
            <span className="su-mono" style={{ fontSize: 11, color: SU.ink2 }}>{r[1]}</span>
            <span style={{ fontSize: 13, color: SU.ink }}>{r[2]}</span>
            <span className="su-mono" style={{ fontSize: 14, color: SU.ink }}>{r[3]}</span>
            <span className="su-mono" style={{ fontSize: 11, color: r[4].startsWith("↓")?SU.lime:(r[4]==="—"?SU.ink3:SU.warn) }}>{r[4]}</span>
            <span className="su-mono" style={{ fontSize: 12, color: SU.ink2 }}>{r[5]}</span>
            <span className="su-mono" style={{ fontSize: 8, color: r[7], letterSpacing: "0.22em", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dot color={r[7]} size={5}/>{r[6]}
            </span>
            <span style={{ color: SU.ink3 }}>›</span>
          </div>
        ))}
      </div>

      {/* Side stack */}
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 14, padding: 20 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em", display: "flex", alignItems: "center", gap: 6 }}><Dot color={SU.lime}/> CADDIE · UKEN</div>
          <p className="su-serif" style={{ fontSize: 18, color: SU.ink, lineHeight: 1.35, margin: "14px 0 0" }}>
            "Du putter 2 slag mindre per runde enn i mars. Det er hovedgrunnen til at HCP-en faller."
          </p>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink4, letterSpacing: "0.2em", marginTop: 18 }}>STRIKELAB · BASERT PÅ 5 RUNDER</div>
        </div>

        <div style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 14, padding: 20 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>DATA-KILDER · 4 KOBLET</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {[
              ["WATCH",    "Apple Watch Ultra",        "1 842 slag"],
              ["TRACKMAN", "Miklagard",                "18 økter"],
              ["GOLFBOX",  "Scorekort-import",         "32 runder"],
              ["UPLOAD",   "Bilder + PDF",             "6 manuelle"],
            ].map(r => (
              <div key={r[0]} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 10, alignItems: "center" }}>
                <span className="su-mono" style={{ fontSize: 9, color: SU.lime, letterSpacing: "0.22em" }}><Dot color={SU.lime} size={5}/> {r[0]}</span>
                <span style={{ fontSize: 12, color: SU.ink }}>{r[1]}</span>
                <span className="su-mono" style={{ fontSize: 10, color: SU.ink3 }}>{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </WebShell>
);

// ────────────────────────────────────────────────────────────────────────
// 03 · WEB ROUND DETAIL — strikelab.golf/round/2026-05-12-losby
// The "after the round" beautiful page. Every shot, every hole.
// ────────────────────────────────────────────────────────────────────────
const WebRoundDetail = () => {
  const holes = Array.from({length: 18}, (_, i) => {
    const sc = [3,2,4,3,3,5,3,4,3, 3,3,4,2,3,3,5,3,3][i];
    const par = 3;
    const t = sc===par?"par":(sc<par?"bird":(sc===par+1?"bog":"dbog"));
    return { h: i+1, par, sc, t };
  });
  const tone = (t) => ({
    par:  SU.ink, bird: SU.lime, bog: SU.warn, dbog: SU.bad,
  }[t]);

  return (
    <WebShell url="strikelab.golf/round/2026-05-12-losby">
      <div style={{ padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${SU.line2}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SLogo size={20}/>
          <span className="su-mono" style={{ fontSize: 11, color: SU.ink3, letterSpacing: "0.22em" }}>· RUNDE · 12. MAI 2026</span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>EKSPORT ↓</span>
          <span className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>DEL →</span>
        </div>
      </div>

      {/* Headline */}
      <div style={{ padding: "44px 48px 28px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "flex-start" }}>
        <div>
          <div className="su-mono" style={{ fontSize: 11, color: SU.lime, letterSpacing: "0.22em" }}>LOSBY GK · GUL · 18 HULL</div>
          <div className="su-display" style={{ fontSize: 200, color: SU.ink, marginTop: 6, lineHeight: 0.9, letterSpacing: "-0.06em" }}>84</div>
          <div className="su-mono" style={{ fontSize: 13, color: SU.ink2, letterSpacing: "0.18em", marginTop: -10 }}>+13 OVER PAR · NET 73 · STBLF 32</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["PUTTS",   "31",  "1.72/hull"],
            ["FAIRWAYS","9/14","64% truffet"],
            ["GIR",     "8/18","greens-in-regulation"],
            ["UP-DOWN", "5/10","scrambling"],
          ].map(([k,v,s]) => (
            <div key={k} style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 12, padding: "16px 18px" }}>
              <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
              <div className="su-mono" style={{ fontSize: 26, color: SU.ink, marginTop: 4 }}>{v}</div>
              <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.16em", marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hole row */}
      <div style={{ padding: "0 48px 24px" }}>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 14, padding: "18px 22px" }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span>HULL · FOR HULL</span>
            <span>F9 · 30 (+3) · B9 · 29 (+2)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(18, 1fr)", gap: 4 }}>
            {holes.map(h => (
              <div key={h.h} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div className="su-mono" style={{ fontSize: 9, color: SU.ink3 }}>{h.h}</div>
                <div style={{
                  width: 38, height: 38, borderRadius: 19,
                  border: `1.5px solid ${h.t === "par" ? "transparent" : tone(h.t)}`,
                  background: h.t === "bird" ? "rgba(170,210,90,0.06)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="su-mono" style={{ fontSize: 18, color: tone(h.t) }}>{h.sc}</span>
                </div>
                <div className="su-mono" style={{ fontSize: 9, color: SU.ink4 }}>{h.par}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shot detail strip */}
      <div style={{ padding: "0 48px 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 14, padding: 22 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>BIRDIES · 2</div>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {[["HULL 2","Par 3 · 145m · 8-jern · 0.4m"],["HULL 13","Par 3 · 132m · 9-jern · 1.1m"]].map(r => (
              <div key={r[0]}>
                <div className="su-mono" style={{ fontSize: 11, color: SU.lime }}>{r[0]}</div>
                <div className="su-mono" style={{ fontSize: 10, color: SU.ink2, marginTop: 2, letterSpacing: "0.06em" }}>{r[1]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: SU.s1, border: `1px solid ${SU.line2}`, borderRadius: 14, padding: 22 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>KLUBB · MEST BRUKT</div>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {[
              ["7-jern","12 slag","148m snitt"],
              ["Driver","13 slag","234m snitt"],
              ["Putter","31 slag","—"],
            ].map(r => (
              <div key={r[0]} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: SU.ink }}>{r[0]}</span>
                <span className="su-mono" style={{ fontSize: 11, color: SU.ink2 }}>{r[1]}</span>
                <span className="su-mono" style={{ fontSize: 11, color: SU.ink3 }}>{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: SU.s1, border: `1px solid ${SU.lime}`, borderRadius: 14, padding: 22 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em", display: "flex", alignItems: "center", gap: 6 }}><Dot color={SU.lime}/> CADDIE</div>
          <p className="su-serif" style={{ fontSize: 17, color: SU.ink, lineHeight: 1.35, margin: "14px 0 0" }}>
            "To dobler kostet 4 slag. Begge på samme klubb (3-jern fra rough). Vurder å bytte til hybrid neste runde."
          </p>
        </div>
      </div>
    </WebShell>
  );
};

Object.assign(window, { WebLanding, WebDashboard, WebRoundDetail, WEB_W, WEB_H });
