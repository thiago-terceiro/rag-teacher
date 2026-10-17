import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Compass,
  HelpCircle,
  Sparkles,
  Printer,
  Terminal,
} from 'lucide-react';
import React, { useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSteps } from '../hooks/useSteps';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { interviewQuestions } from '../data/interviewQuestionsData';
import MarkdownRenderer from './MarkdownRenderer';
import NotesJournal from './NotesJournal';
import ModuleQuiz from './ModuleQuiz';
import { TableOfContentsDesktop, TableOfContentsMobile } from './TableOfContents';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { scrollToHeading } from '../lib/headings';
import { cn } from '../lib/utils';
import { getNextStep, getPrevStep, allSteps, getStepByKey } from '../data/guideData';
import ChunkingCalculator from './ChunkingCalculator';
import RRFSimulator from './RRFSimulator';

const StepView = ({ onOpenVectorSandbox, onOpenPythonSandbox }) => {
  const { stepKey } = useParams();
  const navigate = useNavigate();
  const { updateStepProgress, phases } = useSteps();
  const { settings } = useReadingSettings();

  // Instant synchronous lookup (0ms latency, zero spinner flash)
  const step = getStepByKey(stepKey) || allSteps[0];
  const stepInterview = interviewQuestions.find(q => q.step_key === stepKey);

  // Find step in current phases state to get latest status and notes
  const currentStepFromPhases = phases
    .flatMap(p => p.steps)
    .find(s => s.step_key === stepKey);

  const currentPhase = phases.find(p => p.steps.some(s => s.step_key === stepKey));
  const stepIndex = allSteps.findIndex(s => s.step_key === stepKey) + 1;
  const nextStep = getNextStep(stepKey);
  const prevStep = getPrevStep(stepKey);

  const status = currentStepFromPhases?.status || 'not_started';
  const { headings } = useTableOfContents(step.content);
  const isLightTheme = settings.theme === 'daylight-paper';

  // On step change or hash change: honor #section deep link with smooth scroll and neon pulse highlight
  useEffect(() => {
    const handleHashNavigation = (smooth = false) => {
      const hashId = decodeURIComponent(window.location.hash.slice(1));
      if (hashId) {
        requestAnimationFrame(() => {
          const el = document.getElementById(hashId);
          if (el) {
            scrollToHeading(hashId, { smooth });
            // Clean up any existing pulse highlight
            document.querySelectorAll('.deep-link-target').forEach((node) => {
              node.classList.remove('deep-link-target');
            });
            // Apply neon pulse highlight to target element
            el.classList.add('deep-link-target');
            setTimeout(() => {
              el.classList.remove('deep-link-target');
            }, 3000);
          }
        });
        return true;
      }
      return false;
    };

    if (!handleHashNavigation(false)) {
      const container = document.getElementById('main-scroll-container');
      if (container) {
        container.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    const onHashChange = () => handleHashNavigation(true);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
    <div key={stepKey} className={cn("mx-auto flex justify-center items-start gap-6 xl:gap-8 transition-all duration-200 w-full max-w-full min-w-0 overflow-x-hidden", settings.contentWidth === 'wide' ? 'max-w-[90rem]' : 'max-w-7xl')}>
      <article className={cn("relative w-full max-w-full min-w-0 pb-16 transition-all duration-200", settings.contentWidth === 'wide' ? 'max-w-5xl' : 'max-w-4xl')}>
        {/* React 19 Native Document Metadata Hoisting */}
        <title>{`${step.title} — RAG Teacher`}</title>
        <meta
          name="description"
          content={`Step ${stepIndex} of ${allSteps.length}: ${step.title}. Masterclass for production-grade RAG and Agentic systems.`}
        />

        {/* Print-only PDF Handbook Chapter Header */}
        <div className="hidden print:block border-b border-slate-300 pb-3 mb-6 text-xs text-slate-600">
          <div className="font-bold text-slate-900 uppercase tracking-wider">
            RAG Teacher Masterclass — Production AI Engineering Handbook
          </div>
          <div className="mt-0.5">
            {currentPhase?.title} • Module {stepIndex} of {allSteps.length} ({step.readTime || '15 min'} read)
          </div>
        </div>

        {/* Ambient Aura Background Glow (Linear/Vercel style) */}
        <div className={cn("no-print absolute -top-10 left-1/2 -translate-x-1/2 w-full h-80 bg-gradient-to-b from-primary/15 via-indigo-500/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full transform-gpu will-change-transform", settings.contentWidth === 'wide' ? 'max-w-5xl' : 'max-w-4xl')} />

        {/* Breadcrumb / Phase Banner */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground mb-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold tracking-wide shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center space-x-1.5 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>{currentPhase?.title?.split(':')[0] || 'Curriculum'}</span>
            </span>
            <span>•</span>
            <span>Step {stepIndex} of {allSteps.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {step.readTime && (
              <div className="flex items-center space-x-1.5 text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full border border-border/50">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{step.readTime} read</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              title="Export this module as a clean PDF chapter"
              className="flex items-center space-x-1.5 text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary px-2.5 py-1 rounded-full border border-border/60 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-[0.01em] leading-snug break-words">
          {step.title}
        </h1>
        
        {/* Status Bar Card with Ambient Glassmorphism & Gradient Border */}
        <div className="no-print p-4 mb-8 rounded-xl bg-card/85 backdrop-blur-md border border-border/80 shadow-sm hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] hover:border-primary/40 transition-all duration-300 relative overflow-hidden group flex flex-wrap items-center justify-between gap-4">
          {/* Iridescent top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Your Learning Status:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

            <button
              type="button"
              onClick={onOpenPythonSandbox}
              title="Launch In-Browser Pyodide Python Sandbox"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Python Lab</span>
            </button>
          </div>
        </div>

        {/* Interactive Chunking Simulator for Steps 4, 5, 6 */}
        {(stepKey === 'chunking-fixed-size' || stepKey === 'chunking-semantic' || stepKey === 'chunking-hierarchical') && (
          <div className="no-print">
            <ChunkingCalculator />
          </div>
        )}

        {/* Interactive Reciprocal Rank Fusion (RRF) Simulator for Step 19 */}
        {stepKey === 'agent-tool-doc-search' && (
          <div className="no-print">
            <RRFSimulator />
          </div>
        )}

        {/* Interactive Vector Distance Sandbox Banner (for Vector/Dense retrieval steps) */}
        {(stepKey === 'dense-retrieval' || stepKey === 'vector-database-ann' || stepKey === 'qdrant-setup') && (
          <div className="no-print mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-primary/10 border border-indigo-500/30 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Interactive 2D Vector Distance Sandbox</div>
                <div className="text-xs text-muted-foreground mt-0.5">Drag vector handles in real-time to compute Cosine Similarity, Dot Product, and Euclidean (L2) distance.</div>
              </div>
            </div>
            <button
              onClick={onOpenVectorSandbox}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 flex items-center space-x-1.5 shadow-md cursor-pointer ml-auto"
            >
              <span>Launch Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* On-this-page panel (below xl; desktop rail renders beside the article) */}
        <div className="no-print">
          <TableOfContentsMobile headings={headings} />
        </div>

        {/* Main Content (Memoized against unnecessary re-renders) */}
        <div className={cn(
          "prose max-w-none transition-all duration-150",
          !isLightTheme && "prose-invert",
          `reading-size-${settings.fontSize || 'normal'}`,
          `reading-spacing-${settings.lineSpacing || 'relaxed'}`
        )}>
          <MarkdownRenderer markdown={step.content} />
        </div>

        {/* Interactive Module Knowledge Check (2-3 Scenario Questions) */}
        <ModuleQuiz
          stepKey={stepKey}
          status={status}
          onCompleteStep={handleStatusChange}
        />

        {/* Isolated Notes Journal Component */}
        <div className="no-print">
          <NotesJournal
            stepKey={stepKey}
            initialNotes={currentStepFromPhases?.notes}
            onSaveNotes={handleSaveNotes}
          />
        </div>

        {/* System Design Interview Challenge Card */}
        {stepInterview && (
          <section aria-label="System Design Interview Challenge" className="no-print mt-10 p-5 rounded-2xl bg-card/90 border border-border/80 hover:border-primary/40 shadow-sm transition-all duration-200 relative overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>System Design Interview Challenge</span>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {stepInterview.track || stepInterview.company || 'System Architecture'}
              </span>
            </div>

            <p className="text-sm text-foreground/90 font-medium mb-4 leading-relaxed">
              {stepInterview.question}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Benchmark architecture solution with failure modes & latency budgets</span>
              </div>
              <Link
                to="/interview-questions"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Practice in Interview Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Next / Previous Navigation Controls with React Router v7 Native View Transitions */}
        <nav aria-label="Step Navigation" className="no-print mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              🎉 Curriculum Completed! You are now a Production RAG Master!
            </div>
          )}
        </nav>
      </article>

      {/* Desktop Sticky Rail (Table of Contents) */}
      <TableOfContentsDesktop headings={headings} />
    </div>
  );
};

export default React.memo(StepView);

