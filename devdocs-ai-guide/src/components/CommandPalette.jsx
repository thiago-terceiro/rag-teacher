import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, ArrowRight, BookOpen, Clock, Sparkles, X, Layers, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allSteps, initialPhases } from '../data/guideData';
import { extractHeadings } from '../lib/headings';
import { cn } from '../lib/utils';

// Pre-index searchable topics AND granular section headings for deep-link navigation
const searchableItems = (() => {
  const items = [];

  allSteps.forEach((step) => {
    const phase = initialPhases.find((p) => p.steps.some((s) => s.step_key === step.step_key));
    const phaseTitle = phase ? phase.title.split(':')[0] : 'Curriculum';
    const phaseName = phase ? phase.title : '';
    const contentPreview = (step.content || '').replace(/```[\s\S]*?```/g, '').slice(0, 300);

    // 1. Primary Module Entry
    items.push({
      type: 'module',
      step_key: step.step_key,
      headingId: null,
      title: step.title,
      parentTitle: null,
      readTime: step.readTime || '10 min',
      phaseTitle,
      phaseName,
      contentPreview,
    });

    // 2. Granular Deep Section Headings
    const headings = extractHeadings(step.content);
    headings.forEach((h) => {
      items.push({
        type: 'section',
        step_key: step.step_key,
        headingId: h.id,
        title: h.text,
        parentTitle: step.title,
        readTime: step.readTime || '10 min',
        phaseTitle,
        phaseName,
        contentPreview: '',
      });
    });
  });

  return items;
})();

const POPULAR_SUGGESTIONS = [
  { step_key: 'qdrant-setup', headingId: '3-mathematical--algorithmic-foundations', label: 'HNSW Graph Indexing & Skip-Lists', phase: 'Phase 1', isDeep: true },
  { step_key: 'cross-encoder-reranking', headingId: '1-executive-mental-model--first-principles', label: 'Two-Stage Retrieval & Cross-Encoder Reranking', phase: 'Phase 2', isDeep: true },
  { step_key: 'ragas-evaluation', headingId: '3-mathematical--algorithmic-foundations', label: 'Golden Datasets & Ragas Faithfulness Harmonics', phase: 'Phase 2', isDeep: true },
  { step_key: 'langgraph-agent-architecture', headingId: '3-mathematical--algorithmic-foundations', label: 'LangGraph & Lyapunov Convergence Proof', phase: 'Phase 3', isDeep: true },
  { step_key: 'agent-tool-doc-search', headingId: '3-mathematical--algorithmic-foundations', label: 'Reciprocal Rank Fusion (RRF) Theorem', phase: 'Phase 3', isDeep: true },
  { step_key: 'dspy-setup', headingId: '1-executive-mental-model--first-principles', label: 'DSPy Teleprompters & MIPROv2 Optimization', phase: 'Phase 3', isDeep: true },
];

