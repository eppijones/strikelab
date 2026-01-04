export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const CLUBS = [
  'Driver',
  '3 Wood',
  '5 Wood',
  '7 Wood',
  '2 Hybrid',
  '3 Hybrid',
  '4 Hybrid',
  '5 Hybrid',
  '3 Iron',
  '4 Iron',
  '5 Iron',
  '6 Iron',
  '7 Iron',
  '8 Iron',
  '9 Iron',
  'PW',
  'GW',
  'SW',
  '52 Wedge',
  '54 Wedge',
  '56 Wedge',
  '58 Wedge',
  '60 Wedge',
  'Putter',
] as const

export type Club = (typeof CLUBS)[number]

export const FEEL_TAGS = {
  en: ['calm', 'heavy', 'late', 'stress', 'focused', 'smooth', 'quick', 'tight'],
  no: ['rolig', 'tung', 'sen', 'stress', 'fokusert', 'myk', 'hurtig', 'stram'],
}

export const MISS_PATTERNS = {
  en: ['push', 'pull', 'fade', 'draw', 'slice', 'hook', 'thin', 'fat', 'toe', 'heel'],
  no: ['push', 'pull', 'fade', 'draw', 'slice', 'hook', 'tynn', 'feit', 'tå', 'hæl'],
}

export const CONNECTORS = [
  {
    id: 'trackman',
    name: 'TrackMan',
    description: 'Premium radar launch monitor',
    logo: '🎯',
    status: 'available' as const,
  },
  {
    id: 'topgolf',
    name: 'Topgolf',
    description: 'Entertainment venue data',
    logo: '🏌️',
    status: 'available' as const,
  },
  {
    id: 'foresight',
    name: 'Foresight',
    description: 'Camera-based launch monitor',
    logo: '📷',
    status: 'available' as const,
  },
  {
    id: 'stack',
    name: 'Stack System',
    description: 'Speed training integration',
    logo: '⚡',
    status: 'coming_soon' as const,
  },
  {
    id: 'csv',
    name: 'CSV Import',
    description: 'Universal fallback import',
    logo: '📄',
    status: 'available' as const,
  },
]
