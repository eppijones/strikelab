import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useConnectors,
  useImportCSV,
  useConnectConnector,
  useDisconnectConnector,
} from '@/api/connectors'
import { useConnectorsCatalog } from '@/api/catalog'
import { ConnectorLogo } from '@/components/brand/ConnectorLogo'
import { connectorHasLogo } from '@/components/brand/logoAssets'
import { Panel, Stat, Tag } from '@/components/ui'

interface MergedConnector {
  id: string
  name: string
  description: string
  status: string
  connected: boolean
  last_sync?: string
  capabilities: string[]
  color?: string | null
  logo_path?: string | null
  website?: string | null
}

export default function Connectors() {
  useTranslation()
  const { data: connectorsState = [], isLoading } = useConnectors()
  const { data: catalog = [] } = useConnectorsCatalog()
  const importCsv = useImportCSV()
  const connect = useConnectConnector()
  const disconnect = useDisconnectConnector()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [lastImport, setLastImport] = useState<string | null>(null)

  const merged: MergedConnector[] = useMemo(() => {
    const byId = new Map<string, MergedConnector>()
    for (const c of catalog) {
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        description: c.description ?? '',
        status: c.status,
        connected: false,
        capabilities: c.capabilities ?? [],
        color: c.color,
        logo_path: c.logo_path,
        website: c.website,
      })
    }
    for (const c of connectorsState) {
      const existing = byId.get(c.id)
      byId.set(c.id, {
        ...(existing ?? {
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
          connected: c.connected,
          capabilities: c.capabilities,
          color: null,
          logo_path: null,
          website: null,
        }),
        connected: c.connected,
        last_sync: c.last_sync,
        status: c.status,
        capabilities: c.capabilities ?? existing?.capabilities ?? [],
      })
    }
    // Only surface connectors that have a real logo asset shipped under
    // apps/web/public/integrations/. The rest are hidden until proper marks
    // are added.
    return Array.from(byId.values()).filter((c) => connectorHasLogo(c.id))
  }, [catalog, connectorsState])

  async function handleFile(file: File) {
    setLastImport(null)
    const res = await importCsv.mutateAsync({
      file,
      sessionName: file.name.replace(/\.csv$/i, ''),
    })
    setLastImport(`${res.shots_imported} shots from ${file.name}`)
  }

  const connectedCount = merged.filter((c) => c.connected).length
  // Most-recent sync timestamp across all connected sources, or null
  // when nothing has ever synced. The four header cards used to fake
  // numbers ("24m AGO", "2.4 K SHOTS", "+18%") — they now read empty
  // until real data arrives, which is the only honest position when
  // the connector hasn't run yet.
  const latestSync = merged
    .map((c) => c.last_sync)
    .filter(Boolean)
    .sort()
    .pop() as string | undefined

  function relativeTime(iso: string | undefined): string {
    if (!iso) return '—'
    const ms = Date.now() - new Date(iso).getTime()
    if (Number.isNaN(ms) || ms < 0) return '—'
    const m = Math.floor(ms / 60000)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 48) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">HQ › DATA · CONNECTORS</div>
        <h1 className="display text-[64px] m-0">
          Bring your <em>data.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          TrackMan, Foresight, GSPro, Uneekor, Topgolf, Garmin R10, Rapsodo,
          SkyTrak — or any CSV. Sources normalize to one schema; the rest of
          the system is source-agnostic.
        </p>
      </header>

      <Panel id="UPLOAD" title="MANUAL UPLOAD">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          className={`border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? 'border-accent-fg bg-bg-2' : 'border-line-strong'
          }`}
        >
          <div className="mono text-[10px] text-ink-3 tracking-micro mb-3">
            DROP CSV / XLSX
          </div>
          <div className="display text-[28px] mb-3">
            Or <em>browse</em> for a file.
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
            disabled={importCsv.isPending}
          >
            {importCsv.isPending ? 'Uploading…' : 'Select File'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          {lastImport && (
            <div className="mono text-[11px] text-accent-fg mt-4">
              ✓ {lastImport}
            </div>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel id="P 01" title="ACTIVE SOURCES">
          <Stat
            label="CONNECTED"
            value={connectedCount}
            unit={`/ ${merged.length}`}
          />
        </Panel>
        <Panel id="P 02" title="LAST SYNC">
          <Stat
            label="UPDATED"
            value={relativeTime(latestSync)}
            unit={latestSync ? 'AGO' : ''}
          />
        </Panel>
        <Panel id="P 03" title="CATALOG">
          <Stat
            label="SUPPORTED"
            value={merged.length}
            unit="SOURCES"
          />
        </Panel>
      </div>

      <Panel id="SRC" title="SOURCES">
        {isLoading && <div className="mono text-[11px] text-ink-3">LOADING…</div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {merged.map((c) => (
            <div
              key={c.id}
              className="border border-line-strong p-4 grid items-center gap-4"
              style={{ gridTemplateColumns: 'auto 1fr auto' }}
            >
              <div
                className={`h-12 flex items-center justify-center px-3 border ${
                  c.connected ? 'border-accent-fg' : 'border-line-strong'
                }`}
                style={{ width: 132 }}
              >
                <ConnectorLogo id={c.id} size={28} />
              </div>
              <div>
                <div className="text-[15px] text-ink flex items-center gap-2">
                  <span>{c.name}</span>
                  {c.capabilities.length > 0 && (
                    <span className="mono text-[9px] text-ink-3 tracking-micro-tight">
                      {c.capabilities.slice(0, 3).join(' · ').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mono text-[11px] text-ink-3 mt-1">
                  {c.description}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.status === 'coming_soon' ? (
                  <Tag>Soon</Tag>
                ) : c.connected ? (
                  <button
                    onClick={() => disconnect.mutate(c.id)}
                    className="mono text-[10px] text-bad uppercase tracking-micro hover:underline"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect.mutate(c.id)}
                    className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                  >
                    Connect →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="API" title="API ACCESS">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="display text-[24px]">
              Push your <em>own</em> data.
            </div>
            <p className="text-body text-ink-2 mt-2">
              Tour-tier customers can stream shot data directly. Bearer token, JSON
              over HTTPS, exact same normalized schema.
            </p>
          </div>
          <button className="bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg">
            Read Docs →
          </button>
        </div>
      </Panel>
    </div>
  )
}
