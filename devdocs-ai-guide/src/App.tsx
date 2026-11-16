import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { Search, WifiOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
import ScrollToTopButton from './components/ScrollToTopButton';
import WidgetErrorBoundary from './components/WidgetErrorBoundary';
import { StepsProvider } from './hooks/useSteps';
import { ReadingSettingsProvider } from './hooks/useReadingSettings';
import { I18nProvider, useI18n } from './hooks/useI18n';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { SandboxProvider, useSandbox } from './context/SandboxContext';

// Lazy loaded auxiliary dialogs & routes to keep critical bundle ultra-light
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const ReadingSettingsModal = lazy(() => import('./components/ReadingSettingsModal'));
const VectorVisualizer = lazy(() => import('./components/VectorVisualizer'));
const PythonSandbox = lazy(() => import('./components/PythonSandbox'));
const InterviewQuestions = lazy(() => import('./components/InterviewQuestions'));
const ArchitectureExplorer = lazy(() => import('./components/ArchitectureExplorer'));

function AppContent(): React.JSX.Element {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState<boolean>(false);
  const [hasOpenedSearch, setHasOpenedSearch] = useState<boolean>(false);
  const [hasOpenedSettings, setHasOpenedSettings] = useState<boolean>(false);
  const [hasOpenedVector, setHasOpenedVector] = useState<boolean>(false);
  const [hasOpenedPython, setHasOpenedPython] = useState<boolean>(false);
  const location = useLocation();
  const isArchitecture = location.pathname === '/architecture';
  const { t } = useI18n();
  const { isOnline } = useNetworkStatus();
  const {
    openPythonSandbox,
    openVectorSandbox,
    isPythonSandboxOpen,
    setIsPythonSandboxOpen,
    pythonSandboxCode,
    isVectorVisualizerOpen,
    setIsVectorVisualizerOpen,
  } = useSandbox();

  if (isVectorVisualizerOpen && !hasOpenedVector) setHasOpenedVector(true);
  if (isPythonSandboxOpen && !hasOpenedPython) setHasOpenedPython(true);

  // Stable callback handlers so React.memo on Sidebar, StatsBar, and StepView is preserved
  const handleOpenPythonSandbox = useCallback(() => {
    setHasOpenedPython(true);
    openPythonSandbox(null);
  }, [openPythonSandbox]);

  const handleToggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const handleOpenSearch = useCallback(() => {
    setHasOpenedSearch(true);
    setIsCommandPaletteOpen(true);
  }, []);

  const handleOpenReadingSettings = useCallback(() => {
    setHasOpenedSettings(true);
    setIsReadingSettingsOpen(true);
  }, []);

  // Global shortcuts: Cmd/Ctrl+K for Command Palette, Escape for Mobile Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setHasOpenedSearch(true);
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  // Enforce zero window scroll displacement so top navbar is never lost on mobile touch/scroll
  useEffect(() => {
    const clampWindowScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', clampWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', clampWindowScroll);
  }, []);

  return (
    <>
      {/* Accessibility: Skip to Main Content Link */}
      <a
        href="#main-scroll-container"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:min-h-[44px] focus:inline-flex focus:items-center focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white text-xs font-semibold"
      >
        Skip to main content
      </a>

      <Suspense fallback={null}>
        {(isCommandPaletteOpen || hasOpenedSearch) && (
          <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
        )}
        {(isReadingSettingsOpen || hasOpenedSettings) && (
          <ReadingSettingsModal isOpen={isReadingSettingsOpen} setIsOpen={setIsReadingSettingsOpen} />
        )}
        {(isVectorVisualizerOpen || hasOpenedVector) && (
          <VectorVisualizer isOpen={isVectorVisualizerOpen} setIsOpen={setIsVectorVisualizerOpen} />
        )}
        {(isPythonSandboxOpen || hasOpenedPython) && (
          <PythonSandbox
            isOpen={isPythonSandboxOpen}
            setIsOpen={setIsPythonSandboxOpen}
            initialCode={pythonSandboxCode}
          />
        )}
      </Suspense>

      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenSearch={handleOpenSearch}
        onOpenVectorSandbox={openVectorSandbox}
        onOpenPythonSandbox={handleOpenPythonSandbox}
      />
      <main className="flex-1 flex flex-col min-w-0 h-full max-h-screen overflow-hidden relative">
        <StatsBar
          isMobileOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          onOpenReadingSettings={handleOpenReadingSettings}
          onOpenVectorSandbox={openVectorSandbox}
          onOpenPythonSandbox={handleOpenPythonSandbox}
        />
        {/* Search topics below top navbar, outside top navbar (hidden on /architecture) */}
        {!isArchitecture && (
          <div className="no-print border-b border-border bg-card px-4 sm:px-8 py-2 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenSearch}
              className="w-full max-w-xl min-h-[44px] flex items-center justify-between px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs text-foreground transition-colors duration-150 cursor-pointer shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                <span className="font-medium text-muted-foreground group-hover:text-foreground">{t('nav.search', 'Search 28 topics, formulas, code, theorems...')}</span>
              </div>
              <kbd aria-hidden="true" className="hidden sm:inline-block text-[10px] bg-card px-2 py-0.5 rounded-md border border-border font-mono text-foreground group-hover:border-primary/40 font-semibold shadow-xs">
                ⌘K
              </kbd>
            </button>
            {!isOnline && (
              <div className="flex items-center space-x-1.5 px-3 min-h-[44px] py-1 rounded-full bg-amber-100 border border-amber-700/40 text-amber-900 dark:bg-amber-950/60 dark:border-amber-400/40 dark:text-amber-200 text-xs font-medium shrink-0">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                <span className="text-[11px] font-semibold">{t('nav.offlineMode', 'Offline Mode')}</span>
              </div>
            )}
          </div>
        )}
        <div
          id="main-scroll-container"
          tabIndex={-1}
          role="region"
          aria-label="Main Content"
          className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto overscroll-y-contain overflow-x-hidden custom-scrollbar max-w-full focus:outline-none"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/steps/project-setup" replace />} />
            <Route
              path="/steps/:stepKey"
              element={
                <WidgetErrorBoundary fallbackTitle="Step module failed to render">
                  <StepView
                    onOpenVectorSandbox={openVectorSandbox}
                    onOpenPythonSandbox={handleOpenPythonSandbox}
                  />
                </WidgetErrorBoundary>
              }
            />
            <Route
              path="/interview-questions"
              element={
                <WidgetErrorBoundary fallbackTitle="Interview questions failed to load">
                  <Suspense
                    fallback={
                      <div className="py-20 text-center text-sm text-foreground font-medium">
                        Loading interview questions...
                      </div>
                    }
                  >
                    <InterviewQuestions />
                  </Suspense>
                </WidgetErrorBoundary>
              }
            />
            <Route
              path="/architecture"
              element={
                <WidgetErrorBoundary fallbackTitle="Architecture flow explorer failed to load">
                  <Suspense
                    fallback={
                      <div className="py-20 text-center text-sm text-foreground font-medium">
                        Loading architecture flow explorer...
                      </div>
                    }
                  >
                    <ArchitectureExplorer />
                  </Suspense>
                </WidgetErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="/steps/project-setup" replace />} />
          </Routes>
        </div>
        <ScrollToTopButton />
      </main>
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <div className="bg-background text-foreground h-full h-[100dvh] max-h-screen flex overflow-hidden selection:bg-primary/20 selection:text-primary">
      <I18nProvider>
        <ReadingSettingsProvider>
          <StepsProvider>
            <SandboxProvider>
              <Router>
                <AppContent />
              </Router>
            </SandboxProvider>
          </StepsProvider>
        </ReadingSettingsProvider>
      </I18nProvider>
    </div>
  );
}

export default App;
