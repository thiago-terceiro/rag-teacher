# Performance Optimization Log — RAG Teacher (`devdocs-ai-guide`)

Chronological record of verified performance audits, retained optimizations, reverted experiments, benchmark results, and reproduction steps.

---

## 2026-11-16 — Font Delivery, CodeBlock DOM, Markdown LRU Cache & Interview Cards

**Scope:** Font/asset delivery, code-block DOM footprint, Markdown/KaTeX re-render caching, and Interview Questions offscreen rendering. Negligible or counterproductive micro-optimizations were benchmarked and reverted.

### 1. Summary of Optimizations Kept

All kept changes are small, localized, zero-dependency, and strictly verified against TypeScript (`tsc --noEmit`), Vitest (`11/11` suites, `151/151` tests), Bundle Budget Audit (`10/10`), i18n Parity (`5/5`), and Playwright E2E + Axe WCAG 2.1/2.2 AAA (`22/22` tests).

| # | File | Change | Why & Measured Impact |
| :--- | :--- | :--- | :--- |
| **1** | [`devdocs-ai-guide/src/main.tsx`](../devdocs-ai-guide/src/main.tsx) | Replaced wildcard `@fontsource/inter/latin.css` + `latin-ext.css` with explicit `latin-{400,500,600,700,800}.css` | Eliminates CSS cascade override where `latin-ext` (without `unicode-range`) forced browsers to download 35 KiB `latin-ext` `.woff2` files instead of 23 KiB `latin` `.woff2` files, and removes 26 unused Inter weight files (`100`, `200`, `300`, `900`; verified 0 `latin-ext` chars in `src/`). **-140.2 KiB (-48.9%) font transfer** on cold load, **-4 network requests**, **-2.68 KiB CSS**, **-26 emitted asset files**. |
| **2** | [`devdocs-ai-guide/src/components/CodeBlock.tsx`](../devdocs-ai-guide/src/components/CodeBlock.tsx) | Removed unused `wrapLines={true}` on `SyntaxHighlighter`, hoisted `SYNTAX_HIGHLIGHTER_STYLE` to module scope, sliced `firstLine` check to first 256 chars | `wrapLines={true}` without `lineProps` wrapped every line of code in extra `<span>` nodes. Removing it eliminates **-235 to -240 DOM `<span>` nodes per step** (-17.2% code-block spans on Step 1; -13.3% across 14 steps). |
| **3** | [`devdocs-ai-guide/src/components/MarkdownRenderer.tsx`](../devdocs-ai-guide/src/components/MarkdownRenderer.tsx) | Added a bounded 36-entry LRU cache (`markdownElementCache`) via `renderCachedMarkdown()` around `ReactMarkdown(...)` | Skips synchronous `remark`/`rehype`/`KaTeX` AST parsing on step revisits and interview-answer re-reveals while keeping `<CodeBlock>`, `<TableRegion>`, and `<LazyMermaidBlock>` theme/context reactive on mount. **-29.8% to -32.0% revisit step-navigation latency** (`143.58 ms` -> `100.85 ms` median) and faster cached answer re-reveals (`107.23 ms` -> `75.73 ms` median, `-29.4%`). |
| **4** | [`devdocs-ai-guide/src/components/InterviewQuestions.tsx`](../devdocs-ai-guide/src/components/InterviewQuestions.tsx) | Added CSS `[content-visibility:auto] [contain-intrinsic-size:auto_420px]` to `InterviewQuestionCard` | Defers offscreen layout & `backdrop-blur-md` paint for the 28-card stack. **-33.2% `All (28)` filter/render latency** (`99.89 ms` -> `66.68 ms` median). |

### 2. Experiments Evaluated & Reverted (Cleanliness / ROI Gate)

