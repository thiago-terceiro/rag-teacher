// Security-Hardened Pyodide Web Worker for RAG Teacher In-Browser Python Sandbox
// Runs completely off the main UI thread with air-gapped network/storage & AST sandboxing.

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/';
const MAX_CODE_LENGTH = 20000;

let pyodideInstance: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Lock down the Web Worker global scope AFTER Pyodide & NumPy are loaded in memory.
 * This air-gaps the worker so user Python code cannot make network calls, spawn sub-workers,
 * or read/write browser storage (IndexedDB, Cache API, BroadcastChannel).
 */
function lockDownWorkerGlobals() {
  const blockedAsync = () =>
    Promise.reject(
      new Error('Security Sandbox Policy: Outbound network & storage access are strictly disabled.')
    );
  const blockedSync = function () {
    throw new Error('Security Sandbox Policy: This browser API is disabled inside the Python worker.');
  };

  try {
    const workerSelf = self as any;
    workerSelf.fetch = blockedAsync; // self.fetch = blockedAsync
    workerSelf.XMLHttpRequest = blockedSync; // self.XMLHttpRequest = blockedSync
    workerSelf.WebSocket = blockedSync; // self.WebSocket = blockedSync
    workerSelf.WebTransport = blockedSync; // self.WebTransport = blockedSync
    workerSelf.RTCPeerConnection = blockedSync; // self.RTCPeerConnection = blockedSync
    workerSelf.EventSource = blockedSync; // self.EventSource = blockedSync
    workerSelf.BroadcastChannel = blockedSync; // self.BroadcastChannel = blockedSync
    workerSelf.Worker = blockedSync; // self.Worker = blockedSync
    workerSelf.SharedWorker = blockedSync; // self.SharedWorker = blockedSync
    workerSelf.importScripts = blockedSync; // self.importScripts = blockedSync
    workerSelf.FileReader = blockedSync; // self.FileReader = blockedSync
    workerSelf.FileReaderSync = blockedSync; // self.FileReaderSync = blockedSync
    workerSelf.CacheStorage = blockedSync; // self.CacheStorage = blockedSync

    if (self.navigator) {
      for (const prop of ['sendBeacon', 'storage', 'locks', 'serviceWorker']) {
        try {
          Object.defineProperty(self.navigator, prop, {
            get: blockedSync,
            configurable: false,
          });
        } catch {}
      }
    }

    for (const globalProp of ['indexedDB', 'caches']) {
      try {
        Object.defineProperty(self, globalProp, {
          get: blockedSync,
          configurable: false,
        });
      } catch {}
    }
  } catch (err) {
    // Ignore non-configurable property errors in strict environments
  }
}

