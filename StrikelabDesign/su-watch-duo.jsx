// Strikelab · Watch + Phone duo — the "during a round" story.
// Watch is the primary on-course surface. Phone is the bigger memory.
// Web is the same data on a bigger canvas.

// ── WATCH FACE (the screens you're happy with — keep) ───────────────────
const WatchFrame = ({ children, w = 220, h = 264 }) => (
  <div style={{
    width: w, height: h, background: "#000",
    borderRadius: 40, padding: 8, border: `12px solid #1c1c1e`,
    position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
  }}>
    <div style={{ width: "100%", height: "100%", background: SU.bg, borderRadius: 28, overflow: "hidden", position: "relative" }}>
      {children}
    </div>
  </div>
);

const WatchStrokes = () => (
  <div style={{ width: "100%", height: "100%", position: "relative", color: SU.ink }}>
    {/* top bar */}
    <div style={{ padding: "6px 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: SU.s3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.chev} size={9} color={SU.ink2} sw={2} style={{ transform: "rotate(180deg)" }} />
      </div>
      <div className="su-mono" style={{ fontSize: 12, fontWeight: 600, color: SU.ink, display: "flex", alignItems: "center", gap: 3 }}>
        <Ico d={ICONS.mic} size={9} color={SU.warn} sw={1.6} />8:55
      </div>
    </div>
    <div className="su-mono" style={{ fontSize: 9, color: SU.ink2, textAlign: "right", paddingRight: 10, letterSpacing: "0.12em", marginTop: 2 }}>HULL 7 · PAR 4</div>

    {/* Tabs */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: "6px 8px 0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ background: SU.lime, color: SU.bg, textAlign: "center", padding: "3px 0", fontFamily: "Geist Mono", fontSize: 8, letterSpacing: "0.18em", fontWeight: 600 }}>STROKES</div>
      <div style={{ background: SU.s3, color: SU.ink2, textAlign: "center", padding: "3px 0", fontFamily: "Geist Mono", fontSize: 8, letterSpacing: "0.18em" }}>PUTTS</div>
    </div>

    {/* number row */}
    <div style={{ padding: "6px 8px 0", display: "grid", gridTemplateColumns: "26px 1fr 26px", gap: 4, alignItems: "center" }}>
      <div style={{ background: SU.s3, border: `1px solid ${SU.line2}`, borderRadius: 4, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.minus} size={11} color={SU.ink} sw={2}/>
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="su-display" style={{ fontSize: 60, color: SU.ink, lineHeight: 0.9, letterSpacing: "-0.04em" }}>4</div>
        <div style={{ fontSize: 9, color: SU.ink3, marginTop: -2 }}>Par</div>
      </div>
      <div style={{ background: SU.s3, border: `1px solid ${SU.line2}`, borderRadius: 4, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.plus} size={11} color={SU.ink} sw={2}/>
      </div>
    </div>

    {/* HR + HCP */}
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px 0", alignItems: "center" }}>
      <span className="su-mono" style={{ fontSize: 8, color: SU.lime, background: SU.s3, padding: "1px 4px", borderRadius: 2, letterSpacing: "0.1em" }}># HCP 1</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <Ico d={ICONS.heart} size={9} color={SU.bad} fill={SU.bad}/>
        <span className="su-mono" style={{ fontSize: 9, color: SU.ink }}>66</span>
      </span>
    </div>

    {/* footer */}
    <div style={{ position: "absolute", bottom: 6, left: 8, right: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", alignItems: "center", gap: 4 }}>
      <span className="su-mono" style={{ fontSize: 8, color: SU.ink2, display: "inline-flex", alignItems: "center", gap: 3 }}>
        <Ico d={ICONS.target} size={9} color={SU.lime}/>0
      </span>
      <span className="su-mono" style={{ fontSize: 8, color: SU.ink2, textAlign: "center" }}>⚑ E</span>
      <span className="su-mono" style={{ fontSize: 8, color: SU.ink2, display: "inline-flex", alignItems: "center", gap: 3 }}>
        <Ico d={ICONS.hiker} size={9} color={SU.ink2}/>7I
      </span>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: SU.s2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: SU.ink, fontSize: 12, marginTop: -4 }}>⋯</span>
      </div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────
// DUO · the moment — watch on wrist, phone on the cart
// ────────────────────────────────────────────────────────────────────────
const WatchDuo = () => (
  <div style={{
    width: 1280, height: 720, background: SU.bg, color: SU.ink,
    borderRadius: 16, overflow: "hidden", position: "relative",
    fontFamily: "Geist, sans-serif",
  }}>
    {/* TOP — title */}
    <div style={{ padding: "32px 48px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div className="su-mono" style={{ fontSize: 11, letterSpacing: "0.24em", color: SU.lime }}>03 · DURING THE ROUND</div>
        <div className="su-display" style={{ fontSize: 56, marginTop: 12, maxWidth: 740 }}>
          The watch is the<br/><em>caddie.</em> The phone is the <em>memory.</em>
        </div>
        <p style={{ fontSize: 15, color: SU.ink2, lineHeight: 1.5, marginTop: 14, maxWidth: 560 }}>
          Every confirmed watch swing is saved as a shot row with club, hole, GPS and biometric context. You never have to look at your phone. But when you do, it's the whole round, beautifully laid out.
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>HULL 7 · LOSBY GK</div>
        <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginTop: 3 }}>15.MAI.2026 · 14:55</div>
      </div>
    </div>

    {/* MIDDLE — devices */}
    <div style={{ position: "absolute", left: 48, top: 250, display: "flex", alignItems: "flex-end", gap: 36 }}>
      {/* watch with annotations */}
      <div style={{ position: "relative" }}>
        <WatchFrame>
          <WatchStrokes />
        </WatchFrame>
        {/* annotation lines */}
        <AnnoLine x={262} y={36} text="STROKES + PUTTS toggle — the only on-course UI" />
        <AnnoLine x={262} y={130} text="±  with Digital Crown · stroke commits the hole" />
        <AnnoLine x={262} y={210} text="HR · GPS · club detection — all stamped on the row" />
      </div>

      {/* arrow */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: SU.ink3, height: 264 }}>
        <Ico d={ICONS.arrow} size={28} color={SU.lime} sw={1.5}/>
        <div>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>SYNC</div>
          <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.2em", marginTop: 3 }}>LIVE · BT</div>
        </div>
      </div>

      {/* phone */}
      <div style={{ position: "relative", transform: "scale(0.6)", transformOrigin: "bottom left" }}>
        <ABoard w={IPH_W} h={IPH_H}>
          <IphLiveInline />
        </ABoard>
      </div>
    </div>

    {/* BOTTOM — sync rules */}
    <div style={{ position: "absolute", left: 48, right: 48, bottom: 32, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: `1px solid ${SU.line2}`, paddingTop: 22 }}>
      {[
        ["WATCH OWNS",   "Strokes, putts, club, HR, GPS pings. Tee-to-green."],
        ["PHONE OWNS",   "Scorecard view, course map, group, shot history, after-round."],
        ["CADDIE",       "Voice + on-watch nudges only at decision points. Sjelden, ikke konstant."],
        ["SYNC",         "Live BT during play. iCloud after. Web sees it in seconds."],
      ].map(([k,v], i) => (
        <div key={k} style={{ padding: "0 20px", borderRight: i < 3 ? `1px solid ${SU.line2}` : 0 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>{k}</div>
          <div style={{ fontSize: 13, color: SU.ink2, lineHeight: 1.5, marginTop: 8 }}>{v}</div>
        </div>
      ))}
    </div>
  </div>
);

const AnnoLine = ({ x, y, text }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
    <div style={{ width: 32, height: 1, background: SU.line3 }} />
    <div style={{ width: 6, height: 6, borderRadius: 3, background: SU.lime }} />
    <div className="su-mono" style={{ fontSize: 9, color: SU.ink2, letterSpacing: "0.14em" }}>{text}</div>
  </div>
);

// A flattened mini live screen for inside the phone shell on the duo board.
const IphLiveInline = () => (
  <>
    <IPhStatus time="14:55" tracking />
    <div style={{ padding: "10px 22px 0" }}>
      <div className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: SU.lime }}>HULL 7 · PAR 4</div>
    </div>
    <div className="su-display" style={{ fontSize: 200, color: SU.ink, textAlign: "center", lineHeight: 0.85, letterSpacing: "-0.06em", marginTop: 14 }}>4</div>
    <div className="su-mono" style={{ textAlign: "center", color: SU.ink2, fontSize: 13, marginTop: -2, letterSpacing: "0.18em" }}>PAR · 2 PUTTS · 7I</div>
    <div style={{ margin: "30px 22px 0", border: `1px solid ${SU.line2}`, borderRadius: 14, overflow: "hidden", background: SU.s1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["FRONT","138"],["MIDDLE","147"],["BACK","156"]].map(([k,v], i) => (
          <div key={k} style={{ padding: "12px 8px", borderRight: i < 2 ? `1px solid ${SU.line2}` : 0, textAlign: "center" }}>
            <div className="su-mono" style={{ fontSize: 9, color: SU.ink3, letterSpacing: "0.22em" }}>{k}</div>
            <div className="su-mono" style={{ fontSize: 28, color: SU.ink, marginTop: 4 }}>{v}<span style={{fontSize:12, color: SU.ink3}}>m</span></div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ padding: "20px 22px 0" }}>
      <div className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em", marginBottom: 8 }}>SHOT LOG · HULL 7</div>
      <div style={{ background: SU.s1, border: `1px solid ${SU.line}`, borderRadius: 12, overflow: "hidden" }}>
        {[
          ["1", "Driver",  "238m"],
          ["2", "7-jern",  "147m"],
          ["3", "Putter",  "4.2m"],
          ["4", "Putter",  "0.4m"],
        ].map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr 80px", padding: "10px 14px", borderBottom: i < 3 ? `1px solid ${SU.line}` : 0, alignItems: "center" }}>
            <span className="su-mono" style={{ fontSize: 10, color: SU.ink3 }}>{r[0]}</span>
            <span style={{ fontSize: 13, color: SU.ink }}>{r[1]}</span>
            <span className="su-mono" style={{ fontSize: 12, color: SU.ink2, textAlign: "right" }}>{r[2]}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);

Object.assign(window, { WatchFrame, WatchStrokes, WatchDuo });
