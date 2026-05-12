import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Panel, Tag } from '@/components/ui'
import { SwingRepository } from '@/features/swing-lab/db'
import type { SwingSession } from '@/features/swing-lab/types'

export default function SwingLabCompare() {
  const [sessions, setSessions] = useState<SwingSession[]>([])
  const [leftId, setLeftId] = useState<string>('')
  const [rightId, setRightId] = useState<string>('')

  useEffect(() => {
    SwingRepository.getAll().then(setSessions)
  }, [])

  const left = sessions.find((s) => s.id === leftId)
  const right = sessions.find((s) => s.id === rightId)

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/lab" className="hover:text-ink">LAB</Link> › <span className="text-ink">COMPARE</span>
        </div>
        <h1 className="display text-[64px] m-0">
          Side-by-<em>side.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          Sync two swings on the same phase. Read deltas across spine, hip, X-factor, shaft lean.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <CompareColumn label="LEFT" sessions={sessions} selectedId={leftId} onChange={setLeftId} session={left} />
        <CompareColumn label="RIGHT" sessions={sessions} selectedId={rightId} onChange={setRightId} session={right} />
      </div>
    </div>
  )
}

function CompareColumn({
  label,
  sessions,
  selectedId,
  onChange,
  session,
}: {
  label: string
  sessions: SwingSession[]
  selectedId: string
  onChange: (id: string) => void
  session?: SwingSession
}) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!session) {
      setUrl(null)
      return
    }
    const u = URL.createObjectURL(session.videoBlob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [session])

  return (
    <Panel id={label} title={`${label} SWING`} padded={false}>
      <div className="p-3 border-b border-line-strong">
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
        >
          <option value="">Select a session…</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="aspect-video bg-black flex items-center justify-center">
        {url ? (
          <video src={url} controls className="w-full h-full object-contain" />
        ) : (
          <div className="mono text-[10px] text-ink-3">Pick a session →</div>
        )}
      </div>
      {session && (
        <div className="p-3 flex items-center justify-between">
          <span className="mono text-[11px] text-ink-2">{session.name}</span>
          {session.clubType && <Tag>{session.clubType.toUpperCase()}</Tag>}
        </div>
      )}
    </Panel>
  )
}
