# ⚡ Deep Performance Audit & Optimization Blueprint: RAG Teacher

**Target Objective**: Make navigation, rendering, scrolling, and interaction feel **100% instant (<16ms, 60/120 FPS)** with zero layout shifts, zero spinner flashes, and zero input latency.

---

## 1. Executive Bottleneck Analysis

| Bottleneck | Cause | Impact | Fix |
| :--- | :--- | :--- | :--- |
| **1. Step Navigation Lag & Spinner Flash** | `step` state stored in `useState(null)` and updated via `useEffect` | Flash of loading spinner and 2 render cycles on every step change | Synchronous in-memory lookup (`const step = getStepByKey(stepKey)`) |
| **2. Markdown & Code AST Re-parsing on Input** | Unmemoized `<MarkdownRenderer />` inside `StepView` | 4,000 lines of markdown & 20 code blocks re-parsed on every note keystroke | `React.memo` on `MarkdownRenderer`, `CodeBlock`, and isolated `NotesJournal` |
| **3. Mermaid Diagram Re-renders** | No cache for generated SVG strings | Navigating between steps re-invokes mermaid parser (~80-150ms) | Global in-memory SVG cache (`mermaidCache`) for 0ms instant display |
| **4. 60–120Hz Scroll Re-rendering in Header** | `useScrollProgress` state update triggered `StatsBar` re-renders on every scroll pixel | Garbage collection spikes and CPU frame drops during scrolling | Direct DOM ref hardware transform (`will-change: transform`) |
| **5. Sidebar Search Recalculation** | Unmemoized array filtering on 28 steps | Redundant array allocations on context updates | `useMemo` for search filtering |
| **6. Scroll Reset Clash** | `scroll-smooth` on `#main-scroll-container` clashing with `instant` route reset | Micro-stutter on step change | Temporary smooth scroll suppression on route switch |

---

## 2. Quantitative Performance Targets

* **First Contentful Paint (FCP)**: < 0.6s
* **Time to Interactive (TTI)**: < 0.8s
* **Step Navigation Transition**: < 16ms (Instant same-frame switch, 0 spinner flash)
* **Typing Latency in Notes**: 0ms frame drops (Isolated component tree)
* **Scroll Frame Rate**: Steady 120 FPS / 60 FPS (Zero React re-renders on scroll)
* **Mermaid Re-visit Latency**: 0ms (In-memory cached SVG)
