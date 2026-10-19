import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, supportedLanguages } from '../i18n/translations';

const STORAGE_KEY = 'rag_language_v1';
const I18nContext = createContext(null);

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
      return saved;
    }
    // Check browser language preference
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserCode = navigator.language.slice(0, 2).toLowerCase();
      if (translations[browserCode]) {
        return browserCode;
      }
    }
  } catch {
    // Fallback
  }
  return 'en';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);

  const setLang = useCallback((newLang) => {
    if (!translations[newLang]) return;
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Storage unavailable
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, fallback = '') => {
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

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    supportedLanguages,
  }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
