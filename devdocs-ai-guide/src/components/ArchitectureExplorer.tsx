import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Workflow,
  ShieldCheck,
  Terminal,
  Sparkles,
  Info,
  CheckCircle2,
  FileCode2,
  Radio,
  Zap,
} from 'lucide-react';
import { ARCHITECTURE_FLOWS, type ArchitectureFlow, type ArchitectureFlowStep } from '../data/architectureFlowsData';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';

export default function ArchitectureExplorer(): React.JSX.Element {
  const { t } = useI18n();
  const [selectedFlowId, setSelectedFlowId] = useState<string>(ARCHITECTURE_FLOWS[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x = 2600ms, 1.5x = 1800ms, 2x = 1200ms
  const [hasSimulatedClick, setHasSimulatedClick] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Active Flow object
  const activeFlow = useMemo<ArchitectureFlow>(() => {
    return ARCHITECTURE_FLOWS.find(f => f.id === selectedFlowId) || ARCHITECTURE_FLOWS[0];
  }, [selectedFlowId]);

  // Current Step object
  const currentStep = useMemo<ArchitectureFlowStep>(() => {
    return activeFlow.steps[currentStepIndex] || activeFlow.steps[0];
  }, [activeFlow, currentStepIndex]);

  // Handle flow switch
  const handleSelectFlow = useCallback((flowId: string) => {
    setSelectedFlowId(flowId);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setHasSimulatedClick(false);
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
    setHasSimulatedClick(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev && currentStepIndex === activeFlow.steps.length - 1) {
        setCurrentStepIndex(0);
      }
      return !prev;
    });
  }, [currentStepIndex, activeFlow.steps.length]);

  const handleSimulateClick = useCallback(() => {
    setHasSimulatedClick(true);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, []);

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

      {/* 1. Page Header & Flow Selector */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Workflow className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {t('arch.pageTitle', 'Architecture & Code Flow Explorer')}
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              Live Simulator
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {t('arch.pageSubtitle', 'Simulate application interactions to trace function calls, thread boundaries, and data payloads side-by-side.')}
          </p>
        </div>

        {/* Flow Switcher Dropdown */}
        <div className="flex items-center space-x-3 shrink-0">
          <label htmlFor="flow-selector" className="text-xs font-medium text-muted-foreground sr-only">
            {t('arch.selectFlow', 'Select Flow')}
          </label>
          <div className="relative">
            <select
              id="flow-selector"
              value={selectedFlowId}
              onChange={e => handleSelectFlow(e.target.value)}
              className="appearance-none bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold pl-3 pr-8 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors shadow-xs"
            >
              {ARCHITECTURE_FLOWS.map(flow => (
                <option key={flow.id} value={flow.id} className="bg-popover text-foreground">
                  {t(flow.titleKey, flow.titleDefault)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              ▼
            </div>
          </div>
        </div>
      </header>

      {/* 2. Flow Summary Banner & Interactive Trigger Simulator */}
      <section aria-labelledby="flow-trigger-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Flow Conceptual Overview & Mini-Map */}
        <div className="lg:col-span-2 p-5 bg-card border border-border rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                {t(activeFlow.categoryKey, activeFlow.categoryDefault)}
              </span>
              <h2 id="flow-trigger-heading" className="text-base font-bold text-foreground">
                {t(activeFlow.titleKey, activeFlow.titleDefault)}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(activeFlow.summaryKey, activeFlow.summaryDefault)}
            </p>
          </div>

          {/* Interactive Pipeline Stages Mini-Map */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>{t('arch.pipelineProgress', 'Pipeline Progress')}</span>
              <span className="font-mono text-primary">
                {currentStep.stageName}
              </span>
            </div>
            <div
              tabIndex={0}
              role="tablist"
              aria-label="Pipeline Stages"
              className="flex sm:grid sm:grid-cols-5 gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar focus:outline-hidden focus:ring-1 focus:ring-primary/30"
            >
              {activeFlow.steps.map((s, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                const cleanStageName = s.stageName.includes('. ') ? s.stageName.split('. ')[1] : s.stageName;
                return (
                  <button
                    key={s.stepId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-lg text-xs font-mono transition-all cursor-pointer border shrink-0 sm:shrink min-w-[130px] sm:min-w-0',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold ring-2 ring-primary/30'
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary'
                    )}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      {isPassed && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
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
        </div>

        {/* Right 1 Col: Simulated Action Launcher */}
        <div className="p-5 bg-gradient-to-br from-card to-secondary/30 border border-border rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-primary animate-pulse" aria-hidden="true" />
                <span>{t('arch.simulatedUI', 'Simulated UI Interaction')}</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {activeFlow.mockUI.componentName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeFlow.mockUI.description}
            </p>
          </div>

          {activeFlow.mockUI.sampleInput && (
            <div
              tabIndex={0}
              role="region"
              aria-label="Sample UI input code"
              className="p-2.5 bg-black/40 border border-border/80 rounded-xl font-mono text-[11px] text-emerald-300/90 overflow-x-auto whitespace-pre custom-scrollbar max-h-20"
            >
              {activeFlow.mockUI.sampleInput}
            </div>
          )}

          <button
            type="button"
            onClick={handleSimulateClick}
            className={cn(
              'w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md',
              hasSimulatedClick && isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-black animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20'
            )}
          >
            <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>{t(activeFlow.triggerButtonLabel, activeFlow.triggerButtonLabel)}</span>
          </button>
        </div>
      </section>

      {/* 3. Player Stepper Controls Bar */}
      <section aria-label="Playback Controls" className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2">
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to beginning [R]"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">{t('arch.reset', 'Reset')}</span>
          </button>

          {/* Previous Step */}
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            title="Previous step [←]"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">{t('arch.prevStep', 'Previous Step')}</span>
          </button>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={handleTogglePlay}
            title="Play / Pause simulation [Space]"
            className="flex items-center space-x-1.5 px-3 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>{t('arch.pause', 'Pause')}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>{t('arch.play', 'Auto Play')}</span>
              </>
            )}
          </button>

          {/* Next Step */}
          <button
            type="button"
            onClick={handleNextStep}
            disabled={currentStepIndex === activeFlow.steps.length - 1}
            title="Next step [→]"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">{t('arch.nextStep', 'Next Step')}</span>
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-border">
            {[1, 1.5, 2].map(speed => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  'text-[10px] font-mono px-2 py-1 rounded-md transition-colors cursor-pointer',
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

        {/* Step Badge & Current Action */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-muted-foreground hidden md:inline">
            {t('arch.keyboardShortcuts', 'Keyboard: [Space] Play/Pause, [←/→] Steps, [R] Reset')}
          </span>
          <div className="flex items-center space-x-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border text-xs font-mono">
            <span className="text-primary font-bold">
              {t('arch.step', 'Step')} {currentStep.stepNumber} / {currentStep.totalSteps}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Current Step Narrative Banner */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start space-x-3 shadow-xs">
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
      <section aria-label="Participating Source Code Files" className="relative grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Caller / Source File */}
        <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          {/* File Header */}
          <div className="flex items-center justify-between p-3.5 bg-secondary/60 border-b border-border">
            <div className="flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-xs font-bold text-foreground font-mono">
                {currentStep.sourceFileSnippet.fileName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                ({currentStep.sourceFileSnippet.filePath})
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold', getThreadBadgeClasses(currentStep.sourceFileSnippet.threadType))}>
                {currentStep.sourceFileSnippet.threadLabel}
              </span>
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
            <div className="flex items-center justify-between p-3.5 bg-secondary/60 border-b border-border">
              <div className="flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-xs font-bold text-foreground font-mono">
                  {currentStep.targetFileSnippet.fileName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                  ({currentStep.targetFileSnippet.filePath})
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold', getThreadBadgeClasses(currentStep.targetFileSnippet.threadType))}>
                  {currentStep.targetFileSnippet.threadLabel}
                </span>
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
