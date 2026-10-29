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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/25 text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {t('quiz.knowledgeCheck', 'Module Knowledge Check')}
              </h3>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                {answeredCount}/{questions.length} {t('quiz.answered', 'Answered')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('quiz.subtitle', 'Verify your production architecture intuition before marking this module completed.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {answeredCount > 0 && (
            <>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-bold font-mono border',
                  scorePct === 100
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : scorePct >= 50
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                )}
              >
                {t('quiz.scoreBadge', 'Score')}: {correctCount}/{questions.length} ({scorePct}%)
              </span>
              <button
                type="button"
                onClick={() => resetModuleQuiz(stepKey)}
                title={t('quiz.retry', "Reset this module's quiz answers")}
                aria-label={t('quiz.retry', 'Retry Knowledge Check')}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('quiz.retry', 'Retry')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6 mt-5">
        {questions.map((q, qIdx) => {
          const selectedIdx = stepAnswers[q.id];
          const isAnswered = typeof selectedIdx === 'number';
          const isCorrect = isAnswered && selectedIdx === q.correctIndex;

          return (
            <fieldset
              key={q.id}
              className="p-4 rounded-xl bg-secondary/25 border border-border/70 space-y-3"
            >
              <legend className="flex items-start gap-2.5 mb-2 float-none w-auto">
                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-mono text-xs font-bold shrink-0 mt-0.5" aria-hidden="true">
                  Q{qIdx + 1}
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-foreground leading-relaxed">
                  Question {qIdx + 1}: {q.question}
                </span>
              </legend>

              <div role="radiogroup" aria-label={`Question ${qIdx + 1} options`} className="grid grid-cols-1 gap-2 pt-1">
                {q.options.map((optText, optIdx) => {
                  const isThisSelected = selectedIdx === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;

                  let optionStyle =
                    'border-border/80 bg-card/70 hover:bg-secondary/60 text-foreground/90 hover:border-primary/40';
                  if (isAnswered) {
                    if (isThisCorrect) {
                      optionStyle =
                        'border-emerald-500/60 bg-emerald-500/10 text-foreground font-medium ring-1 ring-emerald-500/30';
                    } else if (isThisSelected && !isThisCorrect) {
                      optionStyle =
                        'border-rose-500/60 bg-rose-500/10 text-foreground/90 ring-1 ring-rose-500/30';
                    } else {
                      optionStyle = 'border-border/40 bg-card/30 text-muted-foreground opacity-65';
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
                        'w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 flex items-start gap-3',
                        isAnswered ? 'cursor-default' : 'cursor-pointer',
                        optionStyle
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border transition-colors',
                          isAnswered && isThisCorrect
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : isAnswered && isThisSelected && !isThisCorrect
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-secondary/80 text-muted-foreground border-border/70'
                        )}
                      >
                        {OPTION_LABELS[optIdx]}
                      </span>
                      <span className="flex-1 leading-relaxed">{optText}</span>
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
                    'mt-3 p-3.5 rounded-xl border text-xs sm:text-[13px] leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-150',
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground/95'
                      : 'bg-amber-500/10 border-amber-500/30 text-foreground/95'
                  )}
                >
                  <Sparkles
                    className={cn(
                      'w-4 h-4 shrink-0 mt-0.5',
                      isCorrect ? 'text-emerald-400' : 'text-amber-400'
                    )}
                  />
                  <div>
                    <span
                      className={cn(
                        'font-bold mr-1.5',
                        isCorrect ? 'text-emerald-400' : 'text-amber-400'
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
          <HelpCircle className="w-4 h-4 text-primary shrink-0" />
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
            'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0',
            status === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : allAnswered
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {status === 'completed' ? t('quiz.moduleCompleted', 'Module Completed') : t('quiz.completeModule', 'Complete Module')}
          </span>
        </button>
      </div>
    </section>
  );
});

export default ModuleQuiz;
