import { createContext, useCallback, use, useState, useMemo, startTransition } from 'react';
import { initialPhases, allSteps, getStepByKey } from '../data/guideData';
import { moduleQuizzes } from '../data/moduleQuizzesData';

const StepsContext = createContext(null);

// React 19 `use()` hook for reading context
export const useSteps = () => use(StepsContext);

const LOCAL_STORAGE_KEY = 'devdocs_ai_guide_progress_v1';
const QUIZ_STORAGE_KEY = 'devdocs_ai_guide_quizzes_v1';

const TOTAL_QUIZ_QUESTIONS = Object.values(moduleQuizzes).reduce(
  (acc, list) => acc + list.length,
  0
);

export const StepsProvider = ({ children }) => {
  const [phases, setPhases] = useState(() => {
    // Read saved progress from localStorage on initialization
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const progressMap = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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

  // Quiz answers state: { [stepKey]: { [questionId]: selectedOptionIndex } }
  const [quizAnswers, setQuizAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      console.warn("Failed to read quiz progress from localStorage", e);
      return {};
    }
  });

  const [loading] = useState(false);
  const [error] = useState(null);

  // Compute overall stats + Comprehension Score (memoized)
  const stats = useMemo(() => {
    const stepsFlat = phases.flatMap(p => p.steps);
    const totalSteps = stepsFlat.length;
    const completedSteps = stepsFlat.filter(s => s.status === 'completed').length;
    const inProgressSteps = stepsFlat.filter(s => s.status === 'in_progress').length;
    const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    let answeredQuizQuestions = 0;
    let correctQuizQuestions = 0;

    for (const [sKey, questions] of Object.entries(moduleQuizzes)) {
      const stepAns = quizAnswers[sKey];
      if (!stepAns) continue;
      for (const q of questions) {
        if (typeof stepAns[q.id] === 'number') {
          answeredQuizQuestions += 1;
          if (stepAns[q.id] === q.correctIndex) {
            correctQuizQuestions += 1;
          }
        }
      }
    }

    const comprehensionScore =
      answeredQuizQuestions > 0
        ? Math.round((correctQuizQuestions / answeredQuizQuestions) * 100)
        : null;

    return {
      totalSteps,
      completedSteps,
      inProgressSteps,
      completionPercentage,
      totalQuizQuestions: TOTAL_QUIZ_QUESTIONS,
      answeredQuizQuestions,
      correctQuizQuestions,
      comprehensionScore,
    };
  }, [phases, quizAnswers]);

  const {
    totalSteps,
    completedSteps,
    completionPercentage,
    answeredQuizQuestions,
    correctQuizQuestions,
    comprehensionScore,
  } = stats;

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

  // Record a quiz answer and persist to localStorage
  const answerQuizQuestion = useCallback((stepKey, questionId, optionIndex) => {
    setQuizAnswers(prev => {
      const stepExisting = prev[stepKey] || {};
      const next = {
        ...prev,
        [stepKey]: {
          ...stepExisting,
          [questionId]: optionIndex,
        },
      };
      try {
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save quiz answer", e);
      }
      return next;
    });
  }, []);

  // Reset a specific module's quiz answers
  const resetModuleQuiz = useCallback((stepKey) => {
    setQuizAnswers(prev => {
      const next = { ...prev };
      delete next[stepKey];
      try {
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to reset module quiz", e);
      }
      return next;
    });
  }, []);

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
        localStorage.removeItem(QUIZ_STORAGE_KEY);
        setQuizAnswers({});
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

  // Export all user notes and progress as a formatted Markdown study guide
  const exportStudyGuide = useCallback(() => {
    const lines = [
      `# 🎓 RAG Teacher Masterclass — Personal Study Guide & Notes`,
      `*Generated on: ${new Date().toLocaleDateString()}*`,
      `*Curriculum Progress: ${completedSteps} / ${totalSteps} modules completed (${completionPercentage}%)*`,
      `*Comprehension Score: ${comprehensionScore !== null ? `${comprehensionScore}% (${correctQuizQuestions}/${answeredQuizQuestions} correct)` : 'No quizzes taken yet'}*`,
      '',
      '---',
      '',
    ];

    phases.forEach((phase) => {
      lines.push(`## ${phase.title}`);
      lines.push(`${phase.description}`);
      lines.push('');

      phase.steps.forEach((step, idx) => {
        const statusEmoji = step.status === 'completed' ? '✅' : step.status === 'in_progress' ? '🔄' : '⚪';
        const stepQuestions = moduleQuizzes[step.step_key] || [];
        const stepAns = quizAnswers[step.step_key] || {};
        const stepCorrect = stepQuestions.filter(q => stepAns[q.id] === q.correctIndex).length;
        const stepAnswered = stepQuestions.filter(q => typeof stepAns[q.id] === 'number').length;

        lines.push(`### ${idx + 1}. ${step.title} (${statusEmoji} ${step.status})`);
        lines.push(`- **Module Key**: \`${step.step_key}\``);
        lines.push(`- **Estimated Read Time**: ${step.readTime || '10 min'}`);
        if (stepAnswered > 0) {
          lines.push(`- **Knowledge Check Score**: ${stepCorrect} / ${stepQuestions.length} correct`);
        }
        if (step.completedAt) {
          lines.push(`- **Completed Date**: ${new Date(step.completedAt).toLocaleDateString()}`);
        }
        if (step.notes && step.notes.trim()) {
          lines.push('');
          lines.push('#### 📝 Your Study Notes:');
          lines.push(step.notes.trim());
        }
        lines.push('');
      });

      lines.push('---');
      lines.push('');
    });

    const markdownContent = lines.join('\n');
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rag-masterclass-study-notes-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [phases, completedSteps, totalSteps, completionPercentage, comprehensionScore, correctQuizQuestions, answeredQuizQuestions, quizAnswers]);

  const value = {
    phases,
    stats,
    loading,
    error,
    quizAnswers,
    answerQuizQuestion,
    resetModuleQuiz,
    updateStepProgress,
    getStepContent,
    resetAllProgress,
    exportStudyGuide,
    allSteps,
  };

  // React 19 `<Context value={value}>` standard (no `.Provider` needed)
  return <StepsContext value={value}>{children}</StepsContext>;
};

