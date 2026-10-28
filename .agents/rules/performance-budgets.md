# Performance Budgets & Optimization Rules for RAG Teacher

This rule defines the performance budgets, chunking strategy, worker lifecycle, and caching protocols for the application.

---

## 1. Bundle Size & Code-Splitting Budgets

1. **Initial Entry Point Chunk Budget**:
   - Initial JS chunk (`assets/index-*.js`) must not exceed **180 kB** uncompressed (<60 kB gzip).
   - Initial CSS chunk (`assets/index-*.css`) must not exceed **45 kB** uncompressed.
2. **Vite Manual Chunks Strategy (`vite.config.ts`)**:
   - Heavy dependencies must never be bundled into the main index:
     - `mermaid`: Lazy-loaded via dynamic `import('mermaid')` only when diagrams render.
     - `pyodide`: Run strictly inside the Web Worker; never import Pyodide into the main UI thread.
     - `react-syntax-highlighter`: Bundled into its own chunk or dynamically imported.
     - `katex`: CSS loaded asynchronously or scoped to mathematical steps.
3. **No Unused Heavy Libraries**:
   - Avoid pulling in heavy graphing or matrix libraries in the UI thread. All heavy matrix or vector operations in the UI must use lightweight pure TypeScript utilities in `src/lib/`.

---

## 2. React 19 Compiler Invariants

1. **Eliminate Redundant Memoization**:
   - React 19 includes the automatic React Compiler.
   - Do NOT wrap ordinary functions in `useCallback` or normal computations in `useMemo` unless specifically required for reference equality in external subscriptions or custom dependency arrays.
2. **Native Ref Prop**:
   - Pass `ref` directly as a component prop. Do NOT wrap modern components in legacy `React.forwardRef`.
3. **Rendering Efficiency & Layout Stability**:
   - Maintain zero Cumulative Layout Shift (CLS) by giving images, diagram containers, and code blocks explicit dimensions or minimum heights (`min-h-[200px]`).
   - Use skeleton loaders with identical layout boxes while dynamic modules are loading.

---

## 3. Worker Lifecycle & Memory Management (`PythonSandbox.tsx`)

1. **Hybrid Worker Architecture**:
   - Do NOT terminate the Web Worker immediately when the user closes the code editor modal. Pyodide takes 2-4 seconds to initialize WASM.
   - Retain a warm worker instance across modal toggles.
2. **5-Minute Inactivity Eviction**:
   - Implement an inactivity timer: if the sandbox is unused for 5 minutes (300,000 ms), terminate the worker and clear references to reclaim ~150MB of browser RAM.
3. **Execution Concurrency Lock**:
   - Guard against rapid consecutive clicks on "Run Code". Maintain an atomic `isExecutingRef` lock that ignores run triggers while an execution is in progress.
4. **Error State Reset**:
   - If worker initialization fails or times out, reset `initPromise` to `null` and terminate the broken worker instance so subsequent attempts can retry cleanly.

---

## 4. Service Worker & Offline PWA Protocol (`public/sw.js`)

1. **Pyodide CDN Cache Partition**:
   - All Pyodide CDN assets (WASM binary, JS loader, Python stdlib wheels, NumPy wheel) must be intercepted and cached in a dedicated cache partition: `pyodide-cdn-v0.27.3`.
   - Use a **Cache-First** strategy for CDN assets: once cached, never re-fetch across sessions.
2. **App Shell Assets**:
   - Use **Stale-While-Revalidate** for Vite application chunks, HTML, and CSS.
   - Always update the cache version identifier on new builds (`CACHE_NAME = 'rag-masterclass-v2'`).
3. **Clean Cache Pruning**:
   - On SW `activate`, prune old caches matching previous versions while preserving user data and active Pyodide wheels.
