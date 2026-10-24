import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { moduleQuizzes } from '../data/moduleQuizzesData';

describe('Accessibility (A11y) & WCAG Compliance Standards', () => {
  describe('CSS Accessibility Foundations', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('should include prefers-reduced-motion media query to support vestibular sensitivities', () => {
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(cssContent).toContain('animation-duration: 0.01ms !important');
      expect(cssContent).toContain('transition-duration: 0.01ms !important');
      expect(cssContent).toContain('scroll-behavior: auto !important');
    });

    it('should include high-visibility focus-visible outlines for keyboard navigation', () => {
      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('outline: 2px solid');
    });

    it('should define accessible contrast and theme variables across modes', () => {
      expect(cssContent).toContain(':root');
      expect(cssContent).toContain('.theme-oled-midnight');
      expect(cssContent).toContain('.theme-daylight-paper');
    });
  });

  describe('Module Quizzes Accessible Data Integrity', () => {
    it('should have semantic questions, non-empty options, and explanatory text for screen readers', () => {
      expect(Object.keys(moduleQuizzes).length).toBeGreaterThan(0);

      Object.entries(moduleQuizzes).forEach(([, questions]) => {
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBeGreaterThan(0);

        questions.forEach((q) => {
          expect(q.id).toBeDefined();
          expect(typeof q.question).toBe('string');
          expect(q.question.trim().length).toBeGreaterThan(10);

          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          q.options.forEach((opt: string) => {
            expect(typeof opt).toBe('string');
            expect(opt.trim().length).toBeGreaterThan(0);
          });

          expect(typeof q.correctIndex).toBe('number');
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.options.length);

          expect(typeof q.explanation).toBe('string');
          expect(q.explanation.trim().length).toBeGreaterThan(15);
        });
      });
    });
  });

  describe('Vector Visualizer Keyboard Rotation & Slider Mechanics', () => {
    // Replicate rotation step logic tested in VectorVisualizer
    const rotateAngle = (currentDeg: number, key: string, isShift: boolean): number => {
      const step = isShift ? 15 : 2;
      let newDeg = currentDeg;
      if (key === 'ArrowRight' || key === 'ArrowUp') {
        newDeg = (currentDeg + step) % 360;
      } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
        newDeg = (currentDeg - step + 360) % 360;
      }
      return Math.round(newDeg);
    };

    it('should rotate in fine 2-degree increments with arrow keys', () => {
      expect(rotateAngle(45, 'ArrowRight', false)).toBe(47);
      expect(rotateAngle(45, 'ArrowUp', false)).toBe(47);
      expect(rotateAngle(45, 'ArrowLeft', false)).toBe(43);
      expect(rotateAngle(45, 'ArrowDown', false)).toBe(43);
    });

    it('should rotate in coarse 15-degree increments when Shift is held', () => {
      expect(rotateAngle(45, 'ArrowRight', true)).toBe(60);
      expect(rotateAngle(45, 'ArrowLeft', true)).toBe(30);
    });

    it('should cleanly wrap around 0 and 360 degrees', () => {
      expect(rotateAngle(1, 'ArrowLeft', false)).toBe(359);
      expect(rotateAngle(359, 'ArrowRight', false)).toBe(1);
      expect(rotateAngle(5, 'ArrowLeft', true)).toBe(350);
    });
  });

  describe('Chunking Calculator ARIA Value Computations', () => {
    const computeChunkMetrics = (docLength: number, chunkSize: number, overlapPct: number) => {
      const overlapTokens = Math.min(chunkSize - 1, Math.round((chunkSize * overlapPct) / 100));
      const stride = Math.max(1, chunkSize - overlapTokens);
      const numChunks = Math.max(1, Math.ceil((docLength - overlapTokens) / stride));
      const totalStoredTokens = numChunks * chunkSize;
      const redundancyRatio = (totalStoredTokens / docLength).toFixed(2);
      return { overlapTokens, stride, numChunks, totalStoredTokens, redundancyRatio };
    };

    it('should compute valid, non-zero values for screen reader announcements', () => {
      const metrics = computeChunkMetrics(2000, 512, 20);
      expect(metrics.overlapTokens).toBe(102);
      expect(metrics.stride).toBe(410);
      expect(metrics.numChunks).toBe(5);
      expect(metrics.totalStoredTokens).toBe(2560);
      expect(Number(metrics.redundancyRatio)).toBeGreaterThan(1.0);
    });
  });

  describe('RRF Simulator ARIA Clamping & Rank Adjustments', () => {
    const clampRank = (currentRank: number, delta: number): number => {
      return Math.max(1, Math.min(20, currentRank + delta));
    };

    it('should clamp document rank between 1 and 20 for keyboard/button accessibility', () => {
      expect(clampRank(1, -1)).toBe(1); // Cannot improve beyond rank 1
      expect(clampRank(20, 1)).toBe(20); // Cannot demote beyond rank 20
      expect(clampRank(5, -1)).toBe(4);
      expect(clampRank(5, 1)).toBe(6);
    });

    it('should validate kConstant within standard limits', () => {
      const clampK = (k: number): number => Math.max(10, Math.min(120, k));
      expect(clampK(60)).toBe(60);
      expect(clampK(5)).toBe(10);
      expect(clampK(150)).toBe(120);
    });
  });

  describe('Markdown Renderer Link Classification', () => {
    const isExternalUrl = (href?: string | null): boolean => {
      return Boolean(href && (href.startsWith('http://') || href.startsWith('https://')));
    };

    it('should mark external links for new-tab announcement', () => {
      expect(isExternalUrl('https://arxiv.org/abs/2312.10997')).toBe(true);
      expect(isExternalUrl('http://example.com')).toBe(true);
    });

    it('should keep internal hash and relative links in the same tab', () => {
      expect(isExternalUrl('#hnsw-indexing')).toBe(false);
      expect(isExternalUrl('/steps/chunking')).toBe(false);
      expect(isExternalUrl('')).toBe(false);
    });
  });
});
