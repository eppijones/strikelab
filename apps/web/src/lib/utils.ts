import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDistance(meters: number, unit: 'meters' | 'yards' = 'meters'): string {
  if (unit === 'yards') {
    return `${Math.round(meters * 1.09361)} yds`
  }
  return `${Math.round(meters)} m`
}

export function formatSpeed(mps: number, unit: 'mps' | 'mph' = 'mph'): string {
  if (unit === 'mph') {
    return `${Math.round(mps * 2.23694)} mph`
  }
  return `${Math.round(mps)} m/s`
}

export function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = new Date(date)
  return d.toLocaleDateString(locale === 'no' ? 'nb-NO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date, locale: string = 'en'): string {
  const d = new Date(date)
  return d.toLocaleString(locale === 'no' ? 'nb-NO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400'
  if (score >= 75) return 'text-cyan'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 90) return t('scores.elite')
  if (score >= 75) return t('scores.solid')
  if (score >= 60) return t('scores.developing')
  return t('scores.focus')
}
