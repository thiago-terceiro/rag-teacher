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

### F. React Compiler & Architecture Hardening
* Installed and configured official `@rolldown/plugin-babel` with `reactCompilerPreset` in `vite.config.js`. Automatic memoization now runs across the component tree without manual boilerplate.
* Moved `markdownComponents` in `src/components/MarkdownRenderer.jsx` to module scope for zero-allocation static lifetime.
* Extracted `src/lib/headings.js` as single source of truth for heading slugs, KaTeX handling, and smooth scrolling.
* Fixed missing `React` reference in `StatsBar.jsx` (`import React, { memo } from 'react'`).

### G. Interactive "On This Page" Table of Contents (TOC)
* Built `src/components/TableOfContents.jsx` and `src/hooks/useTableOfContents.js`:
  - `extractHeadings(markdown)`: Robustly parses H2 and H3 headings while stripping code blocks and formatting.
  - Active Section Scrollspy: Tracks `#main-scroll-container` scroll position and highlights current reading section.
  - Responsive Double Mode: Collapsible `<TableOfContentsMobile>` quick-jump drawer on mobile/tablet (`xl:hidden`), and sticky `<TableOfContentsDesktop>` right-rail sidebar on desktop (`hidden xl:block w-60 shrink-0`).
  - Hash deep-linking: Directly anchors to `#section-id` on step arrival and supports hoverable `#` heading links.
  - Fast Refresh compliance: Hook, library utilities, and components cleanly separated into dedicated modules.

### H. Spotlight Command Palette (`Cmd+K` / `Ctrl+K`)
* Built `src/components/CommandPalette.jsx` using `@radix-ui/react-dialog`:
  - Global keyboard shortcut `Cmd+K` / `Ctrl+K` accessible anywhere in the application.
  - Instant full-text fuzzy search across all 28 module titles, phase keys, and core architectural concepts (e.g., HNSW, Cross-Encoder, DSPy, Ragas, CRAG).
  - Arrow key navigation (`↑`/`↓`), `Enter` to jump, `Escape` to dismiss.
  - Quick-jump curated recommendations when query is blank.
  - Integrated trigger button into `StatsBar.jsx` and `Sidebar.jsx`.

### I. Personalized Markdown Study Guide & Notes Export
* Built client-side Markdown exporter in `src/hooks/useSteps.jsx`:
  - Gathers all 28 curriculum modules with their completion status, timestamps, and personal user notes.
  - Downloads a structured `.md` study guide (`rag-masterclass-study-notes-YYYY-MM-DD.md`) formatted for interview revision.
  - Added one-click Export buttons to `src/components/NotesJournal.jsx` and `src/components/StatsBar.jsx`.

---

## 3. Backlog & Recommended Next Tasks

The platform is running smoothly with 28 masterclass modules. Recommended next enhancements:

### Priority 1: Interactive Cosine & Vector Math Sandbox
* Client-side interactive vector distance visualizer / sandbox for Phase 1 (demonstrating Dot Product vs. Cosine Similarity vs. Euclidean distance with sliders).

### Priority 2: Staff Interview Flashcard / Quiz Mode
* Interactive practice mode that tests learners on the 28 interview system design questions with collapsible staff-level benchmark answers.

---

## 4. Useful Commands for Next Session

```bash
# Check git status (clean on main)
git status

# Run local development server
npm run dev:ui

# Run production build
npm run build

# Deploy to Vercel production
npx --yes vercel --yes --prod
```
