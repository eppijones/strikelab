// Swing Lab — Library entry. Phase 3 fleshes out analyzer + compare.
import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, Tag, Stat } from '@/components/ui'
import { SwingRepository } from '@/features/swing-lab/db'
import type { SwingSession } from '@/features/swing-lab/types'
import { generateThumbnail } from '@/features/swing-lab/lib/videoUtils'

export default function SwingLabLibrary() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<SwingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setSessions(await SwingRepository.getAll())
    setLoading(false)
  }

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const thumbBlob = await generateThumbnail(file).catch(() => null)
      await SwingRepository.create({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.\w+$/, ''),
        date: new Date().toISOString(),
        videoBlob: file,
        thumbnailBlob: (thumbBlob as Blob) ?? new Blob(),
        tags: [],
        category: 'personal',
        notes: '',
        handedness: 'right',
        phaseMarkers: {
          address: null,
          takeaway: null,
          top: null,
          transition: null,
          impact: null,
          followThrough: null,
        },
        phaseKeypoints: {
          address: null,
          takeaway: null,
          top: null,
          transition: null,
          impact: null,
          followThrough: null,
        },
        analysisResults: {
          address: null,
          takeaway: null,
          top: null,
          transition: null,
          impact: null,
          followThrough: null,
        },
        freeAnnotations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await refresh()
    } finally {
      setUploading(false)
    }
  }

  async function deleteSession(id: string) {
    await SwingRepository.remove(id)
    await refresh()
  }

  const personal = sessions.filter((s) => s.category === 'personal')
  const pros = sessions.filter((s) => s.category === 'pro')

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6 flex items-end justify-between gap-8">
        <div>
          <div className="micro mb-3">LAB › LIBRARY</div>
          <h1 className="display text-[64px] m-0">
            Swing <em>video lab.</em>
          </h1>
          <p className="text-body text-ink-2 mt-3">
            Upload, mark phases, place keypoints, read biomechanics against tour-grade norms.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/lab/range"
            className="bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
          >
            Range data →
          </Link>
          <Link
            to="/lab/compare"
            className="bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
          >
            {t('swingLab.compare')} →
          </Link>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : `+ ${t('swingLab.uploadVideo')}`}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Panel id="L 01" title="LIBRARY"><Stat label="SESSIONS" value={sessions.length} /></Panel>
        <Panel id="L 02" title="PERSONAL"><Stat label="MINE" value={personal.length} /></Panel>
        <Panel id="L 03" title="PRO REFERENCE"><Stat label="PROS" value={pros.length} /></Panel>
      </div>

      <Panel id="GRID" title={t('swingLab.personalSessions').toUpperCase()}>
        {loading && <div className="mono text-[11px] text-ink-3">LOADING…</div>}
        {!loading && personal.length === 0 && (
          <p className="text-body text-ink-2">No swings yet. Upload a video to begin.</p>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {personal.map((s) => (
            <Card key={s.id} session={s} onDelete={() => deleteSession(s.id)} />
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Card({ session, onDelete }: { session: SwingSession; onDelete: () => void }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  useEffect(() => {
    if (session.thumbnailBlob && session.thumbnailBlob.size > 0) {
      const url = URL.createObjectURL(session.thumbnailBlob)
      setThumbUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [session.thumbnailBlob])

  return (
    <Link
      to={`/lab/analyze/${session.id}`}
      className="border border-line-strong hover:border-accent-fg transition-colors"
    >
      <div className="aspect-video bg-bg-2 relative overflow-hidden">
        {thumbUrl ? (
          <img src={thumbUrl} alt={session.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center mono text-[10px] text-ink-3">
            VIDEO
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[14px] text-ink truncate">{session.name}</div>
        <div className="mono text-[10px] text-ink-3 mt-1 flex items-center justify-between">
          <span>
            {new Date(session.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
          </span>
          {session.clubType && <Tag>{session.clubType.toUpperCase()}</Tag>}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className="mono text-[9px] text-bad uppercase tracking-micro mt-3 hover:underline"
        >
          Delete
        </button>
      </div>
    </Link>
  )
}
