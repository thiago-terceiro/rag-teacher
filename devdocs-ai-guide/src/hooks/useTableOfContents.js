import { useEffect, useMemo, useState } from 'react';
import { extractHeadings } from '../lib/headings';

const ACTIVE_OFFSET_PX = 120;

/**
 * Builds the TOC for a markdown document and tracks which section is being read.
 * Scroll-spy runs on rAF against #main-scroll-container (the app's scroll root):
 * the active heading is the last one whose top has passed ACTIVE_OFFSET_PX,
 * and the final heading activates when the reader hits the bottom.
 */
export function useTableOfContents(markdown) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container || headings.length === 0) return undefined;

    const elements = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const threshold = container.getBoundingClientRect().top + ACTIVE_OFFSET_PX;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;

      let current = elements[0]?.id ?? '';
      if (atBottom && elements.length) {
        current = elements[elements.length - 1].id;
      } else {
        for (const el of elements) {
          if (el.getBoundingClientRect().top <= threshold) current = el.id;
          else break;
        }
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [headings]);

  return { headings, activeId, setActiveId };
}
