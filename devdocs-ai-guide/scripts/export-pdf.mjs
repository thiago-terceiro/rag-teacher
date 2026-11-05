#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..');
const distDir = path.resolve(projectRoot, 'dist');

// MIME types for static server
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    step: 'project-setup',
    out: null,
    all: false,
    format: 'A4',
  };

  for (const arg of args) {
    if (arg.startsWith('--step=')) {
      options.step = arg.split('=')[1];
    } else if (arg.startsWith('--out=')) {
      options.out = arg.split('=')[1];
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    }
  }

  return options;
}

// Start temporary static server for production dist build
function startServer() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
      reject(new Error(`Production build not found at ${distDir}. Run 'npm run build' first.`));
      return;
    }

    const server = http.createServer((req, res) => {
      const cleanUrl = req.url.split('?')[0];
      let filePath = path.join(distDir, cleanUrl);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // SPA Fallback: serve index.html
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(path.join(distDir, 'index.html')).pipe(res);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

async function exportPageToPdf(browser, port, routePath, outputPath, format = 'A4') {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const url = `http://127.0.0.1:${port}${routePath}`;
  console.log(`[export-pdf] Navigating to ${url}...`);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Scroll through page to trigger IntersectionObserver for lazy diagrams
  await page.evaluate(async () => {
    const container = document.getElementById('main-scroll-container') || document.documentElement;
    const step = 600;
    for (let top = 0; top < container.scrollHeight; top += step) {
      container.scrollTop = top;
      await new Promise((r) => setTimeout(r, 40));
    }
    container.scrollTop = 0;
  });

  // Emulate print media & trigger beforeprint hook
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeprint'));
  });

  // Small delay for any newly triggered Mermaid renders to settle
  await page.waitForTimeout(1000);

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`[export-pdf] Generating PDF -> ${outputPath}...`);
  await page.pdf({
    path: outputPath,
    format,
    printBackground: true,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm',
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true,
  });

  const fileSize = fs.statSync(outputPath).size;
  console.log(`[export-pdf] Success! File created: ${outputPath} (${(fileSize / 1024).toFixed(1)} KB)`);

  await page.close();
  return { path: outputPath, size: fileSize };
}

async function main() {
  const options = parseArgs();
  console.log('[export-pdf] Starting export process with options:', options);

  let serverInstance;
  let browser;

  try {
    const { server, port } = await startServer();
    serverInstance = server;
    console.log(`[export-pdf] Static server running on http://127.0.0.1:${port}`);

    browser = await chromium.launch();

    if (options.all) {
      console.log('[export-pdf] Exporting all interactive lessons...');
      const stepKeys = [
        'project-setup',
        'corpus-understanding',
        'scraper-building',
        'chunking-fixed-size',
        'chunking-semantic',
        'chunking-hierarchical',
        'embedding-sentence-transformers',
        'qdrant-setup',
        'dense-retrieval',
        'cross-encoder-reranking',
        'postgres-logging',
        'sql-changelog-db',
        'golden-eval-set',
        'ragas-evaluation',
        'ir-metrics',
        'chunking-ablation-study',
        'fastapi-backend',
        'langgraph-agent-architecture',
        'agent-tool-doc-search',
        'agent-tool-sql-query',
        'agent-tool-clarifying-questions',
        'dspy-setup',
        'dspy-metrics',
        'react-frontend-setup',
        'react-frontend-chat-ui',
        'evaluation-dashboard',
        'user-study',
        'readme-architecture',
      ];

      const outBaseDir = path.resolve(repoRoot, 'exported-lessons-pdf');
      for (let i = 0; i < stepKeys.length; i++) {
        const key = stepKeys[i];
        const stepNum = String(i + 1).padStart(2, '0');
        const outPath = path.join(outBaseDir, `lesson-${stepNum}-${key}.pdf`);
        await exportPageToPdf(browser, port, `/steps/${key}`, outPath, options.format);
      }
    } else {
      const stepKey = options.step;
      const routePath = stepKey.startsWith('/') ? stepKey : `/steps/${stepKey}`;
      const defaultName = `rag-teacher-${stepKey.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const outPath = options.out ? path.resolve(options.out) : path.resolve(repoRoot, defaultName);

      await exportPageToPdf(browser, port, routePath, outPath, options.format);
    }
  } catch (err) {
    console.error('[export-pdf] Fatal error:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (serverInstance) serverInstance.close();
    console.log('[export-pdf] Finished cleanly.');
  }
}

main();
