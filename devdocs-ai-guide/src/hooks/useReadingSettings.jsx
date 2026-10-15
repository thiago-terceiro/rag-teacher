import { createContext, useContext, useState, useEffect } from 'react';

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

  return (
    <ReadingSettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </ReadingSettingsContext.Provider>
  );
};

export const useReadingSettings = () => {
  const context = useContext(ReadingSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSetting: () => {},
      resetSettings: () => {},
    };
  }
  return context;
};
