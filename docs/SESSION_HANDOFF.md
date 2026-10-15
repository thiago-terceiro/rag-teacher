# 📋 Session Handoff & Continuity Guide

**Project**: RAG Teacher (DevDocs AI Guide)  
**Target Surface**: `devdocs-ai-guide` (React 19 + Vite 8 + Tailwind CSS)  
**Branch**: `main` (clean & synchronized with `origin/main`)  
**Companion Documents**:
* [docs/BOOST_REVIEW.md](BOOST_REVIEW.md) — Architectural review and feature roadmap
* [docs/PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) — Quantitative runtime performance audit

---

## 1. Project Vision & Architecture Boundaries

* **App Purpose**: This repository is **purely an interactive educational masterclass and documentation platform**. It guides developers through 28 production modules to build their own RAG systems from scratch.
* **Scope Decision**: Adding a runnable Python backend to this repo is **explicitly out of scope** for now. The focus is 100% on delivering a world-class, ultra-fast, responsive web application on Vercel.

---

## 2. Completed Work (Pushed to `main`)

The following upgrades have been completed, verified via production build, and pushed to GitHub:

### A. Bundle Slimming & Code-Splitting (89% Reduction)
* Replaced monolithic Prism with `PrismLight` registered only for the curriculum languages (`python`, `bash`, `sql`, `javascript`, `jsx`, `json`, `yaml`, `markdown`, `css`).
* Configured Rollup `manualChunks` in `vite.config.js` to split vendor dependencies (`vendor-react`, `vendor-highlighter`, `vendor-markdown`, `vendor-radix`) and separate the 4 large phase content files into distinct cacheable chunks.
* Main entry chunk dropped from **1.76 MB to ~201 kB**.

### B. Native Mermaid Architecture Diagrams
* Built `src/components/MermaidBlock.jsx` with dark-theme styling, a "Visual / Source" toggle, and a copy button.
* Wired into `src/components/MarkdownRenderer.jsx`.
* Implemented a module-level in-memory cache (`mermaidSvgCache = new Map()`) ensuring that switching between chapters displays cached diagram SVGs in **0ms with zero re-parsing**.

### C. KaTeX LaTeX Math Formatting
* Installed and integrated `remark-math` + `rehype-katex` + `katex/dist/katex.min.css`.
* All formulas, metrics ($\text{NDCG}@K$), and complexity notations ($O(1)$, $O(S)$) now render with crisp LaTeX typography.

### D. Zero-Latency Navigation & Runtime Performance
* **Synchronous Step Resolution**: Replaced `useState(null)` + `useEffect` in `StepView.jsx` with direct synchronous in-memory lookup (`getStepByKey(stepKey)`). Swapping chapters happens on **frame 1 (0ms) with zero loading spinner flash**.
* **Isolated Notes Journal**: Extracted `src/components/NotesJournal.jsx` into an isolated memoized component. Keystrokes in the notes textarea never re-render markdown AST or code highlighters, providing native 120 FPS typing.
* **Scroll Decoupling**: Updated `src/hooks/useScrollProgress.jsx` to drive the neon scroll bar directly via DOM `transform: scaleX(...)` on `requestAnimationFrame`, while throttling React state updates to integer percentage points. This eliminates hundreds of scroll re-renders per minute.
* **Instant Top Reset**: Removed container-level smooth scrolling so route changes snap to the top instantly without animation lag.

### E. React 19 & React Router v7 Modernization
* Adopted React 19's native `use()` hook and `<StepsContext value={value}>` in `src/hooks/useSteps.jsx`.
* Implemented native Document Metadata: `<title>` and `<meta>` tags inside `StepView.jsx` are automatically hoisted to `<head>` by React 19.
* Enabled native React Router v7 `viewTransition` on all navigation `<Link>` elements.
* Upgraded UI components (`button.jsx`, `card.jsx`) to React 19 direct `ref`-as-prop syntax.

---

## 3. Backlog & Recommended Next Tasks

The other session can immediately pick up from here:

### Priority 1: Install & Configure Official React Compiler
* **Goal**: Automate fine-grained memoization across all components and hooks, eliminating manual `useMemo` / `useCallback` boilerplate.
* **Steps**:
  1. Install: `npm install -D babel-plugin-react-compiler` inside `devdocs-ai-guide`.
  2. Configure in `vite.config.js`:
     ```javascript
     plugins: [
       react({
         babel: {
           plugins: [['babel-plugin-react-compiler', {}]],
         },
       }),
     ],
     ```
  3. Verify with `npm run build`.

### Priority 2: Move `components` in `MarkdownRenderer.jsx` to Module Scope
* In `src/components/MarkdownRenderer.jsx`, the `components` mapping is currently wrapped in `useMemo`. Because it has zero dependencies on props or state, moving it completely outside the component function provides zero-allocation static lifetime.

### Priority 3: On-This-Page TOC (Table of Contents)
* For the longer 10–15 minute masterclass chapters, add an interactive floating or right-side TOC that extracts H2/H3 headings from the current step's markdown and highlights active reading position.

---

## 4. Useful Commands for Next Session

```bash
# Check git status (should be clean on main)
git status

# Run local development server
npm run dev

# Run production build (from root or devdocs-ai-guide)
npm run build
```
