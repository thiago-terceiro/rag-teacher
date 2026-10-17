# 🛡️ Infrastructure, Reliability, AST Security, a11y & i18n Overview

**Platform**: RAG Teacher (DevDocs AI Guide)  
**Date**: October 2026  
**Auditor**: Antigravity Full-Stack & Infrastructure Team  

---

## 1. Executive Summary

This audit establishes production-grade DevOps and quality engineering across the `rag-teacher` platform, transforming it from an unautomated codebase to a continuous-integration verified, accessible, and globally ready educational application.

| Area | Before | After | Free Tier / Tooling |
| :--- | :--- | :--- | :--- |
| **Pipeline & CI** | No automated tests or GitHub Actions | Automated GitHub Actions CI workflow on push & PR to `main` | GitHub Actions (Free for public repos) |
| **Test Runner & Speed** | `"echo Error: no test specified"` | 29 automated regression, data integrity & security tests passing in **~650ms** | Vitest 5.x |
| **AST & Security Analysis** | Static code without automated verification | Automated AST attack vector regression suite verifying all 38 red-team vectors | Vitest + Python AST specs |
| **Security Headers** | Basic Vercel defaults | Strict CSP (`wasm-unsafe-eval`, Pyodide CDN, no-frame), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` | `vercel.json` headers |
| **Dependency Vulnerabilities** | 16 vulnerabilities (1 critical, 7 high) | Critical IP spoofing & arbitrary file read eliminated, overrides for `braces`, `katex`, `postcss` | `npm overrides` + `npm audit fix` |
| **Accessibility (a11y)** | Missing skip link, focus styling gaps | WCAG Level A "Skip to content" link, global `:focus-visible` ring, `aria-live` polite feedback, explicit `aria-labels` | Native HTML5 / Tailwind |
| **Internationalization (i18n)** | Hardcoded English | Zero-overhead multi-language architecture supporting English (🇺🇸), Portuguese (🇧🇷), Spanish (🇪🇸) with browser auto-detection | Custom Context / LocalStorage |

---

## 2. Infrastructure & Automated CI Pipeline (`.github/workflows/ci.yml`)

### Pipeline Design
The CI pipeline runs automatically on all pushes and pull requests to `main`:
1. **Runner**: `ubuntu-latest` running Node.js 22 LTS.
2. **Caching**: Automatic caching of `~/.npm` based on `devdocs-ai-guide/package-lock.json` hash, slashing installation time to <3s.
3. **Vitest Execution**: Runs `npm test` across all 5 test suites.
4. **Production Build**: Executes `npm run build` with Vite 8 + React Compiler to catch chunk size regressions, missing imports, or syntax issues before merge.

---

## 3. Reliability & Regression Analysis (Vitest Suite)

The test suite is located in [`devdocs-ai-guide/src/__tests__/`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/__tests__/) and executes 29 tests in 650ms:

### A. Curriculum Data Integrity ([`curriculumData.test.js`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/__tests__/curriculumData.test.js))
- Confirms exactly 4 phases and 28 production modules.
- Enforces unique `step_key` constraints.
- Verifies that every module contains non-empty title, valid `phase_key`, and thorough markdown content (>100 characters).
- Asserts that step lookups (`getStepByKey`, `getNextStep`) function deterministically with zero runtime exceptions.

### B. Module Quizzes Schema & Anti-Tampering ([`moduleQuizzesData.test.js`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/__tests__/moduleQuizzesData.test.js))
- Verifies that all 28 modules have 2–3 questions (57 questions total).
- Verifies that every question has a unique ID, valid question text, exactly 4 unique options, a valid `correctIndex` within `[0..3]`, and a detailed architectural explanation.

### C. Micro-Calculators Mathematical Correctness ([`calculators.test.js`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/__tests__/calculators.test.js))
- **Vector Space Math**: Validates orthogonal ($90^\circ, \cos\theta=0$), parallel ($0^\circ, \cos\theta=1$), and opposite ($180^\circ, \cos\theta=-1$) vectors, proving the unit-norm constraint $L_2^2 \equiv 2 - 2\cos\theta$.
- **Chunking Arithmetic**: Tests sliding window overlap calculations, step size arithmetic, and raw vector storage memory calculations (bytes to MB for 1536-dim float32).
- **Reciprocal Rank Fusion**: Verifies Cormack RRF consensus scoring ($1 / (k + r_i)$) and dampening constant behavior ($k=60$ vs $k=100$).

### D. Python Sandbox Security & AST Regression ([`pythonSandboxSecurity.test.js`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/__tests__/pythonSandboxSecurity.test.js))
- Ensures code size is strictly bounded at 20,000 characters.
- Asserts air-gapping of Web Worker globals (`fetch`, `XMLHttpRequest`, `WebSocket`, `Worker`, `BroadcastChannel`, `indexedDB`, `caches`).
- Validates that recursion limit is capped (`sys.setrecursionlimit(200)`).
- Validates regex detection of format-string exploit attempts (`{0.__class__}`, `{e.tb_frame}`, `{item[0]}`) while allowing standard format strings (`{:.2f}`, `{name}`).
- Asserts module allowlists (`math`, `numpy`, `collections`, `itertools`, `re`, `json`, `random`) and blocklists (`socket`, `subprocess`, `ctypes`, `http`, `urllib`).

---

## 4. Production Security Headers (`vercel.json`)

Vercel edge routing was upgraded with strict defense-in-depth security headers:
- `Content-Security-Policy`:
  - `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net`: Enforces local scripts and Pyodide WebAssembly execution while blocking third-party script injection.
  - `worker-src 'self' blob: https://cdn.jsdelivr.net`: Permits Vite module workers and CDN Pyodide workers.
  - `frame-ancestors 'none'`: Hard block against clickjacking and iframe embedding.
  - `connect-src 'self' https://cdn.jsdelivr.net https://pypi.org https://files.pythonhosted.org`: Restricts network calls to authenticated Python package repositories.
