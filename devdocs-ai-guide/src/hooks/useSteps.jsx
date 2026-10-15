import { createContext, useCallback, use, useEffect, useState, startTransition } from 'react';
import { initialPhases, allSteps, getStepByKey } from '../data/guideData';

const StepsContext = createContext(null);

// React 19 `use()` hook for reading context
export const useSteps = () => use(StepsContext);

const LOCAL_STORAGE_KEY = 'devdocs_ai_guide_progress_v1';

export const StepsProvider = ({ children }) => {
  const [phases, setPhases] = useState(() => {
    // Read saved progress from localStorage on initialization
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const progressMap = JSON.parse(saved);
        return initialPhases.map(phase => ({
          ...phase,
          steps: phase.steps.map(step => {
            const userProg = progressMap[step.step_key] || {};
            return {
              ...step,
              status: userProg.status || 'not_started',
              notes: userProg.notes || '',
              completedAt: userProg.completedAt || null,
            };
          })
        }));
      }
    } catch (e) {
      console.warn("Failed to read progress from localStorage", e);
    }
    return initialPhases.map(phase => ({
      ...phase,
      steps: phase.steps.map(step => ({
        ...step,
        status: 'not_started',
        notes: '',
        completedAt: null,
      }))
    }));
  });

  const [loading] = useState(false);
  const [error] = useState(null);

  // Compute overall stats
  const stepsFlat = phases.flatMap(p => p.steps);
  const totalSteps = stepsFlat.length;
  const completedSteps = stepsFlat.filter(s => s.status === 'completed').length;
  const inProgressSteps = stepsFlat.filter(s => s.status === 'in_progress').length;
  const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const stats = {
    totalSteps,
    completedSteps,
    inProgressSteps,
    completionPercentage,
  };

  // Helper to persist current state to localStorage
  const persistToLocalStorage = (updatedPhases) => {
    try {
      const progressMap = {};
      updatedPhases.flatMap(p => p.steps).forEach(s => {
        if (s.status !== 'not_started' || s.notes) {
          progressMap[s.step_key] = {
            status: s.status,
            notes: s.notes,
            completedAt: s.completedAt,
          };
        }
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progressMap));
    } catch (e) {
      console.error("Failed to save progress to localStorage", e);
    }
  };

  // Update progress for a step using React 19 startTransition
  const updateStepProgress = useCallback((stepKey, status, notes) => {
    startTransition(() => {
      setPhases(prevPhases => {
        let isNewlyCompleted = false;
        const nextPhases = prevPhases.map(phase => ({
          ...phase,
          steps: phase.steps.map(step => {
            if (step.step_key === stepKey) {
              const prevStatus = step.status;
              const nextStatus = status !== undefined ? status : prevStatus;
              const nextNotes = notes !== undefined ? notes : step.notes;
              
              if (prevStatus !== 'completed' && nextStatus === 'completed') {
                isNewlyCompleted = true;
              }

              return {
                ...step,
                status: nextStatus,
                notes: nextNotes,
                completedAt: nextStatus === 'completed' ? (step.completedAt || new Date().toISOString()) : null,
              };
            }
            return step;
          })
        }));

        persistToLocalStorage(nextPhases);

        // React 19 lazy code-splitting: load confetti on-demand only when completed
        if (isNewlyCompleted) {
          import('canvas-confetti').then(({ default: confetti }) => {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
            });
          }).catch(() => {});
        }

        // Opportunistic API sync if backend is active
        fetch(`/api/steps/${stepKey}/progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes }),
        }).catch(() => {
          // Silently ignore if running in static/Vercel mode without backend
        });

        return nextPhases;
      });
    });
  }, []);

  const getStepContent = useCallback((stepKey) => {
    return getStepByKey(stepKey);
  }, []);

  const resetAllProgress = useCallback(() => {
    startTransition(() => {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setPhases(initialPhases.map(phase => ({
          ...phase,
          steps: phase.steps.map(step => ({
            ...step,
            status: 'not_started',
            notes: '',
            completedAt: null,
          }))
        })));
      } catch (e) {
        console.error(e);
      }
    });
  }, []);

  const value = {
    phases,
    stats,
    loading,
    error,
    updateStepProgress,
    getStepContent,
    resetAllProgress,
    allSteps,
  };

  // React 19 `<Context value={value}>` standard (no `.Provider` needed)
  return <StepsContext value={value}>{children}</StepsContext>;
};
