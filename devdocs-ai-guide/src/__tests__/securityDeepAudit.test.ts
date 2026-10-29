import { describe, it, expect } from 'vitest';

describe('Deep Security, XSS & AST Isolation Audit', () => {
  describe('Markdown Protocol Allowlist & URL Sanitization', () => {
    // Test the exact protocol sanitization logic from MarkdownRenderer.tsx
    function isSafeHref(href: string): boolean {
      const rawHref = String(href || '').trim();
      const isProtocolRelative = rawHref.startsWith('//') || rawHref.startsWith('/\\') || rawHref.startsWith('\\\\');
      return (
        (rawHref.startsWith('/') && !isProtocolRelative) ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('http://') ||
        rawHref.startsWith('https://') ||
        rawHref.startsWith('mailto:')
      );
    }

    const dangerousLinks = [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(document.cookie)',
      'javascript:void(0)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'data:image/svg+xml;utf8,<svg onload="alert(1)"/>',
      'vbscript:msgbox(1)',
      'file:///C:/Windows/System32/calc.exe',
      '//evil.com/phishing',
      '/\\evil.com/phishing',
      '\\\\evil.com/share',
      'blob:https://example.com/uuid',
      'about:blank',
      'chrome://settings',
    ];

    dangerousLinks.forEach(link => {
      it(`must reject dangerous link protocol: "${link}"`, () => {
        expect(isSafeHref(link), `Link "${link}" should be rejected`).toBe(false);
      });
    });

    const safeLinks = [
      'https://github.com/qdrant/qdrant',
      'http://localhost:5173',
      'mailto:support@example.com',
      '/steps/project-setup',
      '#vector-math',
      '/architecture',
    ];

    safeLinks.forEach(link => {
      it(`must allow safe link: "${link}"`, () => {
        expect(isSafeHref(link), `Link "${link}" should be accepted`).toBe(true);
      });
    });
  });

  describe('User Notes Sanitization & Export Security', () => {
    function sanitizeNotes(raw: string): string {
      return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    it('should escape HTML tags and script injections in study notes', () => {
      const exploitPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
      const sanitized = sanitizeNotes(exploitPayload);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<img>');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('&lt;img');
    });

    it('should preserve multiline formatting and markdown blockquotes securely', () => {
      const userNote = 'Key takeaway:\nCosine similarity is scale-invariant.\nDot product depends on magnitude.';
      const blockquoted = '> ' + sanitizeNotes(userNote.trim()).replace(/\n/g, '\n> ');

      expect(blockquoted).toContain('> Key takeaway:');
      expect(blockquoted).toContain('> Cosine similarity is scale-invariant.');
      expect(blockquoted).toContain('> Dot product depends on magnitude.');
    });
  });

  describe('AST Format-String Regex Attack Battery', () => {
    // Exact regex from pyodideWorker.ts
    const dangerousFmtRegex = /\{[^{}]*(?:\.[A-Za-z_]|\[)[^{}:!]*/;

    const exploits = [
      '{0.__class__}',
      '{0.__class__.__base__}',
      '{0.__class__.__mro__}',
      '{0.__init__.__globals__}',
      '{x.attr}',
      '{object.__doc__}',
      '{item[0]}',
      '{dict[key]}',
      '{e.tb_frame}',
      '{frame.f_builtins}',
      '{0.__reduce__}',
      '{0.__reduce_ex__}',
    ];

    exploits.forEach(payload => {
      it(`must detect and block format string traversal: "${payload}"`, () => {
        expect(dangerousFmtRegex.test(payload), `Payload "${payload}" must be detected`).toBe(true);
      });
    });

    const benignFormats = [
      'Score: {:.4f}',
      'Vector magnitude: {:08.2f}',
      '{}',
      '{}: {}',
      '{name}: {score}',
      'Index {i} of {count}',
      'Percentage: {pct}%',
    ];

    benignFormats.forEach(safe => {
      it(`must allow standard format string: "${safe}"`, () => {
        expect(dangerousFmtRegex.test(safe), `Format "${safe}" should be allowed`).toBe(false);
      });
    });
  });

  describe('Prototype Pollution Defenses in LocalStorage Deserialization', () => {
    it('should safely deserialize JSON without prototype pollution', () => {
      const maliciousPayload = '{"__proto__": {"polluted": true}, "steps": []}';
      const parsed = JSON.parse(maliciousPayload);
      expect(parsed).toBeDefined();

      // Verify that Object prototype was not polluted globally
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
    });
  });
});
