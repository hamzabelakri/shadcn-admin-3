import { en } from './en'
import { fr } from './fr'
import { ar } from './ar'

export const translations = {
  en,
  fr,
  ar,
} as const

export type TranslationKey = keyof typeof translations.en
export type Language = keyof typeof translations

// Re-export individual language files for i18n config
export { en, fr, ar }
