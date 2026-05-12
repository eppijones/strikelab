import { useEffect, useMemo, useState } from 'react'

import { useBrands, type Brand } from '@/api/catalog'

import { brandLogoPath, getBrandLogoAsset } from './logoAssets'
import { brandMonogram } from './monogram'
import { fontFamilyFor, getWordmarkStyle } from './wordmarkStyles'

interface Props {
  /** Brand id (e.g. 'taylormade'). */
  id: string
  /** Optional brand object — when supplied we skip the lookup. */
  brand?: Brand | null
  /** Pixel height of the logo box. */
  size?: number
  /** Render as solid color, monochrome ink, or muted (used in subdued contexts). */
  tone?: 'color' | 'mono' | 'muted'
  /** Optional explicit asset path override. */
  logoPath?: string
  className?: string
  /** Show wordmark next to the logo even when an asset is loaded. */
  showName?: boolean
  /**
   * Render a square monogram tile instead of a full wordmark.
   * Use for tight layouts (narrow grid columns, dense rows) where the full
   * brand name will not fit. Default false (full stylized wordmark).
   */
  compact?: boolean
}

/**
 * BrandLogo tries to load `/brands/{id}.svg` (or the asset returned by the
 * catalog API).
 *
 * Fallbacks (when the asset is missing):
 *   - Default: a per-brand stylized typographic wordmark — uses the brand's
 *     name in distinctive typography (italic / weight / tracking) so each
 *     brand reads with its own character. Configured in `wordmarkStyles.ts`.
 *   - `compact`: a fixed-square monogram tile (1–3 letters) for tight
 *     layouts where a full wordmark would not fit.
 *
 * Falls back via the <img> onError event rather than a HEAD probe — this is
 * more reliable because dev servers often return index.html (with a 200
 * status) for missing static files via SPA fallback.
 *
 * Note: We never reproduce trademarked logo artwork here. Drop a licensed
 * SVG mark into `apps/web/public/brands/{id}.svg` and it will be used in
 * preference to the typographic fallback automatically.
 */
export function BrandLogo({
  id,
  brand,
  size = 24,
  tone = 'color',
  logoPath,
  className,
  showName = false,
  compact = false,
}: Props) {
  const { data: brands } = useBrands()
  const lookup = brand ?? brands?.find((b) => b.id === id)
  const name = lookup?.name ?? id

  // Prefer our shipped asset (PNG) over the catalog's logo_path which still
  // points at SVGs that don't exist yet.
  const asset = getBrandLogoAsset(id)
  const src = logoPath ?? brandLogoPath(id) ?? lookup?.logo_path ?? `/brands/${id}.svg`
  const [errored, setErrored] = useState(false)
  const monogram = useMemo(() => brandMonogram(name), [name])
  const style = useMemo(() => getWordmarkStyle(id), [id])

  useEffect(() => {
    setErrored(false)
  }, [src])

  const color =
    tone === 'mono' ? 'var(--ink)'
    : tone === 'muted' ? 'var(--ink-3)'
    : lookup?.color ?? 'var(--ink)'

  // Compact = uniform square monogram tile (used in tight grid columns).
  const compactFallback = (
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
        fontSize: Math.max(
          10,
          Math.round(size * (monogram.length >= 3 ? 0.42 : 0.54)),
        ),
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      aria-label={name}
      data-brand-id={id}
      title={name}
    >
      {monogram}
    </span>
  )

  // Full stylized wordmark — per-brand typography from wordmarkStyles.ts.
  const wordmarkText = style.text ?? name
  const wordmark = (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: size,
        fontFamily: fontFamilyFor(style.font),
        fontWeight: style.weight,
        fontStyle: style.italic ? 'italic' : 'normal',
        textTransform: style.uppercase ? 'uppercase' : 'none',
        letterSpacing: style.tracking,
        fontSize: Math.max(10, Math.round(size * (style.scale ?? 0.7))),
        lineHeight: 1,
        color,
        whiteSpace: 'nowrap',
      }}
      aria-label={name}
      data-brand-id={id}
      title={name}
    >
      {wordmarkText}
    </span>
  )

  if (errored) return compact ? compactFallback : wordmark

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

export default BrandLogo