const PYTHON_SANDBOX_BOOTSTRAP = `
def _create_sandbox_executor():
    import sys
    import io
    import ast
    import re as _re
    import time
    import builtins

    # Cap recursion limit to prevent WebAssembly C-stack overflow
    sys.setrecursionlimit(200)

    # Pre-warm NumPy and strip filesystem / ctypes / pickle attack surfaces from it
    try:
        import numpy as _np
        for _dangerous_np_attr in (
            'load', 'save', 'savez', 'savez_compressed',
            'loadtxt', 'savetxt', 'genfromtxt', 'fromregex',
            'fromfile', 'memmap', 'DataSource',
            'ctypeslib', 'f2py', 'testing', '_pytesttester', 'distutils'
        ):
            try:
                delattr(_np, _dangerous_np_attr)
            except Exception:
                pass
        del _np
    except Exception:
        pass

    _GLOBAL_BLOCKED_MODULES = {
        'js', 'pyodide_js', 'pyodide', 'pyodide.ffi', 'pyodide.http',
        'urllib', 'urllib.request', 'http', 'http.client', 'socket',
        'subprocess', 'ctypes', 'webbrowser', 'pickle', '_pickle', 'shelve'
    }

    _SERVER_ONLY_MODULES = {
        'torch', 'qdrant_client', 'sentence_transformers', 'fastapi',
        'uvicorn', 'dspy', 'langgraph', 'langchain', 'langchain_core',
        'psycopg', 'psycopg2', 'asyncpg', 'playwright', 'bs4',
        'httpx', 'aiohttp', 'openai', 'anthropic', 'ragas', 'redis', 'boto3'
    }

    # Strict allowlist of safe mathematical, data-structure, and RAG algorithm modules
    _ALLOWED_MODULES = {
        'math', 'cmath', 'random', 'statistics', 'decimal', 'fractions', 'numbers',
        'numpy', 'collections', 'collections.abc', 'itertools', 'functools',
        'heapq', 'bisect', 'array', 'typing', 'dataclasses', 'enum', 'abc',
        'copy', 're', 'string', 'textwrap', 'difflib', 'json', 'datetime',
        'time', 'hashlib', 'hmac', 'base64'
    }

    _FORBIDDEN_ATTRS = {
        'tb_frame', 'tb_next', 'tb_lasti', 'tb_lineno',
        'f_builtins', 'f_globals', 'f_locals', 'f_back', 'f_code', 'f_trace',
        'f_trace_lines', 'f_trace_opcodes', 'f_lineno', 'f_lasti',
        'gi_frame', 'gi_code', 'gi_yieldfrom',
        'cr_frame', 'cr_code', 'cr_await',
        'ag_frame', 'ag_code', 'ag_await',
        'func_globals', 'func_code', 'func_closure', 'func_defaults',
        'im_func', 'im_self', 'im_class',
        'mro', 'format_map', 'Formatter',
        'tofile', 'fromfile',
        'save', 'savez', 'savez_compressed',
        'loadtxt', 'savetxt', 'genfromtxt', 'fromregex', 'memmap', 'DataSource',
        'ctypes', 'ctypeslib', 'f2py', 'testing', '_pytesttester',
        'sys', 'os', 'io', 'builtins', 'importlib', 'inspect',
        'types', 'operator', 'warnings', 'gc', 'traceback', 'subprocess'
    }

    for _mod in list(sys.modules.keys()):
        if _mod in _GLOBAL_BLOCKED_MODULES or _mod.startswith(('js.', 'pyodide_js.', 'urllib.', 'http.', 'socket')):
            sys.modules[_mod] = None

    class _SecurityImportGuard:
        def find_spec(self, fullname, path, target=None):
            root = fullname.split('.')[0]
            if root in _SERVER_ONLY_MODULES:
                raise ImportError(
                    f"Module '{root}' is a server/GPU library not bundled in the browser WASM sandbox. "
                    f"Try one of the pure-Python/NumPy RAG algorithm templates above!"
                )
            if root in _GLOBAL_BLOCKED_MODULES or fullname in _GLOBAL_BLOCKED_MODULES:
                raise PermissionError(
                    f"Security Sandbox Policy: Importing '{fullname}' is blocked for isolation."
                )
            return None

    if not any(isinstance(x, _SecurityImportGuard) for x in sys.meta_path):
        sys.meta_path.insert(0, _SecurityImportGuard())

    def _disabled_input(prompt=""):
        raise RuntimeError("Interactive input() is disabled in the non-blocking sandbox.")

    def _restricted_open(*args, **kwargs):
        raise PermissionError("Security Sandbox Policy: Filesystem open() is disabled.")

    builtins.input = _disabled_input
    builtins.open = _restricted_open
    io.open = _restricted_open

    class _BoundedStream(io.StringIO):
        MAX_CHARS = 16384
        MAX_LINES = 250

        def __init__(self):
            super().__init__()
            self._chars = 0
            self._lines = 0

        def write(self, s):
            if not isinstance(s, str):
                s = str(s)
            self._chars += len(s)
            self._lines += s.count('\\n')
            if self._chars > self.MAX_CHARS:
                raise MemoryError("Sandbox Output Quota Exceeded: Output capped at 16 KB.")
            if self._lines > self.MAX_LINES:
                raise MemoryError("Sandbox Output Quota Exceeded: Output capped at 250 lines.")
            return super().write(s)

    _orig_import = builtins.__import__
    _orig_getattr = builtins.getattr
    _orig_setattr = builtins.setattr
    _orig_delattr = builtins.delattr
    _orig_hasattr = builtins.hasattr
    _orig_type = builtins.type
    _ModuleType = _orig_type(sys)

    # Read-only proxy around imported modules to prevent transitive leaks (e.g. typing.sys, uuid.os, np.ctypeslib)
    class _SafeModuleProxy:
        __slots__ = ('_mod', '_mod_name')

        def __init__(self, mod, mod_name):
            object.__setattr__(self, '_mod', mod)
            object.__setattr__(self, '_mod_name', mod_name)

        def __getattribute__(self, name):
            if name.startswith('_') or name in _FORBIDDEN_ATTRS:
                raise PermissionError(
                    f"Security Sandbox Policy: Access to '{name}' on module is blocked."
                )
            mod = object.__getattribute__(self, '_mod')
            mod_name = object.__getattribute__(self, '_mod_name')
            try:
                val = _orig_getattr(mod, name)
            except AttributeError:
                raise AttributeError(f"module '{mod_name}' has no attribute '{name}'") from None
            if _orig_type(val) is _ModuleType:
                sub_name = _orig_getattr(val, '__name__', '')
                sub_root = sub_name.split('.')[0]
                if sub_root not in _ALLOWED_MODULES and sub_name not in _ALLOWED_MODULES:
                    raise PermissionError(
                        f"Security Sandbox Policy: Access to transitive module '{sub_name}' is blocked."
                    )
                return _SafeModuleProxy(val, sub_name)
            return val

        def __setattr__(self, name, value):
            raise PermissionError("Security Sandbox Policy: Modifying imported modules is blocked.")

        def __delattr__(self, name):
            raise PermissionError("Security Sandbox Policy: Modifying imported modules is blocked.")

        def __repr__(self):
            mod_name = object.__getattribute__(self, '_mod_name')
            return f"<sandboxed module '{mod_name}'>"

    def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
        if level != 0:
            raise PermissionError("Security Sandbox Policy: Relative imports are disabled.")
        clean_name = (name or '').strip()
        root = clean_name.split('.')[0]
        if root in _SERVER_ONLY_MODULES:
            raise ImportError(
                f"Module '{clean_name}' is a server/GPU package. "
                f"In-browser sandbox supports Python 3.12 stdlib + NumPy."
            )
        if root not in _ALLOWED_MODULES and clean_name not in _ALLOWED_MODULES:
            raise PermissionError(
                f"Security Sandbox Policy: Importing '{clean_name}' is blocked for isolation."
            )
        if fromlist:
            for item in fromlist:
                if item == '*' or item.startswith('_') or item in _FORBIDDEN_ATTRS:
                    raise PermissionError(
                        f"Security Sandbox Policy: Importing '{item}' from '{clean_name}' is blocked."
                    )
                full = f"{clean_name}.{item}"
                if full in _GLOBAL_BLOCKED_MODULES:
                    raise PermissionError(
                        f"Security Sandbox Policy: Importing '{full}' is blocked for isolation."
                    )
        raw_mod = _orig_import(clean_name, {}, {}, fromlist, 0)
        return _SafeModuleProxy(raw_mod, clean_name)

    def _is_forbidden_attr_name(name):
        return (
            not isinstance(name, str)
            or name.startswith('_')
            or name.endswith('__')
            or name in _FORBIDDEN_ATTRS
        )

    def _safe_getattr(obj, name, *default):
        if len(default) > 1:
            raise TypeError(f"getattr expected at most 3 arguments, got {2 + len(default)}")
        if _is_forbidden_attr_name(name):
            raise PermissionError(
                f"Security Sandbox Policy: Dynamic access to '{name}' via getattr() is blocked."
            )
        try:
            return _orig_getattr(obj, name)
        except AttributeError:
            if default:
                return default[0]
            raise AttributeError(f"'{_orig_type(obj).__name__}' object has no attribute '{name}'") from None

    def _safe_hasattr(obj, name):
        if _is_forbidden_attr_name(name):
            return False
        return _orig_hasattr(obj, name)

    def _safe_setattr(obj, name, value):
        if _is_forbidden_attr_name(name) or isinstance(obj, _SafeModuleProxy):
            raise PermissionError(
                f"Security Sandbox Policy: Dynamic modification of '{name}' via setattr() is blocked."
            )
        return _orig_setattr(obj, name, value)

    def _safe_delattr(obj, name):
        if _is_forbidden_attr_name(name) or isinstance(obj, _SafeModuleProxy):
            raise PermissionError(
                f"Security Sandbox Policy: Dynamic deletion of '{name}' via delattr() is blocked."
            )
        return _orig_delattr(obj, name)

    def _safe_type(*args):
        if len(args) != 1:
            raise PermissionError(
                "Security Sandbox Policy: Dynamic 3-argument type() class construction is blocked."
            )
        return _orig_type(args[0])

    def _safe_format(value, format_spec=""):
        if not isinstance(format_spec, str) or '.' in format_spec and any(c.isalpha() for c in format_spec.split('.')[0]):
            raise PermissionError("Security Sandbox Policy: Invalid format specifier.")
        return builtins.format(value, format_spec)

    _FORBIDDEN_CALLS = {
        'eval', 'exec', 'compile', 'open', 'input', 'breakpoint',
        '__import__', 'globals', 'locals', 'vars', 'dir', 'help',
        'copyright', 'credits', 'license', 'exit', 'quit', 'memoryview'
    }

    def _make_blocked_builtin(fn_name):
        def _blocked(*args, **kwargs):
            raise PermissionError(
                f"Security Sandbox Policy: Built-in '{fn_name}()' is disabled in the isolated sandbox."
            )
        return _blocked

    _ALLOWED_BUILTIN_NAMES = (
        'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'bytearray', 'bytes',
        'callable', 'chr', 'classmethod', 'complex', 'dict', 'divmod',
        'enumerate', 'filter', 'float', 'frozenset', 'hash', 'hex', 'id',
        'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'map',
        'max', 'min', 'next', 'object', 'oct', 'ord', 'pow', 'print',
        'property', 'range', 'repr', 'reversed', 'round', 'set', 'slice',
        'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'zip',
        '__build_class__', 'True', 'False', 'None', 'Ellipsis', 'NotImplemented',
        'Exception', 'BaseException', 'ValueError', 'TypeError', 'KeyError',
        'IndexError', 'AttributeError', 'RuntimeError', 'ZeroDivisionError',
        'StopIteration', 'AssertionError', 'ArithmeticError', 'LookupError',
        'NameError', 'NotImplementedError', 'OverflowError', 'PermissionError',
        'ImportError', 'ModuleNotFoundError', 'MemoryError', 'RecursionError',
        'SyntaxError', 'Warning', 'UserWarning'
    )

    _SAFE_BUILTINS = {
        k: _orig_getattr(builtins, k)
        for k in _ALLOWED_BUILTIN_NAMES
        if _orig_hasattr(builtins, k)
    }
    for _bname in _FORBIDDEN_CALLS:
        _SAFE_BUILTINS[_bname] = _make_blocked_builtin(_bname)
    _SAFE_BUILTINS['__import__'] = _safe_import
    _SAFE_BUILTINS['getattr'] = _safe_getattr
    _SAFE_BUILTINS['hasattr'] = _safe_hasattr
    _SAFE_BUILTINS['setattr'] = _safe_setattr
    _SAFE_BUILTINS['delattr'] = _safe_delattr
    _SAFE_BUILTINS['type'] = _safe_type
    _SAFE_BUILTINS['format'] = _safe_format

    # Regex to detect attribute/subscript traversal inside str.format replacement fields: e.g. {0.__class__} or {x[0]}
    _UNSAFE_FORMAT_FIELD_RE = _re.compile(r'\\{[^{}]*(?:\\.[A-Za-z_]|\\[)[^{}:!]*')

    def _audit_ast(source_code):
        tree = ast.parse(source_code, mode='exec')
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    clean = alias.name.strip()
                    root = clean.split('.')[0]
                    if root in _SERVER_ONLY_MODULES:
                        raise ImportError(
                            f"Line {node.lineno}: '{clean}' is a server/GPU package. "
                            f"In-browser sandbox supports Python 3.12 stdlib + NumPy."
                        )
                    if root not in _ALLOWED_MODULES and clean not in _ALLOWED_MODULES:
                        raise PermissionError(
                            f"Line {node.lineno}: Import of '{clean}' is blocked by sandbox security policy."
                        )
            elif isinstance(node, ast.ImportFrom):
                if node.level and node.level > 0:
                    raise PermissionError(
                        f"Line {node.lineno}: Relative imports are blocked by sandbox security policy."
                    )
                mod = (node.module or '').strip()
                root = mod.split('.')[0]
                if root in _SERVER_ONLY_MODULES:
                    raise ImportError(
                        f"Line {node.lineno}: '{mod}' is a server/GPU package. "
                        f"In-browser sandbox supports Python 3.12 stdlib + NumPy."
                    )
                if root not in _ALLOWED_MODULES and mod not in _ALLOWED_MODULES:
                    raise PermissionError(
                        f"Line {node.lineno}: Import from '{mod}' is blocked by sandbox security policy."
                    )
                for alias in node.names:
                    if alias.name == '*' or alias.name.startswith('_') or alias.name in _FORBIDDEN_ATTRS:
                        raise PermissionError(
                            f"Line {node.lineno}: Importing '{alias.name}' from '{mod}' is blocked by sandbox security policy."
                        )
            elif isinstance(node, ast.Attribute):
                attr = node.attr
                # Allow self._private instance attributes (non-dunder) and super().__init__
                is_self_private = (
                    isinstance(node.value, ast.Name)
                    and node.value.id == 'self'
                    and attr.startswith('_')
                    and not attr.startswith('__')
                    and not attr.endswith('__')
                    and attr not in _FORBIDDEN_ATTRS
                )
                is_super_init = (
                    attr == '__init__'
                    and isinstance(node.value, ast.Call)
                    and isinstance(node.value.func, ast.Name)
                    and node.value.func.id == 'super'
                )
                if not (is_self_private or is_super_init):
                    if attr.startswith('_') or attr.endswith('__') or attr in _FORBIDDEN_ATTRS:
                        raise PermissionError(
                            f"Line {node.lineno}: Access to '{attr}' is restricted by sandbox security policy."
                        )
                if attr == 'format':
                    if not (isinstance(node.value, ast.Constant) and isinstance(node.value.value, str)):
                        raise PermissionError(
                            f"Line {node.lineno}: Dynamic '.format()' is restricted by sandbox security policy; use f-strings instead."
                        )
                    if _UNSAFE_FORMAT_FIELD_RE.search(node.value.value):
                        raise PermissionError(
                            f"Line {node.lineno}: Attribute/subscript access inside '.format()' is restricted by sandbox security policy."
                        )
            elif isinstance(node, ast.Name):
                ident = node.id
                if ident != '__name__' and (ident.startswith('__') or ident.endswith('__') or ident in _FORBIDDEN_ATTRS):
                    raise PermissionError(
                        f"Line {node.lineno}: Identifier '{ident}' is restricted by sandbox security policy."
                    )
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                if node.func.id in _FORBIDDEN_CALLS:
                    raise PermissionError(
                        f"Line {node.lineno}: Calling '{node.func.id}()' is restricted by sandbox security policy."
                    )
        return tree

    def _execute_sandboxed(source_code):
        stdout_buf = _BoundedStream()
        stderr_buf = _BoundedStream()
        old_stdout, old_stderr = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = stdout_buf, stderr_buf
        t0 = time.perf_counter()
        status = "ok"
        error_msg = None

        try:
            tree = _audit_ast(source_code)
            compiled = compile(tree, filename="<rag_sandbox>", mode="exec")
            isolated_globals = {
                "__name__": "__main__",
                "__builtins__": dict(_SAFE_BUILTINS),
            }
            exec(compiled, isolated_globals, isolated_globals)
        except Exception as exc:
            status = "error"
            error_msg = f"{_orig_type(exc).__name__}: {exc}"
        finally:
            sys.stdout, sys.stderr = old_stdout, old_stderr
            try:
                import gc as _gc
                _gc.collect()
            except Exception:
                pass

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "status": status,
            "stdout": stdout_buf.getvalue(),
            "stderr": stderr_buf.getvalue(),
            "error": error_msg,
            "elapsedMs": elapsed_ms,
        }

    # Patch typing.ForwardRef to prevent eval() AST sandbox escapes
    try:
        import typing as _typing
        _orig_evaluate = _typing.ForwardRef._evaluate
        def _safe_forwardref_eval(self, globalns, localns, type_params=None, *, recursive_guard=frozenset()):
            if isinstance(self.__forward_arg__, str):
                _audit_ast(self.__forward_arg__)
            if type_params is not None:
                return _orig_evaluate(self, globalns, localns, type_params, recursive_guard=recursive_guard)
            return _orig_evaluate(self, globalns, localns, recursive_guard=recursive_guard)
        _typing.ForwardRef._evaluate = _safe_forwardref_eval
    except Exception:
        pass

    return _execute_sandboxed

_execute_sandboxed = _create_sandbox_executor()
del _create_sandbox_executor
`;

