import React, { createContext, useCallback, use, useState, useMemo, useRef, useEffect, startTransition } from 'react';
import { initialPhases, allSteps, getStepByKey } from '../data/guideData';
import { moduleQuizzes } from '../data/moduleQuizzesData';
import { triggerConfetti } from '../lib/confetti';
import type { Phase, Step, StepStatus, CurriculumStats, QuizAnswerMap, StepsContextType } from '../types';

const StepsContext = createContext<StepsContextType | null>(null);

// React 19 `use()` hook for reading context
export const useSteps = (): StepsContextType => {
  const context = use(StepsContext);
  if (!context) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return context;
};

const LOCAL_STORAGE_KEY = 'devdocs_ai_guide_progress_v1';
const QUIZ_STORAGE_KEY = 'devdocs_ai_guide_quizzes_v1';

const TOTAL_QUIZ_QUESTIONS = Object.values(moduleQuizzes).reduce(
  (acc, list) => acc + list.length,
  0
);

const VALID_STATUSES: Set<StepStatus> = new Set(['not_started', 'in_progress', 'completed']);

function loadStoredProgress(): Phase[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const progressMap: Record<string, { status?: unknown; notes?: unknown; completedAt?: unknown }> =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      return initialPhases.map(phase => ({
        ...phase,
        steps: phase.steps.map(step => {
          const userProg = progressMap[step.step_key] || {};
          const status: StepStatus = typeof userProg.status === 'string' && VALID_STATUSES.has(userProg.status as StepStatus)
            ? (userProg.status as StepStatus)
            : 'not_started';
          const notes = typeof userProg.notes === 'string' ? userProg.notes : '';
          const completedAt = typeof userProg.completedAt === 'string' ? userProg.completedAt : null;
          return {
            ...step,
            status,
            notes,
            completedAt,
          };
        })
      }));
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Failed to read progress from localStorage", e);
  }
  return initialPhases.map(phase => ({
    ...phase,
    steps: phase.steps.map(step => ({
      ...step,
      status: 'not_started' as StepStatus,
      notes: '',
      completedAt: null,
    }))
  }));
}

function loadStoredQuizAnswers(): QuizAnswerMap {
  try {
    const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    console.warn("Failed to read quiz progress from localStorage", e);
    return {};
  }
}

function persistToLocalStorage(updatedPhases: Phase[]) {
  try {
    const progressMap: Record<string, { status?: StepStatus; notes?: string; completedAt?: string | null }> = {};
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
}

export const StepsProvider = ({ children }: { children: React.ReactNode }) => {
  const [phases, setPhases] = useState<Phase[]>(loadStoredProgress);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerMap>(loadStoredQuizAnswers);
  const phasesRef = useRef(phases);

  // Synchronize phasesRef cleanly in effect (zero render-phase mutations)
  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);

  // Persist phases progress strictly in effect (outside state updaters)
  const isFirstPhasesMount = useRef(true);
  useEffect(() => {
    if (isFirstPhasesMount.current) {
      isFirstPhasesMount.current = false;
      return;
    }
    persistToLocalStorage(phases);
  }, [phases]);

  // Persist quiz answers strictly outside state updaters
  const isFirstQuizMount = useRef(true);
  useEffect(() => {
    if (isFirstQuizMount.current) {
      isFirstQuizMount.current = false;
      return;
    }
    try {
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizAnswers));
    } catch (e) {
      console.warn("Failed to save quiz answers", e);
    }
  }, [quizAnswers]);

  // Real-time multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        setPhases(loadStoredProgress());
      } else if (e.key === QUIZ_STORAGE_KEY) {
        setQuizAnswers(loadStoredQuizAnswers());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Compute overall stats + Comprehension Score (memoized)
  const stats: CurriculumStats = useMemo(() => {
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

  // Record a quiz answer purely (side-effect handled by useEffect)
  const answerQuizQuestion = useCallback((stepKey: string, questionId: string, optionIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [stepKey]: {
        ...(prev[stepKey] || {}),
        [questionId]: optionIndex,
      },
    }));
  }, []);

  // Reset a specific module's quiz answers purely
  const resetModuleQuiz = useCallback((stepKey: string) => {
    setQuizAnswers(prev => {
      const next = { ...prev };
      delete next[stepKey];
      return next;
    });
  }, []);

  // Update progress for a step using React 19 startTransition with pure functional updater
  const updateStepProgress = useCallback((stepKey: string, status?: StepStatus, notes?: string) => {
    // Check if this action completes a step for celebratory confetti
    const currentStep = phasesRef.current?.flatMap(p => p.steps).find(s => s.step_key === stepKey);
    const isNewlyCompleted = status === 'completed' && currentStep?.status !== 'completed';

    startTransition(() => {
      setPhases(prevPhases =>
        prevPhases.map(phase => ({
          ...phase,
          steps: phase.steps.map(step => {
            if (step.step_key === stepKey) {
              const prevStatus = step.status;
              const nextStatus = status !== undefined ? status : prevStatus;
              const nextNotes = notes !== undefined ? notes : step.notes;

              return {
                ...step,
                status: nextStatus,
                notes: nextNotes,
                completedAt: nextStatus === 'completed' ? (step.completedAt || new Date().toISOString()) : null,
              };
            }
            return step;
          })
        }))
      );
    });

    if (isNewlyCompleted) {
      triggerConfetti();
    }
  }, []);

  const getStepContent = useCallback((stepKey: string): Step => {
    return getStepByKey(stepKey);
  }, []);

  const resetAllProgress = useCallback(() => {
    startTransition(() => {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(QUIZ_STORAGE_KEY);
        localStorage.removeItem('rag_interview_mastery_v1');
        localStorage.removeItem('rag_interview_drafts_v1');
        setQuizAnswers({});
        window.dispatchEvent(new Event('storage'));
        const freshPhases: Phase[] = initialPhases.map(phase => ({
          ...phase,
          steps: phase.steps.map(step => ({
            ...step,
            status: 'not_started' as StepStatus,
            notes: '',
            completedAt: null,
          }))
        }));
        setPhases(freshPhases);
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

  const value = useMemo<StepsContextType>(() => ({
    phases,
    stats,
    quizAnswers,
    answerQuizQuestion,
    resetModuleQuiz,
    updateStepProgress,
    getStepContent,
    resetAllProgress,
    exportStudyGuide,
    allSteps,
  }), [
    phases,
    stats,
    quizAnswers,
    answerQuizQuestion,
    resetModuleQuiz,
    updateStepProgress,
    getStepContent,
    resetAllProgress,
    exportStudyGuide,
  ]);

  // React 19 `<Context value={value}>` standard (no `.Provider` needed)
  return <StepsContext value={value}>{children}</StepsContext>;
};
