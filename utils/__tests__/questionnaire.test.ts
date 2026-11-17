import { describe, it, expect } from 'vitest';
import { QUESTIONNAIRE, questionnaireError } from '../questionnaire.js';

const all = (pick: (options: string[]) => string = (o) => o[0]) =>
  QUESTIONNAIRE.map((q) => ({ questionId: q.id, answer: pick(q.options) }));

describe('questionnaire (REQ-416)', () => {
  it('has Q1–Q8 with two options each', () => {
    expect(QUESTIONNAIRE.map((q) => q.id)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8']);
    expect(QUESTIONNAIRE.every((q) => q.options.length === 2)).toBe(true);
    expect(QUESTIONNAIRE.find((q) => q.id === 'Q8')?.options).toEqual(['管制', '開放']);
  });

  it('accepts one valid answer per question', () => {
    expect(questionnaireError(all())).toBeNull();
    expect(questionnaireError(all((o) => o[1]))).toBeNull();
  });

  it('rejects missing, duplicate, unknown and off-list answers', () => {
    expect(questionnaireError(all().slice(1))).toMatch(/missing Q1/);
    expect(questionnaireError([...all(), { questionId: 'Q1', answer: '同意' }])).toMatch(/duplicate/);
    expect(questionnaireError([...all(), { questionId: 'Q9', answer: '同意' }])).toMatch(/unknown question Q9/);
    expect(questionnaireError(all().map((a) => (a.questionId === 'Q3' ? { ...a, answer: '同意' } : a)))).toMatch(/Q3/);
    expect(questionnaireError(null)).toMatch(/list/);
  });
});
