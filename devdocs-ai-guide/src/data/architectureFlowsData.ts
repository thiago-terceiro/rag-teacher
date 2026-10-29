/**
 * architectureFlowsData.ts
 * 
 * Declarative architectural flow definitions for the Interactive Architecture
 * and Code Flow Explorer. Models system components, thread contexts, code snippets,
 * function call borders, connection vectors, and serialized runtime payloads.
 */

export interface CodeBlockHighlight {
  fileName: string;
  filePath: string;
  language: 'typescript' | 'python' | 'json';
  threadLabel: string;
  threadType: 'main' | 'worker' | 'storage' | 'math';
  code: string;
  activeFunction: string;
  activeLines: [number, number]; // 1-based start and end line
  callRole: 'caller' | 'callee' | 'evaluator' | 'state-sync';
}

export interface ArchitectureFlowStep {
  stepId: string;
  stepNumber: number;
  totalSteps: number;
  stageName: string;
  titleKey: string;
  titleDefault: string;
  descriptionKey: string;
  descriptionDefault: string;
  badgeText: string;
  sourceFileSnippet: CodeBlockHighlight;
  targetFileSnippet?: CodeBlockHighlight;
  payloadInspector?: {
    title: string;
    direction: string;
    payload: Record<string, unknown> | unknown[] | string;
    securityNotes?: string[];
  };
  connectionLabel?: string;
}

export interface ArchitectureFlow {
  id: string;
  titleKey: string;
  titleDefault: string;
  categoryKey: string;
  categoryDefault: string;
  summaryKey: string;
  summaryDefault: string;
  triggerButtonLabel: string;
  mockUI: {
    componentName: string;
    description: string;
    actionLabel: string;
    sampleInput?: string;
  };
  steps: ArchitectureFlowStep[];
}

