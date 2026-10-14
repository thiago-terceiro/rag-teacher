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
    // Scroll to top on step switch
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="max-w-4xl mx-auto pb-16">
      {/* Breadcrumb / Phase Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground mb-4">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold tracking-wide">
            {currentPhase?.title?.split(':')[0] || 'Curriculum'}
          </span>
          <span>•</span>
          <span>Step {stepIndex} of {allSteps.length}</span>
        </div>
        {step.readTime && (
          <div className="flex items-center space-x-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{step.readTime} read</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 tracking-tight leading-tight">
        {step.title}
      </h1>
      
      {/* Status Bar Card */}
      <div className="p-4 mb-8 rounded-xl bg-card border border-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Your Learning Status:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleStatusChange('not_started')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer',
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
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer',
              status === 'in_progress'
                ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 font-semibold'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>In Progress</span>
          </button>

          <button
            onClick={() => handleStatusChange('completed')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer',
              status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 font-semibold shadow-xs'
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
            className="w-full sm:w-auto flex items-center space-x-3 px-4 py-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/80 hover:border-primary/50 text-foreground transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-transform" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Previous Step</div>
              <div className="text-sm font-medium line-clamp-1">{prevStep.title}</div>
            </div>
          </Link>
        ) : <div className="hidden sm:block" />}

        {nextStep ? (
          <Link
            to={`/steps/${nextStep.step_key}`}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start space-x-3 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md group ml-auto"
          >
            <div className="text-right">
              <div className="text-xs text-primary-foreground/80 uppercase tracking-wider font-medium">Next Step</div>
              <div className="text-sm font-bold line-clamp-1">{nextStep.title}</div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-semibold text-center border border-emerald-500/30">
            🎉 Curriculum Completed! You are now a RAG Master!
          </div>
        )}
      </nav>
    </div>
  );
};

export default StepView;
