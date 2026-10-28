---
name: rag-perf-audit
description: >-
  Audits production bundle sizes, code-splitting rules, Service Worker offline caching partitions, and Web Worker lifecycle.
  Use when building for production, evaluating dependencies, modifying vite.config.ts, sw.js, or optimizing React components.
---

# RAG Performance Audit Skill

This skill enforces performance budgets, bundle code-splitting boundaries, Service Worker offline caching policies, and memory leak prevention for **RAG Teacher**.

## When to Run

- Whenever new dependencies are added to `devdocs-ai-guide/package.json`.
- Whenever `vite.config.ts` or chunking rules are adjusted.
- When modifying `public/sw.js` (Service Worker cache policies).
- When modifying `PythonSandbox.tsx` worker lifecycle or memory pooling.
- Prior to production releases to ensure Lighthouse 100% metrics.

---

## Performance Invariants & Budgets

1. **Initial JS Chunk Budget**:
   - `assets/index-*.js` must remain $\le 180$ kB uncompressed ($\le 60$ kB gzip).
2. **Initial CSS Chunk Budget**:
   - `assets/index-*.css` must remain $\le 90$ kB uncompressed.
3. **Lazy Loading Boundaries**:
   - `mermaid` must never be bundled into the initial entry chunk (loaded dynamically on diagram render).
   - Pyodide WebAssembly runtime is loaded exclusively inside the background worker thread.
4. **Service Worker Offline Caching**:
   - CDN assets matching `https://cdn.jsdelivr.net/.../pyodide/` must be served via Cache-First from `pyodide-cdn-v0.27.3`.
   - Application shell uses Stale-While-Revalidate under `CACHE_NAME`.
5. **Worker Hybrid Lifecycle & RAM Eviction**:
   - Keep worker warm across modal close events to prevent 2-4s WASM bootstrap delay.
   - Automatically terminate and evict idle worker after 5 minutes (`WORKER_IDLE_EVICTION_MS = 300,000`).
   - Atomic `isExecutingRef` prevents concurrent invocation race conditions.

---

## Verification Runbook

### Step 1: Run the Bundle & Performance Audit
Execute the automated performance verification script from workspace root:
```powershell
node .agents/skills/rag-perf-audit/scripts/audit-bundle.mjs
```
*Expected Result: 10/10 tests pass, confirming budgets, SW partitions, and worker lifecycle.*

### Step 2: Build Verification
If bundle changes were made, run a fresh production build and check size metrics:
```powershell
npm.cmd --prefix devdocs-ai-guide run build
node .agents/skills/rag-perf-audit/scripts/audit-bundle.mjs
```

### Step 3: Check for React 19 Compiler Compliance
- Verify that components do not introduce redundant `useMemo` or `useCallback` unless required for external stable callbacks.
- Verify that `ref` is passed directly as a prop (no `forwardRef`).
- Verify zero Cumulative Layout Shift (CLS) on dynamic blocks.
