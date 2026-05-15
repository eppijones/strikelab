import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRound, useUpdateRoundPlan, type PlannedRoundShot } from '@/api/rounds'
import { Panel, Stat } from '@/components/ui'

const clubs = ['Driver', '5 Wood', '7 Iron', 'PW', '52°', '56°', 'Putter']

export default function RoundPlan() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: round, isLoading } = useRound(id)
  const updatePlan = useUpdateRoundPlan(id)
  const [hole, setHole] = useState(1)
  const [club, setClub] = useState('7 Iron')
  const [note, setNote] = useState('')

  const planned = round?.planned_shots ?? []
  const holePlan = useMemo(
    () => planned.filter((s) => s.hole_number === hole).sort((a, b) => a.order - b.order),
    [planned, hole]
  )

  if (isLoading) return <div className="mono text-[11px] text-ink-3">LOADING PLAN…</div>
  if (!round) return <div className="mono text-[11px] text-ink-3">ROUND NOT FOUND</div>

  const addShot = async () => {
    const next: PlannedRoundShot = {
      id: crypto.randomUUID(),
      hole_number: hole,
      order: holePlan.length + 1,
      club,
      target_position: { kind: 'web-intent', progress: Math.min(0.92, 0.25 + holePlan.length * 0.28) },
      start_position: holePlan.length ? holePlan[holePlan.length - 1].target_position : null,
      expected_distance: null,
      notes: note.trim() || null,
    }
    await updatePlan.mutateAsync([...planned, next])
    setNote('')
  }

  const removeShot = async (shotId: string) => {
    const filtered = planned.filter((s) => s.id !== shotId)
    const reordered = filtered.map((s) => {
      if (s.hole_number !== hole) return s
      const order = filtered.filter((x) => x.hole_number === hole && x.order <= s.order).length
      return { ...s, order }
    })
    await updatePlan.mutateAsync(reordered)
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to={`/rounds/${round.id}`} className="hover:text-accent-fg">ROUND</Link> › PLAN
        </div>
        <h1 className="display text-[56px] m-0">Plan {round.course_name}</h1>
        <p className="text-body text-ink-2 mt-3 max-w-[760px]">
          Build a shot intent before you play. After sync, StrikeLab compares planned club and sequence against actual watch-captured shots.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel id="P 01" title="HOLE"><Stat label="ACTIVE" value={hole} /></Panel>
        <Panel id="P 02" title="PLANNED"><Stat label="SHOTS" value={planned.length} /></Panel>
        <Panel id="P 03" title="STATUS"><Stat label="SYNC" value={updatePlan.isPending ? 'SAVING' : 'READY'} /></Panel>
      </div>

      <Panel id="HOLES" title="SELECT HOLE">
        <div className="grid grid-cols-9 gap-2">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setHole(n)}
              className={`mono text-[11px] border px-2 py-2 ${hole === n ? 'bg-accent text-accent-ink border-accent' : 'border-line text-ink-2'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </Panel>

      <Panel id="ADD" title="ADD SHOT INTENT">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <select value={club} onChange={(e) => setClub(e.target.value)} className="bg-bg-2 border border-line px-3 py-2 mono text-[12px]">
            {clubs.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Aim note, miss guard, or commitment"
            className="bg-bg-2 border border-line px-3 py-2 text-body"
          />
          <button onClick={addShot} disabled={updatePlan.isPending} className="bg-accent text-accent-ink px-4 py-2 mono text-[11px] uppercase tracking-micro">
            Add Shot
          </button>
        </div>
      </Panel>

      <Panel id="PLAN" title={`HOLE ${hole} PLAN`}>
        {holePlan.length ? (
          <div className="space-y-2">
            {holePlan.map((shot) => (
              <div key={shot.id} className="border border-line-strong bg-bg-2/30 p-3 grid gap-3 md:grid-cols-[60px_120px_1fr_auto] md:items-center">
                <div className="mono text-[11px] text-ink-3">#{shot.order}</div>
                <div className="mono text-[13px] text-ink">{shot.club}</div>
                <div className="text-body text-ink-2">{shot.notes || 'No note yet'}</div>
                <button onClick={() => removeShot(shot.id)} className="mono text-[10px] text-bad uppercase tracking-micro">Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mono text-[12px] text-ink-3">No planned shots for this hole yet.</p>
        )}
      </Panel>
    </div>
  )
}
