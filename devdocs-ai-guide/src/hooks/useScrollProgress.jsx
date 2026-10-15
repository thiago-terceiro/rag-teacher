import { useEffect, useState } from 'react';

/**
 * useScrollProgress
 * High-performance hook tracking scroll progress of a scrollable container
 * using requestAnimationFrame to ensure smooth 60fps / 120fps GPU performance.
 */
export const useScrollProgress = (targetId = 'main-scroll-container') => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = document.getElementById(targetId);
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const maxScroll = scrollHeight - clientHeight;
          const currentProgress = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;
          setProgress(currentProgress);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initial evaluation
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [targetId]);

  return progress;
};

export default useScrollProgress;