1. **Guarding `container.scrollTop !== 0` in `StepView.tsx` — REVERTED (Counterproductive)**  
   - **Hypothesis:** Checking `container.scrollTop !== 0` and `window.scrollY !== 0` before resetting scroll on step navigation would skip redundant DOM writes.  
   - **Measured Result:** CDP CPU profiling across 4 cached step navigations revealed `get scrollTop` consumed **144 samples (~7–12 ms)** because reading `container.scrollTop` inside `useEffect` immediately after committing ~4,800 DOM nodes forced a synchronous Blink layout reflow (`UpdateStyleAndLayoutForNode`). In an isolated 20-iteration dirty-DOM test, read-then-write took `129.6 ms` vs `116.2 ms` for write-only `container.scrollTop = 0`. Meanwhile, the `window.scrollY !== 0` guard saved only `0.0013 ms` per call. Reverted to keep `StepView.tsx` clean and free of forced layout reads (after reverting, back-revisit median dropped from `101.03 ms` to `97.97 ms`).
2. **Precomputing `titleLower` / `parentLower` / `previewLower` in `CommandPalette.tsx` — REVERTED (Negligible)**  
   - **Hypothesis:** Precomputing lowercase fields in `getSearchableItems()` and refactoring the item builder loop would speed up search keystrokes.  
   - **Measured Result:** In a Chromium V8 micro-benchmark across 220 searchable items, dynamic `.toLowerCase()` took `0.0607 ms` vs `0.0106 ms` precomputed — saving **0.050 ms (50 microseconds)** per keystroke (0.45% of the ~11 ms E2E input-to-paint cycle) while adding 3 extra properties to the exported `SearchableItem` interface and duplicating lowercase strings in memory. Reverted completely.
3. **Guarding `configureMermaidTheme` with `lastConfiguredIsLight` in `MermaidBlock.tsx` — REVERTED (Negligible)**  
   - **Hypothesis:** Skipping redundant `mermaid.initialize()` calls when the light/dark mode hadn't changed would speed up diagram rendering.  
   - **Measured Result:** In headless Chromium against `mermaid.min.js`, `mermaid.initialize()` took **0.568 ms** per call (~0.5% of a 100–170 ms diagram render) while introducing module-level mutable state (`lastConfiguredIsLight`). Reverted.
4. **Removing `key={stepKey}` from `StepView.tsx` outer container — REVERTED (Regression)**  
   - **Measured Result:** Regressed forward navigation median from `141.71 ms` to `168.31 ms` and backward navigation to `200.66 ms` because React diffing two large disparate trees was slower than clean unmount/mount.
5. **Caching `SyntaxHighlighter` element output via `React.cloneElement` + type cast in `CodeBlock.tsx` — REVERTED (Negligible + Type Cast)**  
   - **Measured Result:** Back-navigation median shifted from `97.68 ms` to `98.31 ms` (noise), while requiring `React.cloneElement` and `as unknown as` casts.
6. **Splitting `phase2Content`–`phase4Content` into async phase chunks — NOT APPLIED**  
   - **Rationale:** `StepView.tsx` guarantees synchronous 0 ms step lookup without loading-spinner flashes, and existing unit tests (`curriculumData.test.ts`, `mermaidDiagrams.test.ts`, `stateArchitecture.test.ts`) import `allSteps`/`initialPhases` synchronously.

### 3. Benchmark Evidence (Before vs. After)

**Environment:** Windows 11, Node.js `v24.9.0`, Vite `8.3.4` production build (`dist/`), Headless Chromium via `@playwright/test` (`1.64.1`), local `127.0.0.1` static HTTP server (`waitUntil: 'networkidle'` for cold loads; `requestAnimationFrame` x2 settle for interactive transitions).

#### 3.1 Production Build & Static Assets

| Metric | Baseline (Before) | Optimized (After) | Delta |
| :--- | :---: | :---: | :---: |
| Total files in `dist/assets/` | 176 | 150 | **-26 files (-14.8%)** |
| Inter font files emitted | 36 | 10 | **-26 files (-72.2%)** |
| Initial JS chunk (`index-*.js`) | 158.84 KiB (gzip 50.33 KiB) | 159.07 KiB (gzip 50.42 KiB) | +0.23 KiB (within 180 KiB budget) |
| Initial CSS chunk (`index-*.css`) | 83.20 KiB (gzip 14.81 KiB) | 80.52 KiB (gzip 14.47 KiB) | **-2.68 KiB (-3.2%)** |

