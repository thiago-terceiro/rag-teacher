import { describe, it, expect } from 'vitest';
import { initialPhases, allSteps, getStepByKey, getNextStep } from '../data/guideData';

describe('Curriculum Data Integrity', () => {
  it('should have exactly 4 phases', () => {
    expect(initialPhases).toHaveLength(4);
    const expectedKeys = ['foundation', 'retrieval-quality', 'agent-optimization', 'dashboard-polish'];
    expect(initialPhases.map(p => p.phase_key)).toEqual(expectedKeys);
  });

  it('should contain exactly 28 steps across all phases', () => {
    expect(allSteps).toHaveLength(28);
  });

  it('should have unique step_key values for every step', () => {
    const keys = allSteps.map(s => s.step_key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(28);
  });

  it('should have valid metadata and non-empty content for every step', () => {
    const validPhases = ['foundation', 'retrieval-quality', 'agent-optimization', 'dashboard-polish'];
    allSteps.forEach((step, index) => {
      expect(typeof step.step_key, `Step ${index} step_key must be string`).toBe('string');
      expect(step.step_key.trim().length, `Step ${index} step_key empty`).toBeGreaterThan(0);
      expect(typeof step.title, `Step ${step.step_key} title must be string`).toBe('string');
      expect(step.title.trim().length, `Step ${step.step_key} title empty`).toBeGreaterThan(0);
      expect(typeof step.content, `Step ${step.step_key} content must be string`).toBe('string');
      expect(step.content.length, `Step ${step.step_key} content should be comprehensive`).toBeGreaterThan(100);
      expect(validPhases, `Step ${step.step_key} has invalid phase_key`).toContain(step.phase_key);
    });
  });

  it('getStepByKey should correctly resolve valid steps and fallback to step 0', () => {
    const firstStep = allSteps[0];
    expect(getStepByKey(firstStep.step_key)).toBe(firstStep);

    const step9 = allSteps.find(s => s.step_key === 'dense-retrieval');
    expect(step9).toBeDefined();
    expect(getStepByKey('dense-retrieval')).toBe(step9);

    const nonExistent = getStepByKey('non-existent-step-slug');
    expect(nonExistent).toBe(firstStep);
  });

  it('getNextStep should return next step or null for final step', () => {
    const firstStep = allSteps[0];
    const secondStep = allSteps[1];
    expect(getNextStep(firstStep.step_key)).toBe(secondStep);

    const lastStep = allSteps[allSteps.length - 1];
    expect(getNextStep(lastStep.step_key)).toBeNull();
  });
});
