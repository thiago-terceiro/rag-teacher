import { useEffect, useMemo, useState, useRef } from 'react';
import { extractHeadings } from '../lib/headings';

/**
 * High-performance active heading tracker using IntersectionObserver.
 * Runs off the main compositor thread with zero synchronous getBoundingClientRect layout reflows,
 * preventing scroll jank and mini-jumps.
 */
export function useActiveHeading(headings) {
  const [activeId, setActiveId] = useState('');
  const lastActiveRef = useRef('');

  useEffect(() => {
    if (!headings || headings.length === 0) return undefined;
    const container = document.getElementById('main-scroll-container');
    if (!container) return undefined;

    const headingIds = headings.map((h) => h.id);
    const elements = headingIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) return undefined;

    // Set initial active heading
    if (!lastActiveRef.current) {
      lastActiveRef.current = headings[0]?.id || '';
      setActiveId(lastActiveRef.current);
    }

    // High performance IntersectionObserver
    // Active reading area: between top header (-60px) and middle of screen (-65% from bottom)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Sort by top bounding rect to pick the topmost in reading view
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const newId = visible[0].target.id;
          if (newId && newId !== lastActiveRef.current) {
            lastActiveRef.current = newId;
            setActiveId(newId);
          }
        }
      },
      {
        root: container,
        rootMargin: '-60px 0px -65% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));

    // Fallback bottom-of-page detector using throttled passive scroll listener
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 20) {
            const bottomId = headings[headings.length - 1]?.id;
            if (bottomId && bottomId !== lastActiveRef.current) {
              lastActiveRef.current = bottomId;
              setActiveId(bottomId);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [headings]);

  return [activeId, setActiveId];
}

/**
 * Extracts headings from markdown memoized.
 */
export function useTableOfContents(markdown) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  return { headings };
}

