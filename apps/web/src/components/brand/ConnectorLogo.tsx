import { useEffect, useMemo, useState } from 'react'

import { useConnectorsCatalog, type ConnectorCatalog } from '@/api/catalog'

import { connectorLogoPath, getConnectorLogoAsset } from './logoAssets'
import { brandMonogram } from './monogram'

interface Props {
  id: string
  connector?: ConnectorCatalog | null
  size?: number
  tone?: 'color' | 'mono' | 'muted'
  logoPath?: string
  className?: string
  showName?: boolean
}

/**
 * ConnectorLogo tries to load `/integrations/{id}.svg`. If the asset is
 * missing or fails to load, it falls back to a uniform monogram tile rendered
 * in the existing UI mono font — bold initials in the brand color, fixed
 * footprint, no overflow.
 */
export function ConnectorLogo({
  id,
  connector,
  size = 24,
  tone = 'color',
  logoPath,
  className,
  showName = false,
}: Props) {
  const { data: connectors } = useConnectorsCatalog()
  const lookup = connector ?? connectors?.find((c) => c.id === id)
  const name = lookup?.name ?? id

  // Prefer our shipped asset (PNG) over the catalog's logo_path (SVG paths
  // that don't exist yet).
  const asset = getConnectorLogoAsset(id)
  const src =
    logoPath ?? connectorLogoPath(id) ?? lookup?.logo_path ?? `/integrations/${id}.svg`
  const [errored, setErrored] = useState(false)
  const monogram = useMemo(() => brandMonogram(name), [name])

  useEffect(() => {
    setErrored(false)
  }, [src])

  const color =
    tone === 'mono' ? 'var(--ink)'
    : tone === 'muted' ? 'var(--ink-3)'
    : lookup?.color ?? 'var(--ink)'

  // Slightly tighter type as the monogram gets longer so 3-char acronyms
  // (CSV, MLM, R10) still fit nicely inside the same square footprint.
  const fontSize = Math.max(
    10,
    Math.round(size * (monogram.length >= 3 ? 0.42 : 0.54)),
  )

  const wordmark = (
    <span
      className={`mono uppercase ${className ?? ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        fontWeight: 700,
        letterSpacing: monogram.length >= 3 ? '0.02em' : '0.06em',
        fontSize,
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      aria-label={name}
      data-connector-id={id}
      title={name}
    >
      {monogram}
    </span>
  )

  if (errored) return wordmark

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showName ? 8 : 0,
        height: size,
      }}
      aria-label={name}
    >
      <img
        src={src}
        alt={name}
        height={size}
        onError={() => setErrored(true)}
        className={asset ? `logo-polarity-${asset.polarity}` : undefined}
        style={{
          height: size,
          width: 'auto',
          maxWidth: size * 8,
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {showName ? (
        <span
          className="mono uppercase"
          style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-2)' }}
        >
          {name}
        </span>
      ) : null}
    </span>
  )
}

export default ConnectorLogo