#### 3.2 Cold Page Load (`/steps/project-setup`, 3 Fresh Context Runs)

| Metric | Baseline (Before) | Optimized (After) | Delta |
| :--- | :---: | :---: | :---: |
| Network requests | 41 | 37 | **-4 requests** |
| Font bytes transferred | 286.8 KiB | 146.6 KiB | **-140.2 KiB (-48.9%)** |
| Stylesheet bytes transferred | 112.3 KiB | 109.6 KiB | **-2.7 KiB (-2.4%)** |
| Total cold transfer | 2,598.4 KiB | 2,455.8 KiB | **-142.6 KiB (-5.5%)** |
| Wall load time (median of 3 runs) | 1,017.55 ms | 963.07 ms | **-54.48 ms (-5.4%)** |
| Initial DOM nodes | 3,299 | 3,064 | **-235 nodes (-7.1%)** |
| Initial code-block `<span>` nodes | 1,365 | 1,130 | **-235 spans (-17.2%)** |

#### 3.3 Step-to-Step Navigation (14 Forward + 14 Backward Steps via `ArrowRight` / `ArrowLeft`)

| Metric | Baseline (Before) | Optimized (After) | Delta |
| :--- | :---: | :---: | :---: |
| Avg DOM nodes across 14 steps | 5,022 | 4,781 | **-241 nodes/step** |
| Avg code-block `<span>`s across 14 steps | 1,798 | 1,558 | **-240 spans/step (-13.3%)** |
| Forward step navigation (cold parse, median) | 141.71 ms | 139.73 ms | -1.98 ms (-1.4%) |
| **Revisit step navigation (cached Markdown, median)** | **143.58 ms** | **100.85 ms** | **-42.73 ms (-29.8%)** |
| **Revisit step navigation (cached Markdown, avg)** | **152.24 ms** (5-run baseline) | **103.53 ms** | **-48.71 ms (-32.0%)** |

#### 3.4 Interview Questions (`/interview-questions`)

| Metric | Before | After | Delta |
| :--- | :---: | :---: | :---: |
| **`All (28)` filter render (median of 6 runs)** | **99.89 ms** | **66.68 ms** | **-33.21 ms (-33.2%)** |
| **Reveal Architecture Answer (1st uncached vs 2nd cached, 3 cards)** | **107.23 ms** (1st uncached median; runs: `107.54, 107.04, 107.23`) | **75.73 ms** (2nd cached median; runs: `75.73, 66.94, 83.21`) | **-31.50 ms (-29.4% on cached re-reveal)** |

#### 3.5 Functional Integrity Check (Cached Markdown + Live Theme Switching)
- Navigated `/steps/project-setup` -> forward -> back (hitting `markdownElementCache`), then switched theme from `deep-blue` to `daylight-paper`:
  - `<CodeBlock>` background updated live: `rgb(13, 19, 34)` -> `rgb(248, 250, 252)`
  - `<MermaidBlock>` canvas background updated live: `rgba(12, 16, 23, 0.8)` -> `rgb(248, 250, 252)`

### 4. Verification Gates Executed

1. **TypeScript (`tsc --noEmit`):** `npm.cmd --prefix devdocs-ai-guide run typecheck` -> **Exit 0 (0 errors)**
2. **Vitest Unit & Regression Suite:** `npm.cmd --prefix devdocs-ai-guide test` -> **11/11 files, 151/151 tests passed**
3. **Production Build:** `npm.cmd --prefix devdocs-ai-guide run build` -> **Clean build (`dist/assets/index-*.js` 159.07 KiB / 50.42 KiB gzip)**
4. **Bundle & Perf Budget Audit:** `node .agents/skills/rag-perf-audit/scripts/audit-bundle.mjs` -> **10/10 checks passed**
5. **i18n & Slug Parity Audit:** `node .agents/skills/curriculum-verifier/scripts/check-i18n-keys.mjs` -> **5/5 checks passed (198 keys across `en`, `pt-BR`, `es`)**
6. **Playwright E2E + Axe WCAG 2.1/2.2 AAA:**
   - `e2e/curriculum.spec.ts` -> **7/7 passed**
   - `e2e/a11y.spec.ts --workers=1` -> **15/15 passed**

