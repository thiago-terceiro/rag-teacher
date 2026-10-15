import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, ArrowRight, BookOpen, Clock, Sparkles, CornerDownLeft, X, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allSteps, initialPhases } from '../data/guideData';
import { cn } from '../lib/utils';

// Pre-index searchable topics with phase metadata
const searchableItems = allSteps.map(step => {
  const phase = initialPhases.find(p => p.steps.some(s => s.step_key === step.step_key));
  // Extract major sub-concepts from content
  const contentPreview = (step.content || '').replace(/```[\s\S]*?```/g, '').slice(0, 300);
  return {
    step_key: step.step_key,
    title: step.title,
    readTime: step.readTime || '10 min',
    phaseTitle: phase ? phase.title.split(':')[0] : 'Curriculum',
    phaseName: phase ? phase.title : '',
    contentPreview,
  };
});

const POPULAR_SUGGESTIONS = [
  { step_key: 'hnsw-indexing', label: 'HNSW Graph Indexing & Vector Search', phase: 'Phase 1' },
  { step_key: 'cross-encoder-reranking', label: 'Two-Stage Retrieval & Cross-Encoder Reranking', phase: 'Phase 2' },
  { step_key: 'ragas-evaluation', label: 'Golden Datasets & Ragas Benchmarking', phase: 'Phase 2' },
  { step_key: 'langgraph-crag-agent', label: 'Corrective RAG (CRAG) & LangGraph Agent', phase: 'Phase 3' },
  { step_key: 'dspy-prompt-optimization', label: 'DSPy Teleprompters & MIPROv2 Optimization', phase: 'Phase 3' },
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

  // Filter items matching query
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return searchableItems.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.step_key.toLowerCase().includes(q) ||
        item.phaseName.toLowerCase().includes(q) ||
        item.contentPreview.toLowerCase().includes(q)
      );
    }).slice(0, 8); // Top 8 most relevant matches
  }, [query]);

  // Handle item selection navigation
  const handleSelect = useCallback((stepKey) => {
    setIsOpen(false);
    navigate(`/steps/${stepKey}`);
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
        handleSelect(filteredResults[selectedIndex]?.step_key);
      } else if (!query && POPULAR_SUGGESTIONS.length > 0) {
        handleSelect(POPULAR_SUGGESTIONS[selectedIndex]?.step_key);
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
          className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card/95 border border-border/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col focus:outline-none animate-in zoom-in-95 duration-200"
        >
          <Dialog.Title className="sr-only">Command Palette: Search RAG Curriculum</Dialog.Title>

          {/* Search Header Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
            <Search className="w-5 h-5 text-primary shrink-0 animate-pulse" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search 28 modules, concepts (e.g. HNSW, Ragas, DSPy, CRAG)..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none tracking-[0.01em]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 text-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-secondary/80 text-[10px] font-mono text-muted-foreground border border-border/60">
              ESC
            </kbd>
          </div>

          {/* Search Results List */}
          <div ref={listRef} className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {query ? (
              filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={item.step_key}
                      data-selected={isSelected}
                      onClick={() => handleSelect(item.step_key)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                        isSelected
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-xs'
                          : 'text-foreground hover:bg-secondary/50'
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <BookOpen className={cn('w-4 h-4 mt-0.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="px-2 py-0.2 rounded-full bg-secondary/80 text-[10px] font-medium border border-border/50">
                              {item.phaseTitle}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.readTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className={cn('w-4 h-4 shrink-0 transition-transform duration-150', isSelected ? 'translate-x-1 text-primary' : 'opacity-0')} />
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <p>No topics found matching <span className="text-foreground font-semibold">"{query}"</span></p>
                  <p className="text-xs mt-1 text-muted-foreground/80">
                    Try searching for <span className="text-primary">chunking</span>, <span className="text-primary">hnsw</span>, <span className="text-primary">reranking</span>, or <span className="text-primary">dspy</span>.
                  </p>
                </div>
              )
            ) : (
              <div>
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Popular Modules & Architectures
                </div>
                {POPULAR_SUGGESTIONS.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={item.step_key}
                      data-selected={isSelected}
                      onClick={() => handleSelect(item.step_key)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                        isSelected
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'text-foreground hover:bg-secondary/50'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Layers className={cn('w-4 h-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded border border-border/40">
                        {item.phase}
                      </span>
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
            <span className="font-medium text-foreground/80">28 Modules</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(CommandPalette);
