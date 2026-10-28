# RAG Teacher (`devdocs-ai-guide`) - Workspace Development Standards & Guidelines

This document defines the architectural standards, security protocols, performance budgets, mathematical invariants, and verification workflows for the **RAG Teacher** project. Every agent and developer operating in this repository **must** strictly adhere to these guidelines.

---

## 1. Architecture & Project Layout

```text
rag-teacher/
├── .agents/                        # Antigravity workspace customizations
│   ├── rules/                      # Domain-specific constraints (Security, Perf, Math)
│   ├── skills/                     # Reusable execution workflows and audit runbooks
│   │   ├── rag-sandbox-security/   # AST sandbox verification & exploit testing
│   │   ├── rag-perf-audit/         # Bundle budgets, worker RAM, SW offline caching
│   │   ├── curriculum-verifier/    # i18n completeness, quiz/content QA & CI gates
│   │   └── rag-math-engine/        # Vector similarity, RRF, floating-point robustness
│   └── agents/                     # Persona definitions for specialized subagents
├── devdocs-ai-guide/               # Core Application (Vite + React 19 + TypeScript)
│   ├── public/                     # Static assets & Service Worker (`sw.js`)
│   └── src/
│       ├── components/             # UI Components (WCAG AAA compliant, a11y, Lucide icons)
│       ├── context/                # Context providers (Steps, Notes, Settings)
│       ├── data/                   # Curriculum content, quizzes, interview questions
│       ├── hooks/                  # Custom React hooks (React 19 compiler-optimized)
│       ├── i18n/                   # Multilingual dictionaries (en, pt-BR, es)
│       ├── lib/                    # Math utilities (chunkingMath, vectorMath, rrfMath)
│       ├── workers/                # Pyodide WebAssembly sandboxed worker runtime
│       └── __tests__/              # Vitest comprehensive unit & regression test suite
└── package.json                    # Workspace orchestrator proxying scripts to devdocs-ai-guide
```

---

## 2. Non-Negotiable Security Guardrails

The application executes user-provided Python code directly in the browser via Pyodide WebAssembly. This makes browser containment our highest security priority.

### 2.1 Python AST Sandbox & Pyodide Worker Isolation (`pyodideWorker.ts`)
1. **Network & Storage Air-Gapping**:
   - `self.fetch`, `self.XMLHttpRequest`, `self.WebSocket`, `self.Worker`, `self.BroadcastChannel`, and `self.importScripts` must remain completely neutralized.
   - Web storage (`localStorage`, `sessionStorage`, `indexedDB`, `caches`) is forbidden inside the worker runtime.
2. **AST Visitor Enforcement**:
   - Python AST visitor (`_SecurityVisitor`) must run on every script before execution.
   - Prohibit access to dunder attributes: `__class__`, `__subclasses__`, `__bases__`, `__mro__`, `__code__`, `__globals__`, `__builtins__`, `__import__`, `__reduce__`, `__reduce_ex__`.
   - Prevent `typing.ForwardRef._evaluate` dynamic string breakout by hooking `ForwardRef._evaluate` with `_safe_forwardref_eval` which executes AST checks on `__forward_arg__`.
3. **Format-String Injection Defense**:
   - `_UNSAFE_FORMAT_FIELD_RE` intercepts all `.format()` calls and format-string attribute/index traversals (e.g. `{0.__class__}`, `{x.attr}`).
4. **Module Allowlist & NumPy Deserialization Neutralization**:
   - Explicit module blocklist: `os`, `sys`, `socket`, `subprocess`, `ctypes`, `urllib`, `http`, `pickle`, `_pickle`, `shelve`.
   - Upon NumPy import, strip all filesystem and unpickling functions: `load`, `save`, `savez`, `fromfile`, `memmap`, `ctypeslib`, `f2py`.
5. **Output Flooding & Execution Limits**:
   - `MAX_CODE_LENGTH` enforced at 20,000 characters.
   - Execution timeout enforced via Web Worker `setTimeout(10000)` and termination on overrun.
   - `_BoundedStream` caps standard output at 16,384 characters and 250 lines to prevent DOM lockup.
   - WASM recursion depth capped at `sys.setrecursionlimit(200)` to prevent C-stack overflow.

### 2.2 DOM XSS & Protocol Allowlisting (`MarkdownRenderer.tsx`)
- Render markdown only through strict protocol allowlisting: links must explicitly match `http:`, `https:`, `#`, or `mailto:`.
- All `javascript:`, `data:`, `vbscript:`, or malformed URI protocols must be rejected and rendered as inert text.
- External links must include `target="_blank" rel="noopener noreferrer"`.

