import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';

// Polyfill DOMPurify methods for Vitest node environment
if (typeof (DOMPurify as any).sanitize !== 'function') {
  (DOMPurify as any).sanitize = (s: string) => s;
}
if (typeof (DOMPurify as any).addHook !== 'function') {
  (DOMPurify as any).addHook = () => {};
}
import { phase1Steps } from '../data/phase1Content';
import { phase2Steps } from '../data/phase2Content';
import { phase3Steps } from '../data/phase3Content';
import { phase4Steps } from '../data/phase4Content';

interface DiagramEntry {
  step_key: string;
  title: string;
  index: number;
  chart: string;
}

describe('Mermaid Diagrams Syntax & Parsing Verification', () => {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

  const allSteps = [
    ...phase1Steps,
    ...phase2Steps,
    ...phase3Steps,
    ...phase4Steps,
  ];

  const diagrams: DiagramEntry[] = [];
  allSteps.forEach(step => {
    const content = step.content || '';
    const regex = /(?:\\?`){3}mermaid([\s\S]*?)(?:\\?`){3}/g;
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = regex.exec(content)) !== null) {
      idx++;
      const chart = match[1].trim().replace(/\\`/g, '`');
      diagrams.push({
        step_key: step.step_key,
        title: step.title,
        index: idx,
        chart,
      });
    }
  });

  it('should find diagrams across the curriculum', () => {
    expect(diagrams.length).toBeGreaterThan(20);
  });

  diagrams.forEach(d => {
    it(`should parse diagram #${d.index} in [${d.step_key}] without syntax errors`, async () => {
      try {
        const valid = await mermaid.parse(d.chart);
        expect(valid).toBeTruthy();
      } catch (err: any) {
        throw new Error(`Failed to parse diagram in "${d.title}" (${d.step_key}): ${err.message}`);
      }
    });
  });
});
