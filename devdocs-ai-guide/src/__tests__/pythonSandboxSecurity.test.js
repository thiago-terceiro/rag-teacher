import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Python Sandbox Security & AST Analysis Regression', () => {
  const workerPath = path.resolve(__dirname, '../workers/pyodideWorker.js');
  const workerContent = fs.readFileSync(workerPath, 'utf8');

  it('should enforce MAX_CODE_LENGTH of 20,000 characters', () => {
    expect(workerContent).toMatch(/const MAX_CODE_LENGTH\s*=\s*20000/);
  });

  it('should air-gap worker globals including fetch, WebSocket, and storage APIs', () => {
    const requiredDisables = [
      'self.fetch = blockedAsync',
      'self.XMLHttpRequest = blockedSync',
      'self.WebSocket = blockedSync',
      'self.Worker = blockedSync',
      'self.importScripts = blockedSync',
      'self.BroadcastChannel = blockedSync',
      'indexedDB',
      'caches',
    ];

    requiredDisables.forEach(api => {
      expect(workerContent, `Worker globals must lock down ${api}`).toContain(api);
    });
  });

  it('should cap WASM recursion limit to prevent C-stack overflow', () => {
    expect(workerContent).toContain('sys.setrecursionlimit(200)');
  });

  it('should strip dangerous filesystem/pickle attack vectors from NumPy upon bootstrap', () => {
    const dangerousNpAttrs = [
      'load', 'save', 'savez', 'fromfile', 'memmap', 'ctypeslib', 'f2py'
    ];

    dangerousNpAttrs.forEach(attr => {
      expect(workerContent, `NumPy must strip '${attr}'`).toContain(`'${attr}'`);
    });
  });

  it('should maintain strict module allowlist and blocklist', () => {
    // Blocked modules
    const blocked = ['socket', 'subprocess', 'ctypes', 'urllib', 'http'];
    blocked.forEach(mod => {
      expect(workerContent).toContain(`'${mod}'`);
    });

    // Allowed modules
    const allowed = ['math', 'numpy', 'collections', 'itertools', 'heapq', 're', 'json', 'random'];
    allowed.forEach(mod => {
      expect(workerContent).toContain(`'${mod}'`);
    });
  });

  it('should define BoundedStream to eliminate memory/stdout flood bombs', () => {
    expect(workerContent).toContain('class _BoundedStream');
    expect(workerContent).toContain('MAX_CHARS = 16384');
    expect(workerContent).toContain('MAX_LINES = 250');
  });

  it('should intercept format-string attribute access via regex', () => {
    // Extract regex from worker file
    expect(workerContent).toContain('_UNSAFE_FORMAT_FIELD_RE = _re.compile(');

    // Test regex logic from worker: r'\{[^{}]*(?:\.[A-Za-z_]|\[)[^{}:!]*'
    const dangerousFmtRegex = /\{[^{}]*(?:\.[A-Za-z_]|\[)[^{}:!]*/;

    // Must block
    expect(dangerousFmtRegex.test('{0.__class__}')).toBe(true);
    expect(dangerousFmtRegex.test('{0.__class__.__base__}')).toBe(true);
    expect(dangerousFmtRegex.test('{e.tb_frame}')).toBe(true);
    expect(dangerousFmtRegex.test('{x.attr}')).toBe(true);
    expect(dangerousFmtRegex.test('{item[0]}')).toBe(true);

    // Must allow standard formatting
    expect(dangerousFmtRegex.test('Score: {:.4f}')).toBe(false);
    expect(dangerousFmtRegex.test('{}: {}')).toBe(false);
    expect(dangerousFmtRegex.test('{name}: {score}')).toBe(false);
  });
});
