import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useMyBag,
  useClubStats,
  useUpdateBag,
  useDeleteClub,
  useQuickAddToMyBag,
  type Club,
  type QuickAddClubData,
} from '@/api/equipment'
import { Panel, Tag, Stat } from '@/components/ui'
import { BagClubHeader, BagClubRow } from '@/components/bag/BagClubRow'
import { ClubEditorDrawer } from '@/components/bag/ClubEditorDrawer'

const PRESETS: Array<{ id: string; title: string; body: string; clubs: QuickAddClubData[] }> = [
  {
    id: 'classic',
    title: 'Classic 12',
    body: 'Driver, 5W, 5i-PW, 52/56, putter. A calm starting point for most golfers.',
    clubs: [
      ['driver', 'Driver'],
      ['5_wood', '5W'],
      ['iron', '5i'],
      ['iron', '6i'],
      ['iron', '7i'],
      ['iron', '8i'],
      ['iron', '9i'],
      ['iron', 'PW'],
      ['wedge', '52°'],
      ['wedge', '56°'],
      ['putter', 'Putter'],
    ].map(([club_type, club_label]) => ({
      club_type,
      club_label,
      brand_id: 'titleist',
      model_name: club_label,
    })),
  },
  {
    id: 'friendly',
    title: 'Easy Launch',
    body: 'Driver, 7W, hybrids, 6i-PW, 50/56, putter. Built for launch and forgiveness.',
    clubs: [
      ['driver', 'Driver'],
      ['7_wood', '7W'],
      ['hybrid', '4H'],
      ['hybrid', '5H'],
      ['iron', '6i'],
      ['iron', '7i'],
      ['iron', '8i'],
      ['iron', '9i'],
      ['iron', 'PW'],
      ['wedge', '50°'],
      ['wedge', '56°'],
      ['putter', 'Putter'],
    ].map(([club_type, club_label]) => ({
      club_type,
      club_label,
      brand_id: 'ping',
      model_name: club_label,
    })),
  },
  {
    id: 'player',
    title: 'Player 14',
    body: 'Driver, 3W, 4i-PW, 50/54/58, putter. For golfers who know the gaps.',
    clubs: [
      ['driver', 'Driver'],
      ['3_wood', '3W'],
      ['iron', '4i'],
      ['iron', '5i'],
      ['iron', '6i'],
      ['iron', '7i'],
      ['iron', '8i'],
      ['iron', '9i'],
      ['iron', 'PW'],
      ['wedge', '50°'],
      ['wedge', '54°'],
      ['wedge', '58°'],
      ['putter', 'Putter'],
    ].map(([club_type, club_label]) => ({
      club_type,
      club_label,
      brand_id: 'taylormade',
      model_name: club_label,
    })),
  },
]

