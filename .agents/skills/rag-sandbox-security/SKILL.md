---
name: rag-sandbox-security
description: >-
  Audits, verifies, and tests the client-side Pyodide WebAssembly execution sandbox in RAG Teacher.
  Use when modifying pyodideWorker.ts, PythonSandbox.tsx, or adding new Python exercises, libraries, or AST checks.
---

# RAG Sandbox Security Skill

This skill guides the security audit, exploit verification, and policy enforcement for the client-side Python execution runtime in **RAG Teacher**.

## When to Run

- Whenever `devdocs-ai-guide/src/workers/pyodideWorker.ts` is modified.
- Whenever new Python exercises or code snippets are added to curriculum steps.
- When evaluating third-party Python packages or built-in imports.
- Before committing any changes to the execution worker or sandbox modal.

---

## Security Invariants

The sandbox runs client-side Pyodide WebAssembly in a Web Worker. It relies on multi-layer containment:

1. **Ambient Web Worker Air-Gap**: `fetch`, `XMLHttpRequest`, `WebSocket`, `Worker`, `BroadcastChannel`, and `importScripts` are replaced with throwing stubs.
2. **Python AST Visitor (`_SecurityVisitor`)**: Rejects dangerous dunders (`__class__`, `__subclasses__`, `__bases__`, `__mro__`, `__globals__`, `__code__`), forbidden functions (`eval`, `exec`, `open`, `compile`), and forbidden modules (`os`, `sys`, `subprocess`, `socket`, `pickle`, `ctypes`).
3. **Format String Traversal Interception**: `_UNSAFE_FORMAT_FIELD_RE` blocks attribute or index traversal in `.format()` calls (`"{0.__class__}"`, `"{x.attr}"`).
4. **ForwardRef Evaluation Hook**: `typing.ForwardRef._evaluate` is intercepted with `_safe_forwardref_eval` to audit dynamic annotation strings against AST escape vectors.
5. **NumPy Sanitization**: Filesystem and unpickling functions (`load`, `save`, `fromfile`, `memmap`) are deleted from `numpy` at bootstrap.
6. **Resource Limits**: Max code length 20,000 characters; stdout stream capped at 16,384 characters and 250 lines; execution timeout 10 seconds.

---

## Verification Runbook

### Step 1: Run the Exploit & Invariant Suite
Execute the dedicated exploit test script from workspace root:
```powershell
node .agents/skills/rag-sandbox-security/scripts/test-sandbox-exploits.mjs
```
*Expected Result: 40/40 tests pass with zero failures.*

### Step 2: Run Vitest Python Sandbox Regression Suite
Run the test suite in `devdocs-ai-guide`:
```powershell
npm.cmd --prefix devdocs-ai-guide test src/__tests__/pythonSandboxSecurity.test.ts
```
*Expected Result: All 10 security test specs pass cleanly.*

### Step 3: Test Known Jailbreak Payloads
Verify that the following payloads are blocked when tested through the AST visitor:
1. Class hierarchy traversal:
   ```python
   ().__class__.__bases__[0].__subclasses__()
   ```
2. Format string attribute access:
   ```python
   "{0.__class__.__base__}".format(0)
   ```
3. Type annotation string breakout:
   ```python
   from typing import ForwardRef
   ref = ForwardRef("__import__('os').system('dir')")
   ref._evaluate(globals(), locals(), set())
   ```
4. Serialization exploit:
   ```python
   import pickle
   ```
5. File reading attempt:
   ```python
   import numpy as np
   np.load("credentials.txt")
   ```

All of the above MUST raise a `PermissionError` or AST validation failure before any code runs.
