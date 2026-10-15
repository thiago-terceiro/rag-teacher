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

### J. "Interview Questions" Hub (All 28 Staff-Level Scenarios)
* Built `src/components/InterviewQuestions.jsx` and `src/data/interviewQuestionsData.js`:
  - Curated all 28 production system design interview prompts asked at top AI labs (OpenAI, Anthropic, Google DeepMind, Meta).
  - Phase filter tabs (`All`, `Phase 1: Foundation`, `Phase 2: Quality`, `Phase 3: Agents`, `Phase 4: Prod`) and real-time keyword/tag search.
  - Interactive self-answer scratchpads with auto-saving to `localStorage` (`rag_interview_drafts_v1`).
  - Collapsible Staff-level architecture answers featuring failure modes, sizing calculations, latency budgets, and code recipes.
  - Mastery progress tracking (`rag_interview_mastery_v1`) with completion percentage ring.
  - Dedicated route `/interview-questions`, accessible via `StatsBar`, `Sidebar`, and direct links inside each curriculum step.
  - Code-split into its own cacheable bundle chunk (`content-interview`, ~110 kB).

### K. Interactive 2D Vector Distance Visualizer Sandbox
* Built `src/components/VectorVisualizer.jsx`:
  - Interactive 2D Cartesian SVG plane with draggable vector heads ($\vec{A}$ and $\vec{B}$).
  - Live mathematical metrics computed at 60 FPS: Angle $\theta$, Cosine Similarity ($\cos\theta$), Dot Product ($\vec{A} \cdot \vec{B}$), and Euclidean Distance ($L_2$).
  - Unit-norm constraint toggle proving $\vec{A} \cdot \vec{B} \equiv \cos\theta$ and $L_2^2 = 2 - 2\cos\theta$ geometrically.
  - Staff AI Architect insight callout explaining when to choose Cosine vs. Dot Product vs. L2 in vector databases (FAISS, Qdrant, Pinecone).
  - Accessible via `StatsBar`, `Sidebar`, and directly embedded as an interactive banner inside Step 9 (`dense-retrieval`) and Step 11 (`vector-database-ann`).

### L. Reading Comfort Settings (Customizable Typography & Layout)
* Built `src/hooks/useReadingSettings.jsx` and `src/components/ReadingSettingsModal.jsx`:
  - User-configurable text size: Default (15px), Medium (17px), Large (19px).
  - Reading column width: Standard (`max-w-4xl`) vs. Wide (`max-w-5xl`) with responsive adjustments.
  - Line spacing: Relaxed (1.75) vs. Spacious (2.1).
  - Persisted across sessions via `localStorage` (`rag_reading_settings_v1`).
  - Modal accessible from `StatsBar` with full keyboard and screen-reader accessibility.

---

## 3. Backlog & Recommended Next Tasks

The platform now features the complete 28-step curriculum, interactive vector sandbox, reading comfort controls, and dedicated Interview Questions hub. Recommended future enhancements:

### Backlog Enhancements
1. **Completion Certificate Generator**: Client-side canvas-generated PDF/PNG certificate of completion once all 28 modules and interview questions reach 100% mastery.
2. **Offline PWA Support**: Service worker caching of the curriculum assets for reading on flights or offline environments.

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
