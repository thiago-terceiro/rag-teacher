import { useState, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
import CommandPalette from './components/CommandPalette';
import ReadingSettingsModal from './components/ReadingSettingsModal';
import VectorVisualizer from './components/VectorVisualizer';
import PythonSandbox from './components/PythonSandbox';
import InterviewQuestions from './components/InterviewQuestions';
import { StepsProvider } from './hooks/useSteps';
import { ReadingSettingsProvider } from './hooks/useReadingSettings';
import { I18nProvider } from './hooks/useI18n';
import { SandboxProvider, useSandbox } from './context/SandboxContext';

function AppContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState(false);
  const {
    openPythonSandbox,
    openVectorSandbox,
    isPythonSandboxOpen,
    setIsPythonSandboxOpen,
    pythonSandboxCode,
    isVectorVisualizerOpen,
    setIsVectorVisualizerOpen,
  } = useSandbox();

  // Accessibility: Close mobile sidebar when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  return (
    <Router>
      {/* Accessibility: Skip to Main Content Link for Keyboard & Screen Reader Users */}
      <a
        href="#main-scroll-container"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white text-xs font-semibold"
      >
        Skip to main content
      </a>

      <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
      <ReadingSettingsModal isOpen={isReadingSettingsOpen} setIsOpen={setIsReadingSettingsOpen} />
      <VectorVisualizer isOpen={isVectorVisualizerOpen} setIsOpen={setIsVectorVisualizerOpen} />
      <PythonSandbox
        isOpen={isPythonSandboxOpen}
        setIsOpen={setIsPythonSandboxOpen}
        initialCode={pythonSandboxCode}
      />

      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenVectorSandbox={openVectorSandbox}
        onOpenPythonSandbox={() => openPythonSandbox(null)}
      />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <StatsBar
          isMobileOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenReadingSettings={() => setIsReadingSettingsOpen(true)}
          onOpenVectorSandbox={openVectorSandbox}
          onOpenPythonSandbox={() => openPythonSandbox(null)}
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
                  onOpenPythonSandbox={() => openPythonSandbox(null)}
                />
              }
            />
            <Route path="/interview-questions" element={<InterviewQuestions />} />
            <Route path="*" element={<Navigate to="/steps/project-setup" replace />} />
          </Routes>
        </div>
      </main>
    </Router>
  );
}

function App() {
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
