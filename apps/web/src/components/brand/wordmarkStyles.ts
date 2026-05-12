/**
 * Per-brand typographic wordmark styles.
 *
 * Used as the fallback when an SVG logo asset is missing for a brand. We only
 * render the brand's NAME — not their trademarked logo — but each brand gets
 * a distinct typographic personality (italic, weight, tracking, font family)
 * so the picker reads as branded typography rather than uniform mono caps.
 *
 * The moment a licensed SVG mark is dropped into `apps/web/public/brands/`,
 * BrandLogo will use it instead and these styles become the fallback.
 *
 * Fonts available in the app (loaded in `apps/web/index.html`):
 *   - sans  → Geist (weights 300, 400, 500, 600, 700)
 *   - mono  → Geist Mono (weights 300, 400, 500, 600)
 *   - serif → Instrument Serif (italic + roman)
 */

export type WordmarkFont = 'sans' | 'mono' | 'serif'

export interface WordmarkStyle {
  font?: WordmarkFont
  /** Geist weight; capped at 700 because that's the heaviest variant loaded. */
  weight?: 300 | 400 | 500 | 600 | 700
  italic?: boolean
  uppercase?: boolean
  /** CSS letter-spacing value, e.g. '0.18em' or '-0.01em'. */
  tracking?: string
  /** Font-size as a fraction of the rendered height. Default 0.7. */
  scale?: number
  /** Override the displayed text (defaults to brand.name). */
  text?: string
}

const DEFAULT_STYLE: WordmarkStyle = {
  font: 'sans',
  weight: 700,
  uppercase: true,
  tracking: '0.04em',
  scale: 0.7,
}

const STYLES: Record<string, WordmarkStyle> = {
  // Refined classic — serif italic, mixed case
  titleist: { font: 'serif', italic: true, weight: 500, uppercase: false, tracking: '0', scale: 0.95 },

  // Aggressive sporty — heavy italic caps, tight tracking
  taylormade: { weight: 700, italic: true, uppercase: true, tracking: '-0.005em', scale: 0.66 },

  // Solid mainstream — bold tracked caps
  callaway: { weight: 700, uppercase: true, tracking: '0.10em', scale: 0.7 },

  // Iconic ultra-tracked caps
  ping: { weight: 700, uppercase: true, tracking: '0.42em', scale: 0.78 },

  // Dynamic heavy italic caps
  cobra: { weight: 700, italic: true, uppercase: true, tracking: '0.06em', scale: 0.72 },

  // Classic heavy caps
  cleveland: { weight: 700, uppercase: true, tracking: '0.10em', scale: 0.62 },

  // Japanese restraint — wide tracked caps
  mizuno: { weight: 700, uppercase: true, tracking: '0.18em', scale: 0.7 },

  // Sport heavy caps, slight tracking
  srixon: { weight: 700, uppercase: true, tracking: '0.06em', scale: 0.7 },

  // Long brand — bold caps, modest tracking
  bridgestone: { weight: 700, uppercase: true, tracking: '0.04em', scale: 0.55 },

  // Premium handcrafted — light serif italic
  scotty_cameron: { font: 'serif', italic: true, weight: 400, uppercase: false, tracking: '0.01em', scale: 0.85 },

  // Craftsman — serif italic
  vokey: { font: 'serif', italic: true, weight: 500, uppercase: false, tracking: '0.01em', scale: 0.95 },

  // Luxury technical — heavy mono caps with wide tracking
  pxg: { font: 'mono', weight: 600, uppercase: true, tracking: '0.22em', scale: 0.85 },

  // Wide-tracked caps, technical
  xxio: { weight: 700, uppercase: true, tracking: '0.32em', scale: 0.85 },

  // Premium Japanese — medium caps, generous tracking
  honma: { weight: 600, uppercase: true, tracking: '0.22em', scale: 0.75 },

  // Heritage sport — heavy italic caps
  wilson: { weight: 700, italic: true, uppercase: true, tracking: '0.04em', scale: 0.72 },

  // Performance — bold caps
  tour_edge: { weight: 700, uppercase: true, tracking: '0.10em', scale: 0.6 },

  // Refined Japanese craftsmanship — light, very wide tracking
  miura: { weight: 300, uppercase: true, tracking: '0.50em', scale: 0.78 },

  // Heavy caps, modern
  odyssey: { weight: 700, uppercase: true, tracking: '0.06em', scale: 0.68 },
}

export function getWordmarkStyle(id: string): WordmarkStyle {
  return { ...DEFAULT_STYLE, ...(STYLES[id] ?? {}) }
}

export function fontFamilyFor(font: WordmarkFont = 'sans'): string {
  switch (font) {
    case 'mono':
      return '"Geist Mono", ui-monospace, monospace'
    case 'serif':
      return '"Instrument Serif", "Times New Roman", serif'
    default:
      return '"Geist", system-ui, -apple-system, sans-serif'
  }
}
