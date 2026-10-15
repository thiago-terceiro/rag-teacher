import React, { memo } from 'react';
import { Menu, RotateCcw, BookOpen, Eye, Search, Download } from 'lucide-react';
import { useSteps } from '../hooks/useSteps';
import { useScrollProgress } from '../hooks/useScrollProgress';
import ProgressRing from './ProgressRing';

const StatsBar = ({ onToggleMobileSidebar, onOpenSearch }) => {
  const { stats, loading, resetAllProgress, exportStudyGuide } = useSteps();
  const scrollProgress = useScrollProgress('main-scroll-container');

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your learning progress and notes?")) {
      resetAllProgress();
    }
  };

  if (loading) {
    return <header className="h-16 border-b border-border flex items-center px-6 text-sm text-muted-foreground">Loading progress...</header>;
  }

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 relative select-none">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Interactive Masterclass</span>
          <span>•</span>
          <span>28 Production Modules</span>
        </div>

        {/* Live Reading Scroll Badge */}
        {scrollProgress > 0.02 && (
          <div className="hidden md:flex items-center space-x-1.5 text-[11px] font-medium text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full border border-border/70 animate-in fade-in duration-200">
            <Eye className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>{Math.round(scrollProgress * 100)}% read</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Search / Command Palette Trigger */}
        <button
          onClick={onOpenSearch}
          aria-label="Search curriculum"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/70 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer group shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="hidden md:inline font-medium">Search topics...</span>
          <span className="md:hidden font-medium">Search</span>
          <kbd className="hidden sm:inline-block text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/80 font-mono text-muted-foreground ml-1.5 group-hover:border-primary/40">
            ⌘K
          </kbd>
        </button>

        {/* Export Notes / Study Guide */}
        <button
          onClick={exportStudyGuide}
          title="Export your notes and study guide (.md)"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs transition-colors flex items-center space-x-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline font-medium">Export</span>
        </button>

        {/* Reset progress */}
        {stats.completedSteps > 0 && (
          <button
            onClick={handleReset}
            title="Reset all progress"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        )}

        {/* Progress Ring & Stats */}
        <div className="flex items-center space-x-3 bg-secondary/30 py-1 px-3 rounded-full border border-border">
          <ProgressRing value={stats.completionPercentage} />
          <div className="text-left">
            <div className="text-xs font-bold text-foreground">
              {stats.completedSteps} / {stats.totalSteps}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Completed
            </div>
          </div>
        </div>

        {/* GitHub link */}
        <a
          href="https://github.com/thiago-terceiro/rag-teacher"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source code on GitHub"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>

      {/* Sleek Hardware-Accelerated Neon Reading Scroll Progress Bar */}
      <div className="absolute -bottom-[1px] left-0 right-0 h-[2.5px] bg-border/40 overflow-hidden pointer-events-none">
        <div
          id="header-scroll-progress-bar"
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </header>
  );
};

export default React.memo(StatsBar);
