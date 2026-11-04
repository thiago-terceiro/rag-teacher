import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  ShieldCheck,
  Terminal,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { ARCHITECTURE_FLOWS, type ArchitectureFlow, type ArchitectureFlowStep } from '../data/architectureFlowsData';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';

interface ParsedThreadInfo {
  threadName: string;
  helperText: string | null;
}

function parseThreadLabel(label: string): ParsedThreadInfo {
  const match = label.match(/^(.*?)\s*\[(.*?)\]$/);
  if (match) {
    return {
      threadName: match[1].trim(),
      helperText: match[2].trim(),
    };
  }
  return {
    threadName: label.trim(),
    helperText: null,
  };
}

export default function ArchitectureExplorer(): React.JSX.Element {
  const { t } = useI18n();
  const [selectedFlowId, setSelectedFlowId] = useState<string>(ARCHITECTURE_FLOWS[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x = 2600ms, 1.5x = 1800ms, 2x = 1200ms
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stepsScrollRef = useRef<HTMLDivElement>(null);
  const stepButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stickyRef = useRef<HTMLElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const fileContainerRef = useRef<HTMLElement>(null);
  const prevStepIndexRef = useRef<number>(currentStepIndex);
  const prevFlowIdRef = useRef<string>(selectedFlowId);
  const lastFileTopRef = useRef<number | null>(null);
  const wasDescHiddenRef = useRef<boolean>(false);

  // Monitor scroll on main container to track sticky and file container geometry
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    const updateScrollMetrics = () => {
      if (fileContainerRef.current && stickyRef.current && descriptionRef.current) {
        lastFileTopRef.current = fileContainerRef.current.getBoundingClientRect().top;
        const stickyBottom = stickyRef.current.getBoundingClientRect().bottom;
        const descBottom = descriptionRef.current.getBoundingClientRect().bottom;
        // The description card is hidden behind or scrolled past the sticky controls
        wasDescHiddenRef.current = descBottom <= stickyBottom + 20;
      }
    };

    container.addEventListener('scroll', updateScrollMetrics, { passive: true });
    updateScrollMetrics();

    return () => {
      container.removeEventListener('scroll', updateScrollMetrics);
    };
  }, []);

  // Stabilize file container vertical position when switching steps while description is scrolled out of view
  useLayoutEffect(() => {
    // If flow switched entirely, re-baseline without layout compensation
    if (prevFlowIdRef.current !== selectedFlowId) {
      prevFlowIdRef.current = selectedFlowId;
      prevStepIndexRef.current = currentStepIndex;
      if (fileContainerRef.current && stickyRef.current && descriptionRef.current) {
        lastFileTopRef.current = fileContainerRef.current.getBoundingClientRect().top;
        const stickyBottom = stickyRef.current.getBoundingClientRect().bottom;
        const descBottom = descriptionRef.current.getBoundingClientRect().bottom;
        wasDescHiddenRef.current = descBottom <= stickyBottom + 20;
      }
      return;
    }

    // If step changed within the current flow and description is scrolled out of view:
    if (prevStepIndexRef.current !== currentStepIndex) {
      if (wasDescHiddenRef.current && lastFileTopRef.current !== null && fileContainerRef.current) {
        const currentFileTop = fileContainerRef.current.getBoundingClientRect().top;
        const diff = currentFileTop - lastFileTopRef.current;
        if (Math.abs(diff) > 0.5) {
          const scrollContainer = document.getElementById('main-scroll-container') || document.documentElement;
          scrollContainer.scrollTop += diff;
        }
      }
      prevStepIndexRef.current = currentStepIndex;
    }

    // Refresh baseline metrics after DOM paint/layout
    if (fileContainerRef.current && stickyRef.current && descriptionRef.current) {
      lastFileTopRef.current = fileContainerRef.current.getBoundingClientRect().top;
      const stickyBottom = stickyRef.current.getBoundingClientRect().bottom;
      const descBottom = descriptionRef.current.getBoundingClientRect().bottom;
      wasDescHiddenRef.current = descBottom <= stickyBottom + 20;
    }
  }, [currentStepIndex, selectedFlowId]);

  // Smoothly auto-scroll active step tab into center view
  useEffect(() => {
    const activeBtn = stepButtonRefs.current[currentStepIndex];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentStepIndex]);

  // Click outside to dismiss custom bespoke dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Active Flow object
  const activeFlow = useMemo<ArchitectureFlow>(() => {
    return ARCHITECTURE_FLOWS.find(f => f.id === selectedFlowId) || ARCHITECTURE_FLOWS[0];
  }, [selectedFlowId]);

  // Current Step object
  const currentStep = useMemo<ArchitectureFlowStep>(() => {
    return activeFlow.steps[currentStepIndex] || activeFlow.steps[0];
  }, [activeFlow, currentStepIndex]);

  // Parse structured thread and helper label
  const parsedSourceThread = useMemo(
    () => parseThreadLabel(currentStep.sourceFileSnippet.threadLabel),
    [currentStep.sourceFileSnippet.threadLabel]
  );
  const parsedTargetThread = useMemo(
    () => (currentStep.targetFileSnippet ? parseThreadLabel(currentStep.targetFileSnippet.threadLabel) : null),
    [currentStep.targetFileSnippet]
  );

  // Handle flow switch
  const handleSelectFlow = useCallback((flowId: string) => {
    setSelectedFlowId(flowId);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // Step navigation
  const handleNextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev < activeFlow.steps.length - 1) {
        return prev + 1;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [activeFlow.steps.length]);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev && currentStepIndex === activeFlow.steps.length - 1) {
        setCurrentStepIndex(0);
      }
      return !prev;
    });
  }, [currentStepIndex, activeFlow.steps.length]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(2600 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < activeFlow.steps.length - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, activeFlow.steps.length]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleNextStep, handlePrevStep, handleReset]);

  // Thread badge colors
  const getThreadBadgeClasses = (type: string) => {
    switch (type) {
      case 'worker':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'math':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'storage':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'main':
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  return (
    <div
      ref={containerRef}
      className="max-w-7xl mx-auto space-y-6 pb-16 focus:outline-none"
      tabIndex={-1}
      aria-label="Architecture Flow Explorer Page"
    >
      {/* Hidden Live Region for Screen-Reader Announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`${t('arch.step', 'Step')} ${currentStep.stepNumber} ${t('arch.of', 'of')} ${currentStep.totalSteps}: ${t(currentStep.titleKey, currentStep.titleDefault)}`}
      </div>

      {/* 1. Page Header & Bespoke Flow Selector */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {t('arch.pageTitle', 'Architecture & Code Flow Explorer')}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t('arch.pageSubtitle', 'Trace function calls, thread boundaries, and data payloads side-by-side.')}
          </p>
        </div>

        {/* Bespoke Flow Switcher Dropdown (matching text width with subtle transparency) */}
        <div ref={dropdownRef} className="relative inline-block w-full sm:w-auto shrink-0">
          <label htmlFor="flow-selector" className="text-xs font-medium text-muted-foreground sr-only">
            {t('arch.selectFlow', 'Select Flow')}
          </label>
          {/* Accessible hidden select for screen-readers & automated tests */}
          <select
            id="flow-selector"
            aria-label="Select Flow"
            value={selectedFlowId}
            onChange={e => handleSelectFlow(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          >
            {ARCHITECTURE_FLOWS.map(flow => (
              <option key={flow.id} value={flow.id}>
                {t(flow.titleKey, flow.titleDefault)}
              </option>
            ))}
          </select>

          {/* Bespoke Trigger Button */}
          <button
            id="flow-selector"
            type="button"
            role="combobox"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            aria-label="Change active flow"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="w-full sm:w-auto inline-flex items-center justify-between space-x-2.5 bg-secondary/50 hover:bg-secondary/70 backdrop-blur-md text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all shadow-xs"
          >
            <span className="truncate max-w-[240px] sm:max-w-[320px] md:max-w-none">
              {t(activeFlow.titleKey, activeFlow.titleDefault)}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                isDropdownOpen && 'rotate-180 text-foreground'
              )}
              aria-hidden="true"
            />
          </button>

          {/* Custom Floating Popover Menu with Transparency and Responsive Alignment */}
          {isDropdownOpen && (
            <div
              role="listbox"
              aria-label="Architecture flow choices"
              className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-80 min-w-full max-w-[calc(100vw-2rem)] bg-card/85 dark:bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
            >
              {ARCHITECTURE_FLOWS.map(flow => {
                const isSelected = flow.id === selectedFlowId;
                return (
                  <button
                    key={flow.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      handleSelectFlow(flow.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                    )}
                  >
                    <span className="truncate">{t(flow.titleKey, flow.titleDefault)}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* 2. Flow Summary Banner */}
      <section aria-labelledby="flow-trigger-heading" className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xs">
        <div className="space-y-2">
          {/* Top Line: Header Title */}
          <h2 id="flow-trigger-heading" className="text-base sm:text-lg font-bold text-foreground">
            {t(activeFlow.titleKey, activeFlow.titleDefault)}
          </h2>

          {/* Second Line: Box with Label */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold inline-block">
              {t(activeFlow.categoryKey, activeFlow.categoryDefault)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
            {t(activeFlow.summaryKey, activeFlow.summaryDefault)}
          </p>
        </div>
      </section>

      {/* 3. Sticky Combined Pipeline Stages & Playback Controls Card */}
      <section
        ref={stickyRef}
        aria-label="Pipeline Stages & Playback Controls"
        className="sticky -top-3.5 sm:-top-6 z-20 bg-card/95 backdrop-blur-md border border-border/80 dark:border-border rounded-2xl p-3.5 sm:p-4 shadow-md dark:shadow-black/50 space-y-3 transition-all"
      >
        {/* Step Tabs Horizontal Scroll with Smooth Auto-Scroll */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-[11px] font-medium text-muted-foreground min-w-0 h-5">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-primary shrink-0">
              {t('arch.pipelineProgress', 'Pipeline Progress')}:
            </span>
            <span className="font-mono text-[11px] font-semibold text-foreground truncate min-w-0">
              {currentStep.stageName}
            </span>
          </div>
          <div
            ref={stepsScrollRef}
            tabIndex={0}
            role="tablist"
            aria-label="Pipeline Stages"
            className="flex gap-2 overflow-x-auto scroll-smooth px-2 py-1 pb-1.5 custom-scrollbar focus:outline-hidden focus:ring-1 focus:ring-primary/30"
          >
            {activeFlow.steps.map((s, idx) => {
              const isActive = idx === currentStepIndex;
              const isPassed = idx < currentStepIndex;
              const cleanStageName = s.stageName.includes('. ') ? s.stageName.split('. ')[1] : s.stageName;
              return (
                <button
                  key={s.stepId}
                  ref={el => { stepButtonRefs.current[idx] = el; }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    'flex items-center justify-center py-2 px-3 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer border shrink-0 min-w-[130px] sm:min-w-[150px]',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold ring-2 ring-primary/40 scale-[1.02]'
                      : isPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    {isPassed && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    )}
                    <span className={cn('text-[10px] font-semibold', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}>
                      #{idx + 1}
                    </span>
                    <span className="truncate">{cleanStageName}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playback Controls Row - Squeezed on a single line */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/70 flex-nowrap overflow-x-auto custom-scrollbar">
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              title="Reset to beginning [R]"
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="sr-only">{t('arch.reset', 'Reset')}</span>
            </button>

            {/* Previous Step */}
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              title="Previous step [←]"
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="sr-only">{t('arch.prevStep', 'Previous Step')}</span>
            </button>

            {/* Play Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? t('arch.pause', 'Pause') : t('arch.play', 'Play')}
              title={isPlaying ? `${t('arch.pause', 'Pause')} [Space]` : `${t('arch.play', 'Play')} [Space]`}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-xs hover:bg-primary/90 transition-all cursor-pointer shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>{t('arch.pause', 'Pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>{t('arch.play', 'Play')}</span>
                </>
              )}
            </button>

            {/* Next Step */}
            <button
              type="button"
              onClick={handleNextStep}
              disabled={currentStepIndex === activeFlow.steps.length - 1}
              title="Next step [→]"
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="sr-only">{t('arch.nextStep', 'Next Step')}</span>
            </button>

            {/* Step Indicator (e.g. "1 of 4") squeezed directly after next arrow */}
            <div
              aria-label={`Step ${currentStep.stepNumber} of ${currentStep.totalSteps}`}
              className="flex items-center px-2 py-1 bg-secondary/60 rounded-lg border border-border/70 text-[11px] font-mono shrink-0 select-none"
            >
              <span className="text-primary font-bold">
                {currentStep.stepNumber} {t('arch.of', 'of')} {currentStep.totalSteps}
              </span>
            </div>

            {/* Speed Toggle */}
            <div className="flex items-center space-x-0.5 sm:space-x-1 pl-1.5 border-l border-border/70 shrink-0">
              {[1, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors cursor-pointer',
                    playbackSpeed === speed
                      ? 'bg-secondary text-primary font-bold border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Keyboard Shortcuts Info */}
          <span className="text-[11px] text-muted-foreground hidden lg:inline shrink-0 ml-auto">
            {t('arch.keyboardShortcuts', 'Keyboard: [Space] Play, [←/→] Steps, [R] Reset')}
          </span>
        </div>
      </section>
      {/* 4. Current Step Narrative Banner */}
      <div
        ref={descriptionRef}
        className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start space-x-3 shadow-xs min-h-[72px]"
      >
        <div className="p-1.5 bg-primary/20 rounded-lg text-primary shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {t(currentStep.titleKey, currentStep.titleDefault)}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              {currentStep.badgeText}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(currentStep.descriptionKey, currentStep.descriptionDefault)}
          </p>
        </div>
      </div>

      {/* 5. Side-by-Side Dual Code Panes with Animated Bridge */}
      <section
        ref={fileContainerRef}
        aria-label="Participating Source Code Files"
        className="relative grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Caller / Source File */}
        <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          {/* File Header */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 bg-secondary/60 border-b border-border min-h-[52px]">
            <div className="flex items-center space-x-2 min-w-0 flex-1 truncate mr-2">
              <span className="text-xs font-bold text-foreground font-mono truncate">
                {currentStep.sourceFileSnippet.fileName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono hidden md:inline truncate">
                ({currentStep.sourceFileSnippet.filePath})
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0 text-right min-w-[120px] sm:min-w-[140px]">
              <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold whitespace-nowrap', getThreadBadgeClasses(currentStep.sourceFileSnippet.threadType))}>
                {parsedSourceThread.threadName}
              </span>
              {parsedSourceThread.helperText && (
                <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap mt-1 px-1.5 py-0.5 rounded bg-secondary/80 border border-border/70">
                  [{parsedSourceThread.helperText}]
                </span>
              )}
            </div>
          </div>

          {/* Active Function Callout */}
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/50 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                {t('arch.callerFile', 'Caller Function')}:
              </span>
              <code className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {currentStep.sourceFileSnippet.activeFunction}
              </code>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              Lines {currentStep.sourceFileSnippet.activeLines[0]}–{currentStep.sourceFileSnippet.activeLines[1]}
            </span>
          </div>

          {/* Source Code Content */}
          <div
            tabIndex={0}
            role="region"
            aria-label={`${currentStep.sourceFileSnippet.fileName} code preview`}
            className="p-4 bg-black/60 font-mono text-xs overflow-x-auto custom-scrollbar flex-1"
          >
            <pre className="text-slate-200 leading-relaxed">
              {currentStep.sourceFileSnippet.code.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const [start, end] = currentStep.sourceFileSnippet.activeLines;
                const isHighlight = lineNum >= start && lineNum <= end;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center px-2 py-0.5 rounded transition-all duration-300',
                      isHighlight
                        ? 'bg-indigo-950/60 border-l-2 border-indigo-400 text-indigo-100 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'opacity-40 text-slate-400'
                    )}
                  >
                    <span className="w-8 shrink-0 text-slate-600 select-none text-[10px]">
                      {lineNum}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Callee / Destination File (or Single Card if self-contained) */}
        {currentStep.targetFileSnippet ? (
          <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs relative">
            {/* File Header */}
            <div className="flex items-center justify-between p-3 sm:p-3.5 bg-secondary/60 border-b border-border min-h-[52px]">
              <div className="flex items-center space-x-2 min-w-0 flex-1 truncate mr-2">
                <span className="text-xs font-bold text-foreground font-mono truncate">
                  {currentStep.targetFileSnippet.fileName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono hidden md:inline truncate">
                  ({currentStep.targetFileSnippet.filePath})
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0 text-right min-w-[120px] sm:min-w-[140px]">
                <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold whitespace-nowrap', getThreadBadgeClasses(currentStep.targetFileSnippet.threadType))}>
                  {parsedTargetThread?.threadName}
                </span>
                {parsedTargetThread?.helperText && (
                  <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap mt-1 px-1.5 py-0.5 rounded bg-secondary/80 border border-border/70">
                    [{parsedTargetThread.helperText}]
                  </span>
                )}
              </div>
            </div>

            {/* Active Function Callout */}
            <div className="px-4 py-2 bg-secondary/20 border-b border-border/50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t('arch.calleeFile', 'Callee Handler')}:
                </span>
                <code className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {currentStep.targetFileSnippet.activeFunction}
                </code>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Lines {currentStep.targetFileSnippet.activeLines[0]}–{currentStep.targetFileSnippet.activeLines[1]}
              </span>
            </div>

            {/* Target Code Content */}
            <div
              tabIndex={0}
              role="region"
              aria-label={`${currentStep.targetFileSnippet.fileName} code preview`}
              className="p-4 bg-black/60 font-mono text-xs overflow-x-auto custom-scrollbar flex-1"
            >
              <pre className="text-slate-200 leading-relaxed">
                {currentStep.targetFileSnippet.code.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const [start, end] = currentStep.targetFileSnippet?.activeLines || [0, 0];
                  const isHighlight = lineNum >= start && lineNum <= end;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center px-2 py-0.5 rounded transition-all duration-300',
                        isHighlight
                          ? 'bg-emerald-950/60 border-l-2 border-emerald-400 text-emerald-100 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'opacity-40 text-slate-400'
                      )}
                    >
                      <span className="w-8 shrink-0 text-slate-600 select-none text-[10px]">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre">{line}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        ) : (
          /* Single Card Mode (Evaluator internal view) */
          <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs p-6 justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Internal Execution & Guard Isolation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This stage operates strictly inside the isolated worker environment without requiring an external receiver.
                Parameters remain contained in memory and AST nodes are scanned before execution.
              </p>
            </div>

            <div className="p-4 bg-secondary/50 border border-border rounded-xl space-y-2 text-xs">
              <span className="text-[11px] font-bold text-foreground">Guaranteed Invariants at this stage:</span>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>Zero network leakage: Ambient sockets, fetch, and storage remain disabled.</li>
                <li>Bounded stream output: Standard output is capped to avoid browser memory saturation.</li>
                <li>CPU limits enforced: 10s watchdog protects against non-terminating AST blocks.</li>
              </ul>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/60">
              Context: {currentStep.sourceFileSnippet.threadLabel}
            </div>
          </div>
        )}
      </section>

      {/* 6. Runtime Payload & Security Invariant Inspector */}
      {currentStep.payloadInspector && (
        <section aria-labelledby="payload-inspector-heading" className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-primary" aria-hidden="true" />
              <h3 id="payload-inspector-heading" className="text-sm font-bold text-foreground">
                {t('arch.payload', 'Runtime Data Payload')}: {currentStep.payloadInspector.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
              <span>{t('arch.thread', 'Context')}:</span>
              <span className="px-2 py-0.5 rounded bg-secondary border border-border font-bold text-foreground">
                {currentStep.payloadInspector.direction}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payload JSON View */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Serialized Message Payload:
              </span>
              <div
                tabIndex={0}
                role="region"
                aria-label="Serialized message payload JSON"
                className="p-3.5 bg-black/60 border border-border rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto custom-scrollbar max-h-48"
              >
                <pre>{typeof currentStep.payloadInspector.payload === 'string'
                  ? currentStep.payloadInspector.payload
                  : JSON.stringify(currentStep.payloadInspector.payload, null, 2)}</pre>
              </div>
            </div>

            {/* Architectural & Security Notes */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>{t('arch.securityNotes', 'Architectural & Security Invariants')}:</span>
              </span>
              <div
                tabIndex={0}
                role="region"
                aria-label="Architectural and security invariants list"
                className="p-3.5 bg-secondary/30 border border-border rounded-xl space-y-2 text-xs text-muted-foreground max-h-48 overflow-y-auto custom-scrollbar"
              >
                {currentStep.payloadInspector.securityNotes && currentStep.payloadInspector.securityNotes.length > 0 ? (
                  <ul className="space-y-2">
                    {currentStep.payloadInspector.securityNotes.map((note, nIdx) => (
                      <li key={nIdx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="leading-relaxed">{note}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center space-x-2 text-muted-foreground italic">
                    <Info className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>State transitions strictly maintain data integrity across boundaries.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
