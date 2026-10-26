import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import { interviewQuestions } from '../data/interviewQuestionsData';
import MarkdownRenderer from './MarkdownRenderer';
import useDebounce from '../hooks/useDebounce';
import { cn } from '../lib/utils';
import type { InterviewQuestion } from '../types';

const MASTERY_STORAGE_KEY = 'rag_interview_mastery_v1';
const DRAFTS_STORAGE_KEY = 'rag_interview_drafts_v1';

function loadStoredMastery(): Record<number, boolean> {
  try {
    const saved = localStorage.getItem(MASTERY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function loadStoredDrafts(): Record<string, string> {
  try {
    const saved = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export interface InterviewQuestionCardProps {
  q: InterviewQuestion & { track?: string };
  isMastered: boolean;
  initialDraft: string;
  onToggleMastery: (id: number) => void;
  onDraftChange: (stepKey: string, text: string) => void;
}

const InterviewQuestionCard = React.memo(function InterviewQuestionCard({
  q,
  isMastered,
  initialDraft,
  onToggleMastery,
  onDraftChange,
}: InterviewQuestionCardProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(initialDraft || '');
  const debouncedDraft = useDebounce<string>(draft, 400);

  const draftRef = useRef<string>(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const lastSavedRef = useRef<string>(initialDraft || '');

  // Keep internal draft synced with external props (e.g. multi-tab sync)
  useEffect(() => {
    if (initialDraft !== undefined && initialDraft !== lastSavedRef.current && draft === lastSavedRef.current) {
      setDraft(initialDraft || '');
      lastSavedRef.current = initialDraft || '';
    }
  }, [initialDraft, draft]);

  const flushDraft = useCallback((textToSave: string) => {
    if (textToSave !== lastSavedRef.current) {
      lastSavedRef.current = textToSave;
      onDraftChange(q.step_key, textToSave);
    }
  }, [q.step_key, onDraftChange]);

  // Auto-save debounced draft text
  useEffect(() => {
    flushDraft(debouncedDraft);
  }, [debouncedDraft, flushDraft]);

  // Flush pending edits immediately on unmount or browser tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushDraft(draftRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushDraft(draftRef.current);
    };
  }, [flushDraft]);

  return (
    <div
      id={`q-${q.step_key}`}
      className={cn(
        'rounded-2xl border transition-all duration-200 overflow-hidden bg-card/80 backdrop-blur-md',
        isMastered
          ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
          : 'border-border/80 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)]'
      )}
    >
      {/* Question Header Card */}
      <div className="p-5 sm:p-6">
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
              {q.track || q.company || 'System Architecture'}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Phase {q.phase} • Step {q.id}
            </span>
          </div>

          {/* Mastery Checkbox */}
          <button
            type="button"
            onClick={() => onToggleMastery(q.id)}
            aria-pressed={isMastered}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              isMastered
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {isMastered ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>Mastered</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mark as Mastered</span>
              </>
            )}
          </button>
        </div>

        {/* Step Title Link */}
        <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-[0.01em] mb-3">
          <Link
            to={`/steps/${q.step_key}`}
            className="hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <span>{q.step_title}</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" aria-hidden="true" />
          </Link>
        </h2>

        {/* Verbatim Question Prompt */}
        <div className="p-4 rounded-xl bg-primary/5 border-l-4 border-primary border-y border-r border-primary/20 text-foreground/95 text-sm sm:text-[15px] leading-relaxed my-3 italic">
          &quot;{q.question}&quot;
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {q.tags.map((tag: string, tIdx: number) => (
            <span
              key={tIdx}
              className="px-2 py-0.5 rounded-md bg-secondary/80 text-[10px] text-muted-foreground font-mono"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Draft Answer Scratchpad */}
        <div className="mt-5 pt-4 border-t border-border/60">
          <label htmlFor={`draft-${q.step_key}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Draft Your Solution & Latency / Storage Budget:
          </label>
          <textarea
            id={`draft-${q.step_key}`}
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            onBlur={() => flushDraft(draft)}
            placeholder="Outline your architectural components, sizing calculations, failure modes, and tradeoffs before revealing the architecture answer..."
            className="w-full h-24 p-3 bg-secondary/30 rounded-xl border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsRevealed(v => !v)}
            aria-expanded={isRevealed}
            aria-controls={`answer-${q.id}`}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer',
              isRevealed
                ? 'bg-secondary text-foreground hover:bg-secondary/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20'
            )}
          >
            {isRevealed ? (
              <>
                <EyeOff className="w-4 h-4" aria-hidden="true" />
                <span>Hide Architecture Answer</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Reveal Architecture Answer</span>
              </>
            )}
          </button>

          <Link
            to={`/steps/${q.step_key}`}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Study Full Step Curriculum Module</span>
          </Link>
        </div>
      </div>

      {/* Collapsible Architecture Answer Reveal */}
      {isRevealed && (
        <div id={`answer-${q.id}`} role="region" aria-label="Architecture Answer & Tradeoffs" className="px-5 sm:px-6 py-6 border-t border-border/80 bg-secondary/20 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-primary uppercase tracking-wider mb-4 pb-2 border-b border-border/60">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Production Architecture Answer & Tradeoffs</span>
          </div>

          <div className="prose prose-invert max-w-none text-sm">
            <MarkdownRenderer markdown={q.answer} />
          </div>
        </div>
      )}
    </div>
  );
});

export function InterviewQuestions(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<string>('all'); // 'all' | '1' | '2' | '3' | '4'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [masteredIds, setMasteredIds] = useState<Record<number, boolean>>(loadStoredMastery);
  const [drafts, setDrafts] = useState<Record<string, string>>(loadStoredDrafts);

  const isFirstMasteryMount = useRef<boolean>(true);
  useEffect(() => {
    if (isFirstMasteryMount.current) {
      isFirstMasteryMount.current = false;
      return;
    }
    try {
      localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(masteredIds));
    } catch (e) {
      console.warn('Failed to save mastery', e);
    }
  }, [masteredIds]);

  const isFirstDraftsMount = useRef<boolean>(true);
  useEffect(() => {
    if (isFirstDraftsMount.current) {
      isFirstDraftsMount.current = false;
      return;
    }
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.warn('Failed to save draft', e);
    }
  }, [drafts]);

  // Real-time multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MASTERY_STORAGE_KEY) {
        setMasteredIds(loadStoredMastery());
      } else if (e.key === DRAFTS_STORAGE_KEY) {
        setDrafts(loadStoredDrafts());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Toggle question mastery (pure updater)
  const toggleMastery = useCallback((id: number) => {
    setMasteredIds(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Update draft answer (pure updater)
  const updateDraft = useCallback((stepKey: string, text: string) => {
    setDrafts(prev => ({ ...prev, [stepKey]: text }));
  }, []);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return interviewQuestions.filter((item: InterviewQuestion) => {
      const matchesPhase = activePhase === 'all' || item.phase === Number(activePhase);
      const matchesSearch =
        !q ||
        item.step_title.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.tags.some((t: string) => t.toLowerCase().includes(q));
      return matchesPhase && matchesSearch;
    });
  }, [activePhase, searchQuery]);

  // Mastery statistics
  const totalQuestions = interviewQuestions.length;
  const masteredCount = Object.values(masteredIds).filter(Boolean).length;
  const masteredPercent = totalQuestions > 0 ? Math.round((masteredCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto pb-24 relative px-4 sm:px-6 lg:px-8">
      {/* Title & Metadata */}
      <title>Interview Questions — RAG Teacher</title>
      <meta
        name="description"
        content="28 Production AI & Machine Learning System Design Interview Scenarios with failure modes, latency budgets, and architecture solutions."
      />

      {/* Ambient Aura Background Glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-primary/15 via-indigo-500/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Header Banner */}
      <div className="mt-4 mb-8 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>System Design & Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-[0.01em]">
          Interview Questions
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          The definitive collection of 28 real-world system design interview questions. Test your architecture intuition, draft your response, and benchmark against production architecture solutions.
        </p>
      </div>

      {/* Mastery Progress Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-md border border-border/80 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Circular Progress Ring - locked aspect ratio, never squashed sideways */}
          <div
            role="progressbar"
            aria-label="Interview scenarios mastered progress"
            aria-valuenow={masteredPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${masteredCount} of ${totalQuestions} scenarios mastered (${masteredPercent}%)`}
            className="relative w-14 h-14 shrink-0 aspect-square flex items-center justify-center"
          >
            <svg aria-hidden="true" className="w-full h-full transform -rotate-90 shrink-0" viewBox="0 0 48 48">
              {/* Background circular track */}
              <circle
                className="text-secondary/80"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="20"
                cx="24"
                cy="24"
              />
              {/* Dynamic progress arc */}
              <circle
                className="text-primary transition-all duration-300"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - masteredPercent / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="20"
                cx="24"
                cy="24"
              />
            </svg>
            <span className="absolute font-mono font-bold text-xs sm:text-sm text-foreground">
              {masteredPercent}%
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-foreground">
              Interview Mastery: {masteredCount} of {totalQuestions} Scenarios Mastered
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Practice drafting your technical constraints before revealing the architecture solution.
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-label="Overall interview mastery percentage"
          aria-valuenow={masteredPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full sm:w-64 bg-secondary/60 rounded-full h-2.5 overflow-hidden border border-border/50"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${masteredPercent}%` }}
          />
        </div>
      </div>

      {/* Search & Phase Filters - with elevated height and generous breathing room */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 sm:mb-10">
        {/* Phase Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter interview scenarios by phase"
          className="flex items-center overflow-x-auto p-1.5 bg-secondary/40 rounded-2xl border border-border/80 text-xs shadow-2xs custom-scrollbar"
        >
          {[
            { key: 'all', label: `All (${totalQuestions})` },
            { key: '1', label: 'Phase 1: Foundation (9)' },
            { key: '2', label: 'Phase 2: Quality (7)' },
            { key: '3', label: 'Phase 3: Agents (7)' },
            { key: '4', label: 'Phase 4: Prod (5)' },
          ].map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activePhase === tab.key}
              onClick={() => setActivePhase(tab.key)}
              className={cn(
                'px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer',
                activePhase === tab.key
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search questions, topics..."
            aria-label="Search interview questions by title, keyword, or track"
            className="w-full pl-10 pr-3.5 py-2.5 bg-secondary/50 rounded-xl text-xs placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6 sm:space-y-8">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <InterviewQuestionCard
              key={q.id}
              q={q}
              isMastered={!!masteredIds[q.id]}
              initialDraft={drafts[q.step_key] || ''}
              onToggleMastery={toggleMastery}
              onDraftChange={updateDraft}
            />
          ))
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-base font-semibold">No interview questions match your filter.</p>
            <p className="text-xs mt-1">Try resetting the phase tab or clearing your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(InterviewQuestions);
