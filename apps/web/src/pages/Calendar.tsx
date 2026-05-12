import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTeeTimes, useDeleteTeeTime } from '@/api/courses'
import { useBookingSearch, useHoldSlot, useConfirmBooking, type BookingSlot } from '@/api/booking'
import { Panel, Tag } from '@/components/ui'

export default function Calendar() {
  useTranslation()
  const { data: teeTimes = [] } = useTeeTimes(false)
  const remove = useDeleteTeeTime()

  const [course, setCourse] = useState('')
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [players, setPlayers] = useState(2)
  const [notes, setNotes] = useState('')
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const search = useBookingSearch({ date, players })
  const hold = useHoldSlot()
  const confirm = useConfirmBooking()

  const slots = useMemo(() => search.data || [], [search.data])

  async function bookSlot(slot: BookingSlot) {
    setConfirmation(null)
    const h = await hold.mutateAsync({ ...slot, players })
    const result = await confirm.mutateAsync({ hold_id: h.hold_id, notes })
    setConfirmation(`✓ Booked ${result.course_name} (${result.status})`)
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">PLAY › CALENDAR · BOOKING</div>
        <h1 className="display text-[64px] m-0">
          Schedule the <em>round.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          Search providers, hold a slot, confirm. Internal slots and provider integrations merge into one list.
        </p>
      </header>

      {/* Search */}
      <Panel id="SRCH" title="SEARCH SLOTS">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_120px_140px] gap-3">
          <input
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="Course name (optional)…"
            className="bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
          />
          <select
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
            className="bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'player' : 'players'}
              </option>
            ))}
          </select>
          <button
            onClick={() => search.refetch()}
            disabled={search.isFetching}
            className="bg-accent text-accent-ink mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
          >
            {search.isFetching ? 'Searching…' : 'Search →'}
          </button>
        </div>
      </Panel>

      {/* Slot results */}
      <Panel id="SLOTS" title={`AVAILABLE · ${slots.length}`}>
        {search.isError && (
          <div className="text-body text-ink-2">Booking API not reachable.</div>
        )}
        {!search.isError && slots.length === 0 && !search.isFetching && (
          <div className="text-body text-ink-3">No slots — pick a date and search.</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {slots.map((s, i) => (
            <div
              key={`${s.tee_time}-${i}`}
              className="border border-line-strong p-4 grid items-center gap-4"
              style={{ gridTemplateColumns: '70px 1fr auto auto' }}
            >
              <div>
                <div className="num text-[20px] text-ink">
                  {new Date(s.tee_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="mono text-[10px] text-ink-3 mt-1">
                  {new Date(s.tee_time).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-[14px] text-ink">{s.course_name}</div>
                <div className="mono text-[10px] text-ink-3 mt-1">
                  {s.players_available} OPEN · {s.provider.toUpperCase()}
                </div>
              </div>
              {s.price_amount && (
                <span className="num text-[14px] text-ink-2">
                  {s.price_currency} {s.price_amount.toFixed(0)}
                </span>
              )}
              <button
                onClick={() => bookSlot(s)}
                disabled={s.players_available === 0 || hold.isPending || confirm.isPending}
                className="bg-accent text-accent-ink px-4 py-2 mono text-[10px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-30"
              >
                Book →
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for booking (optional)…"
            className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
          />
        </div>

        {confirmation && (
          <div className="mt-4 mono text-[11px] text-accent-fg">{confirmation}</div>
        )}
      </Panel>

      {/* Booked tee times */}
      <Panel id="TT" title="MY TEE TIMES">
        {teeTimes.length === 0 && <p className="text-body text-ink-3">No tee times yet.</p>}
        {teeTimes.map((tt) => (
          <div
            key={tt.id}
            className="grid items-baseline gap-3 py-3 border-b border-line"
            style={{ gridTemplateColumns: '90px 90px 1fr 100px 60px' }}
          >
            <span className="mono text-[11px] text-ink-3">
              {new Date(tt.tee_time).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
            </span>
            <span className="num text-[14px]">
              {new Date(tt.tee_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[14px] text-ink">{tt.course?.name || (tt as any).course_name || 'Course'}</span>
            <Tag tone={tt.status === 'confirmed' ? 'accent' : 'warn'}>{tt.status.toUpperCase()}</Tag>
            <button
              onClick={() => remove.mutate(tt.id)}
              className="mono text-[10px] text-bad uppercase tracking-micro text-right hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </Panel>
    </div>
  )
}
