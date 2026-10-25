import * as Collapsible from '@radix-ui/react-collapsible';
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Search,
  Layers,
  X,
  HelpCircle,
  Compass,
  Terminal,
  Award,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { useSteps } from '../hooks/useSteps';
import { useSandboxActions } from '../context/SandboxContext';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';
import type { Phase, Step } from '../types';

export interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onOpenSearch?: () => void;
  onOpenVectorSandbox?: () => void;
  onOpenPythonSandbox?: () => void;
}

const Sidebar = ({
  isMobileOpen,
  setIsMobileOpen,
  onOpenSearch,
  onOpenVectorSandbox: onOpenVectorProp,
  onOpenPythonSandbox: onOpenPythonProp,
}: SidebarProps): React.JSX.Element => {
  const { phases, stats } = useSteps();
  const { openPythonSandbox, openVectorSandbox } = useSandboxActions();
  const { t } = useI18n();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleOpenPython = onOpenPythonProp ?? (() => openPythonSandbox(null));
  const handleOpenVector = onOpenVectorProp ?? openVectorSandbox;

  // Body scroll lock on mobile drawer open
  useEffect(() => {
    if (isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileOpen]);

  // Extract current stepKey reliably from location.pathname (e.g., /steps/project-setup)
  const currentStepKey = location.pathname.startsWith('/steps/')
    ? location.pathname.replace('/steps/', '')
    : 'project-setup';

  // Filter steps if user typed a search query (memoized for instant keystroke rendering)
  const queryLower = searchQuery.toLowerCase().trim();
  const filteredPhases: Phase[] = useMemo(() => {
    return phases.map((phase: Phase) => {
      if (!queryLower) return phase;
      const matchingSteps = phase.steps.filter((step: Step) =>
        step.title.toLowerCase().includes(queryLower) ||
        step.step_key.toLowerCase().includes(queryLower)
      );
      return {
        ...phase,
        steps: matchingSteps,
      };
    }).filter((phase: Phase) => !queryLower || phase.steps.length > 0);
  }, [phases, queryLower]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={() => setIsMobileOpen?.(false)}
          className="no-print fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        id="curriculum-sidebar"
        role={isMobileOpen ? 'dialog' : undefined}
        aria-modal={isMobileOpen ? 'true' : undefined}
        aria-label="Navigation drawer"
        className={cn(
          'no-print w-80 bg-card/95 backdrop-blur-md border-r border-border flex flex-col h-screen fixed lg:static top-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link
            to="/"
            onClick={() => setIsMobileOpen?.(false)}
            className="flex items-center space-x-2.5 text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary" aria-hidden="true">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-[0.01em] text-foreground">RAG Teacher</span>
              <span className="block text-[10px] uppercase tracking-wider text-primary font-semibold">DevDocs AI Curriculum</span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen?.(false)}
            aria-label={t('common.close', 'Close')}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border/70">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder={t('sidebar.searchPlaceholder', 'Search 28 RAG topics...')}
              aria-label="Search curriculum topics"
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 rounded-lg text-xs placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all tracking-[0.01em]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
              >
                ✕
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSearch}
                title="Open Spotlight Search (⌘K)"
                aria-label="Open Spotlight Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-secondary/80 hover:bg-secondary px-1.5 py-0.5 rounded border border-border/80 font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                ⌘K
              </button>
            )}
          </div>
        </div>

        {/* Quick Hub Links */}
        <div className="p-2.5 border-b border-border/70 space-y-1">
          <Link
            to="/interview-questions"
            onClick={() => setIsMobileOpen?.(false)}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
              location.pathname === '/interview-questions'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <div className="flex items-center space-x-2.5">
              <HelpCircle className={cn('w-4 h-4', location.pathname === '/interview-questions' ? 'text-primary-foreground' : 'text-primary')} />
              <span>{t('nav.interview', 'Interview Questions')}</span>
            </div>
            <span className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
              location.pathname === '/interview-questions'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-primary/10 text-primary'
            )}>
              28
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsMobileOpen?.(false);
              handleOpenPython();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <Terminal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{t('nav.pythonLab', 'Python RAG Sandbox')}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono">
              Pyodide
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileOpen?.(false);
              handleOpenVector();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-indigo-400 group-hover:rotate-45 transition-transform" />
              <span>{t('nav.vectorSandbox', 'Vector Sandbox')}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary border border-border text-muted-foreground font-mono">
              2D Math
            </span>
          </button>
        </div>

        {/* Navigation Phase List */}
        <nav aria-label="Curriculum Modules" className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {filteredPhases.map((phase: Phase) => {
            const completedCount = phase.steps.filter((s: Step) => s.status === 'completed').length;
            const isPhaseActive = phase.steps.some((s: Step) => s.step_key === currentStepKey);

            return (
              <Collapsible.Root key={phase.id} defaultOpen={isPhaseActive || !queryLower}>
                <Collapsible.Trigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 text-left transition-colors group cursor-pointer">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-semibold text-foreground tracking-[0.01em] group-hover:text-primary transition-colors">
                      {phase.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {completedCount} / {phase.steps.length} {t('sidebar.completed', 'completed')}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground transform transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                </Collapsible.Trigger>

                <Collapsible.Content className="collapsible-animated-content">
                  <div className="pt-1.5 pb-1 ml-2 pl-2 border-l border-border/80 space-y-1">
                    {phase.steps.map((step: Step) => {
                      const isActive = step.step_key === currentStepKey;
                      const isCompleted = step.status === 'completed';
                      const isInProgress = step.status === 'in_progress';
                      const statusLabel = isCompleted
                        ? t('stepView.completed', 'Completed')
                        : isInProgress
                        ? t('stepView.inProgress', 'In Progress')
                        : t('stepView.notStarted', 'Not Started');

                      return (
                        <Link
                          key={step.step_key}
                          to={`/steps/${step.step_key}`}
                          onClick={() => setIsMobileOpen?.(false)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex items-center space-x-2.5 py-1.5 px-2 rounded-md text-xs transition-all relative',
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 aria-hidden="true" className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary-foreground' : 'text-emerald-400')} />
                          ) : isInProgress ? (
                            <span aria-hidden="true" className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', isActive ? 'bg-primary-foreground' : 'bg-amber-400')} />
                          ) : (
                            <Circle aria-hidden="true" className={cn('w-3 h-3 shrink-0 opacity-40', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                          )}
                          <span className="truncate">{step.title}</span>
                          <span className="sr-only"> ({statusLabel})</span>
                        </Link>
                      );
                    })}
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            );
          })}

          {filteredPhases.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {t('sidebar.noTopics', 'No topics matching "{query}"').replace('{query}', searchQuery)}
            </div>
          )}
        </nav>

        {/* Footer Summary */}
        <div className="p-3 border-t border-border bg-card/60 text-xs text-muted-foreground space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground">{t('sidebar.overallMastery', 'Overall Mastery')}</span>
              <span className="font-bold text-primary">{stats.completionPercentage}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Overall curriculum mastery progress"
              aria-valuenow={stats.completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${stats.completionPercentage}% completed`}
              className="w-full bg-secondary h-1.5 rounded-full overflow-hidden"
            >
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('sidebar.comprehensionScore', 'Comprehension Score')}</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {stats.comprehensionScore !== null
                ? `${stats.comprehensionScore}% (${stats.correctQuizQuestions}/${stats.answeredQuizQuestions})`
                : '—'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
