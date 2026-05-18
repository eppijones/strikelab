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

const GENERIC_BRAND_ID = 'generic'

interface ClubChoice {
  type: string
  label: string
}

const STARTER_LABELS = [
  'Driver',
  '5W',
  '4H',
  '5H',
  '6i',
  '7i',
  '8i',
  '9i',
  'PW',
  '50°',
  '56°',
  'Putter',
]

const PLAYER_LABELS = [
  'Driver',
  '3W',
  '4i',
  '5i',
  '6i',
  '7i',
  '8i',
  '9i',
  'PW',
  '50°',
  '54°',
  '58°',
  'Putter',
]

const CLUB_GROUPS: Array<{ title: string; helper: string; clubs: ClubChoice[] }> = [
  {
    title: 'Woods',
    helper: 'Start at the top of the bag.',
    clubs: [
      { type: 'driver', label: 'Driver' },
      { type: '3_wood', label: '3W' },
      { type: '5_wood', label: '5W' },
      { type: '7_wood', label: '7W' },
    ],
  },
  {
    title: 'Hybrids',
    helper: 'Use these instead of long irons if they are easier to hit.',
    clubs: [
      { type: 'hybrid', label: '3H' },
      { type: 'hybrid', label: '4H' },
      { type: 'hybrid', label: '5H' },
      { type: 'utility', label: 'Utility' },
    ],
  },
  {
    title: 'Irons',
    helper: 'Most golfers can start from 6i through pitching wedge.',
    clubs: [
      { type: 'iron', label: '4i' },
      { type: 'iron', label: '5i' },
      { type: 'iron', label: '6i' },
      { type: 'iron', label: '7i' },
      { type: 'iron', label: '8i' },
      { type: 'iron', label: '9i' },
      { type: 'iron', label: 'PW' },
    ],
  },
  {
    title: 'Wedges',
    helper: 'Pick the lofts stamped on your wedges.',
    clubs: [
      { type: 'wedge', label: '48°' },
      { type: 'wedge', label: '50°' },
      { type: 'wedge', label: '52°' },
      { type: 'wedge', label: '54°' },
      { type: 'wedge', label: '56°' },
      { type: 'wedge', label: '58°' },
      { type: 'wedge', label: '60°' },
    ],
  },
  {
    title: 'Putter',
    helper: 'One putter is enough.',
    clubs: [{ type: 'putter', label: 'Putter' }],
  },
]

const ALL_CLUB_CHOICES = CLUB_GROUPS.flatMap((group) => group.clubs)

function clubsForLabels(labels: string[]): QuickAddClubData[] {
  return labels.flatMap((label) => {
    const choice = ALL_CLUB_CHOICES.find((club) => club.label === label)
    if (!choice) return []

    return {
      club_type: choice.type,
      club_label: choice.label,
      brand_id: GENERIC_BRAND_ID,
      model_name: choice.label,
    }
  })
}

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
  const [selectedLabels, setSelectedLabels] = useState<string[]>(STARTER_LABELS)

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

  const toggleSetupClub = (label: string) => {
    setSelectedLabels((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : current.length >= 14
        ? current
        : [...current, label]
    )
  }

  const applyLabels = async (nextLabels: string[]) => {
    setSelectedLabels(nextLabels.slice(0, 14))
  }

  const addSelectedClubs = async () => {
    const used = new Set(labels.map((l) => l.toLowerCase()))
    const openSlots = Math.max(0, 14 - clubs.length)
    const next = clubsForLabels(selectedLabels)
      .filter((club) => !used.has(club.club_label.toLowerCase()))
      .slice(0, openSlots)
    if (next.length === 0) return
    await quickAdd.mutateAsync(next)
  }

  const addableSelectedCount = clubsForLabels(selectedLabels).filter(
    (club) => !labels.some((label) => label.toLowerCase() === club.club_label.toLowerCase())
  ).length

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
            {clubs.length >= 14 ? 'BAG FULL' : '+ ADD ONE CLUB →'}
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
        <Panel id="SETUP" title="SET UP YOUR BAG">
          <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-5">
            <div>
              <div className="display text-[28px]">
                Pick the clubs you <em>carry.</em>
              </div>
              <p className="text-body text-ink-2 mt-2">
                No brand logos, model search, or spec sheet required. Select the clubs in
                your bag now; add brand, loft, lie, shaft, grip, or notes later only if
                you care.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => void applyLabels(STARTER_LABELS)}
                  className="border border-line-strong px-3 py-2 mono text-[10px] uppercase tracking-micro text-ink-2 hover:border-accent-fg hover:text-accent-fg"
                >
                  Easy starter
                </button>
                <button
                  type="button"
                  onClick={() => void applyLabels(PLAYER_LABELS)}
                  className="border border-line-strong px-3 py-2 mono text-[10px] uppercase tracking-micro text-ink-2 hover:border-accent-fg hover:text-accent-fg"
                >
                  Player set
                </button>
                <button
                  type="button"
                  onClick={() => void applyLabels([])}
                  className="border border-line-strong px-3 py-2 mono text-[10px] uppercase tracking-micro text-ink-2 hover:border-ink-3"
                >
                  Clear
                </button>
              </div>
              <button
                type="button"
                onClick={() => void addSelectedClubs()}
                disabled={
                  quickAdd.isPending ||
                  selectedLabels.length === 0 ||
                  addableSelectedCount === 0
                }
                className="mt-5 bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
              >
                ADD {Math.min(addableSelectedCount, 14 - clubs.length)} CLUBS →
              </button>
              <div className="mono text-[10px] text-ink-3 tracking-micro mt-3">
                {selectedLabels.length}/14 selected
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {CLUB_GROUPS.map((group) => (
                <div key={group.title} className="border border-line-strong p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="mono text-[10px] text-accent-fg uppercase tracking-micro">
                      {group.title}
                    </div>
                    <div className="text-[12px] text-ink-3">{group.helper}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {group.clubs.map((club) => {
                      const selected = selectedLabels.includes(club.label)
                      const alreadyInBag = labels.some(
                        (label) => label.toLowerCase() === club.label.toLowerCase()
                      )

                      return (
                        <button
                          key={club.label}
                          type="button"
                          onClick={() => toggleSetupClub(club.label)}
                          disabled={alreadyInBag}
                          className={`px-3 py-2 border mono text-[11px] uppercase tracking-micro transition-colors ${
                            alreadyInBag
                              ? 'border-line text-ink-3 opacity-50 cursor-not-allowed'
                              : selected
                              ? 'border-accent-fg bg-accent/15 text-accent-fg'
                              : 'border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink'
                          }`}
                        >
                          {club.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
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
            + ADD ONE
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
              ADD ONE CUSTOM CLUB →
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
