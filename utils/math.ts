import { Scenario } from '../types';

/**
 * Generates a Full Factorial Design Matrix (2^k)
 * @param activeEdgeIds List of edge IDs that are active factors
 * @returns Array of Scenarios
 */
export const generateDesignMatrix = (activeEdgeIds: string[]): Scenario[] => {
  const k = activeEdgeIds.length;
  const totalScenarios = Math.pow(2, k);
  const scenarios: Scenario[] = [];

  for (let i = 0; i < totalScenarios; i++) {
    const edgeStates: Record<string, 0 | 1> = {};
    
    // Convert integer i to binary string, pad with zeros
    // e.g., if k=3, i=5 (101) -> '101'
    // We map each bit to an edge
    for (let j = 0; j < k; j++) {
      // Check if j-th bit is set
      const isHigh = (i >> j) & 1;
      edgeStates[activeEdgeIds[j]] = isHigh ? 1 : 0;
    }

    scenarios.push({
      id: i + 1,
      edgeStates,
    });
  }

  return scenarios;
};
