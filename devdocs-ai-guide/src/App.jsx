import { useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
import { StepsProvider } from './hooks/useSteps';

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="dark bg-background text-foreground min-h-screen flex selection:bg-primary/20 selection:text-primary">
      <StepsProvider>
        <Router>
          <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
          <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <StatsBar onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)} />
            <div id="main-scroll-container" className="flex-1 p-4 sm:p-8 overflow-y-auto scroll-smooth">
              <Routes>
                <Route path="/" element={<Navigate to="/steps/project-setup" replace />} />
                <Route path="/steps/:stepKey" element={<StepView />} />
                <Route path="*" element={<Navigate to="/steps/project-setup" replace />} />
              </Routes>
            </div>
          </main>
        </Router>
      </StepsProvider>
    </div>
  );
}

export default App;
