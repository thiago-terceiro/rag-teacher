import { CheckCircle2, Circle, Clock, ArrowLeft, ArrowRight, Bookmark } from 'lucide-react';
import React, { useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSteps } from '../hooks/useSteps';
import MarkdownRenderer from './MarkdownRenderer';
import NotesJournal from './NotesJournal';
import { cn } from '../lib/utils';
import { getNextStep, getPrevStep, allSteps, getStepByKey } from '../data/guideData';

const StepView = () => {
  const { stepKey } = useParams();
  const navigate = useNavigate();
  const { updateStepProgress, phases } = useSteps();

  // Instant synchronous lookup (0ms latency, zero spinner flash)
  const step = getStepByKey(stepKey) || allSteps[0];

  // Find step in current phases state to get latest status and notes
  const currentStepFromPhases = phases
    .flatMap(p => p.steps)
    .find(s => s.step_key === stepKey);

  const currentPhase = phases.find(p => p.steps.some(s => s.step_key === stepKey));
  const stepIndex = allSteps.findIndex(s => s.step_key === stepKey) + 1;
  const nextStep = getNextStep(stepKey);
  const prevStep = getPrevStep(stepKey);

  const status = currentStepFromPhases?.status || 'not_started';

  // Instant zero-cost scroll reset to top when switching steps
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stepKey]);

  // Keyboard navigation: Left/Right arrows to flip through steps
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input, textarea, or contentEditable
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isInput) return;

      if (e.key === 'ArrowRight' && nextStep) {
        navigate(`/steps/${nextStep.step_key}`);
      } else if (e.key === 'ArrowLeft' && prevStep) {
        navigate(`/steps/${prevStep.step_key}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep, navigate]);

  const handleStatusChange = useCallback((newStatus) => {
    updateStepProgress(stepKey, newStatus);
  }, [stepKey, updateStepProgress]);

  const handleSaveNotes = useCallback((key, newNotes) => {
    updateStepProgress(key, undefined, newNotes);
  }, [updateStepProgress]);

  return (
    <div key={stepKey} className="max-w-4xl mx-auto pb-16 relative">
      {/* React 19 Native Document Metadata Hoisting */}
      <title>{`${step.title} — RAG Teacher`}</title>
      <meta
        name="description"
        content={`Step ${stepIndex} of ${allSteps.length}: ${step.title}. Masterclass for production-grade RAG and Agentic systems.`}
      />

      {/* Ambient Aura Background Glow (Linear/Vercel style) */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-primary/15 via-indigo-500/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Breadcrumb / Phase Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground mb-4">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold tracking-wide shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center space-x-1.5 transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>{currentPhase?.title?.split(':')[0] || 'Curriculum'}</span>
          </span>
          <span>•</span>
          <span>Step {stepIndex} of {allSteps.length}</span>
        </div>
        {step.readTime && (
          <div className="flex items-center space-x-1.5 text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full border border-border/50">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{step.readTime} read</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-[0.01em] leading-snug">
        {step.title}
      </h1>
      
      {/* Status Bar Card with Ambient Glassmorphism & Gradient Border */}
      <div className="p-4 mb-8 rounded-xl bg-card/85 backdrop-blur-md border border-border/80 shadow-sm hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] hover:border-primary/40 transition-all duration-300 relative overflow-hidden group flex flex-wrap items-center justify-between gap-4">
        {/* Iridescent top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Your Learning Status:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleStatusChange('not_started')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95',
              status === 'not_started'
                ? 'bg-secondary text-foreground ring-1 ring-border font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Not Started</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('in_progress')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95',
              status === 'in_progress'
                ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>In Progress</span>
          </button>

          <button
            onClick={() => handleStatusChange('completed')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95',
              status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </button>
        </div>
      </div>

      {/* Main Content (Memoized against unnecessary re-renders) */}
      <div className="prose prose-invert max-w-none">
        <MarkdownRenderer markdown={step.content} />
      </div>

      {/* Isolated Notes Journal Component */}
      <NotesJournal
        stepKey={stepKey}
        initialNotes={currentStepFromPhases?.notes}
        onSaveNotes={handleSaveNotes}
      />

      {/* Next / Previous Navigation Controls with React Router v7 Native View Transitions */}
      <nav aria-label="Step Navigation" className="mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {prevStep ? (
          <Link
            to={`/steps/${prevStep.step_key}`}
            className="w-full sm:w-auto flex items-center space-x-3 px-4 py-3 rounded-xl border border-border/80 bg-card/70 hover:bg-secondary/90 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] text-foreground transition-all duration-200 active:scale-[0.99] group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1.5 transition-transform duration-200" />
            <div className="text-left">
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <span>Previous Step</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-secondary/80 rounded border border-border/60 text-[10px] text-muted-foreground font-mono">←</kbd>
              </div>
              <div className="text-sm font-medium line-clamp-1">{prevStep.title}</div>
            </div>
          </Link>
        ) : <div className="hidden sm:block" />}

        {nextStep ? (
          <Link
            to={`/steps/${nextStep.step_key}`}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start space-x-3 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all duration-200 active:scale-[0.99] shadow-md group ml-auto cursor-pointer"
          >
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1.5 text-xs text-primary-foreground/80 uppercase tracking-wider font-medium">
                <span>Next Step</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-primary-foreground/20 rounded border border-primary-foreground/30 text-[10px] text-primary-foreground font-mono">→</kbd>
              </div>
              <div className="text-sm font-bold line-clamp-1">{nextStep.title}</div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
          </Link>
        ) : (
          <div className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-center border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-in zoom-in-95 duration-300">
            🎉 Curriculum Completed! You are now a Staff RAG Master!
          </div>
        )}
      </nav>
    </div>
  );
};

export default React.memo(StepView);
