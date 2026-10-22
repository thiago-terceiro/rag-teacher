import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SandboxActionsContextType, SandboxStateContextType, SandboxContextType } from '../types';

const defaultActions: SandboxActionsContextType = {
  openPythonSandbox: () => {},
  openVectorSandbox: () => {},
};

const defaultState: SandboxStateContextType = {
  isPythonSandboxOpen: false,
  setIsPythonSandboxOpen: () => {},
  pythonSandboxCode: null,
  isVectorVisualizerOpen: false,
  setIsVectorVisualizerOpen: () => {},
};

const SandboxActionsContext = createContext<SandboxActionsContextType>(defaultActions);
const SandboxStateContext = createContext<SandboxStateContextType>(defaultState);

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const [isPythonSandboxOpen, setIsPythonSandboxOpen] = useState<boolean>(false);
  const [pythonSandboxCode, setPythonSandboxCode] = useState<string | null>(null);
  const [isVectorVisualizerOpen, setIsVectorVisualizerOpen] = useState<boolean>(false);

  const openPythonSandbox = useCallback((customCode: string | null = null) => {
    setPythonSandboxCode(typeof customCode === 'string' ? customCode : null);
    setIsPythonSandboxOpen(true);
  }, []);

  const openVectorSandbox = useCallback(() => {
    setIsVectorVisualizerOpen(true);
  }, []);

  // Stable actions value — never changes across re-renders
  const actionsValue = useMemo<SandboxActionsContextType>(() => ({
    openPythonSandbox,
    openVectorSandbox,
  }), [openPythonSandbox, openVectorSandbox]);

  // State value — only updates when sandbox visibility or code changes
  const stateValue = useMemo<SandboxStateContextType>(() => ({
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
export function useSandboxActions(): SandboxActionsContextType {
  const context = useContext(SandboxActionsContext);
  return context || defaultActions;
}

/** Hook for sandbox modal consumers */
export function useSandboxState(): SandboxStateContextType {
  const context = useContext(SandboxStateContext);
  return context || defaultState;
}

/** Combined hook for backwards compatibility */
export function useSandbox(): SandboxContextType {
  const actions = useSandboxActions();
  const state = useSandboxState();
  return useMemo(() => ({
    ...actions,
    ...state,
  }), [actions, state]);
}
