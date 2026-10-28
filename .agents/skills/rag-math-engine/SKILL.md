---
name: rag-math-engine
description: >-
  Provides mathematical precision guidelines, numerical edge-case testing, and reference implementations for RAG algorithms (Vector Similarity, RRF, Chunking, BM25).
  Use when implementing or modifying math utilities in src/lib/, updating interactive calculators, or debugging numerical anomalies.
---

# RAG Mathematical Engine Skill

This skill governs the mathematical correctness, numerical stability, and floating-point edge-case handling for all algorithmic implementations in **RAG Teacher**.

## When to Run

- When writing or editing utilities in `devdocs-ai-guide/src/lib/` (`vectorMath.ts`, `rrfMath.ts`, `chunkingMath.ts`).
- When modifying interactive visualizers (`VectorVisualizer.tsx`, `RRFSimulator.tsx`, `ChunkingCalculator.tsx`).
- When adding new mathematical concepts to curriculum steps (e.g. HNSW graph distance, Cross-Encoder scoring, RAGAS metrics).
- Whenever investigating `NaN`, `Infinity`, or precision loss bugs in calculations.

---

## Core Invariants

1. **Pre-Normalized Vector Arithmetic**:
   - Never compute direct dot products on raw vectors when magnitudes can exceed $10^{150}$.
   - Pre-normalize components using `Math.hypot` to prevent intermediate IEEE 754 overflow ($10^{200} \to 10^{400} = \infty$).
   - Clamp cosine similarity results to $[-1.0, 1.0]$.
2. **Bounded RRF Smoothing Parameter**:
   - Enforce $k \ge 1$ (default $k = 60$).
   - Rank is 1-indexed ($r = 1, 2, 3, \dots$).
   - Deduplicate candidates and provide deterministic tie-breaking.
3. **Zero-Safe Chunking Geometry**:
   - When document length is 0, return 0 chunks.
   - Enforce `chunkSize > chunkOverlap` at all times.
   - Scale visual bars using safe division to avoid `width: NaN%`.

---

## Verification Runbook

### Step 1: Run Algorithmic & Calculator Unit Tests
Execute the Vitest suite covering numerical stability:
```powershell
npm.cmd --prefix devdocs-ai-guide test src/__tests__/calculators.test.ts
```
*Expected Result: All tests pass, including extreme magnitude vectors ($10^{200}$), zero-vector edge cases, RRF tie-breaking, and chunking boundary conditions.*

### Step 2: Consult Mathematical Reference
For formal derivations, LaTeX formulas, and parameter guidelines, read the accompanying reference:
[math-formulas.md](./references/math-formulas.md)
