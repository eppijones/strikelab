import { BrandLogo } from '@/components/brand/BrandLogo'
import { Tag } from '@/components/ui'
import type { Club, ClubStats } from '@/api/equipment'

interface Props {
  club: Club
  stat?: ClubStats
  onEdit?: () => void
  onDelete?: () => void
}

const GRID = '60px 24px 1fr 74px 74px 58px 82px auto'

export function BagClubRow({ club, stat, onEdit, onDelete }: Props) {
  return (
    <div
      className="grid items-center gap-3 py-2.5 border-b border-line group"
      style={{ gridTemplateColumns: GRID }}
    >
      <Tag>{club.club_label || club.club_type.toUpperCase()}</Tag>
      <BrandLogo id={club.brand_id} size={20} compact />
      <button
        onClick={onEdit}
        className="text-left text-[14px] text-ink hover:text-accent-fg transition-colors"
      >
        {club.model_name}
        {club.year && (
          <span className="mono text-[10px] text-ink-3 ml-2">{club.year}</span>
        )}
      </button>
      <span className="num text-[13px]">{stat?.avg_carry?.toFixed(0) ?? '—'}</span>
      <span className="num text-[13px]">
        {stat?.max_carry?.toFixed(0) ?? '—'}
      </span>
      <span className="num text-[13px] text-ink-2">{stat?.total_shots ?? '—'}</span>
      <span className="num text-[13px] text-ink-2">
        {stat?.dispersion_radius?.toFixed(1) ?? '—'}
      </span>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="mono text-[10px] text-ink-3 uppercase tracking-micro hover:text-accent-fg"
        >
          EDIT
        </button>
        <button
          onClick={onDelete}
          className="mono text-[10px] text-ink-3 uppercase tracking-micro hover:text-bad"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function BagClubHeader() {
  return (
    <div
      className="grid items-center gap-3 pb-2 border-b border-line-strong mb-2"
      style={{ gridTemplateColumns: GRID }}
    >
      {['LABEL', 'BRAND', 'MODEL', 'AVG CARRY', 'BEST', 'SHOTS', 'σ', ''].map(
        (h) => (
          <span
            key={h}
            className="mono text-[9px] text-ink-3 tracking-micro-tight"
          >
            {h}
          </span>
        )
      )}
    </div>
  )
}
