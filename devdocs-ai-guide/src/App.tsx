import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
import { StepsProvider } from './hooks/useSteps';
import { ReadingSettingsProvider } from './hooks/useReadingSettings';
import { I18nProvider } from './hooks/useI18n';
import { SandboxProvider, useSandbox } from './context/SandboxContext';

// Lazy loaded auxiliary dialogs & routes to keep critical bundle ultra-light
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const ReadingSettingsModal = lazy(() => import('./components/ReadingSettingsModal'));
const VectorVisualizer = lazy(() => import('./components/VectorVisualizer'));
const PythonSandbox = lazy(() => import('./components/PythonSandbox'));
const InterviewQuestions = lazy(() => import('./components/InterviewQuestions'));

function AppContent(): React.JSX.Element {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState<boolean>(false);
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
          onOpenSearch={handleOpenSearch}
          onOpenReadingSettings={handleOpenReadingSettings}
          onOpenVectorSandbox={openVectorSandbox}
          onOpenPythonSandbox={handleOpenPythonSandbox}
        />
        <div
          id="main-scroll-container"
          tabIndex={-1}
          role="region"
          aria-label="Main Content"
          className="flex-1 p-3.5 sm:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar max-w-full focus:outline-none"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/steps/project-setup" replace />} />
            <Route
              path="/steps/:stepKey"
              element={
                <StepView
                  onOpenVectorSandbox={openVectorSandbox}
                  onOpenPythonSandbox={handleOpenPythonSandbox}
                />
              }
            />
            <Route
              path="/interview-questions"
              element={
                <Suspense
                  fallback={
                    <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
                      Loading interview questions...
                    </div>
                  }
                >
                  <InterviewQuestions />
                </Suspense>
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
