// Strikelab · Unified — the canvas composer.
// Sections: Manifesto · iPhone · Watch + Phone duo · Web

const App = () => (
  <div data-screen-label="Strikelab Unified">
    <style>{SU_CSS}</style>

    <DesignCanvas>
      {/* ── INTRO ───────────────────────────────────────────────── */}
      <DCSection id="intro" title="StrikeLab · one system" subtitle="Watch tracks. Phone remembers. Web understands. The unified next iteration.">
        <DCArtboard id="manifest" label="Manifest · the pitch" width={1280} height={720}>
          <Manifest/>
        </DCArtboard>
      </DCSection>

      {/* ── iPHONE — your homebase ─────────────────────────────── */}
      <DCSection id="iphone" title="iPhone · your homebase" subtitle="Every round you've ever played. Every data source. Your AI caddie. Pure, simplified.">
        <DCArtboard id="home"      label="01 · Home"                width={IPH_W} height={IPH_H}><IphHome /></DCArtboard>
        <DCArtboard id="prep"      label="02 · Round prep"          width={IPH_W} height={IPH_H}><IphPrep /></DCArtboard>
        <DCArtboard id="live"      label="03 · Live round"          width={IPH_W} height={IPH_H}><IphLive /></DCArtboard>
        <DCArtboard id="scorecard" label="04 · Scorecard · trophy"  width={IPH_W} height={IPH_H}><IphScorecard /></DCArtboard>
        <DCArtboard id="profile"   label="05 · Profile · data home" width={IPH_W} height={IPH_H}><IphProfile /></DCArtboard>
        <DCArtboard id="tee"       label="06 · Tee-tider · BETA"    width={IPH_W} height={IPH_H}><IphTee /></DCArtboard>
      </DCSection>

      {/* ── WATCH + PHONE DUO ──────────────────────────────────── */}
      <DCSection id="duo" title="Watch + Phone · during the round" subtitle="The watch is the caddie. The phone is the memory. Sync rules below.">
        <DCArtboard id="duo-board" label="The sync moment" width={1280} height={720}>
          <WatchDuo />
        </DCArtboard>
      </DCSection>

      {/* ── WEB ────────────────────────────────────────────────── */}
      <DCSection id="web" title="strikelab.golf · the platform" subtitle="The web is the same homebase on a bigger canvas. Marketing, dashboard, and one beautiful round detail.">
        <DCArtboard id="web-landing"   label="strikelab.golf · landing" width={WEB_W} height={WEB_H}><WebLanding /></DCArtboard>
        <DCArtboard id="web-dashboard" label="strikelab.golf/home"       width={WEB_W} height={WEB_H}><WebDashboard /></DCArtboard>
        <DCArtboard id="web-round"     label="strikelab.golf/round/…"    width={WEB_W} height={WEB_H}><WebRoundDetail /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  </div>
);

// ── MANIFEST · the opening slide ───────────────────────────────────────
const Manifest = () => (
  <div style={{
    width: 1280, height: 720, background: SU.bg, color: SU.ink,
    fontFamily: "Geist, sans-serif", padding: "56px 56px",
    display: "grid", gridTemplateRows: "auto 1fr auto", gap: 32,
    borderRadius: 16, overflow: "hidden",
  }}>
    {/* Top */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SLogo size={26}/>
        <span className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em" }}>STRIKELAB · UNIFIED · v0.2</span>
      </div>
      <span className="su-mono" style={{ fontSize: 10, color: SU.ink3, letterSpacing: "0.22em" }}>NEXT ITERATION · 16 MAI 2026</span>
    </div>

    {/* Hero */}
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 56, alignItems: "center" }}>
      <div>
        <div className="su-mono" style={{ fontSize: 11, color: SU.lime, letterSpacing: "0.24em", marginBottom: 24 }}>ONE SYSTEM · THREE SURFACES</div>
        <h1 className="su-display" style={{ fontSize: 96, margin: 0, lineHeight: 0.94 }}>
          The watch <em>tracks.</em><br/>
          The phone <em>remembers.</em><br/>
          The web <em>understands.</em>
        </h1>
        <p style={{ fontSize: 17, color: SU.ink2, lineHeight: 1.55, marginTop: 32, maxWidth: 640 }}>
          StrikeLab is your golf homebase — every round, every data source, every shot in one place. Apple Watch is your caddie on the course. iPhone is the memory of every round you've ever played. The web is where the bigger picture lives.
        </p>
      </div>

      {/* Three surface stack */}
      <div style={{ display: "grid", gap: 14 }}>
        {[
          ["WATCH",   "Caddie on the wrist. Strokes, putts, GPS, biometrics.",       SU.lime],
          ["IPHONE",  "Homebase. Every round, every source. Your AI friend.",        SU.ink],
          ["WEB",     "Big-canvas view. Imports, dashboards, deep round detail.",    SU.ink],
        ].map(([k, v, c], i) => (
          <div key={k} style={{ background: SU.s1, border: `1px solid ${i===0 ? SU.lime : SU.line2}`, borderRadius: 14, padding: "18px 22px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center" }}>
            <Ico d={k==="WATCH"?ICONS.watch : k==="IPHONE"?ICONS.iphone : ICONS.globe} size={24} color={c} sw={1.4} />
            <div>
              <div className="su-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: c }}>{k}</div>
              <div style={{ fontSize: 14, color: SU.ink2, marginTop: 6 }}>{v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom — what's new */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: `1px solid ${SU.line2}`, paddingTop: 22 }}>
      {[
        ["UNIFIED",   "iPhone now mirrors the watch during a round. Same number, same vocabulary."],
        ["HOMEBASE",  "Profile is now your data hub — watch, Trackman, Topgolf, Golfbox, uploads."],
        ["BETA",      "Tee-times (Golfbox) + Shot Planner shipped as a calm BETA preview."],
        ["CADDIE",    "The AI is sjelden, ikke konstant — one earned sentence per moment."],
      ].map(([k, v], i) => (
        <div key={k} style={{ padding: "0 20px", borderRight: i<3?`1px solid ${SU.line2}`:0 }}>
          <div className="su-mono" style={{ fontSize: 10, color: SU.lime, letterSpacing: "0.22em" }}>{k}</div>
          <div style={{ fontSize: 12, color: SU.ink2, lineHeight: 1.55, marginTop: 8 }}>{v}</div>
        </div>
      ))}
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
