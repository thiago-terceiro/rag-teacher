import React from 'react';
import {
  Menu,
  RotateCcw,
  BookOpen,
  Eye,
  Search,
  Download,
  HelpCircle,
  Compass,
  Type,
  WifiOff,
  DownloadCloud,
  Terminal,
  Printer,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSteps } from '../hooks/useSteps';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSandboxActions } from '../context/SandboxContext';
import { useI18n } from '../hooks/useI18n';
import ProgressRing from './ProgressRing';

export interface StatsBarProps {
  isMobileOpen?: boolean;
  onToggleMobileSidebar: () => void;
  onOpenSearch: () => void;
  onOpenReadingSettings: () => void;
  onOpenVectorSandbox?: () => void;
  onOpenPythonSandbox?: () => void;
}

const ScrollBadge = React.memo(function ScrollBadge(): React.JSX.Element | null {
  const scrollProgress = useScrollProgress('main-scroll-container');
  const { t } = useI18n();
  if (scrollProgress <= 0.02) return null;
  const percentText = t('nav.readPercent', '{percent}% read').replace(
    '{percent}',
    String(Math.round(scrollProgress * 100))
  );

  return (
    <div className="hidden md:flex items-center space-x-1.5 text-[11px] font-medium text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full border border-border/70 animate-in fade-in duration-200">
      <Eye className="w-3.5 h-3.5 text-primary animate-pulse" />
      <span>{percentText}</span>
    </div>
  );
});

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
  onOpenSearch,
  onOpenReadingSettings,
  onOpenVectorSandbox: onOpenVectorProp,
  onOpenPythonSandbox: onOpenPythonProp,
}: StatsBarProps): React.JSX.Element => {
  const isMobileOpen = isMobileOpenProp ?? false;
  const { stats, resetAllProgress, exportStudyGuide } = useSteps();
  const { isOnline, canInstall, promptInstall } = useNetworkStatus();
  const { openPythonSandbox, openVectorSandbox } = useSandboxActions();
  const { t } = useI18n();

  const handleOpenPython = onOpenPythonProp ?? (() => openPythonSandbox(null));
  const handleOpenVector = onOpenVectorProp ?? openVectorSandbox;

  const handleReset = () => {
    const confirmMsg = t(
      'nav.resetConfirm',
      'Are you sure you want to reset your learning progress, quiz scores, and notes?'
    );
    if (window.confirm(confirmMsg)) {
      resetAllProgress();
    }
  };

  return (
    <header className="no-print h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 relative select-none max-w-full overflow-hidden">
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileOpen}
          aria-controls="curriculum-sidebar"
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground lg:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{t('nav.masterclass', 'Interactive Masterclass')}</span>
          <span>•</span>
          <span>{t('nav.modules', '28 Production Modules')}</span>
        </div>

        {/* Live Reading Scroll Badge */}
        <ScrollBadge />
      </div>

      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Offline Connectivity Warning */}
        {!isOnline && (
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium"
            title="You are offline. All 28 modules, formulas, diagrams, and notes are available offline."
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold">{t('nav.offlineMode', 'Offline Mode')}</span>
          </div>
        )}

        {/* PWA Install Button */}
        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            title={t('nav.install', 'Install RAG Teacher as an offline Progressive Web App')}
            aria-label={t('nav.install', 'Install application offline')}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>{t('nav.install', 'Install')}</span>
          </button>
        )}

        {/* Quick Search / Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/70 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer group shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="hidden md:inline font-medium">{t('nav.search', 'Search topics...')}</span>
          <span className="md:hidden font-medium">{t('nav.searchShort', 'Search')}</span>
          <kbd aria-hidden="true" className="hidden sm:inline-block text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/80 font-mono text-muted-foreground ml-1.5 group-hover:border-primary/40">
            ⌘K
          </kbd>
        </button>

        {/* Interview Questions */}
        <Link
          to="/interview-questions"
          title="System Design Interview Scenarios (28 Questions)"
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/70 hover:border-primary/40 transition-colors shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span className="hidden xl:inline font-medium">{t('nav.interview', 'Interview Questions')}</span>
          <span className="xl:hidden font-medium">Interview</span>
          <span aria-hidden="true" className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full font-bold">28</span>
        </Link>

        {/* In-Browser Python Sandbox */}
        <button
          type="button"
          onClick={handleOpenPython}
          title="In-Browser Python RAG Sandbox (Isolated Pyodide Web Worker)"
          aria-label={t('nav.pythonLab', 'Open Python Sandbox Lab')}
          className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/70 hover:border-emerald-400/40 transition-colors cursor-pointer shadow-2xs"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">{t('nav.pythonLab', 'Python Lab')}</span>
        </button>

        {/* Vector Distance Visualizer Sandbox */}
        <button
          type="button"
          onClick={handleOpenVector}
          title="Interactive 2D Vector Distance Visualizer Sandbox"
          aria-label={t('nav.vectorSandbox', 'Open Vector Visualizer Sandbox')}
          className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/70 hover:border-indigo-400/40 transition-colors cursor-pointer shadow-2xs"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">{t('nav.vectorSandbox', 'Vector Sandbox')}</span>
        </button>

        {/* Reading Settings / Display */}
        <button
          type="button"
          onClick={onOpenReadingSettings}
          title="Theme presets, reading comfort & typography settings"
          aria-label={t('settings.title', 'Display and language settings')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer shrink-0 min-h-[38px] min-w-[38px]"
        >
          <Type className="w-4 h-4" />
          <span className="hidden 2xl:inline font-medium">{t('nav.display', 'Display')}</span>
        </button>

        {/* Save as PDF / Print Handbook */}
        <button
          type="button"
          onClick={() => window.print()}
          title="Save current module as a formatted PDF handbook chapter"
          aria-label={t('settings.savePdf', 'Save current chapter as PDF')}
          className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs transition-colors items-center space-x-1 cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline font-medium">{t('nav.pdf', 'PDF')}</span>
        </button>

        {/* Export Notes / Study Guide */}
        <button
          type="button"
          onClick={exportStudyGuide}
          title={t('nav.exportStudyGuide', 'Export your notes and study guide (.md)')}
          aria-label={t('nav.exportStudyGuide', 'Export study guide notes')}
          className="hidden sm:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs transition-colors items-center space-x-1 cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline font-medium">{t('nav.export', 'Export')}</span>
        </button>

        {/* Reset progress */}
        {(stats.completedSteps > 0 || stats.answeredQuizQuestions > 0) && (
          <button
            type="button"
            onClick={handleReset}
            title={t('nav.resetProgress', 'Reset all progress & quiz scores')}
            aria-label={t('nav.resetProgress', 'Reset learning progress')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer shrink-0 min-h-[38px] min-w-[38px]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Comprehension Score Badge */}
        {stats.comprehensionScore !== null && (
          <div
            title={`Comprehension Score: ${stats.correctQuizQuestions}/${stats.answeredQuizQuestions} quiz questions answered correctly`}
            className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1 px-2.5 rounded-full text-xs font-mono font-bold shrink-0"
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{stats.comprehensionScore}%</span>
          </div>
        )}

        {/* Progress Ring & Stats */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 bg-secondary/30 py-1 px-2 sm:px-3 rounded-full border border-border shrink-0">
          <ProgressRing value={stats.completionPercentage} />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-foreground">
              {stats.completedSteps} / {stats.totalSteps}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {t('nav.completed', 'Completed')}
            </div>
          </div>
        </div>

        {/* GitHub link */}
        <a
          href="https://github.com/thiago-terceiro/rag-teacher"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source code on GitHub"
          className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0 flex items-center justify-center"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>

      {/* Sleek Hardware-Accelerated Neon Reading Scroll Progress Bar */}
      <ScrollProgressBar />
    </header>
  );
};

export default React.memo(StatsBar);