export default function MyBag() {
  useTranslation()
  const { data: bag, isLoading } = useMyBag()
  const { data: stats = [] } = useClubStats()
  const updateBag = useUpdateBag()
  const deleteClub = useDeleteClub()
  const quickAdd = useQuickAddToMyBag()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [editingHeader, setEditingHeader] = useState(false)
  const [bagName, setBagName] = useState('')
  const [ballBrand, setBallBrand] = useState('')
  const [ballModel, setBallModel] = useState('')

  if (isLoading)
    return <div className="mono text-[11px] text-ink-3">LOADING BAG…</div>
  if (!bag)
    return <div className="mono text-[11px] text-ink-3">No bag found.</div>

  const clubs = bag.clubs ?? []
  const labels = clubs.map((c) => c.club_label ?? '').filter(Boolean)
  const clubsWithData = stats.filter((s) => (s.total_shots ?? 0) > 0).length
  const totalShots = stats.reduce((sum, s) => sum + (s.total_shots ?? 0), 0)

  const startEdit = (club: Club) => {
    setEditingClub(club)
    setEditorOpen(true)
  }

  const startAdd = () => {
    setEditingClub(null)
    setEditorOpen(true)
  }

  const handleDelete = (club: Club) => {
    if (!window.confirm(`Remove ${club.club_label || club.model_name} from this bag?`))
      return
    deleteClub.mutate(club.id)
  }

  const openHeaderEdit = () => {
    setBagName(bag.name)
    setBallBrand(bag.ball_brand ?? '')
    setBallModel(bag.ball_model ?? '')
    setEditingHeader(true)
  }

  const saveHeader = async () => {
    await updateBag.mutateAsync({
      bagId: bag.id,
      data: {
        name: bagName,
        ball_brand: ballBrand || undefined,
        ball_model: ballModel || undefined,
      },
    })
    setEditingHeader(false)
  }

  const applyPreset = async (preset: (typeof PRESETS)[number]) => {
    const used = new Set(labels.map((l) => l.toLowerCase()))
    const openSlots = Math.max(0, 14 - clubs.length)
    const next = preset.clubs
      .filter((club) => !used.has(club.club_label.toLowerCase()))
      .slice(0, openSlots)
    if (next.length === 0) return
    await quickAdd.mutateAsync(next)
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">HQ › BAG</div>
        <h1 className="display text-[clamp(3rem,8vw,5.75rem)] m-0">
          Your <em>bag.</em>
        </h1>
        <p className="text-body text-ink-2 mt-4 max-w-2xl">
          Build the clubs you actually carry. As range sessions come in, StrikeLab fills in carry distance, best shots, and consistency per club.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Panel id="B 01" title="CLUBS">
          <Stat label="IN BAG" value={clubs.length} unit="/14" />
          <button
            onClick={startAdd}
            disabled={clubs.length >= 14}
            className="mt-3 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {clubs.length >= 14 ? 'BAG FULL' : '+ ADD CLUB →'}
          </button>
        </Panel>

        <Panel id="B 02" title="BALL">
          {!editingHeader ? (
            <>
              <div className="micro">CURRENT</div>
              <div className="display text-[24px] mt-1.5">
                {bag.ball_brand && bag.ball_model
                  ? `${bag.ball_brand} ${bag.ball_model}`
                  : '—'}
              </div>
              <button
                onClick={openHeaderEdit}
                className="mt-3 mono text-[10px] text-ink-3 uppercase tracking-micro hover:text-accent-fg"
              >
                EDIT
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <input
                value={ballBrand}
                onChange={(e) => setBallBrand(e.target.value)}
                placeholder="Brand"
                className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
              />
              <input
                value={ballModel}
                onChange={(e) => setBallModel(e.target.value)}
                placeholder="Model"
                className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
              />
            </div>
          )}
        </Panel>

        <Panel id="B 03" title="LAST UPDATED">
          {!editingHeader ? (
            <>
              <div className="micro">UPDATED</div>
              <div className="mono text-[14px] text-ink mt-1.5">
                {new Date(bag.updated_at)
                  .toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  .toUpperCase()}
              </div>
              <div className="micro mt-3">BAG NAME</div>
              <div className="text-[13px] text-ink mt-1">{bag.name}</div>
            </>
          ) : (
            <div className="space-y-2">
              <input
                value={bagName}
                onChange={(e) => setBagName(e.target.value)}
                placeholder="Bag name"
                className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveHeader}
                  disabled={updateBag.isPending}
                  className="bg-accent text-accent-ink px-3 py-2 mono text-[10px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditingHeader(false)}
                  className="bg-transparent text-ink-2 border border-line-strong px-3 py-2 mono text-[10px] uppercase tracking-micro hover:border-ink-3"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {clubs.length < 14 && (
        <Panel id="SETUP" title="FAST SETUP">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-5">
            <div>
              <div className="display text-[28px]">
                Build it in <em>five minutes.</em>
              </div>
              <p className="text-body text-ink-2 mt-2">
                Start from a common bag, then edit labels, brands, models, lofts, and shafts when you care. You can always add a 4W, 7W, extra wedge, or custom club.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => void applyPreset(preset)}
                  disabled={quickAdd.isPending}
                  className="text-left border border-line-strong p-4 hover:border-accent-fg hover:bg-bg-2 disabled:opacity-50"
                >
                  <div className="mono text-[10px] text-accent-fg uppercase tracking-micro">{preset.title}</div>
                  <p className="text-[13px] text-ink-2 leading-[1.45] mt-2">{preset.body}</p>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <Panel
        id="CLUBS"
        title="CLUB DISTANCES"
        right={
          <button
            onClick={startAdd}
            disabled={clubs.length >= 14}
            className="bg-accent text-accent-ink px-3 py-1.5 mono text-[10px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
          >
            + ADD CLUB
          </button>
        }
      >
        {clubs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="display text-[24px] m-0">
              Build your <em>bag.</em>
            </div>
            <p className="text-body text-ink-3 mt-2 mb-5 max-w-md mx-auto">
              Add your first clubs, or use a fast setup above. We fill in distances after you log range sessions.
            </p>
            <button
              onClick={startAdd}
              className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
            >
              ADD YOUR FIRST CLUB →
            </button>
          </div>
        ) : (
          <>
            <BagClubHeader />
            {clubs
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((c) => {
                const stat = stats.find((s) => s.club_label === c.club_label)
                return (
                  <BagClubRow
                    key={c.id}
                    club={c}
                    stat={stat}
                    onEdit={() => startEdit(c)}
                    onDelete={() => handleDelete(c)}
                  />
                )
              })}
          </>
        )}
      </Panel>

      <Panel id="META" title="BAG METADATA">
        <div className="grid lg:grid-cols-3 gap-3">
          <div className="border border-line-strong p-3">
            <div className="micro">TIP</div>
            <p className="text-[13px] text-ink-2 mt-2">
              The Rules of Golf allow a maximum of 14 clubs in your bag. Carrying more
              counts as a penalty during sanctioned rounds.
            </p>
          </div>
          <div className="border border-line-strong p-3">
            <div className="micro">RANGE DATA</div>
            <p className="text-[13px] text-ink-2 mt-2">
              Each club's <span className="mono text-ink">avg carry</span> and{' '}
              <span className="mono text-ink">σ dispersion</span> are populated as you
              import sessions from <Tag>TRACKMAN</Tag>, <Tag>FORESIGHT</Tag>,{' '}
              <Tag>GSPRO</Tag> or any CSV.
            </p>
          </div>
          <div className="border border-line-strong p-3">
            <div className="micro">STATUS</div>
            <p className="text-[13px] text-ink-2 mt-2">
              <span className="mono text-ink">{clubsWithData}</span> clubs have data from{' '}
              <span className="mono text-ink">{totalShots}</span> total shots. Missing clubs are normal until you practice with them.
            </p>
          </div>
        </div>
      </Panel>

      {bag && (
        <ClubEditorDrawer
          bagId={bag.id}
          open={editorOpen}
          club={editingClub}
          existingLabels={labels}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}
