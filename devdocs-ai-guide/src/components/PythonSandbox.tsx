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
  Trash2,
  Code2,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
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
const WORKER_IDLE_EVICTION_MS = 5 * 60 * 1000; // 5-minute RAM eviction for hybrid lifecycle

// Module-level worker reference & idle timer
let globalPyodideWorker: Worker | null = null;
let globalWorkerIdleTimer: ReturnType<typeof setTimeout> | null = null;

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
  const { t } = useI18n();
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
  const isExecutingRef = useRef<boolean>(false);

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
      isExecutingRef.current = false;
      if (globalWorkerIdleTimer) {
        clearTimeout(globalWorkerIdleTimer);
        globalWorkerIdleTimer = null;
      }
      if (globalPyodideWorker) {
        globalPyodideWorker.terminate();
        globalPyodideWorker = null;
      }
      workerRef.current = null;
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

  // Hybrid Architecture: keep worker warm on modal close, terminate on 5-minute idle timeout
  useEffect(() => {
    if (isOpen) {
      if (globalWorkerIdleTimer) {
        clearTimeout(globalWorkerIdleTimer);
        globalWorkerIdleTimer = null;
      }
      if (globalPyodideWorker) {
        workerRef.current = globalPyodideWorker;
        setWorkerStatus('ready');
        setStatusMessage('Air-Gapped Pyodide 3.12 Warm');
      }
    } else {
      if (globalPyodideWorker && !globalWorkerIdleTimer) {
        globalWorkerIdleTimer = setTimeout(() => {
          if (globalPyodideWorker) {
            globalPyodideWorker.terminate();
            globalPyodideWorker = null;
          }
          globalWorkerIdleTimer = null;
        }, WORKER_IDLE_EVICTION_MS);
      }
    }
  }, [isOpen]);

  const getOrCreateWorker = useCallback(() => {
    if (globalPyodideWorker) {
      workerRef.current = globalPyodideWorker;
      return globalPyodideWorker;
    }

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
        isExecutingRef.current = false;
        setWorkerStatus('error');
        setStatusMessage('Runtime load failed');
        setOutput({
          stdout: '',
          stderr: '',
          error: data.error,
          elapsedMs: null,
        });
      } else if (data.type === 'RESULT') {
        isExecutingRef.current = false;
        if (data.runId !== runIdRef.current) return;
        clearWatchdog();
        if (data.status === 'error') {
          setWorkerStatus('error');
          setStatusMessage('Execution error');
        } else {
          setWorkerStatus('ready');
          setStatusMessage('Air-Gapped Pyodide 3.12 Ready');
        }
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
      isExecutingRef.current = false;
      setWorkerStatus('error');
      setStatusMessage('Worker error');
      setOutput({
        stdout: '',
        stderr: '',
        error: err?.message || 'Web Worker encountered a fatal error.',
        elapsedMs: null,
      });
    };

    globalPyodideWorker = worker;
    workerRef.current = worker;
    return worker;
  }, [clearWatchdog, terminateWorker]);

  const handleRunCode = useCallback(() => {
    if (isExecutingRef.current) return;
    clearWatchdog();
    isExecutingRef.current = true;
    const currentRunId = ++runIdRef.current;
    const isAlreadyReady = (workerStatus === 'ready' || Boolean(globalPyodideWorker));

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

  const handleClearOutput = useCallback(() => {
    setOutput({ stdout: '', stderr: '', error: null, elapsedMs: null });
  }, []);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isBusy) {
      e.preventDefault();
      handleRunCode();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(nextCode);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      });
    }
  };

  const isBusy = workerStatus === 'loading' || workerStatus === 'running';

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 w-full w-screen h-full h-screen max-w-none max-h-none m-0 p-0 rounded-none bg-background text-foreground z-50 flex flex-col overflow-hidden focus:outline-none"
        >
          {/* Top IDE Header Bar */}
          <header className="min-h-[60px] shrink-0 px-4 sm:px-6 py-2 bg-card border-b border-border flex items-center justify-between gap-4 z-10">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary shrink-0">
                <Terminal className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 truncate">
                  <span>{t('sandbox.title', 'In-Browser Python RAG Sandbox')}</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-700/40 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-400/40">
                    {t('sandbox.badge', 'Pyodide WASM + NumPy')}
                  </span>
                </Dialog.Title>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                  {statusMessage}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-lg bg-secondary border border-border text-[11px] font-mono text-muted-foreground">
                <Cpu className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{statusMessage}</span>
              </div>

              {isBusy ? (
                <button
                  type="button"
                  onClick={() => terminateWorker('Execution aborted by user (Worker killed).')}
                  aria-label={t('sandbox.kill', 'Kill Worker')}
                  className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white dark:bg-rose-300 dark:hover:bg-rose-200 dark:text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
                >
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>{t('sandbox.kill', 'Kill Worker')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRunCode}
                  aria-busy={isBusy}
                  aria-label={t('sandbox.run', 'Run Code')}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-300 dark:hover:bg-emerald-200 dark:text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>{t('sandbox.run', 'Run Code')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetCurrentTemplate}
                title={t('sandbox.reset', 'Reset')}
                aria-label={`${t('sandbox.reset', 'Reset')} — Restore original template code`}
                className="p-2 rounded-xl text-foreground hover:bg-secondary border border-border text-xs transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Python sandbox"
                className="p-2 rounded-xl text-foreground hover:bg-secondary border border-border text-xs transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Main IDE Workspace */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Side: Algorithm Templates Menu */}
            <aside
              aria-label={t('sandbox.templates', 'Algorithm Templates')}
              className="w-full md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col min-h-0 overflow-hidden max-h-56 md:max-h-none"
            >
              <div className="px-4 min-h-[44px] py-2.5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/50">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" aria-hidden="true" />
                  {t('sandbox.templates', 'Algorithm Templates')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground font-semibold border border-border">
                  {PYTHON_TEMPLATES.length}
                </span>
              </div>

              <nav
                aria-label="Python code templates"
                className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar"
              >
                {PYTHON_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectTemplate(tpl)}
                      className={cn(
                        'w-full min-h-[44px] text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-1',
                        isSelected
                          ? 'bg-primary/10 text-primary border-primary/50 ring-1 ring-primary/40 shadow-xs'
                          : 'bg-card hover:bg-secondary/70 text-foreground border-border'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                          {tpl.category}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                        )}
                      </div>
                      <span className="text-xs font-semibold leading-snug line-clamp-2">
                        {tpl.title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Security Isolation Summary at bottom of left menu */}
              <div className="hidden md:flex flex-col gap-1.5 p-3.5 border-t border-border bg-secondary/40 text-[11px] text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Air-Gapped Sandbox</span>
                </div>
                <p className="text-[10.5px] leading-relaxed">
                  {t('sandbox.isolationDefense', 'Dedicated Web Worker with neutralized network & storage APIs, AST safety checks, and 5s watchdog.')}
                </p>
              </div>
            </aside>

            {/* Right Side: Code Editor (top) + Terminal Output (below) */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-background">
              {/* Upper Portion: Code Editor Pane */}
              <section
                className="flex-1 flex flex-col min-h-0 overflow-hidden bg-card"
                aria-label="Code Editor"
              >
                {/* Editor Tab Bar */}
                <div className="min-h-[44px] shrink-0 px-4 bg-secondary/50 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="font-mono font-semibold text-foreground text-xs">sandbox_runner.py</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                      Python 3.12
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="hidden sm:inline text-muted-foreground">
                      {t('sandbox.shortcutHint', 'Ctrl+Enter / ⌘+Enter to execute • Tab to indent')}
                    </span>
                    <span className="text-foreground font-semibold">
                      {code.length.toLocaleString()} / 20,000 chars
                    </span>
                  </div>
                </div>

                {/* Textarea Editor */}
                <div className="flex-1 relative overflow-hidden flex min-h-0">
                  <textarea
                    value={code}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
                    onKeyDown={handleEditorKeyDown}
                    spellCheck={false}
                    aria-label="Python sandbox code editor"
                    className="w-full h-full p-4 sm:p-5 bg-transparent text-foreground font-mono text-xs sm:text-[13px] leading-relaxed resize-none focus:outline-none custom-scrollbar selection:bg-primary/25"
                  />
                </div>
              </section>

              {/* Lower Portion: Terminal Output Console Below Code */}
              <section
                className="h-64 sm:h-72 lg:h-80 shrink-0 border-t border-border flex flex-col min-h-0 bg-secondary/40 dark:bg-black/60 overflow-hidden"
                aria-label="Terminal Output"
              >
                {/* Terminal Header */}
                <div className="min-h-[44px] shrink-0 px-4 bg-secondary/60 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="font-mono font-semibold text-foreground uppercase tracking-wider text-[11px]">
                      {t('sandbox.terminal', 'Terminal / Output')}
                    </span>
                    {output.elapsedMs !== null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {output.elapsedMs} ms
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearOutput}
                    aria-label={t('sandbox.clear', 'Clear Output')}
                    className="flex items-center gap-1.5 px-3 min-h-[44px] min-w-[44px] rounded-md hover:bg-secondary text-foreground text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t('sandbox.clear', 'Clear Output')}</span>
                  </button>
                </div>

                {/* Terminal Console Output */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Terminal Output Console"
                  aria-live="polite"
                  className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto custom-scrollbar select-text"
                >
                  {isBusy ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 space-y-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <div className="text-xs font-mono">{statusMessage}</div>
                    </div>
                  ) : output.stdout || output.stderr || output.error ? (
                    <div className="space-y-3">
                      {output.stdout && (
                        <pre className="text-foreground dark:text-emerald-300 whitespace-pre-wrap break-words font-mono text-xs">
                          {output.stdout}
                        </pre>
                      )}
                      {output.stderr && (
                        <pre className="text-amber-900 dark:text-amber-200 bg-amber-500/15 border-l-2 border-amber-600 p-2.5 rounded-r whitespace-pre-wrap break-words font-mono text-xs">
                          {output.stderr}
                        </pre>
                      )}
                      {output.error && (
                        <div className="p-3 rounded-xl bg-rose-100 border border-rose-700/40 text-rose-900 dark:bg-rose-950/60 dark:border-rose-400/50 dark:text-rose-200 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                            {output.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 text-center">
                      <Play className="w-6 h-6 mb-2 text-primary" aria-hidden="true" />
                      <p className="text-xs text-foreground">
                        {t('sandbox.emptyState', 'Click "Run Code" or press Ctrl+Enter to execute snippet in isolated Web Worker.')}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(PythonSandbox);
