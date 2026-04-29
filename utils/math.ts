import { Scenario } from '../types';

export type Point = { x: number; y: number };

// Lightweight scenario representation for design matrix generation (frontend preview)
export interface ScenarioPreview {
  id: number;
  edgeStates: Record<string, 'not give' | 'give'>;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const distanceSquared = (a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
};

export const distance = (a: Point, b: Point): number =>
  Math.sqrt(distanceSquared(a, b));

/** Returns segment projection factor t in [0, 1], or null for degenerate segment. */
export const projectPointToSegmentT = (point: Point, start: Point, end: Point): number | null => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const d2 = dx * dx + dy * dy;

  if (d2 === 0) return null;

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / d2;
  return clamp(t, 0, 1);
};

/** Quadratic Bezier B(t) helper */
export const getBezierPoint = (t: number, p0: Point, p1: Point, p2: Point): Point => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
});

/**
 * Generates a Full Factorial Design Matrix (2^k) for frontend preview
 * @param activeEdgeIds List of edge IDs that are active factors
 * @returns Array of ScenarioPreview objects (lightweight, for display only)
 */
export const generateDesignMatrix = (activeEdgeIds: string[]): ScenarioPreview[] => {
  const k = activeEdgeIds.length;
  const totalScenarios = Math.pow(2, k);
  const scenarios: ScenarioPreview[] = [];

  for (let i = 0; i < totalScenarios; i++) {
    const edgeStates: Record<string, 'not give' | 'give'> = {};
    
    // Convert integer i to binary string, pad with zeros
    // e.g., if k=3, i=5 (101) -> '101'
    // We map each bit to an edge
    for (let j = 0; j < k; j++) {
      // Check if j-th bit is set
      const isHigh = (i >> j) & 1;
      edgeStates[activeEdgeIds[j]] = isHigh ? 'give' : 'not give';
    }

    scenarios.push({
      id: i,
      edgeStates,
    });
  }

  // Fisher-Yates shuffle to randomize scenario order
  for (let i = scenarios.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scenarios[i], scenarios[j]] = [scenarios[j], scenarios[i]];
  }

  return scenarios;
};
