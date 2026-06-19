import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import StepView from './components/StepView';
import { StepsProvider } from './hooks/useSteps';

function App() {
  return (
    <div className="dark bg-background text-foreground min-h-screen flex">
      <StepsProvider>
        <Router>
          <Sidebar />
          <main className="flex-1 flex flex-col">
            <StatsBar />
            <div className="flex-1 p-6 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/steps/project-setup" />} />
                <Route path="/steps/:stepKey" element={<StepView />} />
              </Routes>
            </div>
          </main>
        </Router>
      </StepsProvider>
    </div>
  );
}

export default App;

