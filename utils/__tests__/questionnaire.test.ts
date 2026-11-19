import { describe, it, expect } from 'vitest';
import { QUESTIONNAIRE, questionnaireError } from '../questionnaire.js';
import { deviceTypeOf } from '../device.js';

// REQ-416: answers are the option text; `pick` chooses the first or second option of every question
const all = (pick = 0) => QUESTIONNAIRE.map((q) => ({ questionId: q.id, answer: q.options[pick] }));

describe('questionnaire (REQ-416)', () => {
  it('has Q1–Q8 with two options each', () => {
    expect(QUESTIONNAIRE.map((q) => q.id)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8']);
    expect(QUESTIONNAIRE.every((q) => q.options.length === 2)).toBe(true);
    expect(QUESTIONNAIRE.find((q) => q.id === 'Q8')?.options).toEqual(['管制', '開放']);
  });

  it('accepts one option text per question', () => {
    expect(questionnaireError(all(0))).toBeNull();
    expect(questionnaireError(all(1))).toBeNull();
  });

  it('rejects missing, duplicate, unknown, off-list and Boolean answers', () => {
    expect(questionnaireError(all().slice(1))).toMatch(/missing Q1/);
    expect(questionnaireError([...all(), { questionId: 'Q1', answer: '同意' }])).toMatch(/duplicate/);
    expect(questionnaireError([...all(), { questionId: 'Q9', answer: '同意' }])).toMatch(/unknown question Q9/);
    expect(questionnaireError(all().map((a) => (a.questionId === 'Q3' ? { ...a, answer: '同意' } : a)))).toMatch(/Q3: "同意" is not one of 好 \/ 不好/);
    expect(questionnaireError(all().map((a) => (a.questionId === 'Q8' ? { ...a, answer: true } : a)))).toMatch(/Q8/);
    expect(questionnaireError(null)).toMatch(/list/);
  });
});

describe('deviceTypeOf (REQ-418)', () => {
  it('reads Chrome\'s mobile hint, then the user agent', () => {
    const desktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    const android = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';
    expect(deviceTypeOf(desktop, '?0')).toBe('desktop');
    expect(deviceTypeOf(desktop, '?1')).toBe('mobile');
    expect(deviceTypeOf(android)).toBe('mobile');
    expect(deviceTypeOf(iphone)).toBe('mobile');
    expect(deviceTypeOf(undefined, undefined)).toBe('desktop');
  });
});
