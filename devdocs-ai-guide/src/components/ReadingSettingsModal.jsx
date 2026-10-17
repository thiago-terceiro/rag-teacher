import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Type, X, RotateCcw, Check, Moon, Sun, Sparkles, Printer, Globe } from 'lucide-react';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';

const THEME_PRESETS = [
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

export function ReadingSettingsModal({ isOpen, setIsOpen }) {
  const { settings, updateSetting, resetSettings } = useReadingSettings();
  const { lang, setLang, supportedLanguages, t } = useI18n();
  const activeTheme = settings.theme || 'deep-blue';

  const handlePrintPdf = () => {
    setIsOpen(false);
    setTimeout(() => {
      window.print();
    }, 180);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="no-print fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-150" />
        <Dialog.Content
          aria-describedby={undefined}
          className="no-print fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card/95 border border-border rounded-2xl shadow-2xl z-50 p-6 focus:outline-none animate-in zoom-in-95 duration-150 custom-scrollbar"
        >
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-primary" />
              <Dialog.Title className="text-base font-bold text-foreground">
                {t('settings.title', 'Display, Theme & Language Settings')}
              </Dialog.Title>
            </div>
            <button
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
                <Globe className="w-3.5 h-3.5 text-primary" />
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  {t('settings.language', 'Language / Idioma')}
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {supportedLanguages.map(item => {
                  const isSelected = lang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLang(item.code)}
                      aria-pressed={isSelected}
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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                {t('settings.theme', 'Color Theme Preset')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {THEME_PRESETS.map(item => {
                  const isSelected = activeTheme === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateSetting('theme', item.key)}
                      aria-pressed={isSelected}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span
                          className="w-6 h-6 rounded-lg border border-border/80 flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: item.swatchBg }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.swatchAccent }}
                          />
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 opacity-60" />
                        )}
                      </div>
                      <div className="text-sm font-medium leading-tight">
                        {t(item.labelKey, item.fallbackLabel)}
                      </div>
                      <div className="text-[11px] opacity-75 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size Option */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Text Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'normal', label: 'Default', size: '15px' },
                  { key: 'comfortable', label: 'Medium', size: '17px' },
                  { key: 'large', label: 'Large', size: '19px' },
                ].map(item => {
                  const isSelected = settings.fontSize === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateSetting('fontSize', item.key)}
                      className={cn(
                        'p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-[11px] opacity-70 mt-0.5">{item.size}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Width Option */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Reading Width
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'normal', label: 'Standard Column', desc: 'Optimal for reading' },
                  { key: 'wide', label: 'Wide Column', desc: 'Extra space for code' },
                ].map(item => {
                  const isSelected = settings.contentWidth === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
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
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <div className="text-[11px] opacity-70 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Spacing Option */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Line Spacing
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'relaxed', label: 'Relaxed', desc: 'Standard book rhythm' },
                  { key: 'spacious', label: 'Spacious', desc: 'Higher breathability' },
                ].map(item => {
                  const isSelected = settings.lineSpacing === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
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
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <div className="text-[11px] opacity-70 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
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
                onClick={handlePrintPdf}
                className="text-xs text-primary hover:text-primary/80 flex items-center space-x-1.5 transition-colors cursor-pointer font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Save Chapter as PDF</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
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

