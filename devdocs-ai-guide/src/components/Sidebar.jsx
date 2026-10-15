import * as Collapsible from '@radix-ui/react-collapsible';
import { CheckCircle2, ChevronRight, Circle, Search, Sparkles, BookOpen, Layers, X, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { useSteps } from '../hooks/useSteps';
import { cn } from '../lib/utils';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { phases, loading, stats } = useSteps();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Extract current stepKey reliably from location.pathname (e.g., /steps/project-setup)
  const currentStepKey = location.pathname.startsWith('/steps/')
    ? location.pathname.replace('/steps/', '')
    : 'project-setup';

  if (loading) {
    return (
      <aside className="w-80 bg-card border-r border-border p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </aside>
    );
  }

  // Filter steps if user typed a search query (memoized for instant keystroke rendering)
  const queryLower = searchQuery.toLowerCase().trim();
  const filteredPhases = useMemo(() => {
    return phases.map(phase => {
      if (!queryLower) return phase;
      const matchingSteps = phase.steps.filter(step =>
        step.title.toLowerCase().includes(queryLower) ||
        step.step_key.toLowerCase().includes(queryLower)
      );
      return {
        ...phase,
        steps: matchingSteps
      };
    }).filter(phase => !queryLower || phase.steps.length > 0);
  }, [phases, queryLower]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'w-80 bg-card/95 backdrop-blur-md border-r border-border flex flex-col h-screen fixed lg:static top-0 left-0 z-50 transition-transform duration-300 ease-in-out',
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
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-[0.01em] text-foreground">RAG Teacher</span>
              <span className="block text-[10px] uppercase tracking-wider text-primary font-semibold">DevDocs AI Curriculum</span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen?.(false)}
            aria-label="Close navigation"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border/70">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 28 RAG topics..."
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 rounded-lg text-xs placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all tracking-[0.01em]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Navigation Phase List */}
        <nav aria-label="Curriculum Modules" className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {filteredPhases.map((phase) => {
            const completedCount = phase.steps.filter(s => s.status === 'completed').length;
            const isPhaseActive = phase.steps.some(s => s.step_key === currentStepKey);

            return (
              <Collapsible.Root key={phase.id} defaultOpen={isPhaseActive || !queryLower}>
                <Collapsible.Trigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 text-left transition-colors group cursor-pointer">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-semibold text-foreground tracking-[0.01em] group-hover:text-primary transition-colors">
                      {phase.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {completedCount} / {phase.steps.length} completed
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground transform transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                </Collapsible.Trigger>

                <Collapsible.Content className="collapsible-animated-content">
                  <div className="pt-1.5 pb-1 ml-2 pl-2 border-l border-border/80 space-y-1">
                    {phase.steps.map((step) => {
                      const isActive = step.step_key === currentStepKey;
                      const isCompleted = step.status === 'completed';
                      const isInProgress = step.status === 'in_progress';

                      return (
                        <Link
                          key={step.step_key}
                          to={`/steps/${step.step_key}`}
                          onClick={() => setIsMobileOpen?.(false)}
                          className={cn(
                            'flex items-center space-x-2.5 py-1.5 px-2 rounded-md text-xs transition-all relative',
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary-foreground' : 'text-emerald-400')} />
                          ) : isInProgress ? (
                            <span className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', isActive ? 'bg-primary-foreground' : 'bg-amber-400')} />
                          ) : (
                            <Circle className={cn('w-3 h-3 shrink-0 opacity-40', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                          )}
                          <span className="truncate">{step.title}</span>
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
              No topics matching &quot;{searchQuery}&quot;
            </div>
          )}
        </nav>

        {/* Footer Summary */}
        <div className="p-3 border-t border-border bg-card/60 text-xs text-muted-foreground">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium text-foreground">Overall Mastery</span>
            <span className="font-bold text-primary">{stats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
