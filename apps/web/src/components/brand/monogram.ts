/**
 * Derive a short, uppercase monogram from a brand or connector name.
 *
 * Used as the visual fallback when an SVG asset is missing — keeps the UI
 * uniform (one consistent font, fixed footprint per tile) instead of letting
 * long wordmarks overflow their container.
 *
 * Rules (in order):
 *   1. Strip cosmetic characters (`+`, trailing punctuation).
 *   2. Split on whitespace, slashes, dashes, underscores, and camelCase
 *      boundaries (so "FlightScope" → ["Flight", "Scope"]).
 *   3. If the first token is a short acronym (≤3 chars, all uppercase) keep
 *      it whole — `CSV`, `R10`, `MLM` read better than truncated.
 *   4. If there are two or more tokens, take the first letter of the first
 *      two meaningful tokens (`Foresight Sports` → `FS`).
 *   5. Otherwise, take the first two characters of the single token
 *      (`Uneekor` → `UN`).
 *
 * Always returns 1–3 uppercase characters.
 */
export function brandMonogram(name: string): string {
  const cleaned = (name ?? '').replace(/[+®™©]/g, '').trim()
  if (!cleaned) return '··'

  const tokens = cleaned
    .split(/[\s/\-_·]+/)
    .flatMap((word) => word.split(/(?<=[a-z])(?=[A-Z])/))
    .filter(Boolean)

  if (!tokens.length) return cleaned.slice(0, 2).toUpperCase()

  const first = tokens[0]
  const isShortAcronym =
    first.length <= 3 && first === first.toUpperCase() && /[A-Z]/.test(first)

  if (isShortAcronym) return first

  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[1][0]).toUpperCase()
  }

  return first.slice(0, 2).toUpperCase()
}
