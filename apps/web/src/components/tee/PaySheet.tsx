import { useState } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

export type PayMethod = 'vipps' | 'apple_pay' | 'card'

interface Props {
  total: number
  currency: string
  selected: PayMethod
  onSelect: (method: PayMethod) => void
  cancelFreeUntil?: string
}

export function PaySheet({ total, currency, selected, onSelect, cancelFreeUntil }: Props) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <PayMethodOption
          id="vipps"
          label="Vipps"
          sub="+47 ••• 12 34"
          glyph="V"
          accentClass="bg-warn text-bg"
          selected={selected === 'vipps'}
          onSelect={() => onSelect('vipps')}
        />
        <PayMethodOption
          id="apple_pay"
          label="Apple Pay"
          sub="Visa •• 4082"
          glyph=""
          accentClass="bg-ink text-bg"
          selected={selected === 'apple_pay'}
          onSelect={() => onSelect('apple_pay')}
        />
        <PayMethodOption
          id="card"
          label={t('tee.payWith')}
          sub="Stripe · add card"
          glyph="+"
          accentClass="bg-surface-2 text-ink"
          selected={selected === 'card'}
          onSelect={() => onSelect('card')}
        />
      </div>

      <div className="border-t border-line-strong pt-3 flex items-baseline justify-between mono text-[12px] text-ink-2">
        <span>{t('tee.totalLabel')}</span>
        <span className="text-ink text-[16px]">
          {Math.round(total).toLocaleString('nb-NO')} {currency}
        </span>
      </div>

      {cancelFreeUntil && (
        <div className="mono text-[10px] text-ink-3 uppercase tracking-micro">
          {t('tee.cancelFree')} · {new Date(cancelFreeUntil).toLocaleString()}
        </div>
      )}
    </div>
  )
}

function PayMethodOption({
  id,
  label,
  sub,
  glyph,
  accentClass,
  selected,
  onSelect,
}: {
  id: PayMethod
  label: string
  sub: string
  glyph: string
  accentClass: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'flex items-center gap-3 p-3 border bg-surface-solid text-left transition-colors',
        selected ? 'border-accent-fg' : 'border-line-strong hover:border-ink-3',
      )}
    >
      <div
        className={clsx(
          'w-10 h-10 flex items-center justify-center text-[15px] font-semibold rounded-[2px]',
          accentClass,
        )}
      >
        {glyph || ''}
      </div>
      <div className="flex-1">
        <div className="text-[14px] text-ink">{label}</div>
        <div className="mono text-[10.5px] text-ink-3 mt-0.5">{sub}</div>
      </div>
      <div
        className={clsx(
          'w-5 h-5 rounded-full border flex items-center justify-center',
          selected ? 'bg-accent border-accent' : 'border-line-strong',
        )}
      >
        {selected && (
          <span className="block w-2 h-2 rounded-full bg-accent-ink" />
        )}
      </div>
    </button>
  )
}
