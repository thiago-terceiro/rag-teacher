import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Antigravity Customization Architecture (Agents, Skills & Rules)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const agentsDir = path.join(rootDir, '.agents');
  const agentsMdPath = path.join(rootDir, 'AGENTS.md');

  it('root AGENTS.md must exist and respect Antigravity 24KB rule size limit', () => {
    expect(fs.existsSync(agentsMdPath), 'Root AGENTS.md must exist').toBe(true);
    const content = fs.readFileSync(agentsMdPath, 'utf8');
    const bytes = Buffer.byteLength(content, 'utf8');

    // Antigravity Rule Limit: 24,000 bytes max
    expect(bytes).toBeLessThanOrEqual(24000);
    expect(content).toContain('RAG Teacher');
    expect(content).toContain('Architecture & Project Layout');
    expect(content).toContain('Non-Negotiable Security Guardrails');
    expect(content).toContain('Performance & React 19 Compiler Standards');
    expect(content).toContain('Mathematical & Algorithmic Invariants');
    expect(content).toContain('Verification & Quality Gates');
  });

  describe('Rules Invariants (.agents/rules/)', () => {
    const rulesDir = path.join(agentsDir, 'rules');
    const expectedRules = [
      'security-sandbox.md',
      'performance-budgets.md',
      'numerical-robustness.md',
    ];

    expectedRules.forEach(ruleFile => {
      it(`rule "${ruleFile}" must exist, be under 24KB, and contain domain constraints`, () => {
        const rulePath = path.join(rulesDir, ruleFile);
        expect(fs.existsSync(rulePath), `Rule file ${ruleFile} must exist`).toBe(true);
        const content = fs.readFileSync(rulePath, 'utf8');
        const bytes = Buffer.byteLength(content, 'utf8');

        expect(bytes).toBeLessThanOrEqual(24000);
        expect(content.trim().length).toBeGreaterThan(100);
      });
    });
  });

  describe('Skills Invariants (.agents/skills/)', () => {
    const skillsDir = path.join(agentsDir, 'skills');
    const expectedSkills = [
      'rag-sandbox-security',
      'rag-perf-audit',
      'curriculum-verifier',
      'rag-math-engine',
    ];

    expectedSkills.forEach(skillName => {
      it(`skill "${skillName}" must have valid SKILL.md with YAML frontmatter`, () => {
        const skillMdPath = path.join(skillsDir, skillName, 'SKILL.md');
        expect(fs.existsSync(skillMdPath), `SKILL.md for ${skillName} must exist`).toBe(true);
        const content = fs.readFileSync(skillMdPath, 'utf8');

        // Verify YAML frontmatter
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        expect(frontmatterMatch, `${skillName} must have --- frontmatter --- block`).toBeTruthy();

        const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
        expect(frontmatter).toMatch(new RegExp(`name:\\s*${skillName}`));
        expect(frontmatter).toMatch(/description:\s*(?:>-|>)?\s*[\s\S]+/);

        // Verify body contains instructions & runbook
        expect(content).toMatch(/## (?:When to Run|Invariants|Verification Runbook)/);
      });
    });

    it('all skill helper scripts must exist, have shebang, and import node built-ins correctly', () => {
      const scripts = [
        path.join(skillsDir, 'rag-sandbox-security', 'scripts', 'test-sandbox-exploits.mjs'),
        path.join(skillsDir, 'rag-perf-audit', 'scripts', 'audit-bundle.mjs'),
        path.join(skillsDir, 'curriculum-verifier', 'scripts', 'check-i18n-keys.mjs'),
      ];

      scripts.forEach(scriptPath => {
        expect(fs.existsSync(scriptPath), `Script must exist at ${scriptPath}`).toBe(true);
        const content = fs.readFileSync(scriptPath, 'utf8');
        expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
        expect(content).toContain("import fs from 'node:fs'");
        expect(content).toContain("import path from 'node:path'");
      });
    });
  });

  describe('Custom Agents Invariants (.agents/agents/)', () => {
    const customAgentsDir = path.join(agentsDir, 'agents');
    const expectedAgents = [
      'rag-security-auditor.md',
      'rag-perf-engineer.md',
      'rag-curriculum-architect.md',
    ];

    expectedAgents.forEach(agentFile => {
      it(`agent "${agentFile}" must define Persona, Responsibilities, and Verification Tooling`, () => {
        const agentPath = path.join(customAgentsDir, agentFile);
        expect(fs.existsSync(agentPath), `Agent file ${agentFile} must exist`).toBe(true);
        const content = fs.readFileSync(agentPath, 'utf8');

        expect(content).toContain('## Persona & Role');
        expect(content).toContain('## Core Responsibilities');
        expect(content).toContain('## Verification Tooling');
      });
    });
  });
});