### 2.3 Non-Destructive State Persistence & Migration (`useSteps.tsx`)
- All `localStorage` reads must gracefully handle schema evolution. Never blow away user progress if an unrecognized format or schema version is encountered.
- Cross-tab progress synchronization uses dedicated `BroadcastChannel('rag_masterclass_sync_v2')`.

---

## 3. Performance & React 19 Compiler Standards

1. **Initial Bundle Budget (<180kB index chunk)**:
   - The initial entry chunk must remain under 180kB uncompressed (target <60kB gzip).
   - Heavy dependencies must be dynamically imported:
     - `mermaid` (~3MB) is loaded lazily on demand only when a diagram enters the viewport.
     - `pyodide` WebAssembly binaries are fetched and loaded exclusively inside the background worker thread.
     - `katex` stylesheet is linked efficiently; math rendering is scoped to math blocks.
2. **React 19 Compiler Compatibility**:
   - Do NOT add redundant `useMemo`, `useCallback`, or `React.memo` unless profiling proves a specific bailout need. Trust the React Compiler.
   - Use standard `ref` as prop (React 19 native); do not use `forwardRef`.
3. **Hybrid Worker Lifecycle Management (`PythonSandbox.tsx`)**:
   - Keep the worker warm while modal/dialog closes to prevent repetitive 150MB WASM re-initialization.
   - Automatically evict the warm worker after **5 minutes** of inactivity to reclaim browser RAM.
   - Atomic `isExecutingRef` locks prevent duplicate parallel runs or state race conditions.
4. **Offline-First Service Worker (`public/sw.js`)**:
   - Cache static assets using Stale-While-Revalidate.
   - Partition Pyodide CDN assets into a dedicated cache (`pyodide-cdn-v0.27.3`) with Cache-First strategy to ensure 100% offline interactive Python execution.

---

## 4. Mathematical & Algorithmic Invariants

All algorithms in `src/lib/` and interactive calculators must guarantee numerical stability and IEEE 754 edge-case resilience:

1. **Vector Calculations (`vectorMath.ts`)**:
   - Always normalize components using `Math.hypot(x, y)` before computing dot products or cosines to prevent intermediate floating-point overflow ($10^{200} \times 10^{200} = \infty$) and subsequent `NaN`.
   - Cosine similarity must always return values clamped in $[-1.0, 1.0]$.
   - Zero-magnitude vectors must return similarity of `0.0`, never `NaN` or `Infinity`.
2. **Reciprocal Rank Fusion (`rrfMath.ts`)**:
   - Constant $k$ must be bounded: $k \ge 1$ (default $k = 60$). Reject or clamp invalid values.
   - Handle empty result lists deterministically.
   - Provide deterministic tie-breaking (e.g. alphanumeric by document ID or original rank).
3. **Chunking & Token Geometry (`chunkingMath.ts`, `ChunkingCalculator.tsx`)**:
   - Protect against `docLength = 0`: return 0 chunks, 0 tokens.
   - Guarantee `chunkSize > chunkOverlap` at all times.
   - Prevent UI scale division by zero: if `docLength === 0`, CSS width percentages must remain `0%`, never `NaN%` or `Infinity%`.

---

## 5. UI, Accessibility (a11y) & Internationalization (i18n)

1. **WCAG AAA Accessibility**:
   - Semantic HTML5 structure (`<main>`, `<nav>`, `<article>`, `<header>`).
   - Visible focus rings on all interactive elements (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
   - Full keyboard navigability (Arrow keys, Escape, Enter, Tab). Do not hijack arrow keys from `<input>` or `<range>` elements.
   - ARIA live regions (`aria-live="polite"`) for async results, toasts, and sandbox status.
   - Bounded ARIA attributes: Sliders must maintain valid `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
2. **Trilingual i18n Completeness**:
   - Zero hardcoded strings in templates or components.
   - Full translation parity across **English (`en`)**, **Portuguese - Brazil (`pt-BR`)**, and **Spanish (`es`)**.
   - Slug normalization must use `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` so accented headings (e.g. `Introdução`, `Visión`) generate valid, clean URL anchors.

---

## 6. Verification & Quality Gates

Before considering any task complete:
1. `npm.cmd test` (Vitest): 100% passing tests (all 91+ unit and regression tests).
2. `npm.cmd run typecheck` (`tsc --noEmit`): 0 TypeScript errors.
3. `npm.cmd run build` (Vite): Clean production bundle generation with initial chunk $< 180$kB.
