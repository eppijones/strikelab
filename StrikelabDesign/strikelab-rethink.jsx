// Strikelab · Rethink — strategic critique + redesign mocks.
// Single long-form document. StrikeLab visual language, slightly warmed
// in the "new direction" sections to demonstrate Option B (hybrid).

// ── tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:     "#0a0b0a",
  bg2:    "#111312",
  surf:   "#151816",
  surf2:  "#1c1f1d",
  line:   "#1f2220",
  line2:  "#2d322f",
  ink:    "#ede8de",
  ink2:   "#b9b6ac",
  ink3:   "#76746b",
  ink4:   "#4a4842",
  // warm "bone" palette used in the redesigned marketing & empty-states
  bone:   "#ede8de",
  bone2:  "#e3ddd0",
  boneSurf: "#f5f1e7",
  boneLine: "#b6af9c",
  boneInk: "#141614",
  boneInk2: "#4a4842",
  // single accent — Signal Lime
  lime:   "oklch(0.88 0.18 125)",
  limeOnLight: "oklch(0.55 0.18 145)",
  // problem accents (used only inside critique annotations)
  warn:   "oklch(0.78 0.16 65)",
  bad:    "oklch(0.68 0.20 28)",
};

const SHEET_CSS = `
  .mono { font-family: "Geist Mono", ui-monospace, monospace; font-feature-settings: "tnum","zero"; font-variant-numeric: tabular-nums; }
  .serif { font-family: "Instrument Serif", serif; font-style: italic; }
  .display { font-family: "Geist", sans-serif; font-weight: 500; letter-spacing: -0.04em; line-height: 0.95; }
  .display em { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; letter-spacing: -0.02em; }
  .micro { font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.ink3}; }
  .kicker { font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
  body { background: ${C.bg}; }
  hr.rule { border: 0; border-top: 1px solid ${C.line2}; margin: 0; }
  .strike { text-decoration: line-through; text-decoration-color: ${C.bad}; text-decoration-thickness: 1.5px; }
`;

