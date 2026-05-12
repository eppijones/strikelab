import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import no from './no.json'

/**
 * Default the language to the browser's preference on first launch.
 * Norwegian (`nb` / `nn` / `no`) → `no`, anything else → `en`.
 * Once the user picks explicitly, `localStorage` wins.
 */
function detectInitialLanguage(): 'en' | 'no' {
  const saved = localStorage.getItem('strikelab-language')
  if (saved === 'no' || saved === 'en') return saved

  const nav =
    (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || ''
  const tag = nav.toLowerCase()
  if (tag.startsWith('nb') || tag.startsWith('nn') || tag.startsWith('no')) return 'no'
  return 'en'
}

const initialLanguage = detectInitialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      no: { translation: no },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
