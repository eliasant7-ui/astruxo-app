/**
 * i18n Context
 * Provides internationalization support with automatic language detection
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, defaultLanguage, Language, TranslationKeys } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  availableLanguages: Array<{ code: string; name: string; nativeName: string }>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'astruxo_language';

/**
 * Detect user's preferred language from browser settings
 */
function detectBrowserLanguage(): Language {
  // Check localStorage first (user preference)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in translations) {
    console.log('🌍 Language from localStorage:', stored);
    return stored as Language;
  }

  // Detect from browser
  const browserLang = navigator.language.toLowerCase();
  console.log('🌍 Browser language detected:', browserLang);
  
  // Check exact match (e.g., "en-US" -> "en")
  const langCode = browserLang.split('-')[0];
  if (langCode in translations) {
    console.log('🌍 Using language code:', langCode);
    return langCode as Language;
  }

  // Check full match (e.g., "es-MX")
  if (browserLang in translations) {
    console.log('🌍 Using full browser language:', browserLang);
    return browserLang as Language;
  }

  // Default to English
  console.log('🌍 Defaulting to:', defaultLanguage);
  return defaultLanguage;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => detectBrowserLanguage());

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  };

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
    console.log('🌍 HTML lang attribute set to:', language);
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    availableLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n context
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Hook to get translation function only (for convenience)
 */
export function useTranslation() {
  const { t } = useI18n();
  return t;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function useRelativeTime() {
  const { t } = useI18n();

  return (date: Date | string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) {
      return t.time.now;
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? t.time.minute : t.time.minutes} ${t.time.ago}`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? t.time.hour : t.time.hours} ${t.time.ago}`;
    } else if (diffDay < 7) {
      return `${diffDay} ${diffDay === 1 ? t.time.day : t.time.days} ${t.time.ago}`;
    } else if (diffWeek < 4) {
      return `${diffWeek} ${diffWeek === 1 ? t.time.week : t.time.weeks} ${t.time.ago}`;
    } else if (diffMonth < 12) {
      return `${diffMonth} ${diffMonth === 1 ? t.time.month : t.time.months} ${t.time.ago}`;
    } else {
      return `${diffYear} ${diffYear === 1 ? t.time.year : t.time.years} ${t.time.ago}`;
    }
  };
}