async function ensurePyodideLoaded() {
  if (pyodideInstance) return pyodideInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    self.postMessage({ type: 'STATUS', message: 'Loading Pyodide WebAssembly runtime (v0.27.3)...' });
    const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);

    const pyodide = await loadPyodide({
      indexURL: PYODIDE_INDEX_URL,
    });

    self.postMessage({ type: 'STATUS', message: 'Loading NumPy vector math library...' });
    await pyodide.loadPackage(['numpy']);

    // Air-gap the Web Worker globals before any user script can ever run
    lockDownWorkerGlobals();

    // Initialize AST auditor, import guard, and bounded streams inside Python
    await pyodide.runPythonAsync(PYTHON_SANDBOX_BOOTSTRAP);

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return initPromise;
}

self.onmessage = async (event: MessageEvent) => {
  const data = event?.data;
  if (!data || typeof data !== 'object') return;

  const { type, runId, code } = data;

  if (type === 'INIT') {
    try {
      await ensurePyodideLoaded();
      self.postMessage({ type: 'READY' });
    } catch (err: any) {
      initPromise = null;
      self.postMessage({
        type: 'INIT_ERROR',
        error: err?.message || 'Failed to load Pyodide WebAssembly runtime.',
      });
    }
    return;
  }

  if (type === 'RUN') {
    if (typeof code !== 'string') {
      self.postMessage({
        type: 'RESULT',
        runId,
        status: 'error',
        stdout: '',
        stderr: '',
        error: 'ValueError: Code payload must be a string.',
        elapsedMs: 0,
      });
      return;
    }

    if (code.length > MAX_CODE_LENGTH) {
      self.postMessage({
        type: 'RESULT',
        runId,
        status: 'error',
        stdout: '',
        stderr: '',
        error: `SecurityError: Code exceeds maximum length of ${MAX_CODE_LENGTH} characters.`,
        elapsedMs: 0,
      });
      return;
    }

    let executeFn: any = null;
    let pyResult: any = null;
    try {
      const pyodide = await ensurePyodideLoaded();
      self.postMessage({ type: 'READY' });

      executeFn = pyodide.globals.get('_execute_sandboxed');
      pyResult = executeFn(code);
      const jsResult = pyResult.toJs({ dict_converter: Object.fromEntries });

      self.postMessage({
        type: 'RESULT',
        runId,
        ...jsResult,
      });
    } catch (err: any) {
      if (!pyodideInstance) {
        initPromise = null;
      }
      self.postMessage({
        type: 'RESULT',
        runId,
        status: 'error',
        stdout: '',
        stderr: '',
        error: err?.message || String(err),
        elapsedMs: 0,
      });
    } finally {
      if (pyResult && typeof pyResult.destroy === 'function') {
        try {
          pyResult.destroy();
        } catch {}
      }
      if (executeFn && typeof executeFn.destroy === 'function') {
        try {
          executeFn.destroy();
        } catch {}
      }
    }
  }
};