- `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
- `X-Frame-Options: DENY`: Prevents UI redressing.
- `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
- `Permissions-Policy`: Restricts camera, microphone, geolocation, and FLEDGE tracking.
- `Cache-Control: public, max-age=31536000, immutable`: Hashed Vite bundles cached for 1 year at the edge.

---

## 5. Accessibility (a11y) Upgrades

1. **Skip to Main Content Link**:
   - Added an off-screen accessible link in [`src/App.jsx`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/App.jsx) that becomes visible on initial `Tab` keypress (`focus:not-sr-only`), snapping focus directly to `#main-scroll-container`.
2. **Global High-Contrast Focus Visible Styling**:
   - Added `:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 2px; }` in [`src/index.css`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/index.css), ensuring clear visual indicators across all 3 color themes (Deep Blue, OLED Midnight, and Daylight Paper).
3. **Screen Reader Live Regions (`aria-live="polite"`)**:
   - Integrated `aria-live="polite"` on quiz feedback cards in [`src/components/ModuleQuiz.jsx`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/components/ModuleQuiz.jsx) so non-sighted users hear immediate voice announcements of quiz results and explanations.
4. **Complete ARIA Label Coverage**:
   - Added explicit `aria-label` and `aria-pressed` attributes to all icon-only buttons in [`StatsBar.jsx`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/components/StatsBar.jsx) and [`ReadingSettingsModal.jsx`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/components/ReadingSettingsModal.jsx).

---

## 6. Internationalization (i18n) Foundation

1. **Architecture**:
   - Zero-dependency, lightweight dictionary system in [`src/i18n/translations.js`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/i18n/translations.js).
   - Extensible language dictionary supporting English (🇺🇸), Portuguese (🇧🇷), and Spanish (🇪🇸).
2. **Context & Hook (`useI18n`)**:
   - Context provider in [`src/hooks/useI18n.jsx`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/hooks/useI18n.jsx).
   - Automatically detects user browser locale (`navigator.language`) and falls back to `'en'`.
   - Persists user preferences in `localStorage` (`rag_language_v1`) and dynamically sets document `<html lang="...">`.
   - Accessible Language Selector cards integrated directly into [`ReadingSettingsModal.jsx`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/components/ReadingSettingsModal.jsx).
3. **Parity Testing**:
   - [`src/__tests__/i18n.test.js`](file:///c:/Users/thiag/Documents/projects/antigravity/rag-teacher/devdocs-ai-guide/src/__tests__/i18n.test.js) verifies 100% key parity across all supported language sets.