export function CommandPalette({ isOpen, setIsOpen }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Global keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  // Reset query and selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items matching query with relevance ranking
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const matches = [];
    for (const item of searchableItems) {
      const titleLower = item.title.toLowerCase();
      const parentLower = (item.parentTitle || '').toLowerCase();
      const previewLower = item.contentPreview.toLowerCase();

      let score = 0;
      if (titleLower.startsWith(q)) {
        score = 100;
      } else if (titleLower.includes(q)) {
        score = 75;
      } else if (parentLower.includes(q)) {
        score = 40;
      } else if (previewLower.includes(q)) {
        score = 20;
      }

      if (score > 0) {
        matches.push({ item, score });
      }
    }

    // Sort by relevance score descending
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 9).map((m) => m.item);
  }, [query]);

  // Handle item selection navigation with deep-link support
  const handleSelect = useCallback((item) => {
    setIsOpen(false);
    if (!item) return;

    if (item.headingId) {
      navigate(`/steps/${item.step_key}#${item.headingId}`);
    } else {
      navigate(`/steps/${item.step_key}`);
    }
  }, [navigate, setIsOpen]);

  // Keyboard navigation inside list
  const handleInputKeyDown = (e) => {
    const currentListLength = query ? filteredResults.length : POPULAR_SUGGESTIONS.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, currentListLength));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + currentListLength) % Math.max(1, currentListLength));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query && filteredResults.length > 0) {
        handleSelect(filteredResults[selectedIndex]);
      } else if (!query && POPULAR_SUGGESTIONS.length > 0) {
        handleSelect(POPULAR_SUGGESTIONS[selectedIndex]);
      }
    }
  };

  // Keep selected item scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card/95 border border-border/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col focus:outline-none animate-in zoom-in-95 duration-200"
        >
          <Dialog.Title className="sr-only">Command Palette: Search RAG Curriculum</Dialog.Title>

          {/* Search Header Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
            <Search className="w-5 h-5 text-primary shrink-0 animate-pulse" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="command-palette-results"
              aria-label="Search curriculum modules, topics, and algorithms"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search 28 modules, concepts, algorithms (e.g. HNSW, Ragas, DSPy, RRF)..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none tracking-[0.01em]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search input"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 text-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd aria-hidden="true" className="hidden sm:inline-block px-2 py-0.5 rounded bg-secondary/80 text-[10px] font-mono text-muted-foreground border border-border/60">
              ESC
            </kbd>
          </div>

          {/* Search Results List */}
          <div
            ref={listRef}
            id="command-palette-results"
            role="listbox"
            aria-label="Curriculum Search Results"
            className="max-h-[26rem] overflow-y-auto p-2 space-y-1 custom-scrollbar"
          >
            {query ? (
              filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isSection = item.type === 'section';
                  const itemKey = isSection ? `${item.step_key}-${item.headingId}` : item.step_key;

                  return (
                    <button
                      key={itemKey}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                        isSelected
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-xs'
                          : 'text-foreground hover:bg-secondary/50'
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {isSection ? (
                          <Hash className={cn('w-4 h-4 mt-0.5 shrink-0', isSelected ? 'text-cyan-400' : 'text-muted-foreground')} />
                        ) : (
                          <BookOpen className={cn('w-4 h-4 mt-0.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {isSection ? (
                              <>
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-medium">
                                  Section
                                </span>
                                <span className="truncate max-w-[200px] sm:max-w-xs">{item.parentTitle}</span>
                              </>
                            ) : (
                              <>
                                <span className="px-2 py-0.2 rounded-full bg-secondary/80 text-[10px] font-medium border border-border/50">
                                  {item.phaseTitle}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.readTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className={cn('w-4 h-4 shrink-0 transition-transform duration-150', isSelected ? 'translate-x-1 text-primary' : 'opacity-0')} />
                    </button>
                  );
                })
              ) : (
                <div role="status" aria-live="polite" className="py-12 text-center text-sm text-muted-foreground">
                  <p>No topics found matching <span className="text-foreground font-semibold">"{query}"</span></p>
                  <p className="text-xs mt-1 text-muted-foreground/80">
                    Try searching for <span className="text-primary">chunking</span>, <span className="text-primary">hnsw</span>, <span className="text-primary">reranking</span>, or <span className="text-primary">dspy</span>.
                  </p>
                </div>
              )
            ) : (
              <div>
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
                  Popular Modules & Deep-Link Concepts
                </div>
                {POPULAR_SUGGESTIONS.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={item.label}
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                        isSelected
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'text-foreground hover:bg-secondary/50'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.isDeep ? (
                          <Hash className={cn('w-4 h-4 shrink-0', isSelected ? 'text-cyan-400' : 'text-muted-foreground')} />
                        ) : (
                          <Layers className={cn('w-4 h-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        )}
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isDeep && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 font-mono">
                            #jump
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded border border-border/40">
                          {item.phase}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Controls Hint */}
          <div className="px-4 py-2.5 bg-secondary/30 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-secondary rounded border border-border/60 font-mono text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.2 bg-secondary rounded border border-border/60 font-mono text-[10px]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-secondary rounded border border-border/60 font-mono text-[10px]">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-secondary rounded border border-border/60 font-mono text-[10px]">esc</kbd>
                close
              </span>
            </div>
            <span className="font-medium text-foreground/80">Deep-Link Enabled</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(CommandPalette);
