import React, { createContext, use, useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ReadingSettings, ReadingSettingsContextType, ThemeMode } from '../types';

const ReadingSettingsContext = createContext<ReadingSettingsContextType | null>(null);

const STORAGE_KEY = 'rag_reading_settings_v1';

const VALID_THEMES: ThemeMode[] = ['deep-blue', 'oled-midnight', 'daylight-paper'];
const VALID_FONT_SIZES: Set<string> = new Set(['normal', 'comfortable', 'large']);
const VALID_WIDTHS: Set<string> = new Set(['normal', 'wide']);
const VALID_SPACINGS: Set<string> = new Set(['relaxed', 'spacious']);

const DEFAULT_SETTINGS: ReadingSettings = {
  theme: 'deep-blue',       // 'deep-blue' (#090d16) | 'oled-midnight' (#000000) | 'daylight-paper' (light)
  fontSize: 'normal',       // 'normal' (15px) | 'comfortable' (17px) | 'large' (19px)
  contentWidth: 'normal',   // 'normal' (max-w-4xl) | 'wide' (max-w-5xl)
  lineSpacing: 'relaxed',   // 'relaxed' | 'spacious'
};

const THEME_META_COLORS: Record<ThemeMode, string> = {
  'deep-blue': '#090d16',
  'oled-midnight': '#000000',
  'daylight-paper': '#faf8f5',
};

export function applyThemeAndReadingStyles(settings: ReadingSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  const activeTheme: ThemeMode = VALID_THEMES.includes(settings.theme) ? settings.theme : 'deep-blue';
  const isLight = activeTheme === 'daylight-paper';

  // 1. Instant Theme Classes
  const themeClasses = ['theme-deep-blue', 'theme-oled-midnight', 'theme-daylight-paper', 'dark', 'light'];
  root.classList.remove(...themeClasses);
  body.classList.remove(...themeClasses);
  root.classList.add(`theme-${activeTheme}`, isLight ? 'light' : 'dark');
  body.classList.add(`theme-${activeTheme}`, isLight ? 'light' : 'dark');

  // 2. Instant Font Size Classes
  const fontSize = VALID_FONT_SIZES.has(settings.fontSize) ? settings.fontSize : 'normal';
  const sizeClasses = ['reading-size-normal', 'reading-size-comfortable', 'reading-size-large'];
  root.classList.remove(...sizeClasses);
  body.classList.remove(...sizeClasses);
  root.classList.add(`reading-size-${fontSize}`);
  body.classList.add(`reading-size-${fontSize}`);

  // 3. Instant Line Spacing Classes
  const lineSpacing = VALID_SPACINGS.has(settings.lineSpacing) ? settings.lineSpacing : 'relaxed';
  const spacingClasses = ['reading-spacing-relaxed', 'reading-spacing-spacious'];
  root.classList.remove(...spacingClasses);
  body.classList.remove(...spacingClasses);
  root.classList.add(`reading-spacing-${lineSpacing}`);
  body.classList.add(`reading-spacing-${lineSpacing}`);

  // 4. Instant Content Width Classes
  const contentWidth = VALID_WIDTHS.has(settings.contentWidth) ? settings.contentWidth : 'normal';
  const widthClasses = ['reading-width-normal', 'reading-width-wide'];
  root.classList.remove(...widthClasses);
  body.classList.remove(...widthClasses);
  root.classList.add(`reading-width-${contentWidth}`);
  body.classList.add(`reading-width-${contentWidth}`);

  // 5. Meta Theme Color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', THEME_META_COLORS[activeTheme] || '#090d16');
  }
}

function loadStoredSettings(): ReadingSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved);
    const theme: ThemeMode = VALID_THEMES.includes(parsed?.theme) ? parsed.theme : DEFAULT_SETTINGS.theme;
    const fontSize = VALID_FONT_SIZES.has(parsed?.fontSize) ? parsed.fontSize : DEFAULT_SETTINGS.fontSize;
    const contentWidth = VALID_WIDTHS.has(parsed?.contentWidth) ? parsed.contentWidth : DEFAULT_SETTINGS.contentWidth;
    const lineSpacing = VALID_SPACINGS.has(parsed?.lineSpacing) ? parsed.lineSpacing : DEFAULT_SETTINGS.lineSpacing;
    return { theme, fontSize, contentWidth, lineSpacing };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const ReadingSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<ReadingSettings>(loadStoredSettings);

  // Sync DOM styles synchronously before paint to prevent FOUC (flash of unstyled content)
  useLayoutEffect(() => {
    applyThemeAndReadingStyles(settings);
  }, [settings]);

  // Persist settings in useEffect outside render & updaters
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save reading settings', e);
    }
  }, [settings]);

  // Real-time multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSettings(loadStoredSettings());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSetting = useCallback(<K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo<ReadingSettingsContextType>(() => ({
    settings,
    updateSetting,
    resetSettings,
  }), [settings, updateSetting, resetSettings]);

  // React 19 standard `<Context value={...}>` (no .Provider required)
  return (
    <ReadingSettingsContext value={value}>
      {children}
    </ReadingSettingsContext>
  );
};

export const useReadingSettings = (): ReadingSettingsContextType => {
  // React 19 native `use()` hook
  const context = use(ReadingSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSetting: () => {},
      resetSettings: () => {},
    };
  }
  return context;
};
