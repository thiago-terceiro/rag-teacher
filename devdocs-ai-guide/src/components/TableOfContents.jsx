import { useState } from 'react';
import { AlignLeft, ArrowUp, ChevronDown, ListTree } from 'lucide-react';
import { scrollToHeading } from '../lib/headings';
import { cn } from '../lib/utils';

const MIN_HEADINGS = 3;

function jump(e, id, setActiveId) {
  e.preventDefault();
  if (scrollToHeading(id)) setActiveId(id);
}

/** Collapsible "On this page" panel shown above the content below the xl breakpoint. */
export function TableOfContentsMobile({ headings, activeId, setActiveId }) {
  const [open, setOpen] = useState(false);
  if (headings.length < MIN_HEADINGS) return null;

  return (
    <div className="xl:hidden mb-8 rounded-xl border border-border/80 bg-card/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="toc-mobile-list"
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-primary" />
          On this page
          <span className="text-xs font-medium text-muted-foreground">({headings.length})</span>
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <nav id="toc-mobile-list" aria-label="On this page" className="px-2 pb-2 pt-1 border-t border-border/50 max-h-80 overflow-y-auto">
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={(e) => {
                jump(e, h.id, setActiveId);
                setOpen(false);
              }}
              aria-current={activeId === h.id ? 'location' : undefined}
              className={cn(
                'block py-1.5 px-3 rounded-md text-[13px] leading-snug transition-colors',
                h.level === 3 && 'pl-7 text-[12.5px]',
                activeId === h.id
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {h.text}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Sticky right-rail TOC with an active-section indicator (xl and up). */
export function TableOfContentsDesktop({ headings, activeId, setActiveId }) {
  if (headings.length < MIN_HEADINGS) return null;

  const scrollTop = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
    window.history.replaceState(window.history.state, '', window.location.pathname);
  };

  return (
    <aside aria-label="On this page" className="hidden xl:flex flex-col w-60 shrink-0 sticky top-2 max-h-[calc(100vh-7rem)] self-start">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        <AlignLeft className="w-3.5 h-3.5 text-primary" />
        On this page
      </div>

      <nav className="min-h-0 overflow-y-auto overscroll-contain border-l border-border/60 pr-2">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={(e) => jump(e, h.id, setActiveId)}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'relative -ml-px block border-l-2 py-1 leading-snug transition-colors duration-150',
                h.level === 3 ? 'pl-6 text-[12.5px]' : 'pl-3.5 text-[13px]',
                active
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {h.text}
            </a>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={scrollTop}
        className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        Back to top
      </button>
    </aside>
  );
}