### 5. How to Reproduce

#### 5.1 Run All Quality, Bundle, and E2E Gates

From the workspace root (`rag-teacher/`):

```powershell
# 1. Typecheck, Unit Tests, and Production Build
npm.cmd --prefix devdocs-ai-guide run typecheck
npm.cmd --prefix devdocs-ai-guide test
npm.cmd --prefix devdocs-ai-guide run build

# 2. Bundle Budget & i18n Audits
node .agents/skills/rag-perf-audit/scripts/audit-bundle.mjs
node .agents/skills/curriculum-verifier/scripts/check-i18n-keys.mjs

# 3. Playwright E2E & WCAG AAA Accessibility Audits
Push-Location devdocs-ai-guide
npx.cmd playwright test e2e/curriculum.spec.ts
npx.cmd playwright test e2e/a11y.spec.ts --workers=1
Pop-Location
```

#### 5.2 Reproduce the Performance Benchmarks

From the workspace root (`rag-teacher/`), after running `npm.cmd --prefix devdocs-ai-guide run build`, pipe the following benchmark script directly into `node`:

```powershell
@'
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { chromium } = require('./devdocs-ai-guide/node_modules/@playwright/test');

const distDir = path.resolve('devdocs-ai-guide/dist');
const assetsDir = path.join(distDir, 'assets');
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : +((s[mid - 1] + s[mid]) / 2).toFixed(2);
}

const assetFiles = fs.readdirSync(assetsDir);
const interFiles = assetFiles.filter(f => f.startsWith('inter-'));
const indexJs = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
const indexCss = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.css'));

console.log('=== STATIC ASSETS ===');
console.log({
  totalAssetFiles: assetFiles.length,
  interFontFiles: interFiles.length,
  indexJsKiB: +(fs.statSync(path.join(assetsDir, indexJs)).size / 1024).toFixed(2),
  indexJsGzipKiB: +(zlib.gzipSync(fs.readFileSync(path.join(assetsDir, indexJs))).length / 1024).toFixed(2),
  indexCssKiB: +(fs.statSync(path.join(assetsDir, indexCss)).size / 1024).toFixed(2),
  indexCssGzipKiB: +(zlib.gzipSync(fs.readFileSync(path.join(assetsDir, indexCss))).length / 1024).toFixed(2),
});

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0];
  let fp = path.join(distDir, cleanUrl === '/' ? 'index.html' : cleanUrl);
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) fp = path.join(distDir, 'index.html');
  const ext = path.extname(fp);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch();

  // 1. Cold Load (3 runs)
  const coldResults = [];
  let netSummary = null;
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests = [];
    page.on('response', async res => {
      const url = res.url();
      if (!url.startsWith('http://127.0.0.1')) return;
      let len = 0;
      try { len = (await res.body()).length; } catch {}
      requests.push({ url, type: res.request().resourceType(), bytes: len });
    });

    const t0 = performance.now();
    await page.goto('http://127.0.0.1:' + port + '/steps/project-setup', { waitUntil: 'networkidle' });
    await page.waitForSelector('article header h1');
    const wallMs = +(performance.now() - t0).toFixed(2);
    const navStats = await page.evaluate(() => ({
      domNodes: document.querySelectorAll('*').length,
      codeSpans: document.querySelectorAll('.print-code-block code span').length,
    }));
    coldResults.push({ wallMs, ...navStats });
    if (run === 0) {
      const byType = {};
      for (const r of requests) byType[r.type] = (byType[r.type] || 0) + r.bytes;
      netSummary = {
        requests: requests.length,
        totalKiB: +(requests.reduce((s, r) => s + r.bytes, 0) / 1024).toFixed(1),
        byTypeKiB: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, +(v / 1024).toFixed(1)])),
      };
    }
    await context.close();
  }
  console.log('=== COLD LOAD (3 runs) ===');
  console.log('Network:', netSummary);
  console.log('Median wallMs:', median(coldResults.map(r => r.wallMs)), 'DOM:', coldResults[0]);

  // 2. Step Navigation (14 forward + 14 back)
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:' + port + '/steps/project-setup', { waitUntil: 'networkidle' });
  await page.waitForSelector('article header h1');

  const p0 = await page.locator('article header h1').first().textContent();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((pt) => document.querySelector('article header h1')?.textContent !== pt, p0);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

  const fwdTimes = [];
  let sumDom = 0, sumCodeSpans = 0;
  for (let i = 0; i < 14; i++) {
    const prevTitle = await page.locator('article header h1').first().textContent();
    const start = performance.now();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((pt) => document.querySelector('article header h1')?.textContent !== pt, prevTitle);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    fwdTimes.push(+(performance.now() - start).toFixed(2));
    const counts = await page.evaluate(() => ({
      dom: document.querySelectorAll('*').length,
      spans: document.querySelectorAll('.print-code-block code span').length,
    }));
    sumDom += counts.dom;
    sumCodeSpans += counts.spans;
  }

  const backTimes = [];
  for (let i = 0; i < 14; i++) {
    const prevTitle = await page.locator('article header h1').first().textContent();
    const start = performance.now();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction((pt) => document.querySelector('article header h1')?.textContent !== pt, prevTitle);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    backTimes.push(+(performance.now() - start).toFixed(2));
  }

  console.log('=== STEP NAVIGATION ===');
  console.log('Forward median (ms):', median(fwdTimes), 'avg:', +(fwdTimes.reduce((a,b)=>a+b,0)/14).toFixed(2));
  console.log('Back revisit median (ms):', median(backTimes), 'avg:', +(backTimes.reduce((a,b)=>a+b,0)/14).toFixed(2));
  console.log('Avg DOM nodes/step:', Math.round(sumDom / 14), 'Avg code spans/step:', Math.round(sumCodeSpans / 14));

  // 3. Interview Questions
  await page.goto('http://127.0.0.1:' + port + '/interview-questions', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1');
  const toggleAllTimes = [];
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: 'Phase 1: Foundation (9)' }).click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const s = performance.now();
    await page.getByRole('button', { name: 'All (28)' }).click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    toggleAllTimes.push(+(performance.now() - s).toFixed(2));
  }

  const reveal1Times = [];
  const reveal2Times = [];
  for (let i = 0; i < 3; i++) {
    const card = page.locator('[id^="q-"]').nth(i);
    const s1 = performance.now();
    await card.getByRole('button', { name: /Reveal Architecture Answer/i }).click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    reveal1Times.push(+(performance.now() - s1).toFixed(2));
    await card.getByRole('button', { name: /Hide Architecture Answer/i }).click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const s2 = performance.now();
    await card.getByRole('button', { name: /Reveal Architecture Answer/i }).click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    reveal2Times.push(+(performance.now() - s2).toFixed(2));
    await card.getByRole('button', { name: /Hide Architecture Answer/i }).click();
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  }
  console.log('=== INTERVIEW QUESTIONS ===');
  console.log('All(28) render median (ms):', median(toggleAllTimes));
  console.log('Reveal 1st (uncached) median (ms):', median(reveal1Times), 'runs:', reveal1Times);
  console.log('Reveal 2nd (cached) median (ms):', median(reveal2Times), 'runs:', reveal2Times);

  await ctx.close();
  await browser.close();
  server.close();
})();
'@ | node -
```
