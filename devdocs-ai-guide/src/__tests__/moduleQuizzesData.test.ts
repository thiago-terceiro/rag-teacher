import { describe, it, expect } from 'vitest';
import { moduleQuizzes } from '../data/moduleQuizzesData';
import { allSteps } from '../data/guideData';

describe('Module Quizzes Data Integrity', () => {
  it('should have quiz questions for every curriculum step', () => {
    allSteps.forEach(step => {
      const questions = moduleQuizzes[step.step_key];
      expect(questions, `Missing quiz entry for step: ${step.step_key}`).toBeDefined();
      expect(Array.isArray(questions), `Quiz entry for ${step.step_key} must be an array`).toBe(true);
      expect(questions.length, `Step ${step.step_key} should have 2-3 questions`).toBeGreaterThanOrEqual(2);
      expect(questions.length, `Step ${step.step_key} should have at most 3 questions`).toBeLessThanOrEqual(3);
    });
  });

  it('should have a total of 57 scenario questions across all modules', () => {
    let totalQuestions = 0;
    Object.values(moduleQuizzes).forEach(questions => {
      totalQuestions += questions.length;
    });
    expect(totalQuestions).toBe(57);
  });

  it('should enforce valid schema on every quiz question', () => {
    const allQuestionIds = new Set<string>();

    Object.entries(moduleQuizzes).forEach(([stepKey, questions]) => {
      questions.forEach((q, idx) => {
        // ID check
        expect(typeof q.id, `Question ${idx} in ${stepKey} must have string id`).toBe('string');
        expect(q.id.trim().length, `Question ${idx} in ${stepKey} has empty id`).toBeGreaterThan(0);
        expect(allQuestionIds.has(q.id), `Duplicate question id found: ${q.id}`).toBe(false);
        allQuestionIds.add(q.id);

        // Question text
        expect(typeof q.question, `Question ${q.id} text must be string`).toBe('string');
        expect(q.question.trim().length, `Question ${q.id} text too short`).toBeGreaterThan(15);

        // Options
        expect(Array.isArray(q.options), `Question ${q.id} options must be an array`).toBe(true);
        expect(q.options, `Question ${q.id} must have exactly 4 options`).toHaveLength(4);
        const uniqueOptions = new Set(q.options.map(o => o.trim()));
        expect(uniqueOptions.size, `Question ${q.id} has duplicate options`).toBe(4);

        // Correct Index
        expect(Number.isInteger(q.correctIndex), `Question ${q.id} correctIndex must be integer`).toBe(true);
        expect(q.correctIndex >= 0 && q.correctIndex <= 3, `Question ${q.id} correctIndex out of range [0..3]`).toBe(true);

        // Explanation
        expect(typeof q.explanation, `Question ${q.id} explanation must be string`).toBe('string');
        expect(q.explanation.trim().length, `Question ${q.id} explanation too short`).toBeGreaterThan(15);
      });
    });
  });
});