export const ARCHITECTURE_FLOWS: ArchitectureFlow[] = [
  {
    id: 'python-wasm-sandbox',
    titleKey: 'arch.flow.python.title',
    titleDefault: 'Python Sandbox & Isolated WASM Execution',
    categoryKey: 'arch.flow.python.category',
    categoryDefault: 'WebAssembly & Security Isolation',
    summaryKey: 'arch.flow.python.summary',
    summaryDefault: 'Follow a user click on "Run Python" through the UI thread, across the Web Worker boundary, through the AST security scanner, into Pyodide WASM, and back to the reactive UI output state.',
    triggerButtonLabel: 'Simulate "Run Python" Click',
    mockUI: {
      componentName: 'PythonSandbox.tsx',
      description: 'Modal code playground with Monaco-style editor and execution controls',
      actionLabel: 'Run Python (Ctrl+Enter)',
      sampleInput: `import numpy as np\nv = np.array([0.7071, 0.7071])\nprint("Dot product:", np.dot(v, v))`,
    },
    steps: [
      {
        stepId: 'py-step-1',
        stepNumber: 1,
        totalSteps: 5,
        stageName: '1. UI Trigger & Watchdog',
        titleKey: 'arch.flow.python.step1.title',
        titleDefault: 'UI Click Event & Watchdog Initialization',
        descriptionKey: 'arch.flow.python.step1.desc',
        descriptionDefault: 'User triggers code execution. PythonSandbox sets an atomic execution lock (isExecutingRef) to prevent duplicate runs, updates worker status to "running", and primes a 10s watchdog timeout.',
        badgeText: 'Main Thread UI Event',
        sourceFileSnippet: {
          fileName: 'PythonSandbox.tsx',
          filePath: 'src/components/PythonSandbox.tsx',
          language: 'typescript',
          threadLabel: 'Main UI Thread',
          threadType: 'main',
          activeFunction: 'handleRunClick()',
          activeLines: [3, 14],
          callRole: 'caller',
          code: `// PythonSandbox.tsx — Handling Run Button Trigger
const handleRunClick = useCallback(() => {
  if (isExecutingRef.current) return; // Prevent double-trigger race
  isExecutingRef.current = true;
  
  const currentRunId = ++runIdRef.current;
  setWorkerStatus('running');
  setStatusMessage('Executing in isolated WASM sandbox...');

  const worker = getOrCreateWorker(); // Hybrid lifecycle: warm instance

  // Arm 10-second watchdog timer to terminate infinite loops
  timeoutRef.current = setTimeout(() => {
    terminateWorker('Execution exceeded hard 10s CPU limit.');
  }, 10000);
}, [code, getOrCreateWorker]);`,
        },
        payloadInspector: {
          title: 'Watchdog & UI State',
          direction: 'React Component Internal State',
          payload: {
            isExecuting: true,
            workerStatus: 'running',
            runId: 101,
            watchdogTimerMs: 10000,
          },
          securityNotes: [
            'Atomic lock isExecutingRef blocks double-clicks during active runs.',
            'Watchdog timer guarantees hard termination if user code hangs or loops infinitely.',
          ],
        },
      },
      {
        stepId: 'py-step-2',
        stepNumber: 2,
        totalSteps: 5,
        stageName: '2. Thread Bridge Dispatch',
        titleKey: 'arch.flow.python.step2.title',
        titleDefault: 'Structured Clone Across Worker Boundary',
        descriptionKey: 'arch.flow.python.step2.desc',
        descriptionDefault: 'The main thread dispatches a serialized RUN message to the background Web Worker via worker.postMessage. The message crosses the thread boundary into an air-gapped environment.',
        badgeText: 'postMessage Thread Crossing',
        connectionLabel: 'worker.postMessage({ type: "RUN", code, runId })',
        sourceFileSnippet: {
          fileName: 'PythonSandbox.tsx',
          filePath: 'src/components/PythonSandbox.tsx',
          language: 'typescript',
          threadLabel: 'Main UI Thread',
          threadType: 'main',
          activeFunction: 'worker.postMessage()',
          activeLines: [6, 10],
          callRole: 'caller',
          code: `// Dispatching message across the thread boundary
const worker = getOrCreateWorker();

worker.postMessage({
  type: 'RUN',
  code: userCode,
  runId: currentRunId,
});`,
        },
        targetFileSnippet: {
          fileName: 'pyodideWorker.ts',
          filePath: 'src/workers/pyodideWorker.ts',
          language: 'typescript',
          threadLabel: 'Dedicated Web Worker [Air-Gapped]',
          threadType: 'worker',
          activeFunction: 'self.onmessage = async (e) =>',
          activeLines: [3, 9],
          callRole: 'callee',
          code: `// pyodideWorker.ts — Background Worker Message Listener
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { type, code, runId } = e.data;
  
  if (type === 'RUN') {
    // Air-gapped thread context: fetch, XHR, WebSocket are disabled
    await executeSandboxedPython(code, runId);
  }
};`,
        },
        payloadInspector: {
          title: 'Structured Clone Payload',
          direction: 'Main UI Thread ──▶ Web Worker Thread',
          payload: {
            type: 'RUN',
            runId: 101,
            code: 'import numpy as np\nv = np.array([0.7071, 0.7071])\nprint("Dot product:", np.dot(v, v))',
          },
          securityNotes: [
            'Worker environment is completely air-gapped: self.fetch, self.WebSocket, self.XMLHttpRequest are neutralized.',
            'No browser storage (localStorage, indexedDB) is accessible from the worker context.',
          ],
        },
      },
      {
        stepId: 'py-step-3',
        stepNumber: 3,
        totalSteps: 5,
        stageName: '3. AST Static Security Audit',
        titleKey: 'arch.flow.python.step3.title',
        titleDefault: 'Python AST Static Security Analysis',
        descriptionKey: 'arch.flow.python.step3.desc',
        descriptionDefault: 'Before executing any code, pyodideWorker parses the code into an Abstract Syntax Tree (AST). The _SecurityVisitor inspects every node for dunder traversals, forbidden modules, and format string exploits.',
        badgeText: 'Python AST Validation',
        sourceFileSnippet: {
          fileName: 'pyodideWorker.ts',
          filePath: 'src/workers/pyodideWorker.ts',
          language: 'python',
          threadLabel: 'Dedicated Web Worker [AST Analyzer]',
          threadType: 'worker',
          activeFunction: '_SecurityVisitor.visit()',
          activeLines: [4, 15],
          callRole: 'evaluator',
          code: `# Python AST Security Guard in pyodideWorker.ts
def _audit_ast(source_code):
    tree = _ast.parse(source_code)
    visitor = _SecurityVisitor()
    visitor.visit(tree)

class _SecurityVisitor(_ast.NodeVisitor):
    def visit_Attribute(self, node):
        # Intercept dunder attribute access: __class__, __subclasses__, __bases__
        if node.attr in _FORBIDDEN_ATTRS:
            raise PermissionError(f"Access to '{node.attr}' is restricted.")
        self.generic_visit(node)
        
    def visit_Import(self, node):
        for alias in node.names:
            if alias.name in _BLOCKED_MODULES: # os, sys, subprocess, socket
                raise PermissionError(f"Module '{alias.name}' is blocked.")`,
        },
        payloadInspector: {
          title: 'AST Security Audit Verdict',
          direction: 'Worker Internal AST Validation',
          payload: {
            astValid: true,
            forbiddenDundersFound: 0,
            blockedModulesFound: 0,
            formatStringAttacksFound: 0,
            status: 'VERIFIED_SAFE',
          },
          securityNotes: [
            '_FORBIDDEN_ATTRS blocks __class__, __subclasses__, __mro__, __code__, __globals__.',
            '_UNSAFE_FORMAT_FIELD_RE regex rejects format-string attribute exploits like {0.__class__}.',
            '_safe_forwardref_eval prevents typing.ForwardRef dynamic code execution breakouts.',
          ],
        },
      },
      {
        stepId: 'py-step-4',
        stepNumber: 4,
        totalSteps: 5,
        stageName: '4. Sandboxed Pyodide WASM Run',
        titleKey: 'arch.flow.python.step4.title',
        titleDefault: 'Pyodide WebAssembly Execution & Stdout Throttling',
        descriptionKey: 'arch.flow.python.step4.desc',
        descriptionDefault: 'Python code executes within isolated WebAssembly linear memory. Standard output and error streams are bound to _BoundedStream, enforcing strict character and line ceilings to eliminate browser lockup.',
        badgeText: 'Pyodide WebAssembly Runtime',
        sourceFileSnippet: {
          fileName: 'pyodideWorker.ts',
          filePath: 'src/workers/pyodideWorker.ts',
          language: 'python',
          threadLabel: 'Dedicated Web Worker [Pyodide WASM]',
          threadType: 'worker',
          activeFunction: 'pyodide.runPythonAsync()',
          activeLines: [6, 14],
          callRole: 'evaluator',
          code: `# Executing within Pyodide WASM with stream bounds
stream = _BoundedStream() # Max 16,384 characters and 250 lines
_sys.stdout = stream
_sys.stderr = stream

try:
    start_time = _time.perf_counter()
    res = await pyodide.runPythonAsync(code)
    duration_ms = (_time.perf_counter() - start_time) * 1000
finally:
    import gc
    gc.collect() # Reclaim memory to prevent leaks across runs`,
        },
        payloadInspector: {
          title: 'Stdout Stream & Performance',
          direction: 'WebAssembly Memory ──▶ Worker Buffer',
          payload: {
            stdoutBuffer: 'Dot product: 0.99999042\n',
            charCount: 24,
            maxChars: 16384,
            durationMs: 4.28,
            gcCleaned: true,
          },
          securityNotes: [
            '_BoundedStream truncates excessive output to protect the UI thread from memory flood attacks.',
            'gc.collect() runs in finally block to ensure numpy arrays do not accumulate in WASM heap.',
          ],
        },
      },
      {
        stepId: 'py-step-5',
        stepNumber: 5,
        totalSteps: 5,
        stageName: '5. Result Delivery & UI Update',
        titleKey: 'arch.flow.python.step5.title',
        titleDefault: 'Return Message & Reactive Component State Update',
        descriptionKey: 'arch.flow.python.step5.desc',
        descriptionDefault: 'The worker posts a SUCCESS message containing stdout and execution metrics back to the main thread. PythonSandbox disarms the watchdog timer, releases the execution lock, and updates the terminal view.',
        badgeText: 'Worker ──▶ UI State Update',
        connectionLabel: 'self.postMessage({ type: "RUN_SUCCESS", stdout, duration })',
        sourceFileSnippet: {
          fileName: 'pyodideWorker.ts',
          filePath: 'src/workers/pyodideWorker.ts',
          language: 'typescript',
          threadLabel: 'Dedicated Web Worker Thread',
          threadType: 'worker',
          activeFunction: 'self.postMessage()',
          activeLines: [2, 7],
          callRole: 'caller',
          code: `// pyodideWorker.ts — Returning result to UI
self.postMessage({
  type: 'RUN_SUCCESS',
  runId,
  stdout: stream.getvalue(),
  duration: duration_ms,
});`,
        },
        targetFileSnippet: {
          fileName: 'PythonSandbox.tsx',
          filePath: 'src/components/PythonSandbox.tsx',
          language: 'typescript',
          threadLabel: 'Main UI Thread',
          threadType: 'main',
          activeFunction: 'worker.onmessage = (e) =>',
          activeLines: [4, 11],
          callRole: 'callee',
          code: `// PythonSandbox.tsx — Receiving execution outcome
worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
  const { type, stdout, duration } = e.data;
  
  if (type === 'RUN_SUCCESS') {
    clearWatchdog(); // Disarm 10s watchdog timer
    isExecutingRef.current = false; // Release atomic lock
    setOutput({ stdout, stderr: '', executionTimeMs: duration });
    setWorkerStatus('ready');
    setStatusMessage(\`Execution complete in \${duration.toFixed(1)}ms\`);
  }
};`,
        },
        payloadInspector: {
          title: 'Execution Outcome Payload',
          direction: 'Web Worker Thread ──▶ Main UI Thread',
          payload: {
            type: 'RUN_SUCCESS',
            runId: 101,
            stdout: 'Dot product: 0.99999042\n',
            duration: 4.28,
            workerStatus: 'ready',
          },
          securityNotes: [
            'Watchdog timer is cleared before state update.',
            'Atomic execution lock isExecutingRef is released so subsequent runs can proceed.',
          ],
        },
      },
    ],
  },
  {
    id: 'hybrid-search-rrf',
    titleKey: 'arch.flow.rrf.title',
    titleDefault: 'Reciprocal Rank Fusion (RRF) Hybrid Search',
    categoryKey: 'arch.flow.rrf.category',
    categoryDefault: 'Information Retrieval & Algorithmic Math',
    summaryKey: 'arch.flow.rrf.summary',
    summaryDefault: 'Trace how sparse lexical rankings and dense semantic embeddings merge via the Cormack RRF formula with bounded k >= 1 and deterministic tie-breaking.',
    triggerButtonLabel: 'Simulate "Calculate RRF" Click',
    mockUI: {
      componentName: 'RRFSimulator.tsx',
      description: 'Interactive rank fusion simulator with adjustable smoothing constant k and candidate inputs',
      actionLabel: 'Fuse Rankings (k = 60)',
      sampleInput: 'Dense: [DocA, DocB, DocC] | Sparse: [DocB, DocD, DocA]',
    },
    steps: [
      {
        stepId: 'rrf-step-1',
        stepNumber: 1,
        totalSteps: 4,
        stageName: '1. UI Input Collection',
        titleKey: 'arch.flow.rrf.step1.title',
        titleDefault: 'User Modifies Candidates & Constant k',
        descriptionKey: 'arch.flow.rrf.step1.desc',
        descriptionDefault: 'User adjusts ranked lists and smoothing constant k in RRFSimulator. The component validates inputs and passes dense and sparse rankings to the pure mathematical engine.',
        badgeText: 'Interactive UI Slider & List',
        sourceFileSnippet: {
          fileName: 'RRFSimulator.tsx',
          filePath: 'src/components/RRFSimulator.tsx',
          language: 'typescript',
          threadLabel: 'Main UI Thread',
          threadType: 'main',
          activeFunction: 'handleCalculateRRF()',
          activeLines: [4, 11],
          callRole: 'caller',
          code: `// RRFSimulator.tsx — Triggering rank fusion
const handleCalculateRRF = () => {
  // Extract ranked documents from dense and sparse candidate lists
  const denseRankings = denseList.map((doc, idx) => ({ id: doc.id, rank: idx + 1 }));
  const sparseRankings = sparseList.map((doc, idx) => ({ id: doc.id, rank: idx + 1 }));

  // Call pure mathematical fusion engine in src/lib/rrfMath.ts
  const fusedResults = computeRRF(denseRankings, sparseRankings, kConstant);
  setResults(fusedResults);
};`,
        },
        payloadInspector: {
          title: 'Input Candidate Rankings',
          direction: 'UI Component State ──▶ Math Engine',
          payload: {
            denseList: ['DocA (rank 1)', 'DocB (rank 2)', 'DocC (rank 3)'],
            sparseList: ['DocB (rank 1)', 'DocD (rank 2)', 'DocA (rank 3)'],
            kConstant: 60,
          },
          securityNotes: [
            'Constant k is validated to ensure k >= 1 (preventing divide-by-zero or negative weights).',
          ],
        },
      },
      {
        stepId: 'rrf-step-2',
        stepNumber: 2,
        totalSteps: 4,
        stageName: '2. Pure Math Engine',
        titleKey: 'arch.flow.rrf.step2.title',
        titleDefault: 'Reciprocal Rank Fusion Summation',
        descriptionKey: 'arch.flow.rrf.step2.desc',
        descriptionDefault: 'computeRRF iterates over all candidate systems and accumulates Cormack reciprocal rank scores: sum(1 / (k + rank)). It handles missing documents across lists gracefully.',
        badgeText: 'Numerical Math Execution',
        sourceFileSnippet: {
          fileName: 'rrfMath.ts',
          filePath: 'src/lib/rrfMath.ts',
          language: 'typescript',
          threadLabel: 'Math Library [Pure TS]',
          threadType: 'math',
          activeFunction: 'computeRRF()',
          activeLines: [4, 15],
          callRole: 'evaluator',
          code: `// rrfMath.ts — Cormack RRF Formula Implementation
export function computeRRF(dense: RankedDoc[], sparse: RankedDoc[], k = 60): FusedDoc[] {
  const safeK = Math.max(1, Number.isFinite(k) ? k : 60);
  const scoreMap = new Map<string, { id: string; score: number; denseRank?: number; sparseRank?: number }>();

  // Accumulate dense ranks: 1 / (safeK + rank)
  for (const doc of dense) {
    const current = scoreMap.get(doc.id) || { id: doc.id, score: 0 };
    current.score += 1 / (safeK + doc.rank);
    current.denseRank = doc.rank;
    scoreMap.set(doc.id, current);
  }

  // Accumulate sparse ranks: 1 / (safeK + rank)
  for (const doc of sparse) {
    const current = scoreMap.get(doc.id) || { id: doc.id, score: 0 };
    current.score += 1 / (safeK + doc.rank);
    current.sparseRank = doc.rank;
    scoreMap.set(doc.id, current);
  }
  // ...`,
        },
        payloadInspector: {
          title: 'Score Accumulation Math',
          direction: 'Internal Map Computation',
          payload: {
            'DocA': '1/(60+1) + 1/(60+3) = 0.01639 + 0.01587 = 0.03226',
            'DocB': '1/(60+2) + 1/(60+1) = 0.01613 + 0.01639 = 0.03252',
            'DocC': '1/(60+3) = 0.01587',
            'DocD': '1/(60+2) = 0.01613',
          },
          securityNotes: [
            'Guaranteed safe against NaN or Infinity by clamping k >= 1.',
          ],
        },
      },
      {
        stepId: 'rrf-step-3',
        stepNumber: 3,
        totalSteps: 4,
        stageName: '3. Deterministic Tie-Breaking',
        titleKey: 'arch.flow.rrf.step3.title',
        titleDefault: 'Score Sorting & Alphanumeric Tie-Breaking',
        descriptionKey: 'arch.flow.rrf.step3.desc',
        descriptionDefault: 'Candidate documents are sorted in descending order of fused scores. Any numerical ties are broken deterministically by document ID to avoid UI rendering jitter.',
        badgeText: 'Stable Sorting Algorithm',
        sourceFileSnippet: {
          fileName: 'rrfMath.ts',
          filePath: 'src/lib/rrfMath.ts',
          language: 'typescript',
          threadLabel: 'Math Library [Pure TS]',
          threadType: 'math',
          activeFunction: 'sortFusedCandidates()',
          activeLines: [3, 11],
          callRole: 'evaluator',
          code: `// Deterministic tie-breaking
return Array.from(scoreMap.values())
  .sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 1e-9) {
      return scoreDiff;
    }
    // Alphanumeric tie-breaking preserves render determinism
    return a.id.localeCompare(b.id);
  });`,
        },
        payloadInspector: {
          title: 'Sorted Results Array',
          direction: 'Math Engine ──▶ React Component',
          payload: [
            { id: 'DocB', score: 0.03252, rank: 1, reason: 'High consensus in both retrievers' },
            { id: 'DocA', score: 0.03226, rank: 2, reason: 'Strong lexical and semantic support' },
            { id: 'DocD', score: 0.01613, rank: 3, reason: 'Sparse retriever only' },
            { id: 'DocC', score: 0.01587, rank: 4, reason: 'Dense retriever only' },
          ],
          securityNotes: [
            'Tie-breaking ensures reproducible results across all browsers and devices.',
          ],
        },
      },
      {
        stepId: 'rrf-step-4',
        stepNumber: 4,
        totalSteps: 4,
        stageName: '4. Visual Re-ranking Render',
        titleKey: 'arch.flow.rrf.step4.title',
        titleDefault: 'Component State Rehydration & Animation',
        descriptionKey: 'arch.flow.rrf.step4.desc',
        descriptionDefault: 'RRFSimulator consumes the sorted array, reorders candidate cards with smooth transitions, and renders score badges with rank improvement indicators.',
        badgeText: 'UI Render & Score Badges',
        sourceFileSnippet: {
          fileName: 'RRFSimulator.tsx',
          filePath: 'src/components/RRFSimulator.tsx',
          language: 'typescript',
          threadLabel: 'Main UI Thread',
          threadType: 'main',
          activeFunction: 'renderResults()',
          activeLines: [3, 12],
          callRole: 'callee',
          code: `// RRFSimulator.tsx — Visualizing fused ranks
<div className="space-y-2">
  {results.map((doc, index) => (
    <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-bold font-mono text-primary">#{index + 1}</span>
        <span className="font-semibold text-sm">{doc.id}</span>
      </div>
      <div className="text-xs font-mono text-muted-foreground">
        RRF: {doc.score.toFixed(5)}
      </div>
    </div>
  ))}
</div>`,
        },
        payloadInspector: {
          title: 'Final View Model',
          direction: 'React Virtual DOM',
          payload: {
            top1: 'DocB (Winner by multi-modal consensus)',
            totalDocuments: 4,
            renderDurationMs: 0.8,
          },
        },
      },
    ],
  },
  {
    id: 'crosstab-state-sync',
    titleKey: 'arch.flow.sync.title',
    titleDefault: 'Cross-Tab State Synchronization',
    categoryKey: 'arch.flow.sync.category',
    categoryDefault: 'Offline Persistence & Multi-Tab Events',
    summaryKey: 'arch.flow.sync.summary',
    summaryDefault: 'Observe how completing a step in Tab A updates localStorage with non-destructive schema migration and broadcasts via BroadcastChannel to synchronize Tab B instantly without page reload.',
    triggerButtonLabel: 'Simulate "Complete Step" in Tab A',
    mockUI: {
      componentName: 'StepView.tsx / ModuleQuiz.tsx',
      description: 'Module completion banner triggering progress save',
      actionLabel: 'Mark Module Complete',
      sampleInput: 'Step: "hybrid-search" → status: "completed"',
    },
    steps: [
      {
        stepId: 'sync-step-1',
        stepNumber: 1,
        totalSteps: 4,
        stageName: '1. Tab A Completion Trigger',
        titleKey: 'arch.flow.sync.step1.title',
        titleDefault: 'User Completes Quiz in Tab A',
        descriptionKey: 'arch.flow.sync.step1.desc',
        descriptionDefault: 'User marks a curriculum step complete. The useSteps hook updates in-memory React state and prepares non-destructive storage serialization.',
        badgeText: 'Tab A User Action',
        sourceFileSnippet: {
          fileName: 'useSteps.tsx',
          filePath: 'src/hooks/useSteps.tsx',
          language: 'typescript',
          threadLabel: 'Tab A [Main UI Thread]',
          threadType: 'main',
          activeFunction: 'completeStep()',
          activeLines: [3, 10],
          callRole: 'caller',
          code: `// Tab A: Updating completion state in useSteps.tsx
const completeStep = useCallback((stepKey: string) => {
  setPhases(prevPhases => {
    const updated = markStepCompleted(prevPhases, stepKey);
    // Non-destructive write to localStorage
    safePersistProgress(updated);
    // Broadcast event to other open tabs
    syncChannel.postMessage({ type: 'STEP_COMPLETED', stepKey });
    return updated;
  });
}, [syncChannel]);`,
        },
        payloadInspector: {
          title: 'Tab A Step Action',
          direction: 'Tab A Hook ──▶ Storage & Channel',
          payload: {
            action: 'COMPLETE_STEP',
            stepKey: 'hybrid-search',
            timestamp: Date.now(),
          },
        },
      },
      {
        stepId: 'sync-step-2',
        stepNumber: 2,
        totalSteps: 4,
        stageName: '2. Non-Destructive Storage',
        titleKey: 'arch.flow.sync.step2.title',
        titleDefault: 'Safe LocalStorage Migration & Persistence',
        descriptionKey: 'arch.flow.sync.step2.desc',
        descriptionDefault: 'The state is serialized and persisted to localStorage. The migration layer preserves user progress and notes even if the underlying schema version changes.',
        badgeText: 'Web Storage Serialization',
        sourceFileSnippet: {
          fileName: 'useSteps.tsx',
          filePath: 'src/hooks/useSteps.tsx',
          language: 'typescript',
          threadLabel: 'Web Storage [LocalStorage]',
          threadType: 'storage',
          activeFunction: 'safePersistProgress()',
          activeLines: [3, 11],
          callRole: 'evaluator',
          code: `// Safe persistence with schema evolution guards
function safePersistProgress(phases: Phase[]) {
  try {
    const payload = {
      version: CURRENT_SCHEMA_VERSION,
      completedStepKeys: extractCompleted(phases),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
  } catch (err) {
    console.warn('Storage quota exceeded, state retained in RAM');
  }
}`,
        },
        payloadInspector: {
          title: 'LocalStorage Serialized JSON',
          direction: 'Browser LocalStorage Key: rag_masterclass_progress_v2',
          payload: {
            version: 2,
            completedStepKeys: ['project-setup', 'chunking-strategies', 'hybrid-search'],
            lastUpdated: '2026-10-29T15:00:00.000Z',
          },
          securityNotes: [
            'Try-catch block handles storage quota exhaustion without throwing.',
            'Schema versioning ensures future updates never purge existing user completions.',
          ],
        },
      },
      {
        stepId: 'sync-step-3',
        stepNumber: 3,
        totalSteps: 4,
        stageName: '3. Cross-Tab Event Broadcast',
        titleKey: 'arch.flow.sync.step3.title',
        titleDefault: 'BroadcastChannel Transmission to Tab B',
        descriptionKey: 'arch.flow.sync.step3.desc',
        descriptionDefault: 'Tab A dispatches a sync event over the dedicated BroadcastChannel ("rag_masterclass_sync_v2"). Tab B instantly receives the event without polling or timer loops.',
        badgeText: 'BroadcastChannel Bridge',
        connectionLabel: 'BroadcastChannel("rag_masterclass_sync_v2").postMessage()',
        sourceFileSnippet: {
          fileName: 'useSteps.tsx',
          filePath: 'src/hooks/useSteps.tsx',
          language: 'typescript',
          threadLabel: 'Tab A [Broadcast Dispatcher]',
          threadType: 'main',
          activeFunction: 'syncChannel.postMessage()',
          activeLines: [2, 6],
          callRole: 'caller',
          code: `// Tab A broadcasting synchronization event
syncChannel.postMessage({
  type: 'STEP_COMPLETED',
  stepKey: 'hybrid-search',
  timestamp: Date.now(),
});`,
        },
        targetFileSnippet: {
          fileName: 'useSteps.tsx',
          filePath: 'src/hooks/useSteps.tsx',
          language: 'typescript',
          threadLabel: 'Tab B [Broadcast Receiver]',
          threadType: 'main',
          activeFunction: 'channel.onmessage = (e) =>',
          activeLines: [3, 9],
          callRole: 'callee',
          code: `// Tab B listening for real-time background sync
syncChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
  if (event.data.type === 'STEP_COMPLETED') {
    // Re-hydrate state in Tab B without full page reload
    syncExternalStepCompletion(event.data.stepKey);
  }
};`,
        },
        payloadInspector: {
          title: 'BroadcastChannel Event Data',
          direction: 'Tab A ──▶ Tab B (Dedicated Channel)',
          payload: {
            channel: 'rag_masterclass_sync_v2',
            type: 'STEP_COMPLETED',
            stepKey: 'hybrid-search',
          },
          securityNotes: [
            'Dedicated BroadcastChannel eliminates fragile window.storage event race conditions.',
          ],
        },
      },
      {
        stepId: 'sync-step-4',
        stepNumber: 4,
        totalSteps: 4,
        stageName: '4. Tab B Reactive Update',
        titleKey: 'arch.flow.sync.step4.title',
        titleDefault: 'Tab B Rehydrates & Updates Progress Ring',
        descriptionKey: 'arch.flow.sync.step4.desc',
        descriptionDefault: 'Tab B receives the event, smoothly updates its progress counter and sidebar checkmarks, and plays a subtle completion animation.',
        badgeText: 'Tab B UI Synchronized',
        sourceFileSnippet: {
          fileName: 'Sidebar.tsx',
          filePath: 'src/components/Sidebar.tsx',
          language: 'typescript',
          threadLabel: 'Tab B [Main UI Thread]',
          threadType: 'main',
          activeFunction: 'renderProgress()',
          activeLines: [3, 9],
          callRole: 'callee',
          code: `// Tab B: Sidebar instantly reflects newly completed step
const isCompleted = step.status === 'completed';

<div className="flex items-center space-x-2">
  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50" />
  <span className="text-xs text-foreground font-medium">{step.title}</span>
</div>`,
        },
        payloadInspector: {
          title: 'Tab B Synced Status',
          direction: 'Tab B Component State',
          payload: {
            completedCount: 3,
            totalSteps: 28,
            progressPercentage: '10.7%',
            syncedWithTabA: true,
          },
        },
      },
    ],
  },
];
