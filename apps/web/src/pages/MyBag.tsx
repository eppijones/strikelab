import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useMyBag,
  useClubStats,
  useUpdateBag,
  useDeleteClub,
  type Club,
} from '@/api/equipment'
import { Panel, Tag, Stat } from '@/components/ui'
import { BagClubHeader, BagClubRow } from '@/components/bag/BagClubRow'
import { ClubEditorDrawer } from '@/components/bag/ClubEditorDrawer'

export default function MyBag() {
  useTranslation()
  const { data: bag, isLoading } = useMyBag()
  const { data: stats = [] } = useClubStats()
  const updateBag = useUpdateBag()
  const deleteClub = useDeleteClub()

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

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">HQ › BAG</div>
        <h1 className="display text-[64px] m-0">
          The <em>14.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          Your active bag — clubs, ball, and per-club performance.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Panel id="B 01" title="CLUBS">
          <Stat label="IN BAG" value={clubs.length} unit={`/ 14`} />
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

      <Panel
        id="CLUBS"
        title="ALL CLUBS"
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
              Add up to 14 clubs. Pick a brand, choose the model, dial in the specs.
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
        <div className="grid lg:grid-cols-2 gap-3">
          <div className="border border-line-strong p-3">
            <div className="micro">TIP</div>
            <p className="text-[13px] text-ink-2 mt-2">
              The Rules of Golf allow a maximum of 14 clubs in your bag. Carrying more
              counts as a penalty during sanctioned rounds.
            </p>
          </div>
          <div className="border border-line-strong p-3">
            <div className="micro">DRY YOUR DATA</div>
            <p className="text-[13px] text-ink-2 mt-2">
              Each club's <span className="mono text-ink">avg carry</span> and{' '}
              <span className="mono text-ink">σ dispersion</span> are populated as you
              import sessions from <Tag>TRACKMAN</Tag>, <Tag>FORESIGHT</Tag>,{' '}
              <Tag>GSPRO</Tag> or any CSV.
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
