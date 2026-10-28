# Numerical & Algorithmic Robustness Rules for RAG Teacher

This rule enforces mathematical rigor, IEEE 754 floating-point safety, and algorithmic edge-case handling across all RAG calculation engines.

---

## 1. Vector Geometry & Similarity Invariants (`vectorMath.ts`)

1. **Intermediate Overflow Defense**:
   - Never compute dot products as `(ax * bx) + (ay * by)` directly when magnitudes can be large ($10^{150}$ to $10^{300}$). Squaring such values produces `Infinity`, causing `Infinity / Infinity = NaN`.
   - Always normalize vectors to unit components before computing dot product or cosine similarity:
     ```typescript
     const magA = Math.hypot(vA.x, vA.y);
     const magB = Math.hypot(vB.x, vB.y);
     if (magA === 0 || magB === 0 || !Number.isFinite(magA) || !Number.isFinite(magB)) {
       return 0;
     }
     const uAx = vA.x / magA;
     const uAy = vA.y / magA;
     const uBx = vB.x / magB;
     const uBy = vB.y / magB;
     const dot = (uAx * uBx) + (uAy * uBy);
     return Math.max(-1, Math.min(1, dot));
     ```
2. **Euclidean Distance Stability**:
   - Always calculate distance via `Math.hypot(vB.x - vA.x, vB.y - vA.y)`.
   - Never use manual square root `Math.sqrt(dx*dx + dy*dy)` due to intermediate overflow risks.
3. **Angle Normalization for Sliders (`VectorVisualizer.tsx`)**:
   - Angle sliders and rotational controls must normalize radian angles to $[-\pi, \pi]$:
     ```typescript
     function normalizeAngle(rad: number): number {
       let a = rad % (2 * Math.PI);
       if (a > Math.PI) a -= 2 * Math.PI;
       if (a < -Math.PI) a += 2 * Math.PI;
       return a;
     }
     ```
   - All slider inputs must provide valid ARIA range attributes: `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.

---

## 2. Reciprocal Rank Fusion (RRF) Rules (`rrfMath.ts`)

1. **Parameter Bounds**:
   - Constant $k$ must satisfy $k \ge 1$. Default value is $k = 60$.
   - If an invalid $k$ is supplied ($k < 1$ or non-finite), clamp or default to $60$.
2. **Formula Precision**:
   $$\text{RRF\_Score}(d) = \sum_{r \in R} \frac{1}{k + \text{rank}_r(d)}$$
   - Rank is 1-indexed ($\text{rank} = 1, 2, 3, \dots$).
3. **Edge Case Handling**:
   - If input rankings are empty, return an empty array `[]`.
   - Deduplicate documents across candidate lists and sum scores correctly.
   - Deterministic tie-breaking: when two documents have identical RRF scores, break ties alphabetically by document ID or original index.

---

## 3. Chunking & Overlap Calculations (`chunkingMath.ts`, `ChunkingCalculator.tsx`)

1. **Zero Document Length Protection**:
   - If `docLength === 0`, return `{ chunkCount: 0, totalTokens: 0 }`.
2. **Valid Window Geometry**:
   - Chunk size must be strictly greater than overlap: `chunkSize > chunkOverlap`.
   - Step size is `step = chunkSize - chunkOverlap`.
   - Stride must always be $\ge 1$.
3. **UI Scaling & CSS NaN Prevention**:
   - When calculating visual chunk width percentages:
     ```typescript
     const scale = docLength > 0 ? 100 / docLength : 0;
     const widthPercent = Math.max(0, Math.min(100, chunkSize * scale));
     ```
   - Never inject `NaN%` or `Infinity%` into inline styles.
