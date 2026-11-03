import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Type, X, RotateCcw, Check, Moon, Sun, Sparkles, Globe } from 'lucide-react';
import { useReadingSettings, applyThemeAndReadingStyles } from '../hooks/useReadingSettings';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';
import type {
  ThemeMode,
  FontSizeMode,
  ContentWidthMode,
  LineSpacingMode,
} from '../types';

export interface ReadingSettingsModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface ThemePreset {
  key: ThemeMode;
  labelKey: string;
  fallbackLabel: string;
  desc: string;
  swatchBg: string;
  swatchAccent: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

const THEME_PRESETS: readonly ThemePreset[] = [
  {
    key: 'deep-blue',
    labelKey: 'settings.themeDeepBlue',
    fallbackLabel: 'Deep Blue',
    desc: 'Ambient navy (#090d16)',
    swatchBg: '#090d16',
    swatchAccent: '#3b82f6',
    icon: Moon,
  },
  {
    key: 'oled-midnight',
    labelKey: 'settings.themeOled',
    fallbackLabel: 'OLED Midnight',
    desc: 'Pure black (#000000)',
    swatchBg: '#000000',
    swatchAccent: '#60a5fa',
    icon: Sparkles,
  },
  {
    key: 'daylight-paper',
    labelKey: 'settings.themeDaylight',
    fallbackLabel: 'Daylight Paper',
    desc: 'High-contrast light',
    swatchBg: '#faf8f5',
    swatchAccent: '#2563eb',
    icon: Sun,
  },
];

export function ReadingSettingsModal({ isOpen, setIsOpen }: ReadingSettingsModalProps): React.JSX.Element {
  const { settings, updateSetting, resetSettings } = useReadingSettings();
  const { lang, setLang, supportedLanguages, t } = useI18n();
  const activeTheme = settings.theme || 'deep-blue';

  const handleThemeSelect = (themeKey: ThemeMode) => {
    // 1. Immediately apply class changes to documentElement & body in 0ms (instant synchronous repaint)
    applyThemeAndReadingStyles({ ...settings, theme: themeKey });
    // 2. React 19 startTransition to keep the UI interactive and avoid locking the main thread
    React.startTransition(() => {
      updateSetting('theme', themeKey);
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="no-print fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          className="no-print fixed inset-y-0 right-0 w-full sm:max-w-md h-full max-h-screen bg-card border-l border-border shadow-2xl z-50 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar focus:outline-none animate-drawer-right"
        >
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-primary" />
              <Dialog.Title className="text-base font-bold text-foreground">
                {t('settings.title', 'Display, Theme & Language Settings')}
              </Dialog.Title>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-5 space-y-6">
            {/* Language Selector */}
            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <Globe className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span id="heading-language" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  {t('settings.language', 'Language / Idioma')}
                </span>
              </div>
              <div role="radiogroup" aria-labelledby="heading-language" className="grid grid-cols-3 gap-2">
                {supportedLanguages.map(item => {
                  const isSelected = lang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setLang(item.code)}
                      className={cn(
                        'py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-xs font-medium',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <span className="text-sm">{item.flag}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Preset Option */}
            <div>
              <span id="heading-theme" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                {t('settings.theme', 'Color Theme Preset')}
              </span>
              <div role="radiogroup" aria-labelledby="heading-theme" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {THEME_PRESETS.map(item => {
                  const isSelected = activeTheme === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleThemeSelect(item.key)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span
                          aria-hidden="true"
                          className="w-6 h-6 rounded-lg border border-border/80 flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: item.swatchBg }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.swatchAccent }}
                          />
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                        )}
                      </div>
                      <div className="text-sm font-medium leading-tight">
                        {t(item.labelKey, item.fallbackLabel)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size Option */}
            <div>
              <span id="heading-fontsize" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Text Size
              </span>
              <div role="radiogroup" aria-labelledby="heading-fontsize" className="grid grid-cols-3 gap-2">
                {[
                  { key: 'normal' as FontSizeMode, label: 'Default', size: '15px' },
                  { key: 'comfortable' as FontSizeMode, label: 'Medium', size: '17px' },
                  { key: 'large' as FontSizeMode, label: 'Large', size: '19px' },
                ].map(item => {
                  const isSelected = settings.fontSize === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateSetting('fontSize', item.key)}
                      className={cn(
                        'p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{item.size}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Width Option */}
            <div>
              <span id="heading-width" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Reading Width
              </span>
              <div role="radiogroup" aria-labelledby="heading-width" className="grid grid-cols-2 gap-2">
                {[
                  { key: 'normal' as ContentWidthMode, label: 'Standard Column', desc: 'Optimal for reading' },
                  { key: 'wide' as ContentWidthMode, label: 'Wide Column', desc: 'Extra space for code' },
                ].map(item => {
                  const isSelected = settings.contentWidth === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateSetting('contentWidth', item.key)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Spacing Option */}
            <div>
              <span id="heading-spacing" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Line Spacing
              </span>
              <div role="radiogroup" aria-labelledby="heading-spacing" className="grid grid-cols-2 gap-2">
                {[
                  { key: 'relaxed' as LineSpacingMode, label: 'Relaxed', desc: 'Standard book rhythm' },
                  { key: 'spacious' as LineSpacingMode, label: 'Spacious', desc: 'Higher breathability' },
                ].map(item => {
                  const isSelected = settings.lineSpacing === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateSetting('lineSpacing', item.key)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetSettings}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(ReadingSettingsModal);
