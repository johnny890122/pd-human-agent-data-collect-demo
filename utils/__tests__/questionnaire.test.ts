import { describe, it, expect } from 'vitest';
import { QUESTIONNAIRE, questionnaireError, answerValue, answerLabel } from '../questionnaire.js';
import { deviceTypeOf } from '../device.js';

const all = (value = true) => QUESTIONNAIRE.map((q) => ({ questionId: q.id, answer: value }));

describe('questionnaire (REQ-416)', () => {
  it('has Q1–Q8 with two options each', () => {
    expect(QUESTIONNAIRE.map((q) => q.id)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8']);
    expect(QUESTIONNAIRE.every((q) => q.options.length === 2)).toBe(true);
    expect(QUESTIONNAIRE.find((q) => q.id === 'Q8')?.options).toEqual(['管制', '開放']);
  });

  it('maps the first option to true and back (同意 / 好 / 管制 = true)', () => {
    const [q1, , q3, , , , , q8] = QUESTIONNAIRE;
    expect([answerValue(q1, '同意'), answerValue(q1, '不同意')]).toEqual([true, false]);
    expect([answerValue(q3, '好'), answerValue(q3, '不好')]).toEqual([true, false]);
    expect([answerValue(q8, '管制'), answerValue(q8, '開放')]).toEqual([true, false]);
    expect(QUESTIONNAIRE.every((q) => q.options.every((o) => answerLabel(q, answerValue(q, o)) === o))).toBe(true);
  });

  it('accepts one Boolean answer per question', () => {
    expect(questionnaireError(all(true))).toBeNull();
    expect(questionnaireError(all(false))).toBeNull();
  });

  it('rejects missing, duplicate, unknown and non-Boolean answers', () => {
    expect(questionnaireError(all().slice(1))).toMatch(/missing Q1/);
    expect(questionnaireError([...all(), { questionId: 'Q1', answer: true }])).toMatch(/duplicate/);
    expect(questionnaireError([...all(), { questionId: 'Q9', answer: true }])).toMatch(/unknown question Q9/);
    expect(questionnaireError(all().map((a) => (a.questionId === 'Q3' ? { ...a, answer: '好' } : a)))).toMatch(/Q3: answer must be true or false/);
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
