# Security & Sandboxing Rules for RAG Teacher

This rule enforces all security invariants for client-side Python execution, Web Worker isolation, DOM sanitization, and state persistence.

---

## 1. Pyodide WebAssembly Sandbox Invariants (`pyodideWorker.ts`)

Every modification to the Python execution pipeline must preserve these controls:

### 1.1 Web Worker Isolation & Global Disabling
```typescript
// All ambient networking, worker spawning, and storage APIs must remain blocked
const blockedSync = () => { throw new Error('API blocked by sandbox security policy'); };
const blockedAsync = () => Promise.reject(new Error('Network access blocked by sandbox security policy'));

self.fetch = blockedAsync;
self.XMLHttpRequest = blockedSync as unknown as typeof XMLHttpRequest;
self.WebSocket = blockedSync as unknown as typeof WebSocket;
self.Worker = blockedSync as unknown as typeof Worker;
self.importScripts = blockedSync;
self.BroadcastChannel = blockedSync as unknown as typeof BroadcastChannel;
```
- No network requests (`fetch`, `XHR`, `WebSocket`) may ever leave the worker thread.
- The worker must not access browser storage (`localStorage`, `sessionStorage`, `indexedDB`, `caches`).

### 1.2 Python AST Visitor Invariants
Before Python code is passed to Pyodide's `eval` or `exec`, it must pass AST static analysis (`_SecurityVisitor`):
1. **Forbidden Dunder Attributes**:
   - `__class__`, `__subclasses__`, `__bases__`, `__mro__`, `__base__`, `__globals__`, `__code__`, `__builtins__`, `__import__`, `__reduce__`, `__reduce_ex__`.
2. **Forbidden Function & Method Calls**:
   - `eval`, `exec`, `compile`, `open`, `input`, `breakpoint`, `help`, `globals`, `locals`, `vars`, `dir`, `getattr`, `setattr`, `delattr`.
3. **Module Import Restrictions**:
   - **Allowed**: `math`, `numpy`, `collections`, `itertools`, `heapq`, `re`, `json`, `random`.
   - **Blocked**: `os`, `sys`, `subprocess`, `socket`, `urllib`, `http`, `ctypes`, `shutil`, `pickle`, `_pickle`, `shelve`.
4. **NumPy Attribute Stripping**:
   - NumPy's filesystem and deserialization APIs must be deleted immediately after NumPy bootstrap:
     `load`, `save`, `savez`, `fromfile`, `memmap`, `ctypeslib`, `f2py`.
5. **Format-String Dynamic Injection**:
   - Format strings must be audited with regex:
     `_UNSAFE_FORMAT_FIELD_RE = re.compile(r'\{[^{}]*(?:\.[A-Za-z_]|\[)[^{}:!]*')`
   - Blocks expressions like `"{0.__class__}"`, `"{e.tb_frame}"`, and `"{x.attr}"` while allowing standard formatting like `"{:.4f}"` or `"{name}: {score}"`.
6. **`typing.ForwardRef` Breakout Protection**:
   - `ForwardRef._evaluate` evaluates strings in caller scopes. It must be wrapped with `_safe_forwardref_eval` which passes `self.__forward_arg__` through the AST security audit before evaluation.

---

## 2. Resource Exhaustion & Memory Defenses

1. **Character Budget**:
   - Enforce `const MAX_CODE_LENGTH = 20000;` on incoming user code.
2. **Stdout Stream Throttling**:
   - Standard output and error streams must route through `_BoundedStream`.
   - Hard limits: `MAX_CHARS = 16384`, `MAX_LINES = 250`.
   - When capped, output must append `"\n[Output truncated: maximum display limit reached]"`.
3. **Execution Timeout**:
   - The UI worker controller must set a 10-second timer (`setTimeout(10000)`).
   - If a script times out, the host must force-terminate the worker, destroy references, and instantiate a fresh worker.
4. **C-Stack Recursion Limit**:
   - Pyodide must execute `sys.setrecursionlimit(200)` during bootstrap to prevent WebAssembly stack overflows.
5. **Garbage Collection**:
   - Execute `import gc; gc.collect()` after each run to prevent memory leak accumulation across script executions.

---

## 3. DOM & State Security

1. **Markdown Link Sanitization (`MarkdownRenderer.tsx`)**:
   - Reject any URI whose protocol is not in `['http:', 'https:', '#', 'mailto:']`.
   - Never allow `javascript:`, `data:`, `vbscript:`, or protocol-relative (`//`) URLs.
2. **State & LocalStorage Evolution (`useSteps.tsx`, `NotesJournal.tsx`)**:
   - Always wrap `JSON.parse` in try-catch with a fallback default.
   - Guard against invalid stringified primitives (e.g. `"null"` or `"undefined"` stored in localStorage).
   - Never purge user notes or completion state during schema upgrades; use non-destructive migration functions.
