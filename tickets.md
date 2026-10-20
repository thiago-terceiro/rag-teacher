# 🎫 TypeScript Full-Stack Migration Ticket Tracker

**Status**: Planning / In Progress  
**Objective**: Migrate 100% of the JavaScript (`.js`/`.jsx`) codebase to strict TypeScript (`.ts`/`.tsx`), configure `tsconfig.json`, establish explicit domain types, verify all unit tests and production builds, and push to GitHub.

---

### [x] Ticket 1: Tooling & TSConfig Foundation
- **Scope**:
  - Install devDependencies: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@types/canvas-confetti`, `@types/express`, `@types/pg`.
  - Create `tsconfig.json` with strict type checking, ES2022 target, `bundler` module resolution, `react-jsx` support, and path aliases.
  - Create `tsconfig.node.json` for Vite and server scripts.
  - Add `"typecheck": "tsc --noEmit"` script to `package.json`.
- **Definition of Done**: `npm run typecheck` can run in `devdocs-ai-guide/`.

---

### [ ] Ticket 2: Domain Types & Data Contracts Definition
- **Scope**:
  - Create `src/types/index.ts`.
  - Define interfaces:
    - `Step`, `Phase`, `StepStatus`, `CurriculumProgress`
    - `ReadingSettings`, `ThemeMode`, `FontSizeMode`, `SpacingMode`, `WidthMode`
    - `QuizQuestion`, `QuizAnswerState`, `QuizSubmission`
    - `InterviewQuestion`, `InterviewAnswerState`
    - `SupportedLocale`, `TranslationDictionary`
    - `SandboxContextType`, `PythonRunResult`, `VectorPoint`
- **Definition of Done**: All shared contracts are cleanly exported with zero `any` wherever possible.

---

### [ ] Ticket 3: Utilities, Libraries, i18n & Worker Migration
- **Scope**:
  - `src/lib/utils.js` -> `src/lib/utils.ts`
  - `src/lib/headings.js` -> `src/lib/headings.ts`
  - `src/lib/confetti.js` -> `src/lib/confetti.ts`
  - `src/lib/registerServiceWorker.js` -> `src/lib/registerServiceWorker.ts`
  - `src/i18n/translations.js` -> `src/i18n/translations.ts`
  - `src/workers/pyodideWorker.js` -> `src/workers/pyodideWorker.ts`
- **Definition of Done**: Utility and worker files compile cleanly under `tsc`.

---

### [ ] Ticket 4: Curriculum Data Migration
- **Scope**:
  - `src/data/guideData.js` -> `src/data/guideData.ts`
  - `src/data/interviewQuestionsData.js` -> `src/data/interviewQuestionsData.ts`
  - `src/data/moduleQuizzesData.js` -> `src/data/moduleQuizzesData.ts`
  - `src/data/phase1Content.js` -> `src/data/phase1Content.ts`
  - `src/data/phase2Content.js` -> `src/data/phase2Content.ts`
  - `src/data/phase3Content.js` -> `src/data/phase3Content.ts`
  - `src/data/phase4Content.js` -> `src/data/phase4Content.ts`
- **Definition of Done**: All 28 steps and questions type-checked against `Step[]` and `InterviewQuestion[]`.

---

### [ ] Ticket 5: Context Providers & Custom Hooks Migration
- **Scope**:
  - `src/context/SandboxContext.jsx` -> `src/context/SandboxContext.tsx`
  - `src/hooks/useSteps.jsx` -> `src/hooks/useSteps.tsx`
  - `src/hooks/useReadingSettings.jsx` -> `src/hooks/useReadingSettings.tsx`
  - `src/hooks/useI18n.jsx` -> `src/hooks/useI18n.tsx`
  - `src/hooks/useScrollProgress.jsx` -> `src/hooks/useScrollProgress.tsx`
  - `src/hooks/useTableOfContents.js` -> `src/hooks/useTableOfContents.ts`
  - `src/hooks/useNetworkStatus.js` -> `src/hooks/useNetworkStatus.ts`
  - `src/hooks/useDebounce.js` -> `src/hooks/useDebounce.ts`
- **Definition of Done**: All custom hooks have typed parameters and return tuples/objects.

---

### [ ] Ticket 6: UI Primitives & Core Display Components Migration
- **Scope**:
  - `src/components/ui/button.jsx` -> `src/components/ui/button.tsx`
  - `src/components/ui/card.jsx` -> `src/components/ui/card.tsx`
  - `src/components/ProgressRing.jsx` -> `src/components/ProgressRing.tsx`
  - `src/components/CodeBlock.jsx` -> `src/components/CodeBlock.tsx`
  - `src/components/MermaidBlock.jsx` -> `src/components/MermaidBlock.tsx`
  - `src/components/MarkdownRenderer.jsx` -> `src/components/MarkdownRenderer.tsx`
- **Definition of Done**: Display components type-checked with explicit prop interfaces.

---

### [ ] Ticket 7: Interactive Features & Calculator Widgets Migration
- **Scope**:
  - `src/components/ChunkingCalculator.jsx` -> `src/components/ChunkingCalculator.tsx`
  - `src/components/RRFSimulator.jsx` -> `src/components/RRFSimulator.tsx`
  - `src/components/VectorVisualizer.jsx` -> `src/components/VectorVisualizer.tsx`
  - `src/components/PythonSandbox.jsx` -> `src/components/PythonSandbox.tsx`
  - `src/components/NotesJournal.jsx` -> `src/components/NotesJournal.tsx`
  - `src/components/ModuleQuiz.jsx` -> `src/components/ModuleQuiz.tsx`
  - `src/components/InterviewQuestions.jsx` -> `src/components/InterviewQuestions.tsx`
  - `src/components/CommandPalette.jsx` -> `src/components/CommandPalette.tsx`
  - `src/components/ReadingSettingsModal.jsx` -> `src/components/ReadingSettingsModal.tsx`
  - `src/components/TableOfContents.jsx` -> `src/components/TableOfContents.tsx`
- **Definition of Done**: State updaters and math calculations typed without implicit `any`.

---

### [ ] Ticket 8: App Shell, Navigation & Entry Migration
- **Scope**:
  - `src/components/Sidebar.jsx` -> `src/components/Sidebar.tsx`
  - `src/components/StatsBar.jsx` -> `src/components/StatsBar.tsx`
  - `src/components/StepView.jsx` -> `src/components/StepView.tsx`
  - `src/App.jsx` -> `src/App.tsx`
  - `src/main.jsx` -> `src/main.tsx`
  - Update `index.html` script tag to point to `/src/main.tsx`.
- **Definition of Done**: Application boots and navigates with 100% typed component hierarchy.

---

### [ ] Ticket 9: Backend Server & Scripts Migration
- **Scope**:
  - `server/db.js` -> `server/db.ts`
  - `server/content.js` -> `server/content.ts`
  - `server/migrate.js` -> `server/migrate.ts`
  - `server/seed.js` -> `server/seed.ts`
  - `server/routes/api.js` -> `server/routes/api.ts`
  - `server/index.js` -> `server/index.ts`
- **Definition of Done**: Express routes and database queries type-checked.

---

### [ ] Ticket 10: Test Suite Migration, Typecheck & Verification
- **Scope**:
  - Migrate all `src/__tests__/*.test.js` to `.test.ts`.
  - Run `npm run typecheck` (`tsc --noEmit`) -> 0 errors.
  - Run `npm test` (Vitest) -> 100% passing.
  - Run `npm run build` (Vite production build) -> success.
  - Verify zero leftover `.js` or `.jsx` source files in `src/` and `server/`.
  - Push clean commit to GitHub `main`.
- **Definition of Done**: Full repository is 100% TypeScript, passing all automated suites.
