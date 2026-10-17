import { describe, it, expect } from 'vitest';
import { translations, supportedLanguages } from '../i18n/translations.js';

describe('Internationalization (i18n) Completeness', () => {
  it('should support en, pt, and es', () => {
    const codes = supportedLanguages.map(l => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('pt');
    expect(codes).toContain('es');
  });

  it('all supported languages should define every key present in english dictionary', () => {
    const enKeys = Object.keys(translations.en);
    expect(enKeys.length).toBeGreaterThan(20);

    supportedLanguages.forEach(({ code }) => {
      const dict = translations[code];
      expect(dict, `Dictionary missing for language code: ${code}`).toBeDefined();

      enKeys.forEach(key => {
        expect(dict[key], `Language '${code}' missing translation for key: '${key}'`).toBeDefined();
        expect(typeof dict[key], `Language '${code}' translation for '${key}' must be a string`).toBe('string');
        expect(dict[key].trim().length, `Language '${code}' translation for '${key}' is empty`).toBeGreaterThan(0);
      });
    });
  });

  it('no duplicate translation keys should exist per language', () => {
    Object.entries(translations).forEach(([code, dict]) => {
      const keys = Object.keys(dict);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
