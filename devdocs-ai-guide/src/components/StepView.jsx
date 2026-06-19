import { CheckCircle, Circle, Loader, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';
import { useSteps } from '../hooks/useSteps';
import MarkdownRenderer from './MarkdownRenderer';

const StepView = () => {
  const { stepKey } = useParams();
  const { getStepContent, updateStepProgress, phases } = useSteps();
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const debouncedNotes = useDebounce(notes, 500);

  const currentStepFromPhases = phases
    .flatMap(p => p.steps)
    .find(s => s.step_key === stepKey);

  const [status, setStatus] = useState(currentStepFromPhases?.status || 'not_started');

  useEffect(() => {
    const fetchStep = async () => {
      setLoading(true);
      const stepData = await getStepContent(stepKey);
      setStep(stepData);
      setNotes(currentStepFromPhases?.notes || '');
      setStatus(currentStepFromPhases?.status || 'not_started');
      setLoading(false);
    };
    fetchStep();
  }, [stepKey, getStepContent, currentStepFromPhases]);

  useEffect(() => {
    if (debouncedNotes !== (currentStepFromPhases?.notes || '')) {
      updateStepProgress(stepKey, status, debouncedNotes);
    }
  }, [debouncedNotes, stepKey, status, updateStepProgress, currentStepFromPhases]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    updateStepProgress(stepKey, newStatus, notes);
  };

  if (loading || !step) {
    return <div className="flex items-center justify-center h-full"><Loader className="animate-spin w-12 h-12" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-primary">{step.title}</h1>
      
      <div className="flex items-center space-x-8 mb-8">
        <div className="font-semibold">Status:</div>
        <div className="flex items-center space-x-4">
          <button onClick={() => handleStatusChange('not_started')} className="flex items-center space-x-2">
            <Circle className={cn('w-5 h-5', status === 'not_started' ? 'text-primary' : 'text-muted-foreground')} />
            <span>Not Started</span>
          </button>
          <button onClick={() => handleStatusChange('in_progress')} className="flex items-center space-x-2">
            <Radio className={cn('w-5 h-5', status === 'in_progress' ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
            <span>In Progress</span>
          </button>
          <button onClick={() => handleStatusChange('completed')} className="flex items-center space-x-2">
            <CheckCircle className={cn('w-5 h-5', status === 'completed' ? 'text-accent' : 'text-muted-foreground')} />
            <span>Completed</span>
          </button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-code:bg-secondary prose-code:p-1 prose-code:rounded">
        <MarkdownRenderer markdown={step.content} />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Your Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down your thoughts, learnings, or any issues you encountered..."
          className="w-full h-48 p-4 bg-secondary/50 rounded-md border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
        />
      </div>
    </div>
  );
};

export default StepView;
