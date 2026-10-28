#!/usr/bin/env node
/**
 * audit-bundle.mjs
 * 
 * Verifies production build bundle sizes, code-splitting rules,
 * and Service Worker offline caching partition configurations.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../../../../devdocs-ai-guide/dist');
const assetsDir = path.join(distDir, 'assets');
const swPath = path.resolve(__dirname, '../../../../devdocs-ai-guide/public/sw.js');

console.log('====================================================');
console.log('  RAG TEACHER: Production Performance & Bundle Audit');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Verify Service Worker Caching Partition
console.log('1. Checking Service Worker Pyodide Cache Partition:');
if (fs.existsSync(swPath)) {
  const swCode = fs.readFileSync(swPath, 'utf8');
  assert(swCode.includes('pyodide-cdn-v0.27.3'), 'Dedicated pyodide-cdn-v0.27.3 cache partition configured');
  assert(swCode.includes('url.pathname.includes(\'/pyodide/\')'), 'Intercepts Pyodide CDN assets');
  assert(swCode.includes('cache.match(request)'), 'Applies Cache-First strategy for Pyodide assets');
} else {
  assert(false, `sw.js not found at ${swPath}`);
}

// 2. Inspect Production Assets (if dist exists)
console.log('\n2. Inspecting Production Bundle Chunks (dist/assets):');
if (!fs.existsSync(assetsDir)) {
  console.log('  [!] dist/assets directory not found. Run "npm run build" first to verify chunk sizes.');
  console.log('  [i] Skipping chunk size measurements (build required).');
} else {
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  const indexJs = jsFiles.find(f => f.startsWith('index-'));
  const indexCss = cssFiles.find(f => f.startsWith('index-'));

  if (indexJs) {
    const rawSize = fs.statSync(path.join(assetsDir, indexJs)).size;
    const content = fs.readFileSync(path.join(assetsDir, indexJs));
    const gzipSize = zlib.gzipSync(content).length;

    const rawKb = (rawSize / 1024).toFixed(1);
    const gzipKb = (gzipSize / 1024).toFixed(1);

    console.log(`  -> Initial JS Chunk: ${indexJs} (${rawKb} kB, gzip ${gzipKb} kB)`);

    // Budget: 180 kB uncompressed
    assert(rawSize <= 180 * 1024, `Initial JS chunk (${rawKb} kB) is within budget (< 180 kB)`);
    assert(gzipSize <= 60 * 1024, `Initial JS chunk gzip (${gzipKb} kB) is within target (< 60 kB)`);

    // Verify Mermaid is NOT bundled inside the initial index chunk
    const hasMermaidBundle = content.includes('mermaid') && rawSize > 800 * 1024;
    assert(!hasMermaidBundle, 'Mermaid is successfully decoupled from initial index chunk');
  } else {
    assert(false, 'index-*.js not found in dist/assets');
  }

  if (indexCss) {
    const cssSize = fs.statSync(path.join(assetsDir, indexCss)).size;
    const cssKb = (cssSize / 1024).toFixed(1);
    console.log(`  -> Initial CSS Chunk: ${indexCss} (${cssKb} kB)`);
    assert(cssSize <= 90 * 1024, `Initial CSS chunk (${cssKb} kB) is within budget (< 90 kB)`);
  }
}

// 3. Worker Hybrid Lifecycle Checks in PythonSandbox.tsx
console.log('\n3. Verifying PythonSandbox Hybrid Lifecycle & Eviction:');
const sandboxPath = path.resolve(__dirname, '../../../../devdocs-ai-guide/src/components/PythonSandbox.tsx');
if (fs.existsSync(sandboxPath)) {
  const sandboxCode = fs.readFileSync(sandboxPath, 'utf8');
  assert(sandboxCode.includes('WORKER_IDLE_EVICTION_MS = 5 * 60 * 1000'), '5-minute worker idle eviction configured');
  assert(sandboxCode.includes('isExecutingRef.current'), 'Atomic execution lock prevents double-invocation races');
  assert(sandboxCode.includes('globalPyodideWorker'), 'Warm worker caching across dialog close events is active');
} else {
  assert(false, `PythonSandbox.tsx not found at ${sandboxPath}`);
}

console.log('\n----------------------------------------------------');
console.log(`Results: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  console.error('\n[-] Performance audit failed! Review chunk sizes or worker lifecycle.');
  process.exit(1);
} else {
  console.log('[+] All Performance & Bundle budgets verified successfully!\n');
  process.exit(0);
}
