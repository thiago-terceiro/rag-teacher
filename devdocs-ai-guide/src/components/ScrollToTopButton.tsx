import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';

export function ScrollToTopButton(): React.JSX.Element {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { t } = useI18n();

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(container.scrollTop > 280);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      aria-label={t('nav.scrollToTop', 'Scroll to top')}
      title={t('nav.scrollToTop', 'Scroll to top')}
      className={cn(
        'no-print fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded-full flex items-center justify-center bg-card/95 hover:bg-card text-foreground border border-border shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary/60 hover:shadow-primary/20 active:scale-95 group',
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      )}
    >
      <ArrowUp className="w-5 h-5 text-primary group-hover:-translate-y-0.5 transition-transform duration-200" aria-hidden="true" />
    </button>
  );
}

export default React.memo(ScrollToTopButton);
