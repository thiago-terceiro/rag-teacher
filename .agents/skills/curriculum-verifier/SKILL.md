---
name: curriculum-verifier
description: >-
  Audits curriculum content integrity, module quizzes, interview questions, i18n translation parity (en, pt-BR, es), and executes full CI testing gates.
  Use when adding or updating curriculum steps, translation strings, quiz questions, or verifying PR readiness.
---

# Curriculum Verifier Skill

This skill provides an automated verification runbook to ensure instructional quality, multilingual dictionary completeness, question schema validity, and zero regression across all test suites in **RAG Teacher**.

## When to Run

- When adding or editing modules/steps in `devdocs-ai-guide/src/data/`.
- When adding, modifying, or refactoring UI translation strings in `devdocs-ai-guide/src/i18n/translations.ts`.
- When modifying quiz questions, interview question banks, or study guide export formats.
- Prior to submitting pull requests or merging feature branches.

---

## Quality Invariants

1. **Trilingual Dictionary Parity**:
   - Every single key defined in `translations.en` must have an equivalent non-empty translation in `translations['pt-BR']` and `translations.es`.
   - Zero hardcoded English strings in UI templates.
2. **Accented Unicode Heading Slugs**:
   - All topic headings must generate valid anchors through `slugify(title)` using `normalize('NFD')` to strip diacritics while preserving word boundaries.
3. **Curriculum Step Integrity**:
   - Each curriculum step must contain a unique `id`, valid `title`, `module` assignment, non-empty `content`, and at least one code example or interactive widget.
4. **Quiz & Interview Question Schemas**:
   - Quizzes must have exactly one correct answer index, explanation string, and non-empty options array.
   - Interview questions must define `id`, `question`, `category`, `difficulty`, and structured guidance (`keyConcepts`, `talkingPoints`, `pitfalls`).

---

## Verification Runbook

### Step 1: Run the Automated i18n & Slug Parity Audit
From the workspace root, run:
```powershell
node .agents/skills/curriculum-verifier/scripts/check-i18n-keys.mjs
```
*Expected Result: All 104+ translation keys match 100% across en, pt-BR, and es.*

### Step 2: Run Full Unit & Regression Test Suite
Run Vitest across all curriculum, state, and algorithmic tests:
```powershell
npm.cmd --prefix devdocs-ai-guide test
```
*Expected Result: 8/8 test files pass (all 91+ unit tests).*

### Step 3: Run TypeScript Strict Typecheck
Verify zero type errors across the entire application:
```powershell
npm.cmd --prefix devdocs-ai-guide run typecheck
```
*Expected Result: `tsc --noEmit` exits with code 0.*

### Step 4: Run Production Build
Ensure that Vite builds cleanly without warnings or missing asset references:
```powershell
npm.cmd --prefix devdocs-ai-guide run build
```
