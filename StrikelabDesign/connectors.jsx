// Connectors / data import.

const Connectors = ({ mode = 'dark' }) => {
  const sources = [
    { name: 'TrackMan', kind: 'Premium radar launch monitor', status: 'CONNECTED', detail: 'Last sync · 12 min ago · 88 shots imported', tone: 'good' },
    { name: 'Foresight GCQuad', kind: 'Camera-based launch monitor', status: 'CONNECTED', detail: 'Last sync · 2 days ago', tone: 'good' },
    { name: 'GSPro', kind: 'Simulator round data', status: 'CONNECTED', detail: 'Auto · push on round complete', tone: 'good' },
    { name: 'Topgolf Toptracer', kind: 'Range venue', status: 'NOT CONNECTED', detail: 'Sync via mobile QR', tone: 'idle' },
    { name: 'Uneekor EYE XO', kind: 'Overhead camera launch monitor', status: 'NOT CONNECTED', detail: 'Sync via local app', tone: 'idle' },
    { name: 'Rapsodo MLM2 Pro', kind: 'Portable monitor', status: 'NOT CONNECTED', detail: 'Sync via cloud account', tone: 'idle' },
    { name: 'SkyTrak+', kind: 'Photometric monitor', status: 'NOT CONNECTED', detail: 'Sync via local network', tone: 'idle' },
    { name: 'Stack System', kind: 'Speed training', status: 'COMING Q3', detail: 'Pre-registered · waitlist', tone: 'soon' },
  ];

  return (
    <div className="sl-theme" data-mode={mode} style={{ width: 1440, background: 'var(--bg)', color: 'var(--ink)', minHeight: 900 }}>
      <style>{SL_THEME_CSS}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SLLogo size={18} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>DATA ›</span>
          <span className="mono" style={{ fontSize: 11 }}>CONNECTORS</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>● 3 OF 8 SOURCES LIVE</span>
      </div>

      <div style={{ padding: '40px 32px 56px' }}>
        <div className="micro">DATA · INPUT</div>
        <h1 className="display" style={{ fontSize: 80, margin: '12px 0 0' }}>
          Bring your <em>data.</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 720, marginTop: 14, lineHeight: 1.5 }}>
          Pipe in any monitor or simulator. Drop a CSV. The Bay reads what you give it and starts measuring.
        </p>

        {/* CSV / Drop zone */}
        <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <Panel id="UPLOAD" title="MANUAL · CSV / XLSX" padded={false}>
            <div style={{ padding: 28, borderBottom: '1px solid var(--line-strong)' }}>
              <div style={{ border: '1px dashed var(--line-strong)', padding: 36, textAlign: 'center', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: 'var(--ink-2)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 16 L12 4 M7 9 L12 4 L17 9" stroke="currentColor"/><path d="M4 20 L20 20" stroke="currentColor"/></svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>Drop a session CSV</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.16em' }}>OR CLICK TO BROWSE · MAX 50MB</div>
                <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['shot_number','club','carry_distance','ball_speed','smash_factor','launch_angle','spin_rate','spin_axis','face_angle','face_to_path','attack_angle','offline_distance'].map(c => (
                    <span key={c} className="mono" style={{ fontSize: 9, padding: '3px 7px', border: '1px solid var(--line)', color: 'var(--ink-3)', letterSpacing: '0.14em' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
              <input placeholder="Session name (optional, e.g. 'Range — driver focus')" style={{ background: 'var(--bg-2)', border: '1px solid var(--line-strong)', color: 'var(--ink)', padding: '12px 14px', fontFamily: 'Geist Mono', fontSize: 12, outline: 'none' }} />
              <button style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, padding: '12px 20px', fontFamily: 'Geist Mono', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Upload →</button>
            </div>
          </Panel>

          <Panel id="STATUS" title="PIPELINE · LAST 24H">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <Stat label="SHOTS IN" value="312" delta="+88 today" />
              <Stat label="SOURCES" value="3/8" />
              <Stat label="LAST SYNC" value="12m" unit="ago" />
              <Stat label="HEALTH" value="OK" delta="all green" />
            </div>
            <hr className="rule" style={{ margin: '0 0 14px' }} />
            <div className="micro" style={{ marginBottom: 8 }}>EVENT LOG</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {[
                ['16:42','TRACKMAN sync · 88 shots','good'],
                ['16:38','Session 047 created','good'],
                ['14:12','GSPRO round complete · 18 holes','good'],
                ['09:04','CSV upload · wedge_dial.csv · 96 rows','good'],
                ['08:58','Topgolf · auth expired','warn'],
              ].map(([t, b, tone], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 8px', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{b}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone === 'warn' ? 'var(--warn)' : 'var(--accent)' }} />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* SOURCE GRID */}
        <div style={{ marginTop: 24, border: '1px solid var(--line-strong)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--line-strong)' }}>
            <span className="micro">SOURCES · 8 AVAILABLE</span>
            <span className="micro">SORT · STATUS · NAME</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {sources.map((s, i) => (
              <div key={s.name} style={{ padding: 22, borderRight: i % 2 === 0 ? '1px solid var(--line-strong)' : 0, borderBottom: i < sources.length - 2 ? '1px solid var(--line-strong)' : 0, display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.tone === 'good' ? 'var(--accent)' : 'var(--ink-3)' }}>
                  <SLLogo size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{s.name}</span>
                    <Tag tone={s.tone === 'good' ? 'accent' : s.tone === 'soon' ? 'warn' : 'default'}>{s.status}</Tag>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.16em' }}>· {s.kind.toUpperCase()}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 6 }}>{s.detail}</div>
                </div>
                <button style={{ background: s.tone === 'good' ? 'transparent' : s.tone === 'soon' ? 'transparent' : 'var(--accent)', color: s.tone === 'good' ? 'var(--ink-2)' : s.tone === 'soon' ? 'var(--ink-3)' : 'var(--accent-ink)', border: s.tone === 'good' || s.tone === 'soon' ? '1px solid var(--line-strong)' : 0, padding: '10px 16px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: s.tone === 'soon' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {s.tone === 'good' ? 'Manage' : s.tone === 'soon' ? 'Waitlist' : 'Connect →'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* API */}
        <Panel id="API" title="API · DEVELOPER" style={{ marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Push your own data</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>POST shots to the Bay. Tour tier only.</div>
              <pre className="mono" style={{ background: 'var(--bg-2)', border: '1px solid var(--line-strong)', padding: 14, marginTop: 14, fontSize: 11, color: 'var(--ink-2)', overflow: 'auto' }}>{`curl -X POST https://api.strikelab.app/v1/shots \\
  -H "Authorization: Bearer sl_live_••••" \\
  -d @session.json`}</pre>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>API Key</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>Rotates every 90 days. Last rotated 12 Apr.</div>
              <div className="mono" style={{ background: 'var(--bg-2)', border: '1px solid var(--line-strong)', padding: 14, marginTop: 14, fontSize: 11, color: 'var(--accent)' }}>sl_live_•••••••••••••••••••••6b3a</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)', padding: '8px 14px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Reveal</button>
                <button style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line-strong)', padding: '8px 14px', fontFamily: 'Geist Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>Rotate</button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

window.Connectors = Connectors;
