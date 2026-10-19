import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const defaultActions = {
  openPythonSandbox: () => {},
  openVectorSandbox: () => {},
};

const defaultState = {
  isPythonSandboxOpen: false,
  setIsPythonSandboxOpen: () => {},
  pythonSandboxCode: null,
  isVectorVisualizerOpen: false,
  setIsVectorVisualizerOpen: () => {},
};

const SandboxActionsContext = createContext(defaultActions);
const SandboxStateContext = createContext(defaultState);

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

  // Stable actions value — never changes across re-renders
  const actionsValue = useMemo(() => ({
    openPythonSandbox,
    openVectorSandbox,
  }), [openPythonSandbox, openVectorSandbox]);

  // State value — only updates when sandbox visibility or code changes
  const stateValue = useMemo(() => ({
    isPythonSandboxOpen,
    setIsPythonSandboxOpen,
    pythonSandboxCode,
    isVectorVisualizerOpen,
    setIsVectorVisualizerOpen,
  }), [isPythonSandboxOpen, pythonSandboxCode, isVectorVisualizerOpen]);

  return (
    <SandboxActionsContext value={actionsValue}>
      <SandboxStateContext value={stateValue}>
        {children}
      </SandboxStateContext>
    </SandboxActionsContext>
  );
}

/** Hook for action-only consumers (e.g. CodeBlock) to prevent re-rendering on sandbox toggle */
export function useSandboxActions() {
  const context = useContext(SandboxActionsContext);
  return context || defaultActions;
}

/** Hook for sandbox modal consumers */
export function useSandboxState() {
  const context = useContext(SandboxStateContext);
  return context || defaultState;
}

/** Combined hook for backwards compatibility */
export function useSandbox() {
  const actions = useSandboxActions();
  const state = useSandboxState();
  return useMemo(() => ({
    ...actions,
    ...state,
  }), [actions, state]);
}
