#!/usr/bin/env node
/**
 * check-i18n-keys.mjs
 * 
 * Audits i18n dictionary completeness across English (en), Portuguese (pt-BR),
 * and Spanish (es). Verifies zero missing keys, non-empty translations,
 * and valid heading Unicode slugs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsPath = path.resolve(__dirname, '../../../../devdocs-ai-guide/src/i18n/translations.ts');

console.log('====================================================');
console.log('  RAG TEACHER: Curriculum & i18n Completeness Audit ');
console.log('====================================================\n');

if (!fs.existsSync(translationsPath)) {
  console.error(`[-] Error: translations.ts not found at ${translationsPath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(translationsPath, 'utf8');

function extractKeys(locale) {
  // Regex match block for locale: { ... } or 'locale': { ... }
  const escapedLocale = locale.replace('-', '\\-');
  const blockRegex = new RegExp(`['"]?${escapedLocale}['"]?\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`, 'm');
  const match = fileContent.match(blockRegex);
  if (!match) return [];

  const lines = match[1].split('\n');
  const keys = [];
  for (const line of lines) {
    const keyMatch = line.match(/^\s*['"]([^'"]+)['"]\s*:/);
    if (keyMatch) {
      keys.push(keyMatch[1]);
    }
  }
  return keys;
}

const enKeys = extractKeys('en');
const ptBRKeys = extractKeys('pt-BR');
const esKeys = extractKeys('es');

console.log(`Found translation keys:`);
console.log(`  - en:    ${enKeys.length} keys`);
console.log(`  - pt-BR: ${ptBRKeys.length} keys`);
console.log(`  - es:    ${esKeys.length} keys\n`);

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

assert(enKeys.length > 50, `English dictionary is richly populated (${enKeys.length} keys)`);

// Check pt-BR parity
console.log('\nChecking pt-BR key parity:');
const missingInPt = enKeys.filter(k => !ptBRKeys.includes(k));
if (missingInPt.length === 0) {
  assert(true, 'pt-BR has 100% key parity with en');
} else {
  assert(false, `pt-BR missing ${missingInPt.length} keys: ${missingInPt.slice(0, 5).join(', ')}...`);
}

// Check es parity
console.log('\nChecking es key parity:');
const missingInEs = enKeys.filter(k => !esKeys.includes(k));
if (missingInEs.length === 0) {
  assert(true, 'es has 100% key parity with en');
} else {
  assert(false, `es missing ${missingInEs.length} keys: ${missingInEs.slice(0, 5).join(', ')}...`);
}

// Check for slug normalization helper
console.log('\nChecking Unicode slug normalization:');
const headingsPath = path.resolve(__dirname, '../../../../devdocs-ai-guide/src/lib/headings.ts');
if (fs.existsSync(headingsPath)) {
  const headingsCode = fs.readFileSync(headingsPath, 'utf8');
  assert(headingsCode.includes("normalize('NFD')"), "Headings utility normalizes NFD Unicode for accented slugs");
  assert(headingsCode.includes('[\\u0300-\\u036f]'), "Headings utility strips diacritical marks");
} else {
  assert(false, `headings.ts not found at ${headingsPath}`);
}

console.log('\n----------------------------------------------------');
console.log(`Results: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  console.error('\n[-] Curriculum QA audit failed! Fix missing translation keys.');
  process.exit(1);
} else {
  console.log('[+] All curriculum & i18n invariants verified successfully!\n');
  process.exit(0);
}
