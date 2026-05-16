import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, Tag } from '@/components/ui'
import {
  deleteRangeSession,
  fetchRangeSessionsResult,
  putRangeSessionSync,
  type RangeSessionApiListItem,
} from '@/api/rangeSessions'
import { RangeImportRepository } from '@/features/range-session/db'
import type { RangeSessionImportRow } from '@/features/range-session/db'
import { parseStrikeLabRangeJson } from '@/features/range-session/parseExport'
import type { StrikeLabRangeExport } from '@/features/range-session/types'
import { useAuthStore } from '@/stores/authStore'

type ListRow =
  | { kind: 'cloud'; id: string; label: string; shotCount: number; startTime: string; updatedAt: string }
  | { kind: 'local'; id: string; label: string; shotCount: number; startTime: string }

export default function RangeLab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [rows, setRows] = useState<RangeSessionImportRow[]>([])
  const [cloud, setCloud] = useState<RangeSessionApiListItem[]>([])
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const refreshLocal = useCallback(async () => {
    setRows(await RangeImportRepository.list())
  }, [])

  const refreshCloud = useCallback(async () => {
    if (!accessToken) {
      setCloud([])
      setCloudError(null)
      return
    }
    try {
      setCloudError(null)
      const { sessions, error } = await fetchRangeSessionsResult()
      setCloud(sessions)
      if (error) setCloudError(error)
    } catch (e) {
      setCloud([])
      setCloudError(e instanceof Error ? e.message : 'Could not load cloud sessions.')
    }
  }, [accessToken])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await Promise.all([refreshLocal(), refreshCloud()])
      setLoading(false)
    })()
  }, [refreshLocal, refreshCloud])

  async function ingestJson(text: string, filename?: string) {
    setMessage(null)
    const parsed = parseStrikeLabRangeJson(text)
    if (!parsed.ok) {
      setMessage(parsed.message)
      return
    }
    const { session } = parsed
    const env: StrikeLabRangeExport = parsed.export
    const rawJson = JSON.stringify(env, null, 2)
    const start = session.startTime
    const label =
      filename?.replace(/\.json$/i, '') ||
      `Range · ${new Date(start).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
    await RangeImportRepository.upsert({
      id: session.id,
      importedAt: new Date().toISOString(),
      label,
      shotCount: session.shots.length,
      startTime: start,
      sourceApp: env.app,
      schemaVersion: env.schemaVersion,
      rawJson,
    })
    let msg = `Imported ${session.shots.length} shots — saved in this browser.`
    if (accessToken) {
      try {
        await putRangeSessionSync(env)
        msg += ' Synced to StrikeLab API.'
        await queryClient.invalidateQueries({ queryKey: ['range-sessions'] })
        await refreshCloud()
      } catch (e) {
        msg += ` Cloud sync failed: ${e instanceof Error ? e.message : 'error'}.`
      }
    }
    setMessage(msg)
    await refreshLocal()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const text = await f.text()
    await ingestJson(text, f.name)
  }

  async function onPasteArea() {
    const text = window.prompt('Paste the full JSON export here:')
    if (text) await ingestJson(text)
  }

  async function backupAll() {
    const blob = await RangeImportRepository.downloadBackup()
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `strikelab_range_imports_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const merged: ListRow[] = [
    ...cloud.map((c) => ({
      kind: 'cloud' as const,
      id: c.id,
      label:
        c.location?.trim() ||
        `Range · ${c.start_time ? new Date(c.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : c.id.slice(0, 8)}`,
      shotCount: c.shot_count,
      startTime: c.start_time ?? c.updated_at,
      updatedAt: c.updated_at,
    })),
    ...rows
      .filter((r) => !cloud.some((c) => c.id === r.id))
      .map((r) => ({
        kind: 'local' as const,
        id: r.id,
        label: r.label,
        shotCount: r.shotCount,
        startTime: r.startTime,
      })),
  ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/" className="hover:text-ink">
            HQ
          </Link>{' '}
          › <span className="text-ink">PRACTICE</span>
        </div>
        <h1 className="display text-[clamp(3rem,8vw,5.5rem)] m-0">
          Practice <em>sessions.</em>
        </h1>
        <p className="text-body text-ink-2 mt-4 max-w-2xl">
          {t('rangeLab.lede', {
            defaultValue:
              'Upload your first range session. Drop an export from iPhone Caddie here, then StrikeLab keeps the shots, clubs, and patterns together.',
          })}
        </p>
      </header>

      <Panel id="P1" title="UPLOAD OR SYNC">
        <div className="grid lg:grid-cols-[1fr_auto] gap-5 items-start mb-5">
          <div>
            <div className="display text-[28px]">
              Keep every <em>range bucket.</em>
            </div>
            <p className="text-body text-ink-2 mt-2 max-w-xl">
              Import the JSON export from StrikeLab Caddie, or let the iPhone sync sessions to the API when you are signed in. Club distances in your bag get better as you add more shots.
            </p>
          </div>
          <Tag tone={accessToken ? 'accent' : 'default'}>{accessToken ? 'SIGNED IN' : 'LOCAL COPY'}</Tag>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
          >
            Choose export
          </button>
          <button
            type="button"
            onClick={() => void onPasteArea()}
            className="border border-line-strong text-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-bg-2"
          >
            Paste JSON
          </button>
          <button
            type="button"
            onClick={() => void backupAll()}
            className="border border-line-strong text-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-bg-2"
          >
            Download local backup
          </button>
        </div>
        {message ? <p className="text-body text-ink-2 mt-4">{message}</p> : null}
      </Panel>

      <Panel id="P2" title="PRACTICE SESSIONS">
        {loading ? (
          <p className="text-ink-3 mono text-[12px]">Loading…</p>
        ) : (
          <>
            {!accessToken ? (
              <p className="text-ink-3 mono text-[12px] mb-4">
                Sign in to load sessions synced from StrikeLab Caddie on iPhone.
              </p>
            ) : cloudError ? (
              <p className="text-warn mono text-[12px] mb-4">{cloudError}</p>
            ) : null}
            {merged.length === 0 ? (
              <div className="py-12 text-center">
                <div className="display text-[26px]">
                  Upload your first <em>range session.</em>
                </div>
                <p className="text-body text-ink-3 mt-2 max-w-md mx-auto">
                  Drop an iPhone export here after practice. We will keep the shots, clubs, and distances ready for your bag.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {merged.map((r) => (
                  <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-stretch gap-2 border border-line-strong">
                    <Link
                      to={`/practice/${encodeURIComponent(r.id)}`}
                      className="flex flex-1 flex-wrap items-baseline justify-between gap-2 px-4 py-3 hover:bg-bg-2 min-w-0"
                    >
                      <span className="text-ink truncate">{r.label}</span>
                      <span className="mono text-[11px] text-ink-3 shrink-0">
                        {r.shotCount} shots · {new Date(r.startTime).toLocaleString()}
                      </span>
                    </Link>
                    <div className="flex items-center gap-2 px-2 border-l border-line-strong">
                      <Tag tone={r.kind === 'cloud' ? 'accent' : 'default'}>{r.kind === 'cloud' ? 'API' : 'LOCAL'}</Tag>
                      {r.kind === 'cloud' && accessToken ? (
                        <button
                          type="button"
                          className="mono text-[9px] text-bad uppercase px-2 py-1 hover:underline"
                          onClick={() => {
                            if (!window.confirm('Delete this session from StrikeLab (server)?')) return
                            void (async () => {
                              await deleteRangeSession(r.id)
                              await refreshCloud()
                            })()
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}
