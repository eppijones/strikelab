export interface ClubTypeDef {
  id: string
  label: string
  shortLabel: string
  defaultLabels: string[]
}

export const CLUB_TYPES: ClubTypeDef[] = [
  { id: 'driver', label: 'Driver', shortLabel: 'DRV', defaultLabels: ['Driver'] },
  {
    id: '3_wood',
    label: '3-Wood',
    shortLabel: '3W',
    defaultLabels: ['3W'],
  },
  {
    id: '4_wood',
    label: '4-Wood',
    shortLabel: '4W',
    defaultLabels: ['4W'],
  },
  {
    id: '5_wood',
    label: '5-Wood',
    shortLabel: '5W',
    defaultLabels: ['5W'],
  },
  {
    id: '7_wood',
    label: '7-Wood',
    shortLabel: '7W',
    defaultLabels: ['7W'],
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'HY',
    defaultLabels: ['2H', '3H', '4H', '5H'],
  },
  {
    id: 'iron',
    label: 'Iron',
    shortLabel: 'IRN',
    defaultLabels: ['3i', '4i', '5i', '6i', '7i', '8i', '9i', 'PW'],
  },
  {
    id: 'wedge',
    label: 'Wedge',
    shortLabel: 'WDG',
    defaultLabels: ['GW', 'SW', 'LW', '50°', '52°', '54°', '56°', '58°', '60°'],
  },
  { id: 'utility', label: 'Utility / Chipper', shortLabel: 'UTL', defaultLabels: ['Utility', 'Chipper'] },
  { id: 'putter', label: 'Putter', shortLabel: 'PUT', defaultLabels: ['Putter'] },
]

export const SHAFT_FLEX_OPTIONS = ['L', 'A', 'R', 'S', 'X'] as const
export type ShaftFlex = (typeof SHAFT_FLEX_OPTIONS)[number]

export function getClubTypeDef(id: string): ClubTypeDef | undefined {
  return CLUB_TYPES.find((t) => t.id === id)
}

export function defaultLabelForType(typeId: string, existing: string[] = []): string {
  const def = getClubTypeDef(typeId)
  if (!def) return ''
  const used = new Set(existing.map((l) => l.toLowerCase()))
  const next = def.defaultLabels.find((l) => !used.has(l.toLowerCase()))
  return next ?? def.defaultLabels[0] ?? def.shortLabel
}
