import { useState, useEffect, useCallback } from 'react';
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

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState(false);
  const [isVectorVisualizerOpen, setIsVectorVisualizerOpen] = useState(false);
  const [isPythonSandboxOpen, setIsPythonSandboxOpen] = useState(false);
  const [pythonSandboxCode, setPythonSandboxCode] = useState(null);

  const handleOpenPythonSandbox = useCallback((customCode = null) => {
    setPythonSandboxCode(typeof customCode === 'string' ? customCode : null);
    setIsPythonSandboxOpen(true);
  }, []);

  useEffect(() => {
    const onCustomSandboxEvent = (e) => {
      handleOpenPythonSandbox(e.detail?.code || null);
    };
    window.addEventListener('open-python-sandbox', onCustomSandboxEvent);
    return () => window.removeEventListener('open-python-sandbox', onCustomSandboxEvent);
  }, [handleOpenPythonSandbox]);

  return (
    <div className="bg-background text-foreground min-h-screen flex selection:bg-primary/20 selection:text-primary">
      <I18nProvider>
        <ReadingSettingsProvider>
          <StepsProvider>
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
              onOpenVectorSandbox={() => setIsVectorVisualizerOpen(true)}
              onOpenPythonSandbox={() => handleOpenPythonSandbox(null)}
            />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <StatsBar
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
                onOpenSearch={() => setIsCommandPaletteOpen(true)}
                onOpenReadingSettings={() => setIsReadingSettingsOpen(true)}
                onOpenVectorSandbox={() => setIsVectorVisualizerOpen(true)}
                onOpenPythonSandbox={() => handleOpenPythonSandbox(null)}
              />
              <div id="main-scroll-container" className="flex-1 p-3.5 sm:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar max-w-full">
                <Routes>
                  <Route path="/" element={<Navigate to="/steps/project-setup" replace />} />
                  <Route
                    path="/steps/:stepKey"
                    element={
                      <StepView
                        onOpenVectorSandbox={() => setIsVectorVisualizerOpen(true)}
                        onOpenPythonSandbox={() => handleOpenPythonSandbox(null)}
                      />
                    }
                  />
                  <Route path="/interview-questions" element={<InterviewQuestions />} />
                  <Route path="*" element={<Navigate to="/steps/project-setup" replace />} />
                </Routes>
              </div>
            </main>
          </Router>
        </StepsProvider>
      </ReadingSettingsProvider>
    </I18nProvider>
  </div>
);
}

export default App;

