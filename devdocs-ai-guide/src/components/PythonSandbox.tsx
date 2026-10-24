import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Terminal,
  Play,
  Square,
  RotateCcw,
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Cpu,
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface PythonSandboxProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialCode?: string | null;
}

export interface PythonTemplate {
  id: string;
  title: string;
  category: string;
  code: string;
}

export interface PythonSandboxOutput {
  stdout: string;
  stderr: string;
  error: string | null;
  elapsedMs: number | null;
}

const EXECUTION_TIMEOUT_MS = 5000;
const INIT_DOWNLOAD_TIMEOUT_MS = 35000;

export const PYTHON_TEMPLATES: readonly PythonTemplate[] = [
  {
    id: 'chunking',
    title: '1. Sliding Window Chunker & Context Prefix',
    category: 'Phase 1 • Chunking',
    code: `# Phase 1: Fixed-Size Sliding Window Chunker with Context Prefix Injection
from typing import List, Dict

def sliding_window_chunker(
    text: str,
    doc_title: str,
    chunk_size: int = 12,
    chunk_overlap: int = 3
) -> List[Dict]:
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be strictly less than chunk_size!")
    
    tokens = text.split()
    stride = chunk_size - chunk_overlap
    chunks = []
    
    for idx, start in enumerate(range(0, len(tokens), stride)):
        window = tokens[start : start + chunk_size]
        if not window:
            break
        prefix = f"[Doc: {doc_title}] "
        chunks.append({
            "chunk_id": f"chunk_{idx}",
            "token_span": (start, start + len(window)),
            "embedded_text": prefix + " ".join(window)
        })
        if start + chunk_size >= len(tokens):
            break
    return chunks

sample_mdn = (
    "EventTarget.addEventListener sets up a function that will be called "
    "whenever the specified event is delivered to the target. "
    "The options parameter supports capture once and passive booleans."
)

result = sliding_window_chunker(sample_mdn, "EventTarget.addEventListener()", chunk_size=10, chunk_overlap=3)
print(f"Total tokens: {len(sample_mdn.split())} | Generated chunks: {len(result)}\\n")
for c in result:
    print(f"{c['chunk_id']} {c['token_span']}:\\n  -> {c['embedded_text']}")
`,
  },
  {
    id: 'vector-math',
    title: '2. Dense Vector Math & L2 / Cosine Equivalence (NumPy)',
    category: 'Phase 1 • Embeddings',
    code: `# Phase 1: Mathematical Proof that L2^2 == 2 - 2*cos(theta) on Unit Vectors
import numpy as np

# Simulate 384-dim embeddings (seeded for reproducibility)
rng = np.random.default_rng(42)
raw_q = rng.normal(size=8)
raw_d1 = raw_q + rng.normal(scale=0.35, size=8)  # Semantically close chunk
raw_d2 = rng.normal(size=8)                      # Unrelated distractor chunk

def normalize(v: np.ndarray) -> np.ndarray:
    return v / np.linalg.norm(v)

q = normalize(raw_q)
d1 = normalize(raw_d1)
d2 = normalize(raw_d2)

for label, doc in [("Relevant Chunk (d1)", d1), ("Distractor Chunk (d2)", d2)]:
    dot_prod = float(np.dot(q, doc))
    cos_sim = float(np.dot(q, doc) / (np.linalg.norm(q) * np.linalg.norm(doc)))
    l2_dist = float(np.linalg.norm(q - doc))
    identity_check = 2.0 - 2.0 * cos_sim

    print(f"=== {label} ===")
    print(f"  Dot Product (q · d)      : {dot_prod:.6f}")
    print(f"  Cosine Similarity        : {cos_sim:.6f}")
    print(f"  Squared Euclidean (L2^2) : {l2_dist**2:.6f}")
    print(f"  Formula (2 - 2*cos)      : {identity_check:.6f}")
    assert np.isclose(l2_dist**2, identity_check), "Identity violation!"
print("\\n✓ Verified: Unit-norm MIPS dot product is strictly equivalent to Cosine & L2 ranking!")
`,
  },
  {
    id: 'rrf',
    title: '3. Hybrid Reciprocal Rank Fusion (RRF)',
    category: 'Phase 3 • Hybrid Search',
    code: `# Phase 3: Reciprocal Rank Fusion (BM25 Lexical + Dense Vector Search)
from typing import List, Dict

def reciprocal_rank_fusion(
    ranked_lists: Dict[str, List[str]],
    k: int = 60
) -> List[tuple]:
    rrf_scores = {}
    provenance = {}

    for retriever_name, doc_ids in ranked_lists.items():
        for rank_idx, doc_id in enumerate(doc_ids, start=1):
            contrib = 1.0 / (k + rank_idx)
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + contrib
            provenance.setdefault(doc_id, {})[retriever_name] = rank_idx

    ranked = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    return [(doc_id, round(score, 6), provenance[doc_id]) for doc_id, score in ranked]

# Query: "Array.prototype.slice shallow copy without mutating"
rankings = {
    "dense_bi_encoder": ["doc_splice", "doc_slice", "doc_concat", "doc_copyWithin"],
    "sparse_bm25":      ["doc_slice", "doc_shallow_copy", "doc_concat", "doc_splice"],
}

fused = reciprocal_rank_fusion(rankings, k=60)
print("Hybrid RRF Consensus Ranking (k=60):")
for idx, (doc_id, score, ranks) in enumerate(fused, start=1):
    print(f"  #{idx} {doc_id:<18} | RRF Score: {score:.6f} | Ranks: {ranks}")
`,
  },
  {
    id: 'ir-metrics',
    title: '4. IR Evaluation: NDCG@K, MRR & Precision@K',
    category: 'Phase 2 • Evaluation',
    code: `# Phase 2: Information Retrieval Metrics (Graded NDCG@K and MRR)
import numpy as np

# Graded relevance for retrieved top-5 chunks (3=Exact Answer, 2=Partial, 1=Context, 0=Noise)
# Compare Stage-1 Bi-Encoder vs Stage-2 Cross-Encoder Reranker
stage1_relevances = [0, 1, 0, 3, 2]  # Correct answer buried at Rank 4!
stage2_relevances = [3, 2, 1, 0, 0]  # Cross-encoder promoted exact answer to Rank 1!

def dcg_at_k(relevances, k=5):
    rel = np.asfarray(relevances)[:k]
    if rel.size == 0:
        return 0.0
    discounts = np.log2(np.arange(len(rel)) + 2)
    return float(np.sum((2**rel - 1) / discounts))

def ndcg_at_k(relevances, k=5):
    dcg = dcg_at_k(relevances, k)
    ideal_relevances = sorted(relevances, reverse=True)
    idcg = dcg_at_k(ideal_relevances, k)
    return (dcg / idcg) if idcg > 0 else 0.0

def reciprocal_rank(relevances, binary_threshold=2):
    for rank_idx, rel in enumerate(relevances, start=1):
        if rel >= binary_threshold:
            return 1.0 / rank_idx
    return 0.0

print(f"Stage 1 (Bi-Encoder Only)  -> NDCG@5: {ndcg_at_k(stage1_relevances):.4f} | MRR: {reciprocal_rank(stage1_relevances):.4f}")
print(f"Stage 2 (With Reranker)    -> NDCG@5: {ndcg_at_k(stage2_relevances):.4f} | MRR: {reciprocal_rank(stage2_relevances):.4f}")
`,
  },
  {
    id: 'ambiguity-entropy',
    title: '5. Clarification Routing: Shannon Entropy of Retrieval',
    category: 'Phase 3 • Agent Routing',
    code: `# Phase 3: Shannon Routing Entropy to Trigger Proactive Clarification Loops
import numpy as np

def softmax(x: np.ndarray) -> np.ndarray:
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def evaluate_query_ambiguity(candidate_scores: dict, entropy_threshold: float = 0.85):
    docs = list(candidate_scores.keys())
    scores = np.array(list(candidate_scores.values()))
    probs = softmax(scores)
    
    # Normalized Shannon Entropy: H / log(N)
    h = -float(np.sum(probs * np.log2(probs + 1e-12)))
    max_h = np.log2(len(docs))
    h_norm = h / max_h if max_h > 0 else 0.0
    
    print(f"Candidates            : {docs}")
    print(f"Softmax Probabilities : {[round(p, 4) for p in probs]}")
    print(f"Normalized Entropy    : {h_norm:.4f} (Threshold: {entropy_threshold})")
    print(f"Action                : {'ASK CLARIFYING QUESTION' if h_norm >= entropy_threshold else 'DIRECT ANSWER'}\\n")

print("Query 1: 'slice' (Ambiguous across 3 namespaces)")
evaluate_query_ambiguity({"Array.slice": 0.81, "String.slice": 0.79, "Blob.slice": 0.76})

print("Query 2: 'Array.prototype.slice shallow copy' (Specific intent)")
evaluate_query_ambiguity({"Array.slice": 0.94, "String.slice": 0.42, "Blob.slice": 0.31})
`,
  },
];

