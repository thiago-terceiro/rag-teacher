import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, supportedLanguages } from '../i18n/translations';
import type { SupportedLocale, I18nContextType } from '../types';

const STORAGE_KEY = 'rag_language_v1';
const I18nContext = createContext<I18nContextType | null>(null);

function getInitialLanguage(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (saved && translations[saved]) {
      return saved;
    }
    // Check browser language preference
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserCode = navigator.language.slice(0, 2).toLowerCase() as SupportedLocale;
      if (translations[browserCode]) {
        return browserCode;
      }
    }
  } catch {
    // Fallback
  }
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLocale>(getInitialLanguage);

  // Pure updater
  const setLang = useCallback((newLang: SupportedLocale) => {
    if (!translations[newLang]) return;
    setLangState(newLang);
  }, []);

  // Sync DOM lang attribute and persist in effect outside updaters
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable
    }
  }, [lang]);

  // Real-time multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && translations[e.newValue as SupportedLocale]) {
        setLangState(e.newValue as SupportedLocale);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = useCallback((key: string, fallback: string = ''): string => {
    const langDict = translations[lang] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const defaultDict = translations.en;
    if (defaultDict && defaultDict[key] !== undefined) {
      return defaultDict[key];
    }
    return fallback || key;
  }, [lang]);

  const value = useMemo<I18nContextType>(() => ({
    lang,
    setLang,
    t,
    supportedLanguages,
  }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
