import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Type, X, RotateCcw, Check } from 'lucide-react';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { cn } from '../lib/utils';

export function ReadingSettingsModal({ isOpen, setIsOpen }) {
  const { settings, updateSetting, resetSettings } = useReadingSettings();

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-150" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card/95 border border-border rounded-2xl shadow-2xl z-50 p-6 focus:outline-none animate-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-primary" />
              <Dialog.Title className="text-base font-bold text-foreground">
                Reading Comfort Settings
              </Dialog.Title>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-5 space-y-6">
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

          <div className="pt-4 border-t border-border/80 flex items-center justify-between">
            <button
              onClick={resetSettings}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
            <button
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
