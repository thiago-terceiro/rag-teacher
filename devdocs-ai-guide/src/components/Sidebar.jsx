import * as Collapsible from '@radix-ui/react-collapsible';
import { CheckCircle, ChevronRight, Circle, Loader } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSteps } from '../hooks/useSteps';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const { phases, loading } = useSteps();
  const { stepKey } = useParams();

  if (loading) {
    return <aside className="w-80 bg-secondary/30 p-4 flex items-center justify-center"><Loader className="animate-spin" /></aside>;
  }

  return (
    <aside className="w-80 bg-secondary/30 p-4 overflow-y-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">DevDocs AI Guide</h1>
      <nav className="space-y-4">
        {phases.map((phase) => (
          <Collapsible.Root key={phase.id} defaultOpen>
            <Collapsible.Trigger className="w-full flex items-center justify-between text-lg font-semibold text-left">
              <span>{phase.title}</span>
              <ChevronRight className="transform transition-transform duration-200 ui-open:rotate-90" />
            </Collapsible.Trigger>
            <Collapsible.Content className="mt-2 ml-4 space-y-2">
              {phase.steps.map((step) => (
                <Link
                  key={step.id}
                  to={`/steps/${step.step_key}`}
                  className={cn(
                    'flex items-center space-x-2 p-2 rounded-md transition-colors',
                    step.step_key === stepKey
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-accent" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span>{step.title}</span>
                </Link>
              ))}
            </Collapsible.Content>
          </Collapsible.Root>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
