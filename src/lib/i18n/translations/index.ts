/**
 * Translation Index
 * Exports all available translations
 */

import { en } from './en';
import { es } from './es';

export const translations = {
  en,
  es,
} as const;

export type Language = keyof typeof translations;
export type { TranslationKeys } from './en';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
] as const;

export const defaultLanguage: Language = 'en';
