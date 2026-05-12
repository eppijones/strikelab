// App shell — design canvas with all artboards + tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "dark",
  "accentHue": 125,
  "density": "comfortable"
}/*EDITMODE-END*/;

const App = () => {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const id = 'sl-accent-override';
    let style = document.getElementById(id);
    if (!style) { style = document.createElement('style'); style.id = id; document.head.appendChild(style); }
    style.textContent = `
      .sl-theme[data-mode="dark"] { --accent: oklch(0.88 0.18 ${t.accentHue}); --accent-2: oklch(0.78 0.18 ${t.accentHue}); }
      .sl-theme[data-mode="light"] { --accent: oklch(0.55 0.18 ${t.accentHue}); --accent-2: oklch(0.45 0.18 ${t.accentHue}); }
    `;
  }, [t.accentHue]);

  const { DesignCanvas, DCSection, DCArtboard, TweaksPanel, TweakSection, TweakRadio, TweakSlider } = window;

  return (
    <>
      <DesignCanvas>
        <DCSection id="brand" title="01 — Brand System" subtitle="Identity, type, color, motion, icons">
          <DCArtboard id="brand-1" label="Identity sheet" width={1440} height={2400}>
            <BrandSystem />
          </DCArtboard>
        </DCSection>

        <DCSection id="marketing" title="02 — Marketing Site" subtitle="Hero · method · pricing · CTA">
          <DCArtboard id="mkt-1" label="strikelab.app — home" width={1440} height={3600}>
            <Marketing mode={t.mode} />
          </DCArtboard>
        </DCSection>

        <DCSection id="product" title="03 — Product · The Bay" subtitle="Command Center, sessions, reports, plan, data">
          <DCArtboard id="dash" label="Command Center / Dashboard" width={1440} height={1080}>
            <Dashboard mode={t.mode} />
          </DCArtboard>
          <DCArtboard id="session" label="Session detail · S-047" width={1440} height={2200}>
            <SessionDetail mode={t.mode} />
          </DCArtboard>
          <DCArtboard id="coach" label="Coach Report · R-038" width={1440} height={1900}>
            <CoachReport mode={t.mode} />
          </DCArtboard>
          <DCArtboard id="plan" label="Training plan · 8 weeks" width={1440} height={1700}>
            <TrainingPlan mode={t.mode} />
          </DCArtboard>
          <DCArtboard id="data" label="Connectors · data import" width={1440} height={1700}>
            <Connectors mode={t.mode} />
          </DCArtboard>
        </DCSection>

        <DCSection id="caddie" title="04 — StrikeLab Caddie · Apple Watch" subtitle="On-course companion · 6 screens">
          <DCArtboard id="caddie-1" label="Caddie · screens & rationale" width={1440} height={1500}>
            <Caddie />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakRadio label="Mode" value={t.mode} options={[['dark','Dark'],['light','Light']]} onChange={v => setTweak('mode', v)} />
          <TweakSlider label="Accent hue" value={t.accentHue} min={0} max={360} step={1} onChange={v => setTweak('accentHue', v)} />
        </TweakSection>
        <TweakSection title="Accent presets">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['Lime', 125],['Orange', 50],['Amber', 80],['Cyan', 200],['Magenta', 330]].map(([n, h]) => (
              <button key={n} onClick={() => setTweak('accentHue', h)} style={{ background: `oklch(0.85 0.18 ${h})`, color: '#0a0b0a', border: 0, padding: '6px 12px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
