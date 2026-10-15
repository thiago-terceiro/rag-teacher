import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlignLeft, ChevronDown, ChevronUp, ArrowUp, Compass } from 'lucide-react';
import { slugify } from './MarkdownRenderer';
import { cn } from '../lib/utils';

/**
 * Extracts H2 and H3 headings from markdown content, stripping code blocks
 */
export function extractHeadings(markdown) {
  if (!markdown) return [];

  // Strip code blocks so comments like `## step 1` aren't captured
  const codeBlockRegex = /```[\s\S]*?```/g;
  const strippedContent = markdown.replace(codeBlockRegex, '');

  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(strippedContent)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();

    // Strip markdown formatting: `code`, **bold**, *italic*, [link](url), LaTeX $...$
    const cleanText = rawText
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\$([^$]+)\$/g, '$1')
      .trim();

    const id = slugify(cleanText);
    if (id) {
      headings.push({ level, text: cleanText, id });
    }
  }

  return headings;
}

/**
 * Hook to manage headings, active section tracking, and scroll jumping
 */
export function useTableOfContents(markdown) {
  const [activeId, setActiveId] = useState('');
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);

  const scrollToHeading = useCallback((e, id) => {
    if (e) e.preventDefault();
    const container = document.getElementById('main-scroll-container');
    const element = document.getElementById(id);

    if (element && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top + container.scrollTop - 24;

      container.scrollTo({
        top: offset,
        behavior: 'smooth',
      });

      setActiveId(id);
      history.replaceState(null, '', `#${id}`);
    } else if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveId(headings[0]?.id || '');
    history.replaceState(null, '', window.location.pathname);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    let rafId = null;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const containerRect = container.getBoundingClientRect();
        const threshold = containerRect.top + 130;

        let currentActive = headings[0]?.id;

        for (let i = 0; i < headings.length; i++) {
          const el = document.getElementById(headings[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= threshold) {
              currentActive = headings[i].id;
            } else {
              break;
            }
          }
        }

        if (currentActive) {
          setActiveId(currentActive);
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [headings]);

  return { headings, activeId, scrollToHeading, scrollToTop };
}

/**
 * Mobile / Tablet Collapsible Quick Jump Drawer
 */
export const TableOfContentsMobile = React.memo(({ headings, activeId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!headings || headings.length < 2) return null;

  return (
    <div className="xl:hidden mb-8 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-xs">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-secondary/40 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-primary animate-pulse" />
          <span>On This Page</span>
          <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] font-medium text-muted-foreground border border-border/50">
            {headings.length} sections
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <nav className="p-3 pt-1 border-t border-border/50 max-h-72 overflow-y-auto space-y-1 bg-secondary/20">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(e) => {
                  onSelect(e, heading.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'block py-1.5 px-3 rounded-lg text-xs transition-all duration-150',
                  heading.level === 3 ? 'ml-3 text-[11px]' : 'font-medium',
                  isActive
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                {heading.text}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
});

/**
 * Desktop Sticky Sidebar TOC
 */
export const TableOfContentsDesktop = React.memo(({
  headings,
  activeId,
  onSelect,
  onScrollToTop,
  title = 'On This Page',
}) => {
  if (!headings || headings.length < 2) return null;

  return (
    <aside
      aria-label="Table of contents"
      className="hidden xl:block w-64 shrink-0 self-start sticky top-4 max-h-[calc(100vh-6rem)] flex flex-col justify-between"
    >
      <div className="overflow-y-auto pr-3 py-1 custom-scrollbar">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border/60">
          <div className="flex items-center space-x-2">
            <AlignLeft className="w-3.5 h-3.5 text-primary" />
            <span>{title}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/80">
            {headings.length}
          </span>
        </div>

        <nav className="space-y-0.5 border-l border-border/60 relative">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(e) => onSelect(e, heading.id)}
                title={heading.text}
                className={cn(
                  'block text-left transition-all duration-150 relative truncate group',
                  heading.level === 3
                    ? 'pl-6 pr-2 py-1 text-[12px]'
                    : 'pl-3.5 pr-2 py-1.5 text-[13px]',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)] rounded-r" />
                )}
                <span className="group-hover:translate-x-0.5 transition-transform duration-150 inline-block truncate max-w-full">
                  {heading.text}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 mt-2 border-t border-border/60 pr-3">
        <button
          onClick={onScrollToTop}
          className="flex items-center space-x-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer group py-1"
        >
          <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          <span>Back to top</span>
        </button>
      </div>
    </aside>
  );
});

const TableOfContents = ({ markdown, title }) => {
  const { headings, activeId, scrollToHeading, scrollToTop } = useTableOfContents(markdown);

  return (
    <>
      <TableOfContentsMobile
        headings={headings}
        activeId={activeId}
        onSelect={scrollToHeading}
      />
      <TableOfContentsDesktop
        headings={headings}
        activeId={activeId}
        onSelect={scrollToHeading}
        onScrollToTop={scrollToTop}
        title={title}
      />
    </>
  );
};

export default React.memo(TableOfContents);
