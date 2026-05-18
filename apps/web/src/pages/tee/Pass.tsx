import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { usePass, useCancelBooking } from '@/api/tee'
import { Panel } from '@/components/ui'
import { PassCard } from '@/components/tee'

export default function TeePass() {
  const { t } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const { data: pass, isLoading } = usePass(id)
  const cancel = useCancelBooking()

  if (isLoading || !pass) {
    return <div className="text-body text-ink-3">Loading…</div>
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header className="tee-card p-5 sm:p-6">
        <Link
          to="/tee"
          className="tee-pill hover:border-ink-3"
        >
          ← {t('tee.discover')}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="tee-pill bg-[var(--ink)] text-[var(--surface-solid)] border-transparent">BETA PASS</span>
          <span className="tee-pill">
            Demo booking
          </span>
        </div>
        <div className="micro mt-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          {t('tee.confirmed' satisfies string).toUpperCase()}
        </div>
        <h1 className="display text-[clamp(3rem,7vw,5.5rem)] m-0 mt-1">
          {t('tee.youreIn')} <em>.</em>
        </h1>
        <p className="mono text-[11px] text-ink-3 mt-2">
          {t('tee.willRemind')}
        </p>
      </header>

      <PassCard pass={pass} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="tee-pill justify-center py-3 mono text-[11px] uppercase tracking-micro hover:text-ink hover:border-ink-3"
        >
          {t('tee.addToWallet')}
        </button>
        <button
          type="button"
          className="tee-pill justify-center py-3 mono text-[11px] uppercase tracking-micro hover:text-ink hover:border-ink-3"
        >
          {t('tee.driveTime')}{' '}
          {pass.drive_min != null ? `${pass.drive_min} MIN` : '—'}
        </button>
      </div>

      <Panel id="L1" title="STRIKELAB">
        <div className="space-y-2">
          <div className="text-[14px] text-ink">
            <em className="serif">{t('tee.preRoundDrill')}</em>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Link
              to="/training"
              className="tee-cta px-4 py-3 mono text-[11px] uppercase tracking-micro text-center"
            >
              OPEN TRAINING →
            </Link>
            <Link
              to={`/rounds?course_id=${pass.course_id ?? ''}&start=${pass.tee_time}`}
              className="tee-pill justify-center px-4 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg text-center"
            >
              {t('tee.startRound')} →
            </Link>
          </div>
        </div>
      </Panel>

      {pass.status === 'confirmed' && (
        <button
          type="button"
          disabled={cancel.isPending}
          onClick={() => {
            if (window.confirm('Cancel this booking?')) {
              cancel.mutate(pass.booking_id)
            }
          }}
          className="text-bad mono text-[10px] uppercase tracking-micro hover:opacity-80"
        >
          CANCEL BOOKING
        </button>
      )}

      <div className="mono text-[10px] text-ink-3 uppercase tracking-micro">
        {t('tee.cancelFree')} ·{' '}
        {pass.cancel_free_until
          ? new Date(pass.cancel_free_until).toLocaleString()
          : '—'}
      </div>
    </div>
  )
}
