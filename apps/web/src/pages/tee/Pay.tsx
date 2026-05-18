import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { useConfirmBookingV2 } from '@/api/tee'
import { useCourse } from '@/api/courses'
import { Panel } from '@/components/ui'
import { PaySheet, type PayMethod } from '@/components/tee'

export default function TeePay() {
  const { t } = useTranslation()
  const { holdId = '' } = useParams<{ holdId: string }>()
  const [params] = useSearchParams()
  const courseId = params.get('course_id') ?? ''
  const navigate = useNavigate()

  const { data: course } = useCourse(courseId)
  const confirm = useConfirmBookingV2()
  const [method, setMethod] = useState<PayMethod>('vipps')

  // Read pending hold from localStorage to render receipt + total without
  // an extra API trip. (Persisted by the Group page.)
  const pending = readPendingHold(holdId)
  const pricePer = pending?.price_amount ?? 0
  const total = pricePer * (pending?.players ?? 1)

  async function handlePay() {
    const result = await confirm.mutateAsync({
      hold_id: holdId,
      payment_method: method,
      split_mode: pending?.splitMode ?? 'together',
    })
    navigate(`/tee/passes/${result.booking_id}`)
  }

  return (
    <div className="max-w-[760px] mx-auto space-y-5">
      <header className="tee-card p-5 sm:p-6">
        <Link
          to={`/tee/booking/${holdId}/group?course_id=${courseId}`}
          className="tee-pill hover:border-ink-3"
        >
          ← {t('tee.back')}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="tee-pill bg-[var(--ink)] text-[var(--surface-solid)] border-transparent">DEMO PAYMENT</span>
          <span className="tee-pill">3 / 3</span>
        </div>
        <h1 className="display text-[clamp(3rem,7vw,5rem)] m-0 mt-3">
          {t('tee.lastStep')} <em>.</em>
        </h1>
        <p className="text-[15px] text-ink-2 mt-3">
          Payment methods are shown as beta checkout patterns for launch testing.
        </p>
      </header>

      <Panel id="R1" title="RECEIPT">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[16px] text-ink">
            {course?.name ?? pending?.course_name ?? 'Tee'}
          </div>
          <div className="mono text-[13px] text-ink-2">
            {pending?.tee_time
              ? new Date(pending.tee_time).toLocaleString()
              : ''}
          </div>
        </div>
        <div className="mono text-[12px] text-ink-2 space-y-1.5 pt-3 border-t border-line-strong">
          <div className="flex items-baseline justify-between">
            <span>
              {pending?.players ?? 1} × {Math.round(pricePer)} kr
            </span>
            <span>{Math.round(pricePer * (pending?.players ?? 1))} kr</span>
          </div>
          <div className="flex items-baseline justify-between text-ink-3">
            <span>{t('tee.service')}</span>
            <span>0 kr</span>
          </div>
          <div className="flex items-baseline justify-between text-ink-3">
            <span>{t('tee.cancelFree')}</span>
            <span>✓</span>
          </div>
        </div>
      </Panel>

      <Panel id="R2" title={t('tee.payWith').toUpperCase()}>
        <PaySheet
          total={total}
          currency={pending?.currency ?? 'NOK'}
          selected={method}
          onSelect={setMethod}
        />
      </Panel>

      <button
        type="button"
        disabled={confirm.isPending}
        onClick={handlePay}
        className={
          method === 'vipps'
            ? 'w-full py-4 mono text-[12px] uppercase tracking-micro bg-warn text-bg hover:opacity-90 disabled:opacity-50 rounded-pill'
            : 'w-full tee-cta py-4 mono text-[12px] uppercase tracking-micro disabled:opacity-50'
        }
      >
        {confirm.isPending
          ? '…'
          : `${t('tee.payNow')} ${Math.round(total).toLocaleString('nb-NO')} kr →`}
      </button>
    </div>
  )
}

function readPendingHold(holdId: string) {
  if (!holdId) return null
  try {
    const raw = localStorage.getItem('strikelab-tee-pending-hold')
    if (!raw) return null
    const all = JSON.parse(raw)
    return all[holdId] ?? null
  } catch {
    return null
  }
}
