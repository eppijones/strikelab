import { Link, useParams } from 'react-router-dom'
import { roundShotAudioUrl, useRound } from '@/api/rounds'
import { Panel, Stat, Tag } from '@/components/ui'

export default function RoundDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: round, isLoading, isError } = useRound(id)

  if (isLoading) return <div className="mono text-[11px] text-ink-3">LOADING ROUND…</div>

  if (isError || !round) {
    return (
      <Panel id="ERR" title="ROUND NOT FOUND">
        <p className="text-body text-ink-2">
          We could not load this round. It may not have synced from your iOS Caddie yet.
        </p>
        <Link to="/rounds" className="mono text-[11px] text-accent-fg uppercase tracking-micro mt-3 inline-block">
          Back to rounds →
        </Link>
      </Panel>
    )
  }

  const playFormat = round.play_format ?? (round.holes.length <= 9 ? 'front9' : 'full18')
  const sections = scorecardSections(round.holes, playFormat)
  const playedHoles = sections.flatMap((section) => section.holes)
  const scorecardPar = playedHoles.reduce((sum, hole) => sum + hole.par, 0)
  const vsPar = round.total_gross - scorecardPar
  const targetHoles = playedHoles.length || round.holes.length || 18
  const shots = round.shots ?? []
  const withMotion = shots.filter((s) => s.motion_data).length
  const withHeart = shots.filter((s) => s.heart_rate_at_shot != null || s.biometric_data).length
  const withGps = shots.filter((s) => s.start_lat != null && s.start_lon != null).length
  const withAudio = shots.filter((s) => s.shot_context?.audio?.url).length
  const planned = round.planned_shots ?? []
  const plannedKeys = new Set(planned.map((s) => `${s.hole_number}:${s.order}`))
  const actualKeys = new Set(shots.map((s) => `${s.hole_number}:${s.shot_number}`))
  const plannedMatched = [...plannedKeys].filter((key) => actualKeys.has(key)).length

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/" className="hover:text-ink">HQ</Link> ›{' '}
          <Link to="/rounds" className="hover:text-ink">ROUNDS</Link> ›{' '}
          <span className="text-ink">R-{round.id.slice(-4).toUpperCase()}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="display text-[64px] m-0">{round.course_name}</h1>
            <div className="mono text-[11px] text-ink-3 mt-3 flex items-center gap-3">
              <span>{new Date(round.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
              <span>·</span>
              {round.selected_tee && <Tag>{round.selected_tee.toUpperCase()}</Tag>}
              <Tag tone={round.is_complete ? 'accent' : 'warn'}>
                {round.is_complete ? 'COMPLETE' : 'IN PROGRESS'}
              </Tag>
            </div>
          </div>
          <Link to={`/rounds/${round.id}/plan`} className="bg-accent text-accent-ink px-4 py-3 mono text-[11px] uppercase tracking-micro">
            Plan Shots →
          </Link>
        </div>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel id="R 01" title="GROSS"><Stat label="TOTAL" value={round.total_gross} /></Panel>
        <Panel id="R 02" title="NET"><Stat label="TOTAL" value={round.total_net} /></Panel>
        <Panel id="R 03" title="vs PAR">
          <Stat
            label="DIFF"
            value={`${vsPar > 0 ? '+' : ''}${vsPar}`}
            deltaTone={vsPar < 0 ? 'good' : vsPar > 0 ? 'warn' : 'neutral'}
          />
        </Panel>
        <Panel id="R 04" title="HOLES PLAYED">
          <Stat label={`OF ${targetHoles}`} value={playedHoles.filter((h) => h.gross_strokes > 0).length} />
        </Panel>
      </div>

      <Panel id="DATA" title="CAPTURE DATA">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Shots" value={shots.length} />
          <Stat label="GPS start" value={withGps} />
          <Stat label="Motion" value={withMotion} />
          <Stat label="Heart rate" value={withHeart} />
          <Stat label="Audio" value={withAudio} />
        </div>
      </Panel>

      <Panel id="REVIEW" title="ROUND REVIEW">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Plan match" value={planned.length ? `${plannedMatched}/${planned.length}` : '—'} />
          <Stat label="Club intents" value={planned.length} />
          <Stat label="Capture rate" value={shots.length ? `${Math.round((withHeart / shots.length) * 100)}% HR` : '—'} />
          <Stat label="GPS coverage" value={shots.length ? `${Math.round((withGps / shots.length) * 100)}%` : '—'} />
        </div>
        <p className="text-body text-ink-3 mt-3">
          Review whether the round was played to plan, then use missing GPS, HR, motion, or audio counts to diagnose capture setup before the next tee.
        </p>
      </Panel>

      <Panel id="PLAN" title="PLANNED SHOTS">
        {round.planned_shots?.length ? (
          <div className="space-y-2">
            {round.planned_shots
              .slice()
              .sort((a, b) => a.hole_number - b.hole_number || a.order - b.order)
              .map((shot) => (
                <div key={shot.id} className="border border-line-strong bg-bg-2/30 p-3 grid gap-3 sm:grid-cols-[80px_100px_1fr]">
                  <div className="mono text-[11px] text-ink-3">H{shot.hole_number} · #{shot.order}</div>
                  <div className="mono text-[13px] text-ink">{shot.club}</div>
                  <div className="text-body text-ink-2">{shot.notes || 'Planned target'}</div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-ink-3 mono text-[12px]">No planned shots yet.</p>
        )}
      </Panel>

      {/* Scorecard */}
      <Panel id="CARD" title="SCORECARD">
        {sections.map((section, index) => (
          <div key={section.label}>
            {index > 0 && <hr className="rule my-4" />}
            <Nine label={section.label} holes={section.holes} />
          </div>
        ))}
      </Panel>

      <Panel id="SHOTS" title="SHOT LOG">
        {shots.length ? (
          <div className="space-y-3">
            {shots.map((shot, index) => (
              <div key={shot.id} className="border border-line-strong bg-bg-2/30 p-3">
                <div className="grid gap-3 md:grid-cols-[80px_120px_1fr] md:items-start">
                  <div className="mono text-[11px] text-ink-3">#{index + 1}</div>
                  <div>
                    <div className="mono text-[13px] text-ink">{shot.club}</div>
                    <div className="mono text-[10px] text-ink-3">
                      Hole {shot.hole_number}
                      {shot.timestamp ? ` · ${new Date(shot.timestamp).toLocaleTimeString()}` : ''}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Mini label="Distance" value={shot.distance_yards != null ? `${shot.distance_yards.toFixed(0)} yds` : '—'} />
                    <Mini label="GPS" value={shot.start_lat != null ? `${shot.start_lat.toFixed(5)}, ${shot.start_lon?.toFixed(5)}` : '—'} />
                    <Mini label="HR" value={shot.heart_rate_at_shot != null ? `${shot.heart_rate_at_shot.toFixed(0)} bpm` : '—'} />
                    <Mini label="Motion" value={shot.motion_data ? 'IMU' : '—'} />
                  </div>
                </div>
                {shot.shot_context?.audio?.url ? (
                  <div className="mt-3">
                    <div className="micro text-ink-3 mb-2">Impact audio</div>
                    <audio controls preload="metadata" src={roundShotAudioUrl(round.id, shot.id)} className="w-full" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ink-3 mono text-[12px]">No shots have synced for this round yet.</p>
        )}
      </Panel>
    </div>
  )
}

function scorecardSections(
  holes: { hole_number: number; par: number; gross_strokes: number; net_strokes: number }[],
  playFormat: 'full18' | 'front9' | 'back9',
) {
  const front = holes.filter((h) => h.hole_number >= 1 && h.hole_number <= 9)
  const back = holes.filter((h) => h.hole_number >= 10 && h.hole_number <= 18)

  if (playFormat === 'front9') return [{ label: 'OUT', holes: front }]
  if (playFormat === 'back9') return [{ label: 'IN', holes: back.length ? back : holes.slice(0, 9) }]
  return [
    { label: 'OUT', holes: front.length ? front : holes.slice(0, 9) },
    { label: 'IN', holes: back.length ? back : holes.slice(9, 18) },
  ].filter((section) => section.holes.length > 0)
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-2 py-2">
      <div className="micro text-ink-3 mb-1">{label}</div>
      <div className="mono text-[11px] text-ink-2 break-all">{value}</div>
    </div>
  )
}

function Nine({ label, holes }: { label: string; holes: { hole_number: number; par: number; gross_strokes: number; net_strokes: number }[] }) {
  const totalPar = holes.reduce((a, h) => a + h.par, 0)
  const totalGross = holes.reduce((a, h) => a + h.gross_strokes, 0)
  return (
    <div>
      <div className="micro mb-3">{label}</div>
      <div className="grid items-center gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {holes.map((h) => (
          <div key={h.hole_number} className="mono text-[10px] text-ink-3 text-center">
            {h.hole_number}
          </div>
        ))}
        <div className="mono text-[10px] text-ink uppercase tracking-micro text-center">{label}</div>
      </div>
      <div className="grid items-center gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {holes.map((h) => (
          <div key={`p-${h.hole_number}`} className="mono text-[10px] text-ink-2 text-center">
            {h.par}
          </div>
        ))}
        <div className="mono text-[11px] text-ink-2 text-center">{totalPar}</div>
      </div>
      <div className="grid items-center gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {holes.map((h) => {
          const diff = h.gross_strokes - h.par
          return (
            <div
              key={`g-${h.hole_number}`}
              className={`num text-[14px] text-center border ${
                h.gross_strokes === 0
                  ? 'border-line text-ink-4'
                  : diff < 0
                  ? 'border-accent-fg text-accent-fg'
                  : diff > 0
                  ? 'border-warn text-warn'
                  : 'border-line-strong text-ink'
              } py-1`}
            >
              {h.gross_strokes || '—'}
            </div>
          )
        })}
        <div className="num text-[14px] text-center border border-ink-3 text-ink py-1">
          {totalGross}
        </div>
      </div>
    </div>
  )
}
