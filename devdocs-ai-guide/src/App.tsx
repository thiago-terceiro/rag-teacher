import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Search, WifiOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
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

  // Stable callback handlers so React.memo on Sidebar, StatsBar, and StepView is preserved
  const handleOpenPythonSandbox = useCallback(() => {
    openPythonSandbox(null);
  }, [openPythonSandbox]);

  const handleToggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const handleOpenSearch = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const handleOpenReadingSettings = useCallback(() => {
    setIsReadingSettingsOpen(true);
  }, []);

  // Global shortcuts: Cmd/Ctrl+K for Command Palette, Escape for Mobile Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  return (
    <Router>
      {/* Accessibility: Skip to Main Content Link */}
      <a
        href="#main-scroll-container"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white text-xs font-semibold"
      >
        Skip to main content
      </a>

      <Suspense fallback={null}>
        {isCommandPaletteOpen && (
          <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
        )}
        {isReadingSettingsOpen && (
          <ReadingSettingsModal isOpen={isReadingSettingsOpen} setIsOpen={setIsReadingSettingsOpen} />
        )}
        {isVectorVisualizerOpen && (
          <VectorVisualizer isOpen={isVectorVisualizerOpen} setIsOpen={setIsVectorVisualizerOpen} />
        )}
        {isPythonSandboxOpen && (
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
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <StatsBar
          isMobileOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          onOpenReadingSettings={handleOpenReadingSettings}
          onOpenVectorSandbox={openVectorSandbox}
          onOpenPythonSandbox={handleOpenPythonSandbox}
        />
        {/* Search topics below top navbar, outside top navbar */}
        <div className="no-print border-b border-border/70 bg-card/40 backdrop-blur-xs px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-full max-w-xl flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/80 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center space-x-2.5">
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              <span className="font-medium">{t('nav.search', 'Search 28 topics, formulas, code, theorems...')}</span>
            </div>
            <kbd aria-hidden="true" className="hidden sm:inline-block text-[10px] bg-background/90 px-2 py-0.5 rounded-md border border-border/80 font-mono text-muted-foreground group-hover:border-primary/40 font-semibold shadow-xs">
              ⌘K
            </kbd>
          </button>
          {!isOnline && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium shrink-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" aria-hidden="true" />
              <span className="text-[11px] font-semibold">{t('nav.offlineMode', 'Offline Mode')}</span>
            </div>
          )}
        </div>
        <div
          id="main-scroll-container"
          tabIndex={-1}
          role="region"
          aria-label="Main Content"
          className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto overflow-x-hidden custom-scrollbar max-w-full focus:outline-none"
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
                      <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
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
                      <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
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
      </main>
    </Router>
  );
}

function App(): React.JSX.Element {
  return (
    <div className="bg-background text-foreground min-h-screen flex selection:bg-primary/20 selection:text-primary">
      <I18nProvider>
        <ReadingSettingsProvider>
          <StepsProvider>
            <SandboxProvider>
              <AppContent />
            </SandboxProvider>
          </StepsProvider>
        </ReadingSettingsProvider>
      </I18nProvider>
    </div>
  );
}

export default App;
