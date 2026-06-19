import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const StepsContext = createContext();

export const useSteps = () => useContext(StepsContext);

export const StepsProvider = ({ children }) => {
  const [phases, setPhases] = useState([]);
  const [stats, setStats] = useState({ totalSteps: 0, completedSteps: 0, completionPercentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [phasesRes, statsRes] = await Promise.all([
        fetch('/api/phases'),
        fetch('/api/stats'),
      ]);
      if (!phasesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      const phasesData = await phasesRes.json();
      const statsData = await statsRes.json();
      setPhases(phasesData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStepProgress = useCallback(async (stepKey, status, notes) => {
    try {
      const res = await fetch(`/api/steps/${stepKey}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) {
        throw new Error('Failed to update progress');
      }
      // Refetch data to update UI
      await fetchData();
    } catch (err) {
      console.error("Failed to update step progress:", err);
      // Optionally handle error in UI
    }
  }, [fetchData]);
  
  const getStepContent = useCallback(async (stepKey) => {
    try {
        const res = await fetch(`/api/steps/${stepKey}`);
        if (!res.ok) {
            throw new Error('Failed to fetch step content');
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to fetch step content:", err);
        return null;
    }
  }, []);


  const value = {
    phases,
    stats,
    loading,
    error,
    updateStepProgress,
    getStepContent,
    refreshData: fetchData,
  };

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
};
