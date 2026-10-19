import { createContext, use, useEffect, useState, useCallback, useMemo } from 'react';

const ReadingSettingsContext = createContext(null);

const STORAGE_KEY = 'rag_reading_settings_v1';

const VALID_THEMES = ['deep-blue', 'oled-midnight', 'daylight-paper'];

const DEFAULT_SETTINGS = {
  theme: 'deep-blue',       // 'deep-blue' (#090d16) | 'oled-midnight' (#000000) | 'daylight-paper' (light)
  fontSize: 'normal',       // 'normal' (15px) | 'comfortable' (17px) | 'large' (19px)
  contentWidth: 'normal',   // 'normal' (max-w-4xl) | 'wide' (max-w-5xl)
  lineSpacing: 'relaxed',   // 'relaxed' | 'spacious'
};

const THEME_META_COLORS = {
  'deep-blue': '#090d16',
  'oled-midnight': '#000000',
  'daylight-paper': '#faf8f5',
};

export function applyThemeAndReadingStyles(settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  const activeTheme = VALID_THEMES.includes(settings.theme) ? settings.theme : 'deep-blue';
  const isLight = activeTheme === 'daylight-paper';

  // 1. Instant Theme Classes
  const themeClasses = ['theme-deep-blue', 'theme-oled-midnight', 'theme-daylight-paper', 'dark', 'light'];
  root.classList.remove(...themeClasses);
  body.classList.remove(...themeClasses);
  root.classList.add(`theme-${activeTheme}`, isLight ? 'light' : 'dark');
  body.classList.add(`theme-${activeTheme}`, isLight ? 'light' : 'dark');

  // 2. Instant Font Size Classes
  const sizeClasses = ['reading-size-normal', 'reading-size-comfortable', 'reading-size-large'];
  root.classList.remove(...sizeClasses);
  body.classList.remove(...sizeClasses);
  root.classList.add(`reading-size-${settings.fontSize || 'normal'}`);
  body.classList.add(`reading-size-${settings.fontSize || 'normal'}`);

  // 3. Instant Line Spacing Classes
  const spacingClasses = ['reading-spacing-relaxed', 'reading-spacing-spacious'];
  root.classList.remove(...spacingClasses);
  body.classList.remove(...spacingClasses);
  root.classList.add(`reading-spacing-${settings.lineSpacing || 'relaxed'}`);
  body.classList.add(`reading-spacing-${settings.lineSpacing || 'relaxed'}`);

  // 4. Instant Content Width Classes
  const widthClasses = ['reading-width-normal', 'reading-width-wide'];
  root.classList.remove(...widthClasses);
  body.classList.remove(...widthClasses);
  root.classList.add(`reading-width-${settings.contentWidth || 'normal'}`);
  body.classList.add(`reading-width-${settings.contentWidth || 'normal'}`);

  // 5. Meta Theme Color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', THEME_META_COLORS[activeTheme] || '#090d16');
  }
}

function loadStoredSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved);
    const theme = VALID_THEMES.includes(parsed?.theme) ? parsed.theme : DEFAULT_SETTINGS.theme;
    return { ...DEFAULT_SETTINGS, ...parsed, theme };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const ReadingSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadStoredSettings);

  // Sync DOM styles and persist settings strictly in effect (outside render & updaters)
  useEffect(() => {
    applyThemeAndReadingStyles(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save reading settings', e);
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(() => ({
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

export const useReadingSettings = () => {
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
