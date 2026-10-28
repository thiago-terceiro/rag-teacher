# Mathematical Foundations of RAG Algorithms

This reference document specifies the mathematical formulations, numerical stability considerations, and edge cases for the core algorithms in **RAG Teacher**.

---

## 1. Vector Similarity & Distance Metrics

### 1.1 Cosine Similarity
$$\text{sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_{i=1}^d u_i v_i}{\sqrt{\sum_{i=1}^d u_i^2} \sqrt{\sum_{i=1}^d v_i^2}}$$

#### Numerical Hazards & Defenses
- **Intermediate Overflow**: If vector components are large ($u_i \approx 10^{200}$), $u_i^2 \approx 10^{400}$, which exceeds IEEE 754 double maximum ($\approx 1.79 \times 10^{308}$) and evaluates to `Infinity`. Computing `Infinity / Infinity` yields `NaN`.
- **Pre-normalization Defense**:
  Calculate magnitudes using `Math.hypot(...components)` (which prevents intermediate overflow/underflow through internal scaling), then compute unit vectors:
  $$\hat{\mathbf{u}} = \frac{\mathbf{u}}{\|\mathbf{u}\|_2}, \quad \hat{\mathbf{v}} = \frac{\mathbf{v}}{\|\mathbf{v}\|_2}$$
  $$\text{sim}(\mathbf{u}, \mathbf{v}) = \hat{\mathbf{u}} \cdot \hat{\mathbf{v}}$$
- **Zero Vector**: If $\|\mathbf{u}\|_2 = 0$ or $\|\mathbf{v}\|_2 = 0$, return `0.0`.
- **Clamping**: Due to floating-point rounding, $\hat{\mathbf{u}} \cdot \hat{\mathbf{v}}$ may evaluate to $1.0000000000000002$. Always clamp to $[-1.0, 1.0]$.

### 1.2 Euclidean Distance ($L_2$)
$$d(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|_2 = \sqrt{\sum_{i=1}^d (u_i - v_i)^2}$$
- In JavaScript, always evaluate using `Math.hypot(vB.x - vA.x, vB.y - vA.y)`.

---

## 2. Reciprocal Rank Fusion (RRF)

Reciprocal Rank Fusion combines ranked lists from disparate retrieval systems (e.g. sparse BM25 and dense vector search) without requiring score calibration or normalization.

$$\text{RRF\_Score}(d \in D) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where:
- $M$ is the set of retrieval models (rankers).
- $r_m(d)$ is the 1-based rank of document $d$ in system $m$ ($1, 2, 3, \dots$).
- $k$ is the smoothing constant (typically $k = 60$).

### Numerical Hazards & Defenses
1. **Smoothing Parameter $k$**:
   - $k$ must be bounded: $k \ge 1$.
   - If $k = 0$, a document ranked 1st in one system would receive score $\frac{1}{0 + 1} = 1.0$, while a document ranked 10th in two systems receives $\frac{1}{10} + \frac{1}{10} = 0.2$, excessively penalizing multi-system consensus.
   - If $k < 0$, negative denominators or division by zero can occur.
2. **Deterministic Tie-Breaking**:
   - When $\text{RRF}(d_1) = \text{RRF}(d_2)$, tie-break by document ID or original index to prevent flaky renders.

---

## 3. Chunking Geometry & Tokenization

Given a document of length $L$ (characters or tokens), chunk size $C$, and chunk overlap $O$:

$$\text{step} = C - O$$
$$\text{chunkCount} = \begin{cases} 0 & \text{if } L = 0 \\ 1 & \text{if } 0 < L \le C \\ \left\lceil \frac{L - O}{C - O} \right\rceil & \text{if } L > C \end{cases}$$

### Invariants:
- $C > O \ge 0$ (chunk size must strictly exceed overlap).
- $\text{step} \ge 1$.
- If $L = 0$, chunk count is strictly $0$.
- UI percentage calculation: $\text{scale} = \frac{100}{\max(1, L)}$ to prevent `100 / 0 = Infinity`.