// ── building blocks ────────────────────────────────────────────────────
const Logo = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ color }}>
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1" />
    <line x1="12" y1="2" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1" />
    <line x1="12" y1="17.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1" />
    <line x1="17.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
    <circle cx="13.5" cy="10.5" r="1.6" fill="currentColor" />
    <path d="M12 12 L13.5 10.5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const Section = ({ num, label, title, lede, children, dense = false }) => (
  <section style={{ borderTop: `1px solid ${C.line2}`, padding: dense ? "56px 0" : "96px 0" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 56, alignItems: "flex-start", marginBottom: dense ? 32 : 56 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.24em" }}>{num} · {label}</div>
        </div>
        <div>
          <h2 className="display" style={{ fontSize: 56, margin: 0, color: C.ink }}>{title}</h2>
          {lede && <p style={{ fontSize: 17, color: C.ink2, lineHeight: 1.55, marginTop: 16, maxWidth: 760 }}>{lede}</p>}
        </div>
      </div>
      {children}
    </div>
  </section>
);

const Tag = ({ children, tone = "default", solid = false }) => {
  const tones = {
    default: { color: C.ink2, borderColor: C.line2 },
    accent:  { color: C.lime, borderColor: C.lime },
    warn:    { color: C.warn, borderColor: C.warn },
    bad:     { color: C.bad, borderColor: C.bad },
  };
  const t = tones[tone];
  return (
    <span className="mono" style={{
      display: "inline-block",
      padding: "3px 7px",
      border: "1px solid",
      borderRadius: 2,
      fontSize: 9,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      ...(solid ? { background: t.color, color: C.bg, borderColor: t.color } : t),
    }}>{children}</span>
  );
};

const Verdict = ({ tone, label, body }) => {
  const color = tone === "kill" ? C.bad : tone === "soften" ? C.warn : C.lime;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 18, padding: "18px 0", borderTop: `1px solid ${C.line}`, alignItems: "flex-start" }}>
      <span className="mono" style={{ fontSize: 10, color, letterSpacing: "0.2em", paddingTop: 2 }}>{label}</span>
      <div style={{ fontSize: 14, color: C.ink2, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
};

// ── HERO ───────────────────────────────────────────────────────────────
const Hero = () => (
  <div style={{ padding: "120px 56px 56px", maxWidth: 1280, margin: "0 auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 72 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Logo size={24} />
        <span style={{ fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.22em" }}>STRIKELAB · RETHINK</span>
      </div>
      <span className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.2em" }}>STRATEGY MEMO · 15 MAY 2026 · D. HASSAN</span>
    </div>

    <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.24em", marginBottom: 24 }}>
      VERDICT · ONE PARAGRAPH
    </div>
    <h1 className="display" style={{ fontSize: 124, margin: 0, lineHeight: 0.92 }}>
      You're building a <em>laboratory.</em><br />
      Norwegians want a <em>caddie.</em>
    </h1>

    <p style={{ fontSize: 22, color: C.ink2, lineHeight: 1.5, marginTop: 40, maxWidth: 880 }}>
      Strikelab's craft is excellent. The typography, the lime-on-black restraint,
      the precision — that's a moat. But the <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>positioning</em> is
      pointed at the wrong golfer. "Diagnose → Foreskriv → Valider" sells to a club
      pro's student. The Norwegian 12-handicap who plays 22 rounds a year wants to
      know where to tee off Saturday, what they shot, and whether their handicap is
      moving. That's a different product story — told with the same beautiful tools.
    </p>

    <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: `1px solid ${C.line2}` }}>
      {[
        ["KEEP",     "The aesthetic. Mono numbers. Serif italic. Lime restraint. Apple Watch DNA."],
        ["RENAME",   "Six features have nerd names. \"Diagnose,\" \"System,\" \"Bevis,\" \"Valider\" — all out."],
        ["DEMOTE",   "AI Coach, dispersion analytics, 8-week blocks. Powerful, but not the headline."],
        ["ELEVATE",  "Courses. Scorecards. Apple Watch round tracking. Tee times. The actual job."],
      ].map(([k, v], i) => (
        <div key={k} style={{ padding: 24, borderRight: i < 3 ? `1px solid ${C.line2}` : 0 }}>
          <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.22em" }}>{k}</div>
          <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginTop: 10 }}>{v}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── 01 · POSITIONING CRITIQUE ─────────────────────────────────────────
const S1_Positioning = () => (
  <Section num="01" label="POSITIONING" title="Bli presis is selling the wrong promise."
    lede="The current line — “Bli presis. Diagnostiser feilen, tren med hensikt, og valider endringen på banen.” — is technically beautiful and emotionally cold. It positions Strikelab as a clinical tool for serious players already obsessed with mechanics. That market exists in Norway, but it's roughly 8% of registered golfers, and most of them already pay a coach to do that work for them.">

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
      <div style={{ background: C.surf, border: `1px solid ${C.line2}`, padding: 28 }}>
        <Tag tone="bad">CURRENT · NO</Tag>
        <div className="serif" style={{ fontSize: 28, color: C.ink, marginTop: 18, lineHeight: 1.2 }}>
          "Bli <em>presis.</em>"
        </div>
        <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.55, marginTop: 14 }}>
          Diagnostiser feilen, tren med hensikt, og valider endringen på banen.
        </p>
        <hr className="rule" style={{ margin: "20px 0" }} />
        <div className="mono" style={{ fontSize: 10, color: C.bad, letterSpacing: "0.18em", marginBottom: 10 }}>READS AS</div>
        <ul style={{ fontSize: 13, color: C.ink3, lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
          <li>"You have a problem. We will diagnose it."</li>
          <li>"Practice with mechanical intent" — not "go play golf."</li>
          <li>Medical / engineering register. Clinical, not warm.</li>
          <li>Implies you should know what your fault is before you sign up.</li>
        </ul>
      </div>

      <div style={{ background: C.surf, border: `1px solid ${C.lime}`, padding: 28 }}>
        <Tag tone="accent">PROPOSED · NO</Tag>
        <div className="display" style={{ fontSize: 38, color: C.ink, marginTop: 18, lineHeight: 1.05 }}>
          All golfen din.<br /><em>På ett sted.</em>
        </div>
        <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.55, marginTop: 14 }}>
          Tee-tider, baner, scorekort og rangeøkter — i én app. Bygd i Norge for norske golfere.
        </p>
        <hr className="rule" style={{ margin: "20px 0" }} />
        <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.18em", marginBottom: 10 }}>READS AS</div>
        <ul style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
          <li>Concrete. Tee times, courses, scorecards — every golfer knows these.</li>
          <li>Local. "Bygd i Norge" is a moat. Lean into it.</li>
          <li>Calm. The serif italic is the smile. The mono delivers.</li>
          <li>Doesn't ask the user to admit they have a problem.</li>
        </ul>
      </div>
    </div>

    <div style={{ borderTop: `1px solid ${C.line2}`, paddingTop: 24 }}>
      <Verdict tone="kill" label="KILL"
        body={<>The word <span className="mono" style={{ color: C.ink, fontSize: 13 }}>DIAGNOSTISER</span> in any user-facing surface. Keep it as an internal feature name if it helps the team think clearly, but golfers don't have a "diagnosis." They have a slice on Tuesday.</>} />
      <Verdict tone="kill" label="KILL"
        body={<>The phrase <span className="mono" style={{ color: C.ink, fontSize: 13 }}>LUKKET SLØYFE FOR GOLFUTVIKLING</span>. This is a machine-learning paper title. The closest English equivalent — "closed loop for golf development" — would not appear on Trackman, Arccos, or 18Birdies. It shouldn't appear on you.</>} />
      <Verdict tone="soften" label="SOFTEN"
        body={<>"Bli presis" can survive as a <em>sub-promise</em> on the analytics page once a user is already in the app and has 3+ sessions logged. It's a perfectly good line for the power user. It's the wrong line for the visitor.</>} />
      <Verdict tone="keep" label="KEEP"
        body={<>The visual restraint — black bay, lime accent, mono numbers — is your single biggest brand asset. Every competitor (GolfShot, 18Birdies, Hole19, Arccos, Shot Scope) looks like a SaaS dashboard from 2014. Don't soften the chrome. Soften the <em>words</em>.</>} />
    </div>
  </Section>
);

// ── 02 · WHO BOUNCES ──────────────────────────────────────────────────
const Persona = ({ name, profile, plays, owns, wants, bounces, bouncesAt }) => (
  <div style={{ background: C.surf, border: `1px solid ${C.line2}`, padding: 28 }}>
    <div className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>PROFILE</div>
    <div className="display" style={{ fontSize: 36, marginTop: 8 }}>{name}</div>
    <div className="mono" style={{ fontSize: 11, color: C.lime, letterSpacing: "0.14em", marginTop: 6 }}>{profile}</div>
    <hr className="rule" style={{ margin: "20px 0" }} />
    <Row k="PLAYS"  v={plays} />
    <Row k="OWNS"   v={owns} />
    <Row k="WANTS"  v={wants} />
    <Row k="BOUNCES AT" v={bouncesAt} tone="bad" />
    <hr className="rule" style={{ margin: "20px 0" }} />
    <div className="serif" style={{ fontSize: 16, color: C.ink, lineHeight: 1.35 }}>
      "{bounces}"
    </div>
  </div>
);
const Row = ({ k, v, tone }) => (
  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
    <span className="mono" style={{ fontSize: 9, color: tone === "bad" ? C.bad : C.ink3, letterSpacing: "0.2em", paddingTop: 2 }}>{k}</span>
    <span style={{ fontSize: 13, color: C.ink2 }}>{v}</span>
  </div>
);

const S2_Bounces = () => (
  <Section num="02" label="WHO BOUNCES" title="The 12-handicap doesn't know they have a problem."
    lede="A normal Norwegian golfer doesn't have a 'face-to-path' fault. They have an opinion about their slice and they want to play more rounds. Three personas, written from the bounce-rate side.">

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
      <Persona
        name="Lars, 42"
        profile="HCP 14.8 · LOSBY GK"
        plays="22 rounds/yr · mostly summer · 9-holes after work twice a week"
        owns="iPhone · Apple Watch SE · no launch monitor"
        wants="Find a 16:30 tee time. Know what he shot. See if his handicap is moving."
        bouncesAt="Sees the word 'DIAGNOSTISER' in the hero. Closes tab."
        bounces="What's a face-to-path? I just want to book Saturday."
      />
      <Persona
        name="Ingrid, 35"
        profile="HCP 22.3 · NEW MEMBER · BÆRUM GK"
        plays="8 rounds/yr · learning · loves the social side"
        owns="iPhone only · no Apple Watch yet · no launch monitor"
        wants="A friendly app that won't make her feel stupid. Find courses near a summer cabin."
        bouncesAt="The current home screen shows 11.5 / 4.0 / 0 / 0 / 'no rounds yet.' She feels behind already."
        bounces="This looks like it's for serious people. I'm not serious yet."
      />
      <Persona
        name="Magnus, 28"
        profile="HCP 4.2 · CLUB CHAMPION TRACK"
        plays="60+ rounds/yr · range every day · Trackman bay at Miklagard"
        owns="iPhone · Apple Watch Ultra · Trackman session exports · GSPro at home"
        wants="Exactly what Strikelab built. Diagnosis. Dispersion. 8-week blocks."
        bouncesAt="Nothing. He's the unicorn the current site is talking to."
        bounces="Finally, an app that takes my game seriously. I'll pay for this."
      />
    </div>

    <div style={{ background: C.surf2, border: `1px solid ${C.line2}`, padding: 32 }}>
      <Tag tone="warn">MARKET MATH</Tag>
      <div className="display" style={{ fontSize: 38, marginTop: 14, maxWidth: 880, lineHeight: 1.05 }}>
        Norway has ~140,000 registered golfers. Magnus is roughly <em>3,000</em> of them. Lars and Ingrid are <em>120,000</em>.
      </div>
      <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.55, marginTop: 14, maxWidth: 880 }}>
        You can absolutely build for Magnus first and pull the others up later — that's the Linear playbook. But the public marketing site can't speak only Magnus's language. The visitor in the first 5 seconds needs to be Lars or Ingrid. Magnus will find Strikelab through TrackMan forums and Reddit either way.
      </p>
    </div>
  </Section>
);

// ── 03 · KILL LIST ────────────────────────────────────────────────────
const KillRow = ({ word, why, replace, action }) => {
  const colors = {
    REMOVE: C.bad, RENAME: C.warn, DEMOTE: C.warn, KEEP: C.lime, DELAY: C.ink3,
  };
  return (
    <tr style={{ borderBottom: `1px solid ${C.line}` }}>
      <td style={{ padding: "16px 16px 16px 0", verticalAlign: "top" }}>
        <span className="mono" style={{ fontSize: 10, color: colors[action], letterSpacing: "0.2em" }}>{action}</span>
      </td>
      <td style={{ padding: "16px", verticalAlign: "top" }}>
        <span className="mono" style={{ fontSize: 13, color: C.ink, letterSpacing: "0.04em" }} className={action === "REMOVE" ? "mono strike" : "mono"}>
          {word}
        </span>
      </td>
      <td style={{ padding: "16px", color: C.ink2, fontSize: 13, lineHeight: 1.5, verticalAlign: "top" }}>{why}</td>
      <td style={{ padding: "16px", verticalAlign: "top" }}>
        <span className="mono" style={{ fontSize: 12, color: C.lime, letterSpacing: "0.04em" }}>{replace}</span>
      </td>
    </tr>
  );
};

const S3_Kill = () => (
  <Section num="03" label="THE KILL LIST" title="Remove, rename, demote, delay."
    lede="A surgical pass on every word on the current marketing site and the logged-in nav. The right column is the public-facing replacement. The internal team can keep using the old names in code — branding is what users see, not what engineers type.">

    <table style={{ width: "100%", borderCollapse: "collapse", borderTop: `1px solid ${C.line2}` }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "12px 16px 12px 0" }}><span className="micro">ACTION</span></th>
          <th style={{ textAlign: "left", padding: "12px 16px" }}><span className="micro">WORD / SURFACE</span></th>
          <th style={{ textAlign: "left", padding: "12px 16px" }}><span className="micro">WHY IT'S NOT WORKING</span></th>
          <th style={{ textAlign: "left", padding: "12px 16px" }}><span className="micro">REPLACE WITH</span></th>
        </tr>
      </thead>
      <tbody>
        <KillRow action="REMOVE" word="Diagnostiser feilen"  why="Medical register. Implies the user is broken before they've signed up."   replace="Se hva som skjer i spillet ditt" />
        <KillRow action="REMOVE" word="Lukket sløyfe"          why="ML-paper jargon. Zero golfer would use this phrase out loud."          replace="(delete entirely)" />
        <KillRow action="REMOVE" word="Validér endringen"      why="Reads like a QA process, not a Saturday round."                        replace="Test det på banen" />
        <KillRow action="REMOVE" word="Foreskriv"              why="Prescription. Implies a pharmacist or therapist, not a coach."         replace="Anbefal" />
        <KillRow action="RENAME" word="SYSTEM (nav)"           why="B2B SaaS language. Golfers don't visit a system."                      replace="Funksjoner / Features" />
        <KillRow action="RENAME" word="BEVIS (nav)"            why={`"Evidence" — legal register. Doesn't tell me what's on the page.`}     replace="Hva du får / What's inside" />
        <KillRow action="RENAME" word="METODE (nav)"           why="Sounds like a workout program for sale on Instagram."                  replace="Slik virker det / How it works" />
        <KillRow action="RENAME" word="Coach-rapport"          why="Suggests a written document from a real coach. It's an AI summary."    replace="Innsikt · denne uka" />
        <KillRow action="RENAME" word="IMPROVER (badge)"       why="Doesn't say what tier this is. Users don't know if they have it."      replace="(drop the tier system v1)" />
        <KillRow action="DEMOTE" word="AI Coach (homepage)"    why="Leads with AI in 2026 = signal that you're hiding a thin product."     replace="Show on page 3, after 5 sessions logged" />
        <KillRow action="DEMOTE" word={`Dispersion / σ / SG`}    why="Beautiful charts, but they're Magnus's. Lars sees them and exits."      replace={`Move behind a "Stats" tab inside a round`} />
        <KillRow action="DEMOTE" word="8-week block"           why="Premature. Should appear after Coach has something to say."             replace={`Empty state as "Logg 3 runder først"`} />
        <KillRow action="DELAY"  word="Connectors / CSV / JSON" why="Pure dev surface. Marketing-page death."                                replace="Hide behind Settings → Data" />
        <KillRow action="DELAY"  word="Tee-time booking"       why="It's not shipped. Don't promise it on the landing page."                replace={`"Kommer snart" badge, or remove entirely`} />
        <KillRow action="KEEP"   word="Apple Watch tracking"   why="Concrete, ownable, photogenic, and actually works."                     replace="Make this hero asset #2" />
        <KillRow action="KEEP"   word="156 NGF-klubber"        why="Real differentiator. The only Norway-first golf product."               replace="Make this hero asset #1" />
        <KillRow action="KEEP"   word="Mono numbers, serif emphasis" why="The brand signature. Keep using them — for human moments too."     replace={`More "God morgen, Espen", less "Face lukker sent"`} />
      </tbody>
    </table>
  </Section>
);

// ── 04 · NEW IA ───────────────────────────────────────────────────────
const NavCol = ({ heading, items, accent }) => (
  <div>
    <div className="mono" style={{ fontSize: 10, color: accent ? C.lime : C.ink3, letterSpacing: "0.22em", marginBottom: 14 }}>{heading}</div>
    <div style={{ display: "grid", gap: 4 }}>
      {items.map(([word, note, kill], i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, padding: "10px 12px", background: kill ? "transparent" : (accent ? C.surf : C.bg2), border: `1px solid ${kill ? C.line : (accent ? C.lime : C.line2)}` }}>
          <span className="mono" style={{ fontSize: 12, color: kill ? C.ink4 : (accent ? C.lime : C.ink), letterSpacing: "0.04em", textDecoration: kill ? "line-through" : "none" }}>{word}</span>
          <span style={{ fontSize: 11, color: kill ? C.ink4 : C.ink3, lineHeight: 1.4 }}>{note}</span>
        </div>
      ))}
    </div>
  </div>
);

const S4_IA = () => (
  <Section num="04" label="INFORMATION ARCHITECTURE" title="Ten nav items become four."
    lede="The current logged-in app has TEE · SPILL · ØKTER · ANALYSE · RANGE · PLAN · BANER · BAG · DATA · HQ · VENNER. Eleven tabs. That's a power-user IDE, not a consumer app. Most golfers cannot tell the difference between SPILL, ØKTER, and RANGE on the first visit. Cut to four.">

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <NavCol
        heading="CURRENT · 11 TABS"
        items={[
          ["TEE",     "Tee-time booking — not shipped yet", true],
          ["SPILL",   "Active round?", false],
          ["ØKTER",   "Range sessions list", false],
          ["ANALYSE", "Dispersion + trends", true],
          ["RANGE",   "Different from ØKTER how?", true],
          ["PLAN",    "8-week training block", true],
          ["BANER",   "Course library", false],
          ["BAG",     "Club distances", true],
          ["DATA",    "CSV / JSON imports — dev surface", true],
          ["HQ",      "Home", false],
          ["VENNER",  "Friends · leaderboard", false],
        ]}
      />
      <NavCol
        accent
        heading="PROPOSED · 4 TABS + MENU"
        items={[
          ["HJEM",    "What's next: tee time today, log a round, or finish a session", false],
          ["SPILL",   "Tee times · live round · scorecard · course library", false],
          ["TREN",    "Range sessions · drills · bag · stats live in here too", false],
          ["BANER",   "Catalog · favorites · planning a trip", false],
          ["⋯",       "Settings · data import · friends · coach reports (after 5 sessions)", false],
        ]}
      />
    </div>

    <div style={{ marginTop: 48, padding: 32, background: C.surf, border: `1px solid ${C.line2}` }}>
      <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.22em", marginBottom: 14 }}>WHY THIS WORKS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
        <div>
          <div style={{ fontSize: 16, color: C.ink }}>Two mental models, not eleven.</div>
          <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginTop: 8 }}>
            Golfers think in <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>playing</em> and <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>practicing</em>. SPILL is the course. TREN is the range. Everything else hangs off those.
          </p>
        </div>
        <div>
          <div style={{ fontSize: 16, color: C.ink }}>Power users still get power.</div>
          <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginTop: 8 }}>
            Dispersion, AOA, σ, AI Coach — all still live in the app. They just live one level deeper, inside a Round or Session detail, where the user has already opted in to caring.
          </p>
        </div>
        <div>
          <div style={{ fontSize: 16, color: C.ink }}>BANER stays top-level on purpose.</div>
          <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginTop: 8 }}>
            The Norway course catalog is your single most defensible asset. Putting it in the main nav is a brand statement: <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>this app knows the country.</em>
          </p>
        </div>
      </div>
    </div>
  </Section>
);

