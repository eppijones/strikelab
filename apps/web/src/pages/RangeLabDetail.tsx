import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts'
import { Panel, Tag } from '@/components/ui'
import { deleteRangeSession, fetchRangeSessionDetail, rangeShotAudioUrl } from '@/api/rangeSessions'
import { RangeImportRepository } from '@/features/range-session/db'
import {
  clubHistogram,
  clubSpeedMph,
  leverRatioForClubRaw,
  medianTempo,
  shotsWithTempoSeries,
  tempoFromMotion,
  verifySession,
} from '@/features/range-session/analytics'
import { parseStrikeLabRangeJson, parseStrikeLabRangeValue } from '@/features/range-session/parseExport'
import { SwingMiniRangeBar, SwingRangeBar } from '@/features/range-session/SwingRangeBar'
import type { PracticeSession } from '@/features/range-session/types'
import { useAuthStore } from '@/stores/authStore'

const TOUR_TEMPO_REFERENCE = 3.0

export default function RangeLabDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'local' | null>(null)
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const decoded = decodeURIComponent(id)
      setError(null)
      setSession(null)
      setSource(null)

      if (accessToken) {
        try {
          const detail = await fetchRangeSessionDetail(decoded)
          const parsed = parseStrikeLabRangeValue(detail.payload)
          if (parsed.ok) {
            setSource('api')
            setSession(parsed.session)
            setLabel(
              detail.location?.trim() ||
                (detail.start_time
                  ? `Range · ${new Date(detail.start_time).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}`
                  : `Range · ${detail.id.slice(0, 8)}`),
            )
            return
          }
          setError(parsed.message)
        } catch {
          // fall through to local IndexedDB
        }
      }

      const row = await RangeImportRepository.get(decoded)
      if (!row) {
        setError('Session not found. Sign in to load from the API, or import JSON on Range Lab home.')
        return
      }
      setError(null)
      setSource('local')
      setLabel(row.label)
      const parsed = parseStrikeLabRangeJson(row.rawJson)
      if (!parsed.ok) {
        setError(parsed.message)
        return
      }
      setSession(parsed.session)
    })()
  }, [id, accessToken])

  useEffect(() => {
    if (!session) {
      setSelectedShotId(null)
      return
    }
    const pick = session.shots.find((s) => s.motion)?.id ?? session.shots[0]?.id ?? null
    setSelectedShotId(pick)
  }, [session?.id, id])

  const selectedShot = useMemo(() => {
    if (!session || !selectedShotId) return null
    return session.shots.find((s) => s.id === selectedShotId) ?? null
  }, [session, selectedShotId])

  const recentTemposSameClub = useMemo(() => {
    if (!session || !selectedShot?.motion) return [] as number[]
    const club = selectedShot.club
    return session.shots
      .filter((s) => s.club === club && s.motion && s.id !== selectedShot.id)
      .map((s) => tempoFromMotion(s.motion!).ratio)
      .filter((r): r is number => r != null)
  }, [session, selectedShot])

  async function remove() {
    if (!session || !source) return
    const decoded = decodeURIComponent(id)
    if (source === 'api') {
      if (!window.confirm('Delete this session from StrikeLab (server)?')) return
      try {
        await deleteRangeSession(decoded)
        navigate('/lab/range')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed')
      }
      return
    }
    if (!window.confirm('Remove this import from this browser only?')) return
    await RangeImportRepository.remove(session.id)
    navigate('/lab/range')
  }

  if (error && !session) {
    return (
      <div className="max-w-3xl space-y-4">
        <p className="text-bad">{error}</p>
        <Link to="/lab/range" className="text-accent-fg underline mono text-[12px]">
          ← Range lab
        </Link>
      </div>
    )
  }

  if (!session) {
    return <p className="text-ink-3 mono text-[12px]">Loading…</p>
  }

  const verify = verifySession(session)
  const clubs = clubHistogram(session)
  const tempoSeries = shotsWithTempoSeries(session)
  const medTempo = medianTempo(session)
  const shotsWithAudio = session.shots.filter((s) => s.audio?.url)

  const issues: string[] = []
  if (verify.duplicateIds.length) issues.push(`Duplicate shot IDs: ${verify.duplicateIds.length}`)
  if (verify.uniqueIds !== verify.shotCount) issues.push('ID count does not match shot count.')
  if (verify.timeOrderIssues) issues.push(`${verify.timeOrderIssues} timestamp ordering issues (check clock / sync).`)
  if (verify.withoutMotion > 0)
    issues.push(`${verify.withoutMotion} shots have no IMU window (waveform may be audio-only on phone).`)

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/" className="hover:text-ink">
            HQ
          </Link>{' '}
          ›{' '}
          <Link to="/lab/range" className="hover:text-ink">
            RANGE LAB
          </Link>{' '}
          › <span className="text-ink">SESSION</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="display text-[36px] m-0">{label || 'Range session'}</h1>
          {source ? <Tag tone={source === 'api' ? 'accent' : 'default'}>{source === 'api' ? 'API' : 'LOCAL'}</Tag> : null}
        </div>
        <p className="text-body text-ink-2 mt-2">
          {verify.shotCount} swings
          {verify.sessionDurationMinutes != null ? ` · ~${verify.sessionDurationMinutes} min span` : ''}
          {session.location ? ` · ${session.location}` : ''}
        </p>
        {error ? <p className="text-warn text-[13px] mt-2">{error}</p> : null}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => void remove()}
            className="border border-line-strong text-ink-2 px-4 py-2 mono text-[10px] uppercase tracking-micro hover:border-bad hover:text-bad"
          >
            {source === 'api' ? 'Delete from server' : 'Remove from browser'}
          </button>
        </div>
      </header>

      <Panel id="RQ" title="DATA QUALITY">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="With motion buffer" value={`${verify.withMotion}`} />
          <Stat label="Full samples" value={`${verify.withSamples}`} />
          <Stat label="Heart rate" value={`${verify.withHeartRate}`} />
          <Stat label="Audio clips" value={`${shotsWithAudio.length}`} />
          <Stat label="Reliable tempo" value={`${verify.withReliableTempo}`} />
          <Stat label="Median gap (s)" value={verify.medianGapSeconds?.toFixed(1) ?? '—'} />
        </div>
        {issues.length ? (
          <ul className="mt-4 space-y-1 text-[13px] text-warn list-disc pl-5">
            {issues.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[13px] text-nordic-sage">No structural issues detected in this slice.</p>
        )}
      </Panel>

      <Panel id="RS" title="SHOT · SWING STRIP">
        <p className="text-body text-ink-2 text-[13px] mb-4">
          Same range-bar metaphor as StrikeLab Caddie: lime band = common skilled reference window, tick = this
          swing.
        </p>
        {session.shots.length === 0 ? (
          <p className="text-ink-3 mono text-[12px]">No shots in session.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="range-shot-select" className="micro text-ink-3 block mb-2">
                Select shot
              </label>
              <select
                id="range-shot-select"
                className="w-full max-w-md bg-bg-2 border border-line-strong text-ink mono text-[12px] px-3 py-2"
                value={selectedShotId ?? ''}
                onChange={(e) => setSelectedShotId(e.target.value || null)}
              >
                {session.shots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.club} · {new Date(s.timestamp).toLocaleTimeString()}
                    {s.motion ? ' · IMU' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedShot?.motion ? (
              (() => {
                const m = selectedShot.motion
                const t = tempoFromMotion(m)
                const mph = clubSpeedMph(m, selectedShot.club)
                const lever = leverRatioForClubRaw(selectedShot.club)
                const handMps = mph != null ? mph / 2.237 / lever : null
                return (
                  <div className="space-y-5 border border-line-strong bg-bg-2/30 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="mono text-[11px] text-ink-3 uppercase tracking-micro">
                        {selectedShot.club} · impact segmentation
                      </span>
                      {m.phases?.unreliable ? (
                        <span className="text-warn mono text-[10px]">Unreliable phases</span>
                      ) : (
                        <span className="text-nordic-sage mono text-[10px]">OK</span>
                      )}
                    </div>

                    {t.ratio != null ? (
                      <SwingRangeBar
                        label="Tempo (backswing : downswing)"
                        value={t.ratio}
                        min={1}
                        max={7}
                        range={[1.5, 6]}
                        target={[2.7, 3.3]}
                        valueSuffix=" :1"
                        width={320}
                        recent={recentTemposSameClub.slice(-14)}
                      />
                    ) : (
                      <p className="text-warn text-[12px] mono">Tempo ratio unavailable for this capture.</p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 border border-line-strong px-2 py-2 bg-bg">
                        <span className="mono text-[9px] text-ink-3 w-14 shrink-0">BACK</span>
                        <SwingMiniRangeBar
                          value={t.backswingSeconds}
                          min={0.35}
                          max={1.15}
                          range={[0.45, 0.95]}
                          target={[0.55, 0.88]}
                          width={130}
                        />
                        <span className="mono text-[11px] text-accent-fg shrink-0">{t.backswingSeconds.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center gap-2 border border-line-strong px-2 py-2 bg-bg">
                        <span className="mono text-[9px] text-ink-3 w-14 shrink-0">DOWN</span>
                        <SwingMiniRangeBar
                          value={Math.max(0.04, t.downswingSeconds)}
                          min={0.04}
                          max={0.45}
                          range={[0.12, 0.38]}
                          target={[0.2, 0.32]}
                          width={130}
                        />
                        <span className="mono text-[11px] text-accent-fg shrink-0">{t.downswingSeconds.toFixed(2)}s</span>
                      </div>
                    </div>

                    {mph != null && handMps != null ? (
                      <p className="mono text-[11px] text-ink-2">
                        Est. club speed ~<span className="text-accent-fg">{mph.toFixed(0)} mph</span>
                        {' · '}
                        hand ~{(handMps * 2.237).toFixed(0)} mph <span className="text-ink-4">(wrist model)</span>
                      </p>
                    ) : null}

                    {selectedShot.audio?.url ? (
                      <div className="border border-line-strong bg-bg px-3 py-2">
                        <div className="micro text-ink-3 mb-2">Impact audio</div>
                        <audio controls preload="metadata" src={rangeShotAudioUrl(session.id, selectedShot.id)} className="w-full" />
                      </div>
                    ) : null}
                  </div>
                )
              })()
            ) : (
              <p className="text-ink-3 mono text-[12px]">
                No IMU window on this shot — choose another row or re-export from Caddie after sync.
              </p>
            )}
          </div>
        )}
      </Panel>

      <Panel id="RA" title="IMPACT AUDIO">
        {shotsWithAudio.length ? (
          <div className="space-y-2">
            {session.shots.map((shot, index) =>
              shot.audio?.url ? (
                <div key={shot.id} className="grid gap-2 border border-line-strong bg-bg-2/30 p-3 md:grid-cols-[180px_1fr]">
                  <div>
                    <div className="mono text-[11px] text-ink">
                      #{index + 1} · {shot.club}
                    </div>
                    <div className="mono text-[10px] text-ink-3">{new Date(shot.timestamp).toLocaleTimeString()}</div>
                    {shot.audio.byteCount ? (
                      <div className="mono text-[10px] text-ink-4">{Math.round(shot.audio.byteCount / 1024)} KB</div>
                    ) : null}
                  </div>
                  <audio controls preload="metadata" src={rangeShotAudioUrl(session.id, shot.id)} className="w-full" />
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <p className="text-ink-3 mono text-[12px]">
            No impact audio has synced for this session yet. Keep Caddie cloud sync on and leave iPhone/Watch connected until upload completes.
          </p>
        )}
      </Panel>

      <Panel id="RT" title="TEMPO VS TOUR REFERENCE">
        <p className="text-body text-ink-2 mb-4 text-[14px]">
          Literature and coaching systems often cite a{' '}
          <strong className="text-ink">~3:1</strong> backswing-to-downswing ratio for skilled players (driver/long
          clubs vary). Your session median (shots with reliable segmentation):{' '}
          <strong className="text-ink">{medTempo != null ? medTempo.toFixed(2) : '—'}</strong>
          {medTempo != null ? (
            <>
              {' '}
              · Delta vs 3.0: <strong className="text-ink">{(medTempo - TOUR_TEMPO_REFERENCE).toFixed(2)}</strong>
            </>
          ) : null}
        </p>
        {tempoSeries.length >= 2 ? (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempoSeries} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d322f" />
                <XAxis dataKey="index" tick={{ fill: '#76746b', fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#76746b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#111312', border: '1px solid #2d322f', color: '#ede8de' }}
                  labelFormatter={(v) => `Shot ${v}`}
                />
                <ReferenceLine y={TOUR_TEMPO_REFERENCE} stroke="#d4a534" strokeDasharray="4 3" />
                <Line type="monotone" dataKey="ratio" stroke="#9fe870" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-ink-3 mono text-[12px]">Not enough reliable tempo points to plot a trend.</p>
        )}
        <p className="text-ink-4 mono text-[10px] mt-2 uppercase tracking-micro">
          Dashed line = 3.0 reference · Same phase math as StrikeLab Caddie iOS
        </p>
      </Panel>

      <Panel id="RC" title="CLUB MIX">
        {clubs.length ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clubs} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d322f" />
                <XAxis type="number" tick={{ fill: '#76746b', fontSize: 10 }} />
                <YAxis type="category" dataKey="club" width={100} tick={{ fill: '#b9b6ac', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#111312', border: '1px solid #2d322f', color: '#ede8de' }}
                  formatter={(v: number) => [`${v} shots`, 'Count']}
                />
                <Bar dataKey="count" fill="#9fe870" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-ink-3">No clubs.</p>
        )}
      </Panel>

      <Panel id="RN" title="NEXT SESSION">
        <ul className="list-disc pl-5 space-y-2 text-body text-ink-2 text-[14px]">
          <li>
            If many shots lack motion, keep the watch tight on the lead wrist and finish the swing calmly so
            segmentation stays reliable.
          </li>
          <li>
            Compare median tempo to your target feel — large drift across the session can mean fatigue or setup
            change.
          </li>
          <li>
            Sessions signed in on the phone sync to this view automatically; keep JSON exports as a cold backup.
          </li>
        </ul>
      </Panel>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line-strong px-3 py-2 bg-bg-2/40">
      <div className="micro text-ink-3 mb-1">{label}</div>
      <div className="num text-[20px] text-accent-fg">{value}</div>
    </div>
  )
}
