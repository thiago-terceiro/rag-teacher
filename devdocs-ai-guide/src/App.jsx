import { useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
import CommandPalette from './components/CommandPalette';
import ReadingSettingsModal from './components/ReadingSettingsModal';
import VectorVisualizer from './components/VectorVisualizer';
import InterviewQuestions from './components/InterviewQuestions';
import { StepsProvider } from './hooks/useSteps';
import { ReadingSettingsProvider } from './hooks/useReadingSettings';

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReadingSettingsOpen, setIsReadingSettingsOpen] = useState(false);
  const [isVectorVisualizerOpen, setIsVectorVisualizerOpen] = useState(false);

  return (
    <div className="dark bg-background text-foreground min-h-screen flex selection:bg-primary/20 selection:text-primary">
      <ReadingSettingsProvider>
        <StepsProvider>
          <Router>
            <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
            <ReadingSettingsModal isOpen={isReadingSettingsOpen} setIsOpen={setIsReadingSettingsOpen} />
            <VectorVisualizer isOpen={isVectorVisualizerOpen} setIsOpen={setIsVectorVisualizerOpen} />

            <Sidebar
              isMobileOpen={isMobileSidebarOpen}
              setIsMobileOpen={setIsMobileSidebarOpen}
              onOpenSearch={() => setIsCommandPaletteOpen(true)}
              onOpenVectorSandbox={() => setIsVectorVisualizerOpen(true)}
            />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <StatsBar
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
                onOpenSearch={() => setIsCommandPaletteOpen(true)}
                onOpenReadingSettings={() => setIsReadingSettingsOpen(true)}
                onOpenVectorSandbox={() => setIsVectorVisualizerOpen(true)}
              />
              <div id="main-scroll-container" className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/steps/project-setup" replace />} />
                  <Route path="/steps/:stepKey" element={<StepView onOpenVectorSandbox={() => setIsVectorVisualizerOpen(true)} />} />
                  <Route path="/interview-questions" element={<InterviewQuestions />} />
                  <Route path="*" element={<Navigate to="/steps/project-setup" replace />} />
                </Routes>
              </div>
            </main>
          </Router>
        </StepsProvider>
      </ReadingSettingsProvider>
    </div>
  );
}

export default App;
