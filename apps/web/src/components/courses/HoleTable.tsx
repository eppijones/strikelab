import type { HoleData } from '@/api/courses'

interface Props {
  holes: HoleData[]
  onChange: (holes: HoleData[]) => void
  unit?: 'yards' | 'meters'
}

export function HoleTable({ holes, onChange, unit = 'yards' }: Props) {
  const ensureLength = (n: number): HoleData[] => {
    const out = [...holes]
    while (out.length < n) {
      out.push({ number: out.length + 1, par: 4 })
    }
    return out.slice(0, n).map((h, i) => ({ ...h, number: i + 1 }))
  }

  const updateHole = (idx: number, patch: Partial<HoleData>) => {
    const next = ensureLength(holes.length || 18)
    next[idx] = { ...next[idx], ...patch }
    onChange(next)
  }

  const setLength = (n: number) => {
    onChange(ensureLength(n))
  }

  const totalPar = holes.reduce((acc, h) => acc + (h.par || 0), 0)
  const totalDistance = holes.reduce((acc, h) => acc + ((unit === 'yards' ? h.yards : h.meters) ?? 0), 0)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="micro">HOLE-BY-HOLE · {unit.toUpperCase()}</div>
        <div className="flex gap-1">
          {[9, 18].map((n) => (
            <button
              key={n}
              onClick={() => setLength(n)}
              className={`px-2.5 py-1 mono text-[10px] uppercase tracking-micro border ${
                holes.length === n
                  ? 'border-accent-fg text-accent-fg'
                  : 'border-line-strong text-ink-3 hover:border-ink-3'
              }`}
            >
              {n} HOLES
            </button>
          ))}
        </div>
      </div>

      <div className="border border-line-strong">
        <div
          className="grid items-center gap-2 px-3 py-2 border-b border-line-strong bg-bg-2"
          style={{ gridTemplateColumns: '40px 60px 60px 1fr' }}
        >
          {['#', 'PAR', 'HCP', unit === 'yards' ? 'YDS' : 'M'].map((h) => (
            <span
              key={h}
              className="mono text-[9px] text-ink-3 tracking-micro-tight"
            >
              {h}
            </span>
          ))}
        </div>

        {holes.map((hole, idx) => (
          <div
            key={hole.number}
            className="grid items-center gap-2 px-3 py-1.5 border-b border-line last:border-b-0"
            style={{ gridTemplateColumns: '40px 60px 60px 1fr' }}
          >
            <span className="mono text-[11px] text-ink-3">
              {String(hole.number).padStart(2, '0')}
            </span>
            <NumberCell
              value={hole.par}
              onChange={(v) => updateHole(idx, { par: v })}
              min={3}
              max={6}
            />
            <NumberCell
              value={hole.handicap}
              onChange={(v) => updateHole(idx, { handicap: v })}
              min={1}
              max={18}
            />
            <NumberCell
              value={unit === 'yards' ? hole.yards : hole.meters}
              onChange={(v) =>
                updateHole(
                  idx,
                  unit === 'yards' ? { yards: v } : { meters: v }
                )
              }
            />
          </div>
        ))}

        <div
          className="grid items-center gap-2 px-3 py-2 border-t border-line-strong bg-bg-2"
          style={{ gridTemplateColumns: '40px 60px 60px 1fr' }}
        >
          <span className="mono text-[10px] text-ink-3 tracking-micro">TOT</span>
          <span className="num text-[12px] text-ink">{totalPar}</span>
          <span className="mono text-[10px] text-ink-3">—</span>
          <span className="num text-[12px] text-ink">
            {totalDistance > 0 ? totalDistance : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function NumberCell({
  value,
  onChange,
  min,
  max,
}: {
  value?: number
  onChange: (v: number | undefined) => void
  min?: number
  max?: number
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      onChange={(e) =>
        onChange(e.target.value === '' ? undefined : Number(e.target.value))
      }
      className="w-full bg-transparent border border-transparent hover:border-line text-ink px-1.5 py-1 mono text-[12px] focus:border-accent-fg focus:outline-none"
    />
  )
}
