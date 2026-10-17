import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Terminal,
  Play,
  Square,
  RotateCcw,
  X,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
} from 'lucide-react';
import { cn } from '../lib/utils';

const EXECUTION_TIMEOUT_MS = 5000;
const INIT_DOWNLOAD_TIMEOUT_MS = 35000;

export const PYTHON_TEMPLATES = [
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
    rels = np.asarray(relevances[:k], dtype=float)
    discounts = np.log2(np.arange(2, len(rels) + 2))
    gains = (2.0 ** rels) - 1.0
    return float(np.sum(gains / discounts))

def ndcg_at_k(relevances, k=5):
    ideal = sorted(relevances, reverse=True)
    idcg = dcg_at_k(ideal, k)
    return dcg_at_k(relevances, k) / idcg if idcg > 0 else 0.0

def reciprocal_rank(relevances, threshold=2):
    for idx, rel in enumerate(relevances, start=1):
        if rel >= threshold:
            return 1.0 / idx
    return 0.0

for name, rels in [("Stage-1 Dense Only", stage1_relevances), ("Stage-2 Cross-Encoder", stage2_relevances)]:
    print(f"=== {name} {rels} ===")
    print(f"  MRR (rel >= 2) : {reciprocal_rank(rels):.4f}")
    print(f"  NDCG@5         : {ndcg_at_k(rels, k=5):.4f}")
`,
  },
  {
    id: 'entropy',
    title: '5. Active Disambiguation via Shannon Entropy',
    category: 'Phase 3 • Agent Tools',
    code: `# Phase 3: Normalized Shannon Entropy Gate for Ambiguous Queries
import numpy as np

def evaluate_query_ambiguity(cluster_scores: dict, entropy_threshold: float = 0.82):
    labels = list(cluster_scores.keys())
    scores = np.array(list(cluster_scores.values()), dtype=float)
    
    # Convert similarity scores into probability distribution via Softmax (T=0.15)
    exp_s = np.exp(scores / 0.15)
    probs = exp_s / np.sum(exp_s)
    
    # Compute normalized Shannon Entropy H_norm in [0, 1]
    k = len(probs)
    shannon_h = -np.sum(probs * np.log(probs + 1e-12))
    h_norm = float(shannon_h / np.log(k)) if k > 1 else 0.0
    
    print(f"Cluster Probabilities : {dict(zip(labels, np.round(probs, 3)))}")
    print(f"Normalized Entropy    : {h_norm:.4f} (Threshold: {entropy_threshold})")
    print(f"Action                : {'ASK CLARIFYING QUESTION' if h_norm >= entropy_threshold else 'DIRECT ANSWER'}\\n")

print("Query 1: 'slice' (Ambiguous across 3 namespaces)")
evaluate_query_ambiguity({"Array.slice": 0.81, "String.slice": 0.79, "Blob.slice": 0.76})

print("Query 2: 'Array.prototype.slice shallow copy' (Specific intent)")
evaluate_query_ambiguity({"Array.slice": 0.94, "String.slice": 0.42, "Blob.slice": 0.31})
`,
  },
];

export function PythonSandbox({ isOpen, setIsOpen, initialCode }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(PYTHON_TEMPLATES[0].id);
  const [code, setCode] = useState(PYTHON_TEMPLATES[0].code);
  const [workerStatus, setWorkerStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'running' | 'error'
  const [statusMessage, setStatusMessage] = useState('WASM Worker on standby');
  const [output, setOutput] = useState({
    stdout: '',
    stderr: '',
    error: null,
    elapsedMs: null,
  });

  const workerRef = useRef(null);
  const runIdRef = useRef(0);
  const timeoutRef = useRef(null);

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

    const worker = new Worker(new URL('../workers/pyodideWorker.js', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event) => {
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

    worker.onerror = (err) => {
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
          : 'TimeoutError: Pyodide WASM initialization timed out. Check your network connection.'
      );
    }, timeoutDuration);

    worker.postMessage({
      type: 'RUN',
      runId: currentRunId,
      code,
    });
  }, [clearWatchdog, code, getOrCreateWorker, terminateWorker, workerStatus]);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setCode(tpl.code);
    setOutput({ stdout: '', stderr: '', error: null, elapsedMs: null });
  };

  const isBusy = workerStatus === 'loading' || workerStatus === 'running';

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="no-print fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
        <Dialog.Content
          aria-describedby={undefined}
          className="no-print fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto bg-card/95 border border-border rounded-2xl shadow-2xl z-50 p-5 sm:p-6 focus:outline-none animate-in zoom-in-95 duration-150 custom-scrollbar"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Dialog.Title className="text-base sm:text-lg font-bold text-foreground">
                    In-Browser Python RAG Sandbox
                  </Dialog.Title>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    Air-Gapped Web Worker • AST Guarded
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Run chunking algorithms, NumPy vector math, RRF fusion, and IR metrics live in WebAssembly with zero main-thread blocking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/70 border border-border text-[11px] font-mono text-muted-foreground">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                {statusMessage}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Python Sandbox"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preset Algorithm Selector Pills */}
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Interactive RAG Algorithm Templates (Python 3.12 + NumPy)</span>
              <span className="font-mono text-[10px] opacity-80">5s Execution Limit • 16KB Output Cap</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
              {selectedTemplateId === 'custom' && (
                <button
                  type="button"
                  onClick={() => setSelectedTemplateId('custom')}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 bg-emerald-600 text-white border-emerald-500 shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Custom Module Snippet</span>
                </button>
              )}
              {PYTHON_TEMPLATES.map((tpl) => {
                const active = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0',
                      active
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                        : 'bg-secondary/50 text-muted-foreground border-border/70 hover:text-foreground hover:bg-secondary'
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
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Kill Worker</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRunCode}
                      className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Python</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
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
                    <Clock className="w-3 h-3" />
                    {output.elapsedMs} ms
                  </span>
                )}
              </div>

              <div className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-80 sm:max-h-96 custom-scrollbar">
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
