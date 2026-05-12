// Swing Lab Analyzer — phase markers + keypoint workflow scaffold (Phase 3 deepens this).
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, Stat, Tag } from '@/components/ui'
import { SwingRepository } from '@/features/swing-lab/db'
import type { SwingSession } from '@/features/swing-lab/types'
import { PHASE_ORDER, PHASE_LABELS, PHASE_KEYPOINT_SETS } from '@/features/swing-lab/core/keypointSchema'
import type { SwingPhase } from '@/features/swing-lab/types'

export default function SwingLabAnalyze() {
  const { t } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const [session, setSession] = useState<SwingSession | null>(null)
  const [activePhase, setActivePhase] = useState<SwingPhase>('address')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let url: string | null = null
    ;(async () => {
      const s = await SwingRepository.getById(id)
      if (!s) return
      setSession(s)
      url = URL.createObjectURL(s.videoBlob)
      setVideoUrl(url)
    })()
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [id])

  async function setPhaseMarker() {
    if (!session || !videoRef.current) return
    const time = videoRef.current.currentTime
    const updated: SwingSession = {
      ...session,
      phaseMarkers: { ...session.phaseMarkers, [activePhase]: time },
      updatedAt: new Date().toISOString(),
    }
    await SwingRepository.update(session.id, { phaseMarkers: updated.phaseMarkers })
    setSession(updated)
  }

  async function jumpTo(phase: SwingPhase) {
    setActivePhase(phase)
    const marker = session?.phaseMarkers[phase]
    if (marker != null && videoRef.current) {
      videoRef.current.currentTime = marker
    }
  }

  if (!session) return <div className="mono text-[11px] text-ink-3">LOADING SESSION…</div>

  const requiredKeypoints = PHASE_KEYPOINT_SETS[activePhase]
  const placedCount = Object.keys(session.phaseKeypoints[activePhase] || {}).length

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/lab" className="hover:text-ink">LAB</Link> ›{' '}
          <Link to="/lab" className="hover:text-ink">LIBRARY</Link> ›{' '}
          <span className="text-ink">{session.name.toUpperCase()}</span>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="display text-[40px] m-0">{session.name}</h1>
          {session.clubType && <Tag>{session.clubType.toUpperCase()}</Tag>}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Panel id="VID" title={`PHASE · ${PHASE_LABELS[activePhase].toUpperCase()}`} padded={false}>
            <div className="relative aspect-video bg-black">
              {videoUrl && (
                <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" controls />
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <button
                onClick={setPhaseMarker}
                className="bg-accent text-accent-ink px-4 py-2 mono text-[10px] uppercase tracking-micro hover:bg-accent-2"
              >
                Mark {PHASE_LABELS[activePhase]} →
              </button>
              <span className="mono text-[10px] text-ink-3">
                Marker: {session.phaseMarkers[activePhase]?.toFixed(2) ?? '—'} s
              </span>
            </div>
          </Panel>

          <Panel id="PHASES" title="PHASES">
            <div className="grid grid-cols-6 gap-2">
              {PHASE_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => jumpTo(p)}
                  className={`p-3 border ${
                    p === activePhase
                      ? 'border-accent-fg text-accent-fg'
                      : 'border-line-strong text-ink-2 hover:border-ink-3'
                  }`}
                >
                  <div className="mono text-[9px] uppercase tracking-micro-tight">{PHASE_LABELS[p]}</div>
                  <div className="mono text-[10px] mt-2 text-ink-3">
                    {session.phaseMarkers[p]?.toFixed(1) ?? '—'}s
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel id="KP" title="KEYPOINTS">
            <Stat
              label={`${PHASE_LABELS[activePhase].toUpperCase()} KEYPOINTS`}
              value={`${placedCount} / ${requiredKeypoints.length}`}
            />
            <div className="mono text-[10px] text-ink-3 mt-3 leading-[1.6]">
              {requiredKeypoints.map((k) => k.toUpperCase()).join(' · ')}
            </div>
            <p className="text-body text-ink-2 mt-4">
              Click on the video to place keypoints (Phase 3 wires the manual placement UI).
            </p>
          </Panel>
          <Panel id="MET" title={t('swingLab.metrics').toUpperCase()}>
            <p className="text-body text-ink-2">
              Metrics are computed once all required keypoints are placed for a phase.
            </p>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
