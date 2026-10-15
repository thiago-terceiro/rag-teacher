import { CheckCircle2, Circle, Clock, ArrowLeft, ArrowRight, BookOpen, Sparkles, Check, Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';
import { useSteps } from '../hooks/useSteps';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '../lib/utils';
import { getNextStep, getPrevStep, allSteps } from '../data/guideData';

const StepView = () => {
  const { stepKey } = useParams();
  const navigate = useNavigate();
  const { getStepContent, updateStepProgress, phases } = useSteps();
  
  const [step, setStep] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const debouncedNotes = useDebounce(notes, 500);

  // Find step in current phases state to get latest status and notes
  const currentStepFromPhases = phases
    .flatMap(p => p.steps)
    .find(s => s.step_key === stepKey);

  const currentPhase = phases.find(p => p.steps.some(s => s.step_key === stepKey));
  const stepIndex = allSteps.findIndex(s => s.step_key === stepKey) + 1;
  const nextStep = getNextStep(stepKey);
  const prevStep = getPrevStep(stepKey);

  const status = currentStepFromPhases?.status || 'not_started';

  useEffect(() => {
    const stepData = getStepContent(stepKey);
    if (!stepData && allSteps.length > 0) {
      navigate(`/steps/${allSteps[0].step_key}`, { replace: true });
      return;
    }
    setStep(stepData);
    setNotes(currentStepFromPhases?.notes || '');
    // Scroll container to top on step switch
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stepKey, getStepContent, currentStepFromPhases?.notes, navigate]);

  // Handle auto-saving debounced notes
  useEffect(() => {
    if (debouncedNotes !== (currentStepFromPhases?.notes || '')) {
      setSaveStatus('saving');
      updateStepProgress(stepKey, status, debouncedNotes);
      const timer = setTimeout(() => setSaveStatus('saved'), 600);
      return () => clearTimeout(timer);
    }
  }, [debouncedNotes, stepKey, status, updateStepProgress, currentStepFromPhases?.notes]);

  const handleStatusChange = (newStatus) => {
    updateStepProgress(stepKey, newStatus, notes);
  };

  if (!step) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  return (
    <div key={stepKey} className="max-w-4xl mx-auto pb-16 animate-step-enter relative">
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

      {/* Main Content */}
      <div className="prose prose-invert max-w-none">
        <MarkdownRenderer markdown={step.content} />
      </div>

      {/* Notes & Learning Journal Section */}
      <div className="mt-14 pt-8 border-t border-border/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-foreground">Your Notes & Code Log</h3>
            <span className="text-xs text-muted-foreground">(Persisted locally)</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center space-x-1">
            {saveStatus === 'saving' ? (
              <span className="text-amber-400">Saving...</span>
            ) : (
              <span className="text-emerald-400 flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Log key insights, terminal outputs, or design decisions for this step..."
          className="w-full h-36 p-3.5 bg-secondary/40 text-foreground placeholder:text-muted-foreground/60 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all text-sm font-sans"
        />
      </div>

      {/* Next / Previous Navigation Controls */}
      <nav aria-label="Step Navigation" className="mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {prevStep ? (
          <Link
            to={`/steps/${prevStep.step_key}`}
            viewTransition
            className="w-full sm:w-auto flex items-center space-x-3 px-4 py-3 rounded-xl border border-border/80 bg-card/70 hover:bg-secondary/90 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] text-foreground transition-all duration-200 active:scale-[0.99] group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1.5 transition-transform duration-200" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Previous Step</div>
              <div className="text-sm font-medium line-clamp-1">{prevStep.title}</div>
            </div>
          </Link>
        ) : <div className="hidden sm:block" />}

        {nextStep ? (
          <Link
            to={`/steps/${nextStep.step_key}`}
            viewTransition
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start space-x-3 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all duration-200 active:scale-[0.99] shadow-md group ml-auto cursor-pointer"
          >
            <div className="text-right">
              <div className="text-xs text-primary-foreground/80 uppercase tracking-wider font-medium">Next Step</div>
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

export default StepView;
