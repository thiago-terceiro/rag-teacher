import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { initialPhases, allSteps } from '../data/guideData';
import { moduleQuizzes } from '../data/moduleQuizzesData';
import { applyThemeAndReadingStyles } from '../hooks/useReadingSettings';

describe('React State Architecture & Performance Invariants', () => {
  describe('AST & Compiler Compliance Checks', () => {
    const srcDir = path.resolve(__dirname, '..');

    it('React.memo components should NOT have default parameters in their parameter lists', () => {
      const filesToCheck = [
        path.join(srcDir, 'components/StatsBar.jsx'),
        path.join(srcDir, 'components/NotesJournal.jsx'),
        path.join(srcDir, 'components/CodeBlock.jsx'),
        path.join(srcDir, 'components/ui/button.jsx'),
      ];

      filesToCheck.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // Check for default param assignments in component parameter headers
        // e.g. ({ isMobileOpen = false, ... }) or ({ language = 'text' })
        expect(content).not.toMatch(/React\.memo\s*\(\s*\(\s*\{[^}]*=\s*[^,}]*/);
        expect(content).not.toMatch(/memo\s*\(\s*\(\s*\{[^}]*=\s*[^,}]*/);
      });
    });

    it('useSteps must not import canvas-confetti directly to avoid AST HIR bailout', () => {
      const useStepsContent = fs.readFileSync(path.join(srcDir, 'hooks/useSteps.jsx'), 'utf8');
      expect(useStepsContent).not.toContain("import('canvas-confetti')");
      expect(useStepsContent).not.toContain("from 'canvas-confetti'");
      expect(useStepsContent).toContain("from '../lib/confetti'");
    });

    it('useSteps must not mutate refs during the render phase', () => {
      const useStepsContent = fs.readFileSync(path.join(srcDir, 'hooks/useSteps.jsx'), 'utf8');
      // Should NOT have a bare phasesRef.current = phases directly in component body after useRef
      expect(useStepsContent).not.toMatch(/useRef\(phases\);\s*\n\s*phasesRef\.current\s*=\s*phases;/);
      expect(useStepsContent).toContain('phasesRef.current = phases;');
      expect(useStepsContent).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*phasesRef\.current\s*=\s*phases;\s*\}\s*,\s*\[phases\]\);/);
    });

    it('CodeBlock must consume useSandboxActions instead of useSandbox to avoid re-renders on sandbox state toggle', () => {
      const codeBlockContent = fs.readFileSync(path.join(srcDir, 'components/CodeBlock.jsx'), 'utf8');
      expect(codeBlockContent).toContain("useSandboxActions");
      expect(codeBlockContent).not.toMatch(/const\s*\{[^}]*\}\s*=\s*useSandbox\(\)/);
    });

    it('AppContent must wrap modal triggers in useCallback to prevent breaking React.memo', () => {
      const appContent = fs.readFileSync(path.join(srcDir, 'App.jsx'), 'utf8');
      expect(appContent).toContain('handleOpenPythonSandbox = useCallback');
      expect(appContent).toContain('handleToggleMobileSidebar = useCallback');
      expect(appContent).toContain('handleOpenSearch = useCallback');
      expect(appContent).toContain('handleOpenReadingSettings = useCallback');
    });

    it('NotesJournal and InterviewQuestionCard must implement onBlur and unmount flush mechanisms', () => {
      const notesContent = fs.readFileSync(path.join(srcDir, 'components/NotesJournal.jsx'), 'utf8');
      expect(notesContent).toContain('onBlur=');
      expect(notesContent).toContain('beforeunload');
      expect(notesContent).toContain('flushNotes');

      const interviewContent = fs.readFileSync(path.join(srcDir, 'components/InterviewQuestions.jsx'), 'utf8');
      expect(interviewContent).toContain('onBlur=');
      expect(interviewContent).toContain('beforeunload');
      expect(interviewContent).toContain('flushDraft');
    });

    it('VectorVisualizer must attach pointercancel listener to prevent stuck drag states', () => {
      const vectorContent = fs.readFileSync(path.join(srcDir, 'components/VectorVisualizer.jsx'), 'utf8');
      expect(vectorContent).toContain("addEventListener('pointercancel'");
      expect(vectorContent).toContain("removeEventListener('pointercancel'");
    });
  });

  describe('Theme and Reading Settings Synchronous DOM Invariants', () => {
    let mockRoot;
    let mockBody;
    let mockMeta;

    beforeEach(() => {
      const classListStore = (name) => {
        const classes = new Set();
        return {
          add: (...cls) => cls.forEach(c => classes.add(c)),
          remove: (...cls) => cls.forEach(c => classes.delete(c)),
          contains: (c) => classes.has(c),
          classes,
        };
      };

      mockRoot = { classList: classListStore('root') };
      mockBody = { classList: classListStore('body') };
      mockMeta = {
        content: '',
        setAttribute: (k, v) => { mockMeta.content = v; },
      };

      globalThis.document = {
        documentElement: mockRoot,
        body: mockBody,
        querySelector: (sel) => sel === 'meta[name="theme-color"]' ? mockMeta : null,
      };
    });

    afterEach(() => {
      delete globalThis.document;
    });

    it('should synchronously apply oled-midnight theme and font classes without errors', () => {
      applyThemeAndReadingStyles({
        theme: 'oled-midnight',
        fontSize: 'comfortable',
        contentWidth: 'wide',
        lineSpacing: 'spacious',
      });

      expect(mockRoot.classList.contains('theme-oled-midnight')).toBe(true);
      expect(mockRoot.classList.contains('dark')).toBe(true);
      expect(mockRoot.classList.contains('reading-size-comfortable')).toBe(true);
      expect(mockRoot.classList.contains('reading-width-wide')).toBe(true);
      expect(mockRoot.classList.contains('reading-spacing-spacious')).toBe(true);
      expect(mockMeta.content).toBe('#000000');
    });

    it('should correctly apply daylight-paper light theme and meta color', () => {
      applyThemeAndReadingStyles({
        theme: 'daylight-paper',
        fontSize: 'normal',
        contentWidth: 'normal',
        lineSpacing: 'relaxed',
      });

      expect(mockRoot.classList.contains('theme-daylight-paper')).toBe(true);
      expect(mockRoot.classList.contains('light')).toBe(true);
      expect(mockMeta.content).toBe('#faf8f5');
    });
  });

  describe('Curriculum & Steps State Calculations', () => {
    it('total steps count and module quiz alignments should be consistent', () => {
      expect(allSteps.length).toBe(28);
      const phasesTotal = initialPhases.reduce((acc, p) => acc + p.steps.length, 0);
      expect(phasesTotal).toBe(28);

      const totalQuizQuestions = Object.values(moduleQuizzes).reduce(
        (acc, list) => acc + list.length,
        0
      );
      expect(totalQuizQuestions).toBeGreaterThan(50);
    });
  });
});
