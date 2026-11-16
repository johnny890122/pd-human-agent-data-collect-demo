import { describe, expect, it } from 'vitest';
import {
  MAX_TOTAL_NTD,
  MIN_TOTAL_NTD,
  PARTICIPATION_FEE_NTD,
  POINT_TO_NTD,
  payoffPoints,
  pointPayoutNtd,
  totalPayoutNtd,
} from '../payment.js';

describe('payment conversion (REQ-408.1)', () => {
  it('matches the payoff matrix and comprehension quiz', () => {
    expect(payoffPoints(true, true)).toBe(2);
    expect(payoffPoints(true, false)).toBe(0);
    expect(payoffPoints(false, true)).toBe(3);
    expect(payoffPoints(false, false)).toBe(1);
  });

  it('converts 1 point to NT$100', () => {
    expect(POINT_TO_NTD).toBe(100);
    expect(pointPayoutNtd(3)).toBe(300);
  });

  it('pays NT$0–300 without a participation fee', () => {
    expect([0, 1, 2, 3].map((points) => totalPayoutNtd(points, 0))).toEqual([0, 100, 200, 300]);
  });

  it('pays NT$100–400 with a NT$100 participation fee', () => {
    expect([0, 1, 2, 3].map((points) => totalPayoutNtd(points, 100))).toEqual([100, 200, 300, 400]);
  });

  it('derives the range from the configured fee', () => {
    expect(MIN_TOTAL_NTD).toBe(PARTICIPATION_FEE_NTD);
    expect(MAX_TOTAL_NTD).toBe(PARTICIPATION_FEE_NTD + 300);
    expect(totalPayoutNtd(2)).toBe(PARTICIPATION_FEE_NTD + 200);
  });
});
