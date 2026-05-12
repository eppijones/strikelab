import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/api/sessions'
import { useSessionLog, useCreateLog } from '@/api/logs'
import { Panel, Tag } from '@/components/ui'

const FEEL_TAGS = ['Calm', 'Heavy', 'Late', 'Stress', 'Focused', 'Smooth', 'Quick', 'Tight', 'Confident', 'Uncertain']

export default function SessionLog() {
  useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const { data: session } = useSession(id)
  const { data: existing } = useSessionLog(id)
  const create = useCreateLog()

  const [energy, setEnergy] = useState<number>(existing?.energy_level || 7)
  const [mental, setMental] = useState<number>(existing?.mental_state || 7)
  const [intent, setIntent] = useState<string>(existing?.intent || '')
  const [tags, setTags] = useState<string[]>(existing?.feel_tags || [])
  const [worked, setWorked] = useState<string>(existing?.what_worked || '')
  const [forward, setForward] = useState<string>(existing?.take_forward || '')
  const [saved, setSaved] = useState(false)

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t]))
  }

  async function submit() {
    await create.mutateAsync({
      session_id: id,
      energy_level: energy,
      mental_state: mental,
      intent,
      feel_tags: tags,
      what_worked: worked,
      take_forward: forward,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/" className="hover:text-ink">HQ</Link> ›{' '}
          <Link to={`/sessions/${id}`} className="hover:text-ink">SESSIONS</Link> ›{' '}
          <span className="text-ink">LOG</span>
        </div>
        <h1 className="display text-[40px] m-0">
          Session <em>log.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          {session?.name || 'Capture how it felt — energy, intent, and what to take forward.'}
        </p>
      </header>

      <Panel id="L 01" title="STATE">
        <Slider label="ENERGY (1–10)" value={energy} onChange={setEnergy} />
        <Slider label="MENTAL (1–10)" value={mental} onChange={setMental} />
      </Panel>

      <Panel id="L 02" title="INTENT">
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={3}
          placeholder="What was the goal of this session?"
          className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none resize-none"
        />
      </Panel>

      <Panel id="L 03" title="FEEL TAGS">
        <div className="flex flex-wrap gap-2">
          {FEEL_TAGS.map((tagName) => (
            <button
              key={tagName}
              onClick={() => toggleTag(tagName)}
              className={`mono text-[10px] uppercase tracking-micro px-3 py-2 border ${
                tags.includes(tagName)
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line-strong text-ink-2 hover:border-ink-3'
              }`}
            >
              {tagName}
            </button>
          ))}
        </div>
      </Panel>

      <Panel id="L 04" title="WHAT WORKED">
        <textarea
          value={worked}
          onChange={(e) => setWorked(e.target.value)}
          rows={3}
          className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none resize-none"
        />
      </Panel>

      <Panel id="L 05" title="TAKE FORWARD">
        <textarea
          value={forward}
          onChange={(e) => setForward(e.target.value)}
          rows={3}
          className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none resize-none"
        />
      </Panel>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={create.isPending}
          className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
        >
          {existing ? 'Update Log →' : 'Submit Log →'}
        </button>
        {saved && <Tag tone="accent">SAVED</Tag>}
      </div>
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between mb-2">
        <label className="micro">{label}</label>
        <span className="num text-[14px] text-accent-fg">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  )
}
