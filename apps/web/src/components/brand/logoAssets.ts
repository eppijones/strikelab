/**
 * Whitelist of brand and connector ids that have a real logo asset shipped
 * in `apps/web/public/{brands,integrations}/`.
 *
 * - `polarity` describes the dominant tone of the artwork:
 *     'dark'  → dark/black art on a light or transparent background.
 *               Inverted in dark mode so it reads as white.
 *     'light' → light/white art on a dark or transparent background.
 *               Inverted in light mode so it reads as black.
 * - `ext` is the file extension under `/{brands|integrations}/{id}.{ext}`.
 *   Defaults to `'png'` because that's what we're shipping today.
 *
 * Anything not in these maps will be hidden from the picker (Connectors page
 * + BrandPicker in ClubEditorDrawer) — we only show entries we can render
 * cleanly.
 *
 * NOTE: the artwork itself is the trademark of each respective company. We
 * use it nominatively to identify equipment / data sources in this app. For
 * any public release, confirm usage rights or use each brand's official
 * mono-color press-kit asset.
 */

export type LogoPolarity = 'dark' | 'light'

export interface LogoAsset {
  polarity: LogoPolarity
  ext?: 'png' | 'svg' | 'jpg'
}

export const BRAND_LOGO_ASSETS: Record<string, LogoAsset> = {
  taylormade: { polarity: 'dark' },
  ping: { polarity: 'dark' },
  callaway: { polarity: 'dark' },
  titleist: { polarity: 'dark' },
  cobra: { polarity: 'dark' },
  mizuno: { polarity: 'dark' },
  odyssey: { polarity: 'dark' },
  srixon: { polarity: 'dark' },
  wilson: { polarity: 'dark' },
  scotty_cameron: { polarity: 'dark' },
  pxg: { polarity: 'dark' },
}

export const CONNECTOR_LOGO_ASSETS: Record<string, LogoAsset> = {
  trackman: { polarity: 'dark' },
  gspro: { polarity: 'light' },
  foresight: { polarity: 'dark' },
  topgolf: { polarity: 'dark' },
  rapsodo: { polarity: 'dark' },
  skytrak: { polarity: 'light' },
  garmin_r10: { polarity: 'dark' },
  uneekor: { polarity: 'dark' },
  arccos: { polarity: 'dark' },
}

export function getBrandLogoAsset(id: string): LogoAsset | undefined {
  return BRAND_LOGO_ASSETS[id]
}

export function getConnectorLogoAsset(id: string): LogoAsset | undefined {
  return CONNECTOR_LOGO_ASSETS[id]
}

export function brandHasLogo(id: string): boolean {
  return id in BRAND_LOGO_ASSETS
}

export function connectorHasLogo(id: string): boolean {
  return id in CONNECTOR_LOGO_ASSETS
}

export function brandLogoPath(id: string): string | null {
  const asset = BRAND_LOGO_ASSETS[id]
  if (!asset) return null
  return `/brands/${id}.${asset.ext ?? 'png'}`
}

export function connectorLogoPath(id: string): string | null {
  const asset = CONNECTOR_LOGO_ASSETS[id]
  if (!asset) return null
  return `/integrations/${id}.${asset.ext ?? 'png'}`
}
