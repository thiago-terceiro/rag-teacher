import React from 'react';
import {
  Menu,
  BookOpen,
  HelpCircle,
  Compass,
  Terminal,
  Workflow,
  Sliders,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';

export interface StatsBarProps {
  isMobileOpen?: boolean;
  onToggleMobileSidebar: () => void;
  onOpenReadingSettings: () => void;
  onOpenVectorSandbox?: () => void;
  onOpenPythonSandbox?: () => void;
}

const ScrollProgressBar = React.memo(function ScrollProgressBar(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="absolute -bottom-[1px] left-0 right-0 h-[2.5px] bg-border/40 overflow-hidden pointer-events-none">
      <div
        id="header-scroll-progress-bar"
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.8)] will-change-transform"
        style={{
          transform: 'scaleX(0)',
          transformOrigin: 'left',
        }}
      />
    </div>
  );
});

const StatsBar = ({
  isMobileOpen: isMobileOpenProp,
  onToggleMobileSidebar,
  onOpenReadingSettings,
  onOpenVectorSandbox,
  onOpenPythonSandbox,
}: StatsBarProps): React.JSX.Element => {
  const isMobileOpen = isMobileOpenProp ?? false;
  const { t } = useI18n();
  const location = useLocation();

  const isCurriculumActive = location.pathname.startsWith('/steps') || location.pathname === '/';
  const isInterviewActive = location.pathname === '/interview-questions';
  const isArchitectureActive = location.pathname === '/architecture';

  return (
    <header className="no-print h-16 shrink-0 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-4 xl:px-6 sticky top-0 z-30 relative select-none max-w-full overflow-hidden">
      {/* Left side: Hamburger button on <1000px, or page links on >=1000px */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1 overflow-hidden">
        {/* Mobile Hamburger Toggle (<1000px) */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileOpen}
          aria-controls="curriculum-sidebar"
          className="p-1.5 sm:p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground min-[1000px]:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand / Context Title on Mobile (<1000px) */}
        <div className="min-[1000px]:hidden flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold text-foreground min-w-0 truncate">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{t('nav.masterclass', 'Interactive Masterclass')}</span>
        </div>

        {/* Navigation Links (Desktop viewports >= 1000px) */}
        <nav aria-label="Main Navigation" className="hidden min-[1000px]:flex items-center space-x-1 xl:space-x-1.5 2xl:space-x-2 min-w-0">
          {/* Curriculum */}
          <Link
            to="/"
            className={cn(
              'flex items-center space-x-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0',
              isCurriculumActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <BookOpen className={cn('w-4 h-4 shrink-0', isCurriculumActive ? 'text-primary-foreground' : 'text-primary')} />
            <span>{t('nav.curriculum', 'Curriculum')}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold hidden 2xl:inline-block',
                isCurriculumActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
              )}
            >
              28
            </span>
          </Link>

          {/* Interview Questions */}
          <Link
            to="/interview-questions"
            className={cn(
              'flex items-center space-x-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0',
              isInterviewActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <HelpCircle className={cn('w-4 h-4 shrink-0', isInterviewActive ? 'text-primary-foreground' : 'text-primary')} />
            <span className="hidden xl:inline">{t('nav.interview', 'Interview Questions')}</span>
            <span className="xl:hidden">{t('nav.interviewShort', 'Interviews')}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold hidden 2xl:inline-block',
                isInterviewActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
              )}
            >
              28
            </span>
          </Link>

          {/* Architecture Flow */}
          <Link
            to="/architecture"
            className={cn(
              'flex items-center space-x-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0',
              isArchitectureActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <Workflow className={cn('w-4 h-4 shrink-0', isArchitectureActive ? 'text-primary-foreground' : 'text-amber-400')} />
            <span className="hidden xl:inline">{t('nav.architecture', 'Architecture Flow')}</span>
            <span className="xl:hidden">{t('nav.architectureShort', 'Architecture')}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold hidden 2xl:inline-block',
                isArchitectureActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
              )}
            >
              Live Map
            </span>
          </Link>

          {/* Python Lab */}
          {onOpenPythonSandbox && (
            <button
              type="button"
              onClick={onOpenPythonSandbox}
              title="Launch In-Browser Pyodide Python Sandbox"
              className="flex items-center space-x-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer shrink-0"
            >
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('nav.pythonLab', 'Python Lab')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono hidden 2xl:inline-block">
                Pyodide
              </span>
            </button>
          )}

          {/* Vector Sandbox */}
          {onOpenVectorSandbox && (
            <button
              type="button"
              onClick={onOpenVectorSandbox}
              title="Interactive 2D Vector Distance Visualizer Sandbox"
              className="flex items-center space-x-1.5 px-2 xl:px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer shrink-0"
            >
              <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden xl:inline">{t('nav.vectorSandbox', 'Vector Sandbox')}</span>
              <span className="xl:hidden">{t('nav.vectorShort', 'Vectors')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary border border-border text-muted-foreground font-mono hidden 2xl:inline-block">
                2D Math
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Right side: Only Display & Accessibility button */}
      <div className="flex items-center space-x-2 shrink-0 ml-2">
        <button
          type="button"
          onClick={onOpenReadingSettings}
          title={t('nav.displayA11y', 'Display & Accessibility')}
          className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/70 text-xs font-medium text-foreground transition-all cursor-pointer shadow-2xs hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="hidden xl:inline font-semibold">{t('nav.displayA11y', 'Display & Accessibility')}</span>
          <span className="xl:hidden font-semibold">{t('nav.display', 'Display')}</span>
        </button>
      </div>

      {/* Sleek Hardware-Accelerated Reading Scroll Progress Bar */}
      <ScrollProgressBar />
    </header>
  );
};

export default React.memo(StatsBar);
