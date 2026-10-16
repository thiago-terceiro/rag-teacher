# ⚛️ React.memo vs. React Compiler Trade-Off

**Date**: October 16, 2026  
**Context**: React 19 + `@vitejs/plugin-react` (`babel-plugin-react-compiler`)  

---

## The Core Trade-Off

| Approach | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- |
| **Automatic Memoization**<br>*(React Compiler)* | • Zero boilerplate (`no memo/useCallback`)<br>• Fine-grained slot caching (`$[0]`)<br>• Solves inline object/callback prop invalidation | • Requires build-time Babel/Rolldown transform<br>• Bypassed in raw Jest/test environments without Babel | **Default for all new components & hooks** |
| **Manual Memoization**<br>*(React.memo / useMemo)* | • Defense-in-depth in uncompiled environments<br>• Explicit architectural boundary for heavy AST trees | • Boilerplate overhead<br>• Fragile: broken by unmemoized inline parent props | **Keep on heavy existing components; omit on new code** |

---

## Policy for This Codebase

1. **Keep Existing `React.memo` on Core Engines**:
   - High-cost leaf components (`MarkdownRenderer`, `CodeBlock`, `MermaidBlock`, `StepView`, `TableOfContents`) keep `React.memo`.
   - **Rationale**: Guarantees zero re-renders even if compiler plugins are disabled during testing, lightweight profiling, or tool migrations.

2. **Omit `React.memo` & `useCallback` on New Code**:
   - The React Compiler automatically optimizes component call sites and memoizes inline functions/objects at build time.
   - Writing manual `React.memo()` or wrapping simple handlers in `useCallback()` is unnecessary boilerplate.

3. **Official React Compatibility Guarantee**:
   - The React Compiler safely analyzes and optimizes around existing `React.memo` and `useMemo` calls without duplicate performance overhead.
