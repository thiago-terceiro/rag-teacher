import { createContext, use, useState } from 'react';

const ReadingSettingsContext = createContext(null);

const STORAGE_KEY = 'rag_reading_settings_v1';

const DEFAULT_SETTINGS = {
  fontSize: 'normal',       // 'normal' (15px) | 'comfortable' (17px) | 'large' (19px)
  contentWidth: 'normal',   // 'normal' (max-w-4xl) | 'wide' (max-w-5xl)
  lineSpacing: 'relaxed',    // 'relaxed' | 'spacious'
};

export const ReadingSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save reading settings', e);
      }
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // React 19 standard `<Context value={...}>` (no .Provider required)
  return (
    <ReadingSettingsContext value={{ settings, updateSetting, resetSettings }}>
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

