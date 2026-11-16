import React, { memo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Award,
  HelpCircle,
} from 'lucide-react';
import { moduleQuizzes } from '../data/moduleQuizzesData';
import { useSteps } from '../hooks/useSteps';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';
import type { StepStatus } from '../types';

export interface ModuleQuizProps {
  stepKey: string;
  status?: StepStatus;
  onCompleteStep: (status: StepStatus) => void;
}

const OPTION_LABELS: readonly string[] = ['A', 'B', 'C', 'D'];

const ModuleQuiz = memo(({ stepKey, status, onCompleteStep }: ModuleQuizProps): React.JSX.Element | null => {
  const { quizAnswers, answerQuizQuestion, resetModuleQuiz, updateStepProgress } = useSteps();
  const { t } = useI18n();
  const questions = moduleQuizzes[stepKey] || [];
  const stepAnswers = quizAnswers[stepKey] || {};

  if (questions.length === 0) return null;

  const answeredCount = questions.filter((q) => typeof stepAnswers[q.id] === 'number').length;
  const correctCount = questions.filter((q) => stepAnswers[q.id] === q.correctIndex).length;
  const allAnswered = answeredCount === questions.length;
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (typeof stepAnswers[questionId] === 'number') return;
    answerQuizQuestion(stepKey, questionId, optionIdx);
    // Automatically transition 'not_started' -> 'in_progress' when starting the knowledge check
    if (status === 'not_started') {
      updateStepProgress(stepKey, 'in_progress');
    }
  };

  return (
    <section
      aria-label="Interactive Knowledge Check"
      className="no-print mt-12 p-5 sm:p-6 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-md transition-all duration-200 relative overflow-hidden"
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 opacity-80" />

      {/* Header */}
      <div className="pb-4 border-b border-border/70">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/25 text-primary shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t('quiz.knowledgeCheck', 'Module Knowledge Check')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('quiz.subtitle', 'Verify your production architecture intuition before marking this module completed.')}
            </p>
          </div>
        </div>
      </div>

      {/* Persistent Status & Progress Bar directly above Question 1 - eliminates layout shift */}
      <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-secondary/45 border border-border flex flex-wrap items-center justify-between gap-2.5 min-h-[44px]">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-background text-primary border border-primary/40 shrink-0">
            {answeredCount}/{questions.length}
          </span>
          <span className="text-xs text-foreground font-medium truncate">
            {t('quiz.answered', 'Answered')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {answeredCount > 0 ? (
            <>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border',
                  scorePct === 100
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-700/40 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-500/40'
                    : scorePct >= 50
                    ? 'bg-amber-50 text-amber-950 border-amber-700/40 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-500/40'
                    : 'bg-rose-50 text-rose-950 border-rose-700/40 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-500/40'
                )}
              >
                {t('quiz.scoreBadge', 'Score')}: {correctCount}/{questions.length} ({scorePct}%)
              </span>
              <button
                type="button"
                onClick={() => resetModuleQuiz(stepKey)}
                title={t('quiz.retry', "Reset this module's quiz answers")}
                aria-label={t('quiz.retry', 'Retry')}
                className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-foreground bg-secondary hover:bg-secondary/80 border border-border text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t('quiz.retry', 'Retry')}</span>
              </button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">
              {t('quiz.promptSelect', 'Select an option below to test intuition')}
            </span>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6 mt-4">
        {questions.map((q, qIdx) => {
          const selectedIdx = stepAnswers[q.id];
          const isAnswered = typeof selectedIdx === 'number';
          const isCorrect = isAnswered && selectedIdx === q.correctIndex;

          return (
            <fieldset
              key={q.id}
              className="p-4 rounded-xl bg-secondary/25 border border-border/70 space-y-3 min-w-0 max-w-full w-full overflow-hidden"
            >
              <legend className="w-full max-w-full mb-2 float-none block">
                <div className="flex items-start gap-2.5 w-full min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-background text-primary border border-primary/40 font-mono text-xs font-bold shrink-0 mt-0.5" aria-hidden="true">
                    Q{qIdx + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-sm sm:text-[15px] font-semibold text-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
                    Question {qIdx + 1}: {q.question}
                  </span>
                </div>
              </legend>

              <div role="radiogroup" aria-label={`Question ${qIdx + 1} options`} className="grid grid-cols-1 gap-2 pt-1 min-w-0 max-w-full">
                {q.options.map((optText, optIdx) => {
                  const isThisSelected = selectedIdx === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;

                  let optionStyle =
                    'border-border bg-card hover:bg-secondary text-foreground hover:border-primary/40';
                  if (isAnswered) {
                    if (isThisCorrect) {
                      optionStyle =
                        'border-emerald-700/60 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/60 text-foreground font-medium ring-1 ring-emerald-500/30';
                    } else if (isThisSelected && !isThisCorrect) {
                      optionStyle =
                        'border-rose-700/60 dark:border-rose-500/60 bg-rose-50 dark:bg-rose-950/60 text-foreground ring-1 ring-rose-500/30';
                    } else {
                      optionStyle = 'border-border bg-card text-muted-foreground';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      role="radio"
                      aria-checked={isThisSelected}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={cn(
                        'w-full max-w-full min-h-[44px] p-3 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 flex items-start gap-3 min-w-0 overflow-hidden',
                        isAnswered ? 'cursor-default' : 'cursor-pointer',
                        optionStyle
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border transition-colors',
                          isAnswered && isThisCorrect
                            ? 'bg-emerald-800 dark:bg-emerald-400 text-white dark:text-slate-950 border-emerald-800 dark:border-emerald-400'
                            : isAnswered && isThisSelected && !isThisCorrect
                            ? 'bg-rose-800 dark:bg-rose-400 text-white dark:text-slate-950 border-rose-800 dark:border-rose-400'
                            : 'bg-secondary text-foreground border-border'
                        )}
                      >
                        {OPTION_LABELS[optIdx]}
                      </span>
                      <span className="flex-1 min-w-0 leading-relaxed break-words [overflow-wrap:anywhere]">{optText}</span>
                      {isAnswered && isThisCorrect && (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" aria-hidden="true" />
                          <span className="sr-only"> (Correct answer)</span>
                        </>
                      )}
                      {isAnswered && isThisSelected && !isThisCorrect && (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-1" aria-hidden="true" />
                          <span className="sr-only"> (Your selection, incorrect)</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation upon answering */}
              {isAnswered && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={cn(
                    'mt-3 p-3.5 rounded-xl border text-xs sm:text-[13px] leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-150 min-w-0 max-w-full overflow-hidden',
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-700/40 dark:border-emerald-500/40 text-foreground'
                      : 'bg-amber-50 dark:bg-amber-950/50 border-amber-700/40 dark:border-amber-500/40 text-foreground'
                  )}
                >
                  <Sparkles
                    className={cn(
                      'w-4 h-4 shrink-0 mt-0.5',
                      isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                    <span
                      className={cn(
                        'font-bold mr-1.5',
                        isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
                      )}
                    >
                      {isCorrect ? t('quiz.correct', 'Correct!') : `${t('quiz.incorrect', 'Correct Answer')}: ${OPTION_LABELS[q.correctIndex]}.`}
                    </span>
                    <span className="text-muted-foreground">{q.explanation}</span>
                  </div>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      {/* Footer CTA to mark module completed */}
      <div className="mt-5 pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            {allAnswered
              ? scorePct === 100
                ? 'Perfect comprehension! Ready to mark this module as Completed.'
                : 'Knowledge check complete! Review explanations above or mark module Completed.'
              : `Answer ${questions.length - answeredCount} more question${
                  questions.length - answeredCount > 1 ? 's' : ''
                } to complete the check.`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onCompleteStep('completed')}
          className={cn(
            'min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0',
            status === 'completed'
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-700/40 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-500/40'
              : allAnswered
              ? 'bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-300 dark:hover:bg-emerald-200 dark:text-slate-950 shadow-md'
              : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
          )}
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>
            {status === 'completed' ? t('quiz.moduleCompleted', 'Module Completed') : t('quiz.completeModule', 'Complete Module')}
          </span>
        </button>
      </div>
    </section>
  );
});

export default ModuleQuiz;