// ── 05 · NEW LANDING PAGE ─────────────────────────────────────────────
// Demonstrates Option B: hybrid (dark editorial header + bone product story).
const NewLandingMock = () => {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.line2}`, overflow: "hidden" }}>
      {/* nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", borderBottom: `1px solid ${C.line2}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={18} /><span className="mono" style={{ fontSize: 11, letterSpacing: "0.22em" }}>STRIKELAB</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {["SPILL", "TREN", "BANER", "WATCH", "PRISER"].map(x => (
            <span key={x} className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>{x}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>LOGG INN</span>
          <span className="mono" style={{ background: C.lime, color: C.bg, padding: "8px 14px", fontSize: 10, letterSpacing: "0.22em" }}>LAST NED →</span>
        </div>
      </div>

      {/* HERO — dark, editorial */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 0, borderBottom: `1px solid ${C.line2}` }}>
        <div style={{ padding: "72px 56px 64px", borderRight: `1px solid ${C.line2}` }}>
          <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.24em", marginBottom: 18 }}>NORGE · BETA · MAI 2026</div>
          <h1 className="display" style={{ fontSize: 84, margin: 0 }}>
            All golfen din.<br /><em>På ett sted.</em>
          </h1>
          <p style={{ fontSize: 17, color: C.ink2, lineHeight: 1.55, marginTop: 24, maxWidth: 540 }}>
            Tee-tider, baner, scorekort og rangeøkter — i én app. iPhone og Apple Watch. Bygd i Norge, for norske golfere.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
            <button style={{ background: C.lime, color: C.bg, border: 0, padding: "16px 24px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>Last ned →</button>
            <button style={{ background: "transparent", color: C.ink, border: `1px solid ${C.line2}`, padding: "16px 24px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Se demo</button>
          </div>
          <div style={{ marginTop: 40, display: "flex", gap: 32 }}>
            <Stat label="NGF-KLUBBER" value="156" />
            <Stat label="APPLE WATCH" value="ULTRA · S10 · SE" />
            <Stat label="PRISER" value="GRATIS" sub="Premium fra 79 kr/mnd" />
          </div>
        </div>
        {/* Hero "phone in pocket" mock — abstract, no fake screen */}
        <div style={{ background: "linear-gradient(180deg, #0e1110, #0a0b0a)", padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="mono" style={{ fontSize: 9, color: C.ink4, letterSpacing: "0.24em" }}>FOTO · LOSBY GK · 04:42 SOLOPPGANG</div>
          <PhotoPlaceholder label="LANDSCAPE · 1. TEE · LOSBY" />
          <div className="mono" style={{ fontSize: 9, color: C.ink4, letterSpacing: "0.24em" }}>SHOT BY · M. SOLBERG · MAY 2026</div>
        </div>
      </div>

      {/* THREE PILLARS — bone background to warm up */}
      <div style={{ background: C.bone, color: C.boneInk, padding: "80px 56px" }}>
        <div className="mono" style={{ fontSize: 10, color: C.boneInk2, letterSpacing: "0.24em", marginBottom: 14 }}>HVA DU FÅR</div>
        <h2 className="display" style={{ fontSize: 56, margin: 0, color: C.boneInk }}>
          Tre ting. <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>Ingen flere.</em>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 48 }}>
          <Pillar
            tag="01 · BANER"
            title="156 norske klubber."
            body="Hver klubb verifisert mot NGF, med scorekort, slope/CR og baneform. Planlegg sommerturen, lagre favorittene, finn en bane i nærheten av hytta."
          />
          <Pillar
            tag="02 · APPLE WATCH"
            title="Spor runden uten å se på telefonen."
            body="Avstander, scorekort og putts på håndleddet. Strikelab Caddie er sjelden, ikke konstant — én lyd ved tee, ett tap ved green."
          />
          <Pillar
            tag="03 · RANGEØKTER"
            title="Last opp Trackman, se hva som faktisk skjedde."
            body="Drag-and-drop CSV fra Trackman, Foresight eller GSPro — eller koble til StrikeLab-bayene. Vi gjør tallene leselige uten å gjøre deg til ingeniør."
          />
        </div>
      </div>

      {/* QUIET — the social proof and watch shot */}
      <div style={{ background: C.bone2, color: C.boneInk, padding: "72px 56px", borderTop: `1px solid ${C.boneLine}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <Tag tone="accent">QUOTE · BETA</Tag>
            <p className="serif" style={{ fontSize: 30, lineHeight: 1.25, color: C.boneInk, marginTop: 18 }}>
              "Endelig en app som husker at jeg er nordmann. Banene er på plass, scorekortet ser ut som hjemmesiden til klubben min, og Apple Watch-en spør meg ikke om en abonnementspakke midt i runden."
            </p>
            <div className="mono" style={{ fontSize: 11, color: C.boneInk2, letterSpacing: "0.18em", marginTop: 18 }}>
              JON, HCP 8.4 · OSLO GK · BETA SIDEN MARS
            </div>
          </div>
          <PhotoPlaceholder label="APPLE WATCH ULTRA · ON WRIST · DAWN ROUND" tall light />
        </div>
      </div>

      {/* Tee-time tease — only if shipped. Otherwise omit. */}
      <div style={{ background: C.bg, padding: "56px 56px", borderTop: `1px solid ${C.line2}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Tag>KOMMER SOMMEREN 2026</Tag>
          <div className="display" style={{ fontSize: 36, marginTop: 14 }}>
            Tee-tid <em>direkte fra appen.</em>
          </div>
        </div>
        <button style={{ background: "transparent", color: C.ink, border: `1px solid ${C.line2}`, padding: "16px 24px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Få beskjed →</button>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub }) => (
  <div>
    <div className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.22em" }}>{label}</div>
    <div className="mono" style={{ fontSize: 20, color: C.ink, fontWeight: 500, marginTop: 4 }}>{value}</div>
    {sub && <div className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.18em", marginTop: 4 }}>{sub}</div>}
  </div>
);

const PhotoPlaceholder = ({ label, tall = false, light = false }) => (
  <div style={{
    background: light
      ? "repeating-linear-gradient(135deg, #d8d2c1, #d8d2c1 12px, #cec7b3 12px, #cec7b3 24px)"
      : "repeating-linear-gradient(135deg, #1a1d1b, #1a1d1b 12px, #15181620 12px, #15181620 24px)",
    height: tall ? 420 : 280,
    position: "relative",
    border: `1px solid ${light ? C.boneLine : C.line2}`,
  }}>
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span className="mono" style={{ color: light ? C.boneInk2 : C.ink3, fontSize: 10, letterSpacing: "0.2em" }}>[ {label} ]</span>
    </div>
    <div style={{ position: "absolute", top: 10, left: 10 }} className="mono">
      <span style={{ fontSize: 8, color: light ? C.boneInk2 : C.ink4, letterSpacing: "0.22em" }}>IMG.001</span>
    </div>
  </div>
);

const Pillar = ({ tag, title, body }) => (
  <div style={{ borderTop: `1px solid ${C.boneLine}`, paddingTop: 20 }}>
    <span className="mono" style={{ fontSize: 10, color: C.limeOnLight, letterSpacing: "0.22em" }}>{tag}</span>
    <div className="display" style={{ fontSize: 30, color: C.boneInk, marginTop: 14, lineHeight: 1.1 }}>{title}</div>
    <p style={{ fontSize: 14, color: C.boneInk2, lineHeight: 1.6, marginTop: 12 }}>{body}</p>
  </div>
);

const S5_Landing = () => (
  <Section num="05" label="LANDING PAGE · v2" title="Dark for the brand. Bone for the story."
    lede="A redesigned landing that opens with the same cinematic dark editorial — keeping the moat — then shifts into a bone-colored product story with three concrete pillars and one warm quote. No four-step closed loop. No coach diagnosis. The visitor knows what the app does in five seconds. (Hybrid approach — see Section 09.)">

    <NewLandingMock />

    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: `1px solid ${C.line2}` }}>
      {[
        ["WHAT CHANGED",   "Hero promise. \"Bli presis\" → \"All golfen din. På ett sted.\""],
        ["WHAT'S GONE",    "Four-step Diagnose / Foreskriv / Valider section. Coach report card. Dispersion sparkline in hero."],
        ["WHAT'S NEW",     "Three concrete pillars · one human quote · photography placeholders · bone sections."],
        ["WHAT'S DELAYED", "Tee-time booking demoted to a quiet \"coming summer 2026\" strip. Don't promise what isn't shipped."],
      ].map(([k, v], i) => (
        <div key={k} style={{ padding: 22, borderRight: i < 3 ? `1px solid ${C.line2}` : 0 }}>
          <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.22em" }}>{k}</div>
          <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginTop: 10 }}>{v}</div>
        </div>
      ))}
    </div>
  </Section>
);

// ── 06 · NEW LOGGED-IN HOME ───────────────────────────────────────────
const NewHomeMock = () => (
  <div style={{ background: C.bg, border: `1px solid ${C.line2}`, overflow: "hidden" }}>
    {/* nav — 4 tabs */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderBottom: `1px solid ${C.line2}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Logo size={18} />
        <div style={{ display: "flex", gap: 24 }}>
          {[["HJEM", true], ["SPILL", false], ["TREN", false], ["BANER", false]].map(([k, active]) => (
            <span key={k} className="mono" style={{
              fontSize: 11, letterSpacing: "0.22em",
              color: active ? C.ink : C.ink3,
              borderBottom: active ? `1px solid ${C.lime}` : "1px solid transparent",
              paddingBottom: 4,
            }}>{k}</span>
          ))}
          <span className="mono" style={{ fontSize: 11, color: C.ink4, letterSpacing: "0.22em" }}>⋯</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.2em" }}>FRE · 15 MAI</span>
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: C.lime, color: C.bg, fontFamily: "Geist Mono", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>EH</span>
      </div>
    </div>

    {/* Greeting + 1 big card */}
    <div style={{ padding: "48px 56px 32px" }}>
      <div className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em", marginBottom: 12 }}>GOD ETTERMIDDAG · 14:08</div>
      <h1 className="display" style={{ fontSize: 56, margin: 0 }}>
        Espen, <em>klar for runde?</em>
      </h1>
      <p style={{ fontSize: 16, color: C.ink2, lineHeight: 1.5, marginTop: 14, maxWidth: 640 }}>
        Været holder seg. Losby har 14:50 ledig. Tar deg én tap.
      </p>

      {/* THE ONE CARD — answers "what do I do next?" */}
      <div style={{ marginTop: 28, background: C.surf, border: `1px solid ${C.lime}`, padding: 0, display: "grid", gridTemplateColumns: "1.4fr 1fr" }}>
        <div style={{ padding: 32, borderRight: `1px solid ${C.line2}` }}>
          <Tag tone="accent">ANBEFALT · 14:50</Tag>
          <div className="display" style={{ fontSize: 44, marginTop: 14 }}>
            Losby GK<br /><em>i ettermiddag.</em>
          </div>
          <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.55, marginTop: 14 }}>
            18 hull · gul tee · 14°, vind SW 4 m/s · spilte her sist 12. mai (87, +15).
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button style={{ background: C.lime, color: C.bg, border: 0, padding: "12px 20px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Book tee-tid →</button>
            <button style={{ background: "transparent", color: C.ink, border: `1px solid ${C.line2}`, padding: "12px 20px", fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>Andre baner</button>
          </div>
        </div>
        <PhotoPlaceholder label="LOSBY · HOLE 1 · TODAY 14:08" />
      </div>
    </div>

    {/* Strip: HCP, last round, this week */}
    <div style={{ padding: "0 56px 32px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: `1px solid ${C.line2}` }}>
      {[
        ["INDEKS",        "11.5",  "↓ 0.4 / 30 dager", "trend"],
        ["SISTE RUNDE",   "87",    "12. MAI · LOSBY · +15", "round"],
        ["DENNE UKEN",    "2",     "RUNDER · 1 RANGEØKT", "week"],
        ["NESTE TEE-TID", "FRE",   "11:20 · TYRIFJORD GK", "next"],
      ].map(([l, v, s], i) => (
        <div key={l} style={{ padding: 22, borderRight: i < 3 ? `1px solid ${C.line2}` : 0 }}>
          <div className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.22em" }}>{l}</div>
          <div className="mono" style={{ fontSize: 32, color: C.ink, fontWeight: 500, marginTop: 6, letterSpacing: "-0.02em" }}>{v}</div>
          <div className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.18em", marginTop: 6 }}>{s}</div>
        </div>
      ))}
    </div>

    {/* Activity feed + quiet Coach */}
    <div style={{ padding: "32px 56px 48px", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24 }}>
      <div style={{ background: C.surf, border: `1px solid ${C.line2}` }}>
        <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.line2}` }}>
          <span className="mono" style={{ fontSize: 10, color: C.ink2, letterSpacing: "0.22em" }}>LOG · SISTE 30 DAGER</span>
          <span className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>5 · 1 RUNDE PR UKE</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 60px 60px 60px 20px", padding: "8px 18px", borderBottom: `1px solid ${C.line2}` }}>
          {["#","DATE","WHAT","SCORE","Δ HCP","TYPE",""].map(h => <span key={h} className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.18em" }}>{h}</span>)}
        </div>
        {[
          ["05", "12 MAI", "Losby Golfklubb",         "87",   "↓0.2", "RUNDE"],
          ["04", "10 MAI", "Rangeøkt — 7-jern",        "54",   "—",    "ØKT"],
          ["03", "08 MAI", "Tyrifjord Golfklubb",      "92",   "↑0.1", "RUNDE"],
          ["02", "06 MAI", "Rangeøkt — driver",        "68",   "—",    "ØKT"],
          ["01", "03 MAI", "Borre Golfbane",           "84",   "↓0.3", "RUNDE"],
        ].map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 60px 60px 60px 20px", padding: "13px 18px", borderBottom: i < 4 ? `1px solid ${C.line}` : 0, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 11, color: C.ink3 }}>{r[0]}</span>
            <span className="mono" style={{ fontSize: 11, color: C.ink2 }}>{r[1]}</span>
            <span style={{ fontSize: 14, color: C.ink }}>{r[2]}</span>
            <span className="mono" style={{ fontSize: 14, color: C.ink }}>{r[3]}</span>
            <span className="mono" style={{ fontSize: 11, color: r[4].startsWith("↓") ? C.lime : (r[4] === "—" ? C.ink3 : C.ink) }}>{r[4]}</span>
            <span className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.16em" }}>{r[5]}</span>
            <span style={{ color: C.ink3 }}>›</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ background: C.surf, border: `1px solid ${C.line2}`, padding: 20 }}>
          <div className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>INNSIKT · DENNE UKA</div>
          <p className="serif" style={{ fontSize: 17, color: C.ink, lineHeight: 1.35, margin: "14px 0 0" }}>
            "Tre runder, snittet ditt på par-3 er +0.4 — beste segment akkurat nå. Vi ser nærmere på det neste uke."
          </p>
          <div className="mono" style={{ fontSize: 9, color: C.ink4, letterSpacing: "0.2em", marginTop: 18 }}>
            STRIKELAB · BASERT PÅ 5 RUNDER
          </div>
        </div>
        <div style={{ background: C.surf, border: `1px solid ${C.line2}`, padding: 20 }}>
          <div className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>VENNER · 3 AKTIVE</div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {[["JB","J. Berg",   "11.4", "↓0.1"], ["ES","E. Solberg","4.8","→"], ["KN","K. Nilsen","9.0","↓0.3"]].map(p => (
              <div key={p[0]} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto auto", gap: 10, alignItems: "center" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.surf2, color: C.ink, fontSize: 10, fontFamily: "Geist Mono", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.line2}` }}>{p[0]}</span>
                <span style={{ fontSize: 13, color: C.ink }}>{p[1]}</span>
                <span className="mono" style={{ fontSize: 11, color: C.ink2 }}>{p[2]}</span>
                <span className="mono" style={{ fontSize: 10, color: p[3].startsWith("↓") ? C.lime : C.ink3 }}>{p[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const S6_Home = () => (
  <Section num="06" label="LOGGED-IN HOME · v2" title="One answer: what do I do next?"
    lede="The current home dumps a player profile, a bag, four metric cards, a session log, a training-plan progress bar, an AI coach strip, and a friends panel into a 1440-wide canvas. A returning user can't tell at a glance which thing is important. The new home picks one card and bets on it. Everything else is supporting evidence.">

    <NewHomeMock />

    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
      <Insight
        kicker="01 · GREETING"
        title="A name, a time, a question."
        body={<>"Espen, klar for runde?" — written like a friend, set in Instrument Serif italic. The serif italic stops being just brand chrome and starts being <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>the voice of the product</em>. That's the warming move.</>} />
      <Insight
        kicker="02 · ONE CARD"
        title="The next action — not five."
        body="Personalized to the moment. Today: Losby is open, weather's good, history says you like it there. If there's a tee time booked, the card becomes the round itself. If it's 21:00, it becomes a range session prompt." />
      <Insight
        kicker="03 · QUIET COACH"
        title="Sidebar, after 5 rounds."
        body={<>The AI coach is moved out of the hero — relegated to a calm sidebar card called <span className="mono" style={{ color: C.ink, fontSize: 12 }}>INNSIKT · DENNE UKA</span>. One sentence, in serif italic. It doesn't speak until it has something earned to say.</>} />
    </div>
  </Section>
);

const Insight = ({ kicker, title, body }) => (
  <div style={{ borderTop: `1px solid ${C.line2}`, paddingTop: 20 }}>
    <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.22em" }}>{kicker}</div>
    <div style={{ fontSize: 20, color: C.ink, marginTop: 10, fontWeight: 500, letterSpacing: "-0.02em" }}>{title}</div>
    <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, marginTop: 8 }}>{body}</div>
  </div>
);

// ── 07 · COPY · NO/EN ─────────────────────────────────────────────────
const CopyRow = ({ surface, no_old, en_old, no_new, en_new, note }) => (
  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 0, borderTop: `1px solid ${C.line2}` }}>
    <div style={{ padding: 18, borderRight: `1px solid ${C.line2}` }}>
      <div className="mono" style={{ fontSize: 10, color: C.lime, letterSpacing: "0.22em" }}>{surface}</div>
      <div className="mono" style={{ fontSize: 9, color: C.ink3, letterSpacing: "0.18em", marginTop: 8, lineHeight: 1.5 }}>{note}</div>
    </div>
    <div style={{ padding: 18, borderRight: `1px solid ${C.line2}` }}>
      <div className="mono" style={{ fontSize: 9, color: C.bad, letterSpacing: "0.22em", marginBottom: 8 }}>NÅ · NO</div>
      <div style={{ fontSize: 14, color: C.ink3, lineHeight: 1.5, marginBottom: 14 }}>{no_old}</div>
      <div className="mono" style={{ fontSize: 9, color: C.bad, letterSpacing: "0.22em", marginBottom: 8 }}>NOW · EN</div>
      <div style={{ fontSize: 14, color: C.ink3, lineHeight: 1.5 }}>{en_old}</div>
    </div>
    <div style={{ padding: 18 }}>
      <div className="mono" style={{ fontSize: 9, color: C.lime, letterSpacing: "0.22em", marginBottom: 8 }}>NY · NO</div>
      <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.5, marginBottom: 14 }}>{no_new}</div>
      <div className="mono" style={{ fontSize: 9, color: C.lime, letterSpacing: "0.22em", marginBottom: 8 }}>NEW · EN</div>
      <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{en_new}</div>
    </div>
  </div>
);

const S7_Copy = () => (
  <Section num="07" label="COPY · NO/EN" title="Same craft. Warmer voice. Less consulting."
    lede="Every line below is what a user sees in a real surface. The current column reads like an internal product spec. The proposed column reads like something a human golfer would say to another human golfer.">

    <div style={{ border: `1px solid ${C.line2}`, borderTop: 0 }}>
      <CopyRow surface="MARKETING · HERO" note="The five-second test"
        no_old="Bli presis. StrikeLab gjør rangeøkter, runder og enhetsdata om til én plan: diagnostiser feilen, tren med hensikt, og valider endringen på banen."
        en_old="Get dialed in. StrikeLab turns range sessions, rounds and device data into one plan: diagnose the fault, train with intent, validate on the course."
        no_new={<>All golfen din. <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>På ett sted.</em> Tee-tider, baner, scorekort og rangeøkter — i én app. Bygd i Norge.</>}
        en_new={<>Your golf, all in <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>one place.</em> Tee times, courses, scorecards and range sessions — one app. Built in Norway.</>}
      />
      <CopyRow surface="MARKETING · METODE" note="Replace the 4-step closed loop"
        no_old="Diagnose. Foreskriv. Validér. Lukket sløyfe for golfutvikling."
        en_old="Diagnose. Prescribe. Validate. A closed loop for golf development."
        no_new={<>Spill. Logg. <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>Bli bedre.</em> Strikelab holder rede på alt det du allerede gjør.</>}
        en_new={<>Play. Log. <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>Improve.</em> Strikelab quietly keeps track of everything you already do.</>}
      />
      <CopyRow surface="APP · HJEM · GREETING" note="The logged-in welcome"
        no_old="Espen, let's move it. Once you log a round or import a session, your handicap trend and patterns appear here."
        en_old="Espen, let's move it. Once you log a round or import a session, your handicap trend and patterns appear here."
        no_new={<>Espen, <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>klar for runde?</em> Været holder seg. Losby har 14:50 ledig.</>}
        en_new={<>Espen, <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>ready to play?</em> Weather looks good. Losby has 14:50 open.</>}
      />
      <CopyRow surface="APP · EMPTY · RANGE" note="First-time range upload"
        no_old="Logg inn og kjør StrikeLab API slik at økter fra StrikeLab Caddie vises her automatisk. Du kan fortsatt importere JSON fra telefonen (del-ikon) som lokal kopi i nettleseren."
        en_old="Sign in and run the StrikeLab API so sessions from StrikeLab Caddie appear here automatically. You can still import JSON from the phone (share icon) as a local copy in the browser."
        no_new={<>Last opp din første rangeøkt. Dra en CSV fra Trackman hit, eller koble Strikelab Caddie til iPhone. Vi gjør resten.</>}
        en_new={<>Upload your first range session. Drop a Trackman CSV here, or connect Strikelab Caddie on iPhone. We'll handle the rest.</>}
      />
      <CopyRow surface="APP · COACH · INSIGHT" note="The AI voice"
        no_old="Hvert slag blir bevis. Sti, blade, spredning, strokes gained og notater settes sammen til en lesbar diagnose."
        en_old="Every shot becomes evidence. Path, face, dispersion, strokes gained and notes combine into a readable diagnosis."
        no_new={<>"Tre runder, snittet ditt på par-3 er +0.4 — beste segment akkurat nå. Vi ser nærmere på det neste uke."</>}
        en_new={<>"Three rounds in, your par-3 average is +0.4 — best segment you've got right now. We'll look closer next week."</>}
      />
      <CopyRow surface="APP · PLAN · EMPTY" note="No data yet"
        no_old="Diagnose → resept → valider. Vi bygger en åtte-ukers blokk basert på Coach-rapporten din så snart du har 3+ økter eller runder logget."
        en_old="Diagnose → prescription → validate. We build an eight-week block based on your Coach report once you have 3+ sessions or rounds logged."
        no_new={<>Vi anbefaler en treningsplan når vi har sett deg spille noen runder først. <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>Ingen mas, vi venter.</em></>}
        en_new={<>We'll suggest a training plan once we've seen you play a few rounds. <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>No nagging — we'll wait.</em></>}
      />
      <CopyRow surface="CTA · PRIMARY" note="The download button"
        no_old="Bli med i betaen →"
        en_old="Join the beta →"
        no_new="Last ned · gratis →"
        en_new="Download · free →"
      />
    </div>
  </Section>
);

// ── 08 · DIRECTION OPTIONS ────────────────────────────────────────────
const DirectionCard = ({ letter, name, desc, palette, pros, cons, pick }) => (
  <div style={{ background: C.surf, border: `1px solid ${pick ? C.lime : C.line2}`, padding: 24, position: "relative" }}>
    {pick && (
      <div style={{ position: "absolute", top: -1, right: -1, background: C.lime, color: C.bg, padding: "4px 10px", fontFamily: "Geist Mono", fontSize: 9, letterSpacing: "0.22em" }}>RECOMMEND</div>
    )}
    <div className="mono" style={{ fontSize: 10, color: pick ? C.lime : C.ink3, letterSpacing: "0.22em" }}>OPTION · {letter}</div>
    <div className="display" style={{ fontSize: 32, marginTop: 10 }}>{name}</div>
    <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, marginTop: 10 }}>{desc}</p>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, marginTop: 20, height: 56 }}>
      {palette.map((color, i) => (
        <div key={i} style={{ background: color, border: `1px solid ${C.line}` }} />
      ))}
    </div>

    <hr className="rule" style={{ margin: "20px 0" }} />
    <div className="mono" style={{ fontSize: 9, color: C.lime, letterSpacing: "0.22em", marginBottom: 8 }}>PROS</div>
    <ul style={{ fontSize: 12, color: C.ink2, lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
      {pros.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
    <div className="mono" style={{ fontSize: 9, color: C.bad, letterSpacing: "0.22em", margin: "14px 0 8px" }}>CONS</div>
    <ul style={{ fontSize: 12, color: C.ink3, lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
      {cons.map((c, i) => <li key={i}>{c}</li>)}
    </ul>
  </div>
);

const S8_Direction = () => (
  <Section num="08" label="DIRECTION" title="Three palettes. One winner."
    lede="The aesthetic question: keep the dark editorial, soften everything to bone, or hybrid both. I have a strong opinion. Here's the reasoning, then the call.">

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
      <DirectionCard letter="A" name="Stay dark."
        desc="Keep the current black-bay aesthetic everywhere. Warm only through warmer copy and the addition of real photography. The brand chrome doesn't change."
        palette={[C.bg, C.surf, C.surf2, C.ink2, C.lime]}
        pros={["Cheapest to ship — no new system.", "Magnus stays comfortable.", "Differentiated from every competitor."]}
        cons={["Lars and Ingrid still feel they walked into a TrackMan bay.", "Reads cold on a phone in sunlight.", "Photography has to do all the warming work."]}
      />
      <DirectionCard letter="B" name="Hybrid · Dark editorial + bone story." pick
        desc="Dark stays the brand signature: nav, app, watch surfaces, the editorial hero. The marketing site shifts to bone (#EDE8DE) for the product story sections, plus the warm empty-states inside the app. Reads like a print magazine."
        palette={[C.bg, C.surf, C.bone2, C.bone, C.lime]}
        pros={["Brand DNA intact. Warmth where it matters.", "Bone sections invite real photography.", "App stays \"the lab\" — earned, premium."]}
        cons={["Two palettes = more system discipline.", "Need to be careful at section transitions.", "Lime needs to work on both backgrounds (lime is already great on bone — see anatomy above)."]}
      />
      <DirectionCard letter="C" name="Flip the script."
        desc={`Marketing site goes fully bone — Saturday newspaper sports section. The logged-in app keeps dark. The contrast becomes the marketing punchline: "warm outside, sharp inside."`}
        palette={[C.bone, C.bone2, C.boneSurf, C.boneInk, C.limeOnLight]}
        pros={["Strongest accessibility for first-time visitors.", "App feels like a tool you 'unlock'."]}
        cons={["Throws away the most ownable thing — the cinematic dark hero.", "Risk of looking like every other golf app on the first scroll.", "Light-mode lime is muddier than dark-mode lime."]}
      />
    </div>
  </Section>
);

// ── 09 · RECOMMENDATION ───────────────────────────────────────────────
const S9_Recommend = () => (
  <Section num="09" label="RECOMMENDATION" title="Pick B. Don't blink."
    lede={undefined}>
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 56, alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 18, color: C.ink, lineHeight: 1.6 }}>
          Strikelab's dark editorial is the single most defensible visual decision in the entire Norwegian golf market. Every competitor — GolfBox, GolfMore, Hole19, 18Birdies — looks like a 2014 Bootstrap dashboard. Throwing that away to look <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>warmer</em> is the wrong fix to the right problem.
        </p>
        <p style={{ fontSize: 16, color: C.ink2, lineHeight: 1.6, marginTop: 18 }}>
          The problem isn't the chrome. The problem is the words. The dark editorial is reading cold <em>because</em> the copy is cold. Swap the copy, add real Norwegian course photography, introduce bone for the product-story sections — and the whole system warms up without losing what makes it Strikelab.
        </p>
        <p style={{ fontSize: 16, color: C.ink2, lineHeight: 1.6, marginTop: 18 }}>
          Use serif italic more often, and use it for <em style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>human</em> moments — greetings, encouragement, the one-sentence coach insight — not just for brand chrome on display headings. The serif is your smile. Right now it's only smiling at the brand. Make it smile at the user.
        </p>
        <p style={{ fontSize: 16, color: C.ink2, lineHeight: 1.6, marginTop: 18 }}>
          Hire (or commission) a single afternoon of golf photography at three iconic Norwegian courses — Losby, Oslo GK, Borre. Twelve frames at golden hour. That alone moves the brand 40% warmer for zero design system change.
        </p>
      </div>
      <div style={{ background: C.surf, border: `1px solid ${C.line2}`, padding: 28 }}>
        <Tag tone="accent">THE ONE-LINER</Tag>
        <p className="serif" style={{ fontSize: 30, lineHeight: 1.25, color: C.ink, marginTop: 16 }}>
          "Strikelab needs warmer words and the same cold restraint, not warmer chrome."
        </p>
        <hr className="rule" style={{ margin: "20px 0" }} />
        <div className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>EXPECTED RESULT</div>
        <ul style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, paddingLeft: 16, marginTop: 10 }}>
          <li>5-second comprehension on landing.</li>
          <li>Lars and Ingrid don't bounce.</li>
          <li>Magnus still feels the product is built for him — just one click deeper.</li>
          <li>Same brand asset, broader audience.</li>
        </ul>
      </div>
    </div>
  </Section>
);

// ── 10 · BUILD NEXT ───────────────────────────────────────────────────
const BuildRow = ({ n, prio, what, surface, why }) => (
  <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1.4fr 1fr 1.4fr", padding: "18px 20px", borderBottom: `1px solid ${C.line}`, alignItems: "flex-start", gap: 18 }}>
    <span className="mono" style={{ fontSize: 12, color: C.ink4 }}>{n}</span>
    <Tag tone={prio === "P0" ? "accent" : prio === "P1" ? "warn" : "default"}>{prio}</Tag>
    <div>
      <div style={{ fontSize: 16, color: C.ink, fontWeight: 500 }}>{what}</div>
    </div>
    <span className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.18em", paddingTop: 4 }}>{surface}</span>
    <div style={{ fontSize: 13, color: C.ink2, lineHeight: 1.5 }}>{why}</div>
  </div>
);

const S10_Build = () => (
  <Section num="10" label="BUILD NEXT" title="Five surfaces. In order."
    lede="Concrete UI components to design this month, ranked by what unblocks the most user value per design hour. Anything below P2 is a nice-to-have that should wait until after the new hero ships and you've measured bounce-rate movement.">

    <div style={{ background: C.surf, border: `1px solid ${C.line2}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1.4fr 1fr 1.4fr", padding: "14px 20px", borderBottom: `1px solid ${C.line2}` }}>
        {["#", "PRIO", "SURFACE", "WHERE", "WHY NOW"].map(h => <span key={h} className="micro">{h}</span>)}
      </div>
      <BuildRow n="01" prio="P0"
        what="Landing page v2 — hybrid"
        surface="strikelab.golf/"
        why="The 5-second test. Replace the closed-loop story with the three-pillar story. Bone sections + one human quote + photography placeholders." />
      <BuildRow n="02" prio="P0"
        what="Logged-in home — one card"
        surface="strikelab.golf/hq"
        why="Pick the next action for the user. Greeting + one big card + 4-stat strip + activity feed + quiet sidebar. Cuts the cognitive load 70%." />
      <BuildRow n="03" prio="P0"
        what="Empty states across the app"
        surface="/range, /plan, /baner, /venner"
        why={`Every empty state currently says "you have nothing yet" in clinical language. Rewrite all five in warm serif italic with one concrete CTA each. Single biggest morale lift per pixel.`} />
      <BuildRow n="04" prio="P1"
        what="Course detail — with photography"
        surface="/baner/[slug]"
        why="Right now courses are abstract topographic SVG. Replace with one hero photo of the actual course + minimal data overlay. Let the place do the marketing." />
      <BuildRow n="05" prio="P1"
        what="Apple Watch complication — in marketing"
        surface="strikelab.golf/watch"
        why="A dedicated landing surface for the watch experience — using your existing Swing Watch and Caddie Watch screens. Watch is the most photogenic and differentiated piece of the product. Give it a real page." />
      <BuildRow n="06" prio="P2"
        what="Scorecard view"
        surface="In-app, after a round"
        why="The single moment of pride after 4 hours on the course. Should be the most beautiful screen in the app. Currently buried somewhere in /spill." />
      <BuildRow n="07" prio="P2"
        what={`"Insight · denne uka" voice`}
        surface="Home sidebar + email"
        why="One sentence per week, in serif italic, signed off as Strikelab. Replaces the AI Coach hero. Earn the right to speak; don't broadcast." />
      <BuildRow n="08" prio="P3"
        what="Friends / leaderboard rethink"
        surface="/venner"
        why="Currently a placeholder. Worth designing once 50+ beta users exist. Premature now." />
      <BuildRow n="09" prio="P3"
        what="Tee-time booking (when shipped)"
        surface="/tee"
        why="You have great mocks already (see tee-times.html in this project). Don't promise it until it's shipped." />
    </div>
  </Section>
);

// ── FOOTER ────────────────────────────────────────────────────────────
const Footer = () => (
  <div style={{ borderTop: `1px solid ${C.line2}`, padding: "56px 56px 80px", maxWidth: 1280, margin: "0 auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <Logo size={28} />
        <div className="display" style={{ fontSize: 44, marginTop: 24, maxWidth: 720 }}>
          The product is good. <em>Tell people that.</em>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <span className="mono" style={{ fontSize: 10, color: C.ink3, letterSpacing: "0.22em" }}>STRATEGY MEMO · 15 MAY 2026</span>
        <div className="mono" style={{ fontSize: 10, color: C.ink4, letterSpacing: "0.22em", marginTop: 6 }}>STRIKELAB · RETHINK · v0.1</div>
      </div>
    </div>
  </div>
);

// ── APP ───────────────────────────────────────────────────────────────
const App = () => (
  <div style={{ background: C.bg, color: C.ink, fontFamily: "Geist, sans-serif", minHeight: "100vh" }}
       data-screen-label="Strikelab Rethink">
    <style>{SHEET_CSS}</style>
    <Hero />
    <S1_Positioning />
    <S2_Bounces />
    <S3_Kill />
    <S4_IA />
    <S5_Landing />
    <S6_Home />
    <S7_Copy />
    <S8_Direction />
    <S9_Recommend />
    <S10_Build />
    <Footer />
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
