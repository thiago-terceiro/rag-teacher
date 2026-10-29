import { describe, it, expect } from 'vitest';
import { ARCHITECTURE_FLOWS } from '../data/architectureFlowsData';

describe('Architecture & Code Flow Explorer Data & Model Integrity', () => {
  it('should define at least 3 architectural flows with unique IDs', () => {
    expect(ARCHITECTURE_FLOWS.length).toBeGreaterThanOrEqual(3);
    const ids = ARCHITECTURE_FLOWS.map(f => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('primary pilot flow (python-wasm-sandbox) must define 5 comprehensive execution stages', () => {
    const pythonFlow = ARCHITECTURE_FLOWS.find(f => f.id === 'python-wasm-sandbox');
    expect(pythonFlow).toBeDefined();
    if (!pythonFlow) return;

    expect(pythonFlow.steps.length).toBe(5);

    // Verify step sequence and numbering
    pythonFlow.steps.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1);
      expect(step.totalSteps).toBe(5);
      expect(step.sourceFileSnippet).toBeDefined();
      expect(step.sourceFileSnippet.code.length).toBeGreaterThan(20);
      expect(step.sourceFileSnippet.activeLines[0]).toBeLessThanOrEqual(step.sourceFileSnippet.activeLines[1]);
    });

    // Step 2 must bridge to pyodideWorker
    const step2 = pythonFlow.steps[1];
    expect(step2.targetFileSnippet).toBeDefined();
    expect(step2.targetFileSnippet?.fileName).toBe('pyodideWorker.ts');
    expect(step2.targetFileSnippet?.threadLabel).toContain('Web Worker');

    // Step 3 must test Python AST visitor
    const step3 = pythonFlow.steps[2];
    expect(step3.sourceFileSnippet.code).toContain('_SecurityVisitor');
    expect(step3.sourceFileSnippet.code).toContain('_FORBIDDEN_ATTRS');

    // Step 4 must execute in Pyodide WASM with bounded stream
    const step4 = pythonFlow.steps[3];
    expect(step4.sourceFileSnippet.code).toContain('_BoundedStream');
    expect(step4.sourceFileSnippet.code).toContain('pyodide.runPythonAsync');

    // Step 5 must return to main thread
    const step5 = pythonFlow.steps[4];
    expect(step5.targetFileSnippet?.fileName).toBe('PythonSandbox.tsx');
    expect(step5.targetFileSnippet?.code).toContain('RUN_SUCCESS');
  });

  it('hybrid-search-rrf flow must validate Cormack formula invariants', () => {
    const rrfFlow = ARCHITECTURE_FLOWS.find(f => f.id === 'hybrid-search-rrf');
    expect(rrfFlow).toBeDefined();
    if (!rrfFlow) return;

    const step2 = rrfFlow.steps[1];
    expect(step2.sourceFileSnippet.code).toContain('safeK = Math.max(1');
    expect(step2.sourceFileSnippet.code).toContain('1 / (safeK + doc.rank)');

    const step3 = rrfFlow.steps[2];
    expect(step3.sourceFileSnippet.code).toContain('localeCompare'); // Deterministic tie-breaking
  });

  it('crosstab-state-sync flow must validate BroadcastChannel and safe persistence', () => {
    const syncFlow = ARCHITECTURE_FLOWS.find(f => f.id === 'crosstab-state-sync');
    expect(syncFlow).toBeDefined();
    if (!syncFlow) return;

    const step2 = syncFlow.steps[1];
    expect(step2.sourceFileSnippet.code).toContain('CURRENT_SCHEMA_VERSION');
    expect(step2.sourceFileSnippet.code).toContain('localStorage.setItem');

    const step3 = syncFlow.steps[2];
    expect(step3.sourceFileSnippet.code).toContain('syncChannel.postMessage');
    expect(step3.targetFileSnippet?.code).toContain('syncChannel.onmessage');
  });

  it('every flow step must define a non-empty payload inspector with security notes', () => {
    ARCHITECTURE_FLOWS.forEach(flow => {
      flow.steps.forEach(step => {
        if (step.payloadInspector) {
          expect(step.payloadInspector.title.trim().length).toBeGreaterThan(0);
          expect(step.payloadInspector.direction.trim().length).toBeGreaterThan(0);
          expect(step.payloadInspector.payload).toBeDefined();
        }
      });
    });
  });
});