export function PythonSandbox({ isOpen, setIsOpen, initialCode }: PythonSandboxProps): React.JSX.Element {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PYTHON_TEMPLATES[0].id);
  const [code, setCode] = useState<string>(PYTHON_TEMPLATES[0].code);
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'loading' | 'ready' | 'running' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('WASM Worker on standby');
  const [output, setOutput] = useState<PythonSandboxOutput>({
    stdout: '',
    stderr: '',
    error: null,
    elapsedMs: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external initialCode when opened from a Markdown CodeBlock
  useEffect(() => {
    if (isOpen && initialCode && typeof initialCode === 'string') {
      setSelectedTemplateId('custom');
      setCode(initialCode);
      setOutput({ stdout: '', stderr: '', error: null, elapsedMs: null });
    }
  }, [isOpen, initialCode]);

  const clearWatchdog = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const terminateWorker = useCallback(
    (reason = 'Execution terminated by user.') => {
      clearWatchdog();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setWorkerStatus('idle');
      setStatusMessage('Worker terminated & reset');
      if (reason) {
        setOutput((prev) => ({
          ...prev,
          error: reason,
        }));
      }
    },
    [clearWatchdog]
  );

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const getOrCreateWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL('../workers/pyodideWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'STATUS') {
        setWorkerStatus('loading');
        setStatusMessage(data.message);
      } else if (data.type === 'READY') {
        // Switch watchdog from download timeout to strict 5s execution timeout
        clearWatchdog();
        timeoutRef.current = setTimeout(() => {
          terminateWorker(
            `TimeoutError: Execution exceeded hard ${EXECUTION_TIMEOUT_MS / 1000}s CPU sandbox limit (infinite loop protection). Worker killed.`
          );
        }, EXECUTION_TIMEOUT_MS);
        setWorkerStatus('running');
        setStatusMessage('Executing in isolated WASM sandbox...');
      } else if (data.type === 'INIT_ERROR') {
        clearWatchdog();
        setWorkerStatus('error');
        setStatusMessage('Runtime load failed');
        setOutput({
          stdout: '',
          stderr: '',
          error: data.error,
          elapsedMs: null,
        });
      } else if (data.type === 'RESULT') {
        if (data.runId !== runIdRef.current) return;
        clearWatchdog();
        setWorkerStatus('ready');
        setStatusMessage('Air-Gapped Pyodide 3.12 Ready');
        setOutput({
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          error: data.error || null,
          elapsedMs: data.elapsedMs ?? 0,
        });
      }
    };

    worker.onerror = (err: ErrorEvent) => {
      clearWatchdog();
      setWorkerStatus('error');
      setStatusMessage('Worker error');
      setOutput({
        stdout: '',
        stderr: '',
        error: err?.message || 'Web Worker encountered a fatal error.',
        elapsedMs: null,
      });
    };

    workerRef.current = worker;
    return worker;
  }, [clearWatchdog, terminateWorker]);

  const handleRunCode = useCallback(() => {
    clearWatchdog();
    const currentRunId = ++runIdRef.current;
    const isAlreadyReady = workerStatus === 'ready' && workerRef.current;

    setWorkerStatus(isAlreadyReady ? 'running' : 'loading');
    setStatusMessage(
      isAlreadyReady ? 'Executing in isolated WASM sandbox...' : 'Initializing Pyodide WASM Worker...'
    );
    setOutput({ stdout: '', stderr: '', error: null, elapsedMs: null });

    const worker = getOrCreateWorker();

    // Set watchdog timer: 5s if already initialized, 35s if downloading WASM for the first time
    const timeoutDuration = isAlreadyReady ? EXECUTION_TIMEOUT_MS : INIT_DOWNLOAD_TIMEOUT_MS;
    timeoutRef.current = setTimeout(() => {
      terminateWorker(
        isAlreadyReady
          ? `TimeoutError: Execution exceeded hard ${EXECUTION_TIMEOUT_MS / 1000}s CPU sandbox limit. Worker terminated.`
          : 'TimeoutError: Pyodide WASM engine download timed out. Check your internet connection.'
      );
    }, timeoutDuration);

    worker.postMessage({
      type: 'RUN',
      code,
      runId: currentRunId,
    });
  }, [code, clearWatchdog, getOrCreateWorker, terminateWorker, workerStatus]);

  const handleSelectTemplate = (tpl: PythonTemplate) => {
    setSelectedTemplateId(tpl.id);
    setCode(tpl.code);
    setOutput({ stdout: '', stderr: '', error: null, elapsedMs: null });
  };

  const handleResetCurrentTemplate = () => {
    const tpl = PYTHON_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (tpl) {
      setCode(tpl.code);
    } else {
      setCode('');
    }
    setOutput({ stdout: '', stderr: '', error: null, elapsedMs: null });
  };

  const isBusy = workerStatus === 'loading' || workerStatus === 'running';

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0a0e17] border border-border/90 rounded-2xl shadow-2xl z-50 p-5 sm:p-6 focus:outline-none animate-in zoom-in-95 duration-200 custom-scrollbar text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/70">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  Air-Gapped Python Sandbox (Pyodide WASM)
                  <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Client-Side
                  </span>
                </Dialog.Title>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute RAG algorithms, dense vector math, and IR evaluation metrics securely inside an isolated Web Worker.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCurrentTemplate}
                title="Reset code to original template"
                aria-label="Reset code to original template"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Python sandbox"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preset Algorithm Switcher Toolbar */}
          <div className="mt-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Curriculum Algorithm Templates</span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {statusMessage}
              </span>
            </div>
            <div
              role="tablist"
              aria-label="Python code templates"
              className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar"
            >
              {PYTHON_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer shrink-0',
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-border/60 hover:bg-slate-800'
                    )}
                  >
                    {tpl.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor & Output Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
            {/* Code Editor Pane */}
            <div className="lg:col-span-7 flex flex-col rounded-xl border border-border/80 bg-[#0d1117] overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-border/50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-xs text-slate-300 font-semibold">
                    sandbox_runner.py
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isBusy ? (
                    <button
                      type="button"
                      onClick={() => terminateWorker('Execution aborted by user (Worker killed).')}
                      aria-label="Terminate Python execution"
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                      <span>Kill Worker</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRunCode}
                      aria-busy={isBusy}
                      aria-label="Run Python code snippet in sandbox"
                      className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>Run Python</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isBusy) {
                    e.preventDefault();
                    handleRunCode();
                  }
                }}
                spellCheck={false}
                aria-label="Python sandbox code editor"
                className="w-full h-80 sm:h-96 p-4 bg-[#0d1117] text-slate-100 font-mono text-xs sm:text-[13px] leading-relaxed focus:outline-none resize-none custom-scrollbar"
              />

              <div className="px-3.5 py-1.5 bg-[#161b22] border-t border-border/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Press Ctrl+Enter / ⌘+Enter to execute</span>
                <span>{code.length.toLocaleString()} / 20,000 chars</span>
              </div>
            </div>

            {/* Output Console Pane */}
            <div className="lg:col-span-5 flex flex-col rounded-xl border border-border/80 bg-[#090d14] overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#121824] border-b border-border/50 text-xs">
                <span className="font-mono font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Standard Output (stdout / stderr)
                </span>
                {output.elapsedMs !== null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {output.elapsedMs} ms
                  </span>
                )}
              </div>

              <div
                role="region"
                aria-label="Standard Output Console"
                aria-live="polite"
                className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-80 sm:max-h-96 custom-scrollbar"
              >
                {isBusy ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 space-y-3">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs text-center">{statusMessage}</div>
                  </div>
                ) : output.stdout || output.stderr || output.error ? (
                  <div className="space-y-3">
                    {output.stdout && (
                      <pre className="text-slate-100 whitespace-pre-wrap break-words font-mono text-xs">
                        {output.stdout}
                      </pre>
                    )}
                    {output.stderr && (
                      <pre className="text-amber-300 whitespace-pre-wrap break-words font-mono text-xs border-l-2 border-amber-500 pl-2.5">
                        {output.stderr}
                      </pre>
                    )}
                    {output.error && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                          {output.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center">
                    <Play className="w-6 h-6 mb-2 opacity-40" />
                    <p>Click &quot;Run Python&quot; to evaluate the snippet inside the isolated Web Worker.</p>
                  </div>
                )}
              </div>

              {/* Security Architecture Note */}
              <div className="p-3 bg-[#121824] border-t border-border/50 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Defense-in-Depth Isolation:</strong> Runs in a dedicated Web Worker with disabled{' '}
                  <code className="text-emerald-300">fetch</code>, <code className="text-emerald-300">WebSocket</code>,{' '}
                  <code className="text-emerald-300">indexedDB</code>, and <code className="text-emerald-300">js</code> bridge, plus static AST inspection and a 5s watchdog kill switch.
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(PythonSandbox);
