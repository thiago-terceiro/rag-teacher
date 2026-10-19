import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const defaultSandboxContext = {
  openPythonSandbox: () => {},
  openVectorSandbox: () => {},
  isPythonSandboxOpen: false,
  setIsPythonSandboxOpen: () => {},
  pythonSandboxCode: null,
  isVectorVisualizerOpen: false,
  setIsVectorVisualizerOpen: () => {},
};

const SandboxContext = createContext(defaultSandboxContext);

export function SandboxProvider({ children }) {
  const [isPythonSandboxOpen, setIsPythonSandboxOpen] = useState(false);
  const [pythonSandboxCode, setPythonSandboxCode] = useState(null);
  const [isVectorVisualizerOpen, setIsVectorVisualizerOpen] = useState(false);

  const openPythonSandbox = useCallback((customCode = null) => {
    setPythonSandboxCode(typeof customCode === 'string' ? customCode : null);
    setIsPythonSandboxOpen(true);
  }, []);

  const openVectorSandbox = useCallback(() => {
    setIsVectorVisualizerOpen(true);
  }, []);

  const value = useMemo(() => ({
    openPythonSandbox,
    openVectorSandbox,
    isPythonSandboxOpen,
    setIsPythonSandboxOpen,
    pythonSandboxCode,
    isVectorVisualizerOpen,
    setIsVectorVisualizerOpen,
  }), [openPythonSandbox, openVectorSandbox, isPythonSandboxOpen, pythonSandboxCode, isVectorVisualizerOpen]);

  return (
    <SandboxContext value={value}>
      {children}
    </SandboxContext>
  );
}

export function useSandbox() {
  const context = useContext(SandboxContext);
  return context || defaultSandboxContext;
}
