/**
 * 數學工具函數 (JavaScript 版本)
 * 只包含後端需要的 generateDesignMatrix 函數
 */

/**
 * Generates a Full Factorial Design Matrix (2^k)
 * @param {string[]} activeEdgeIds - List of edge IDs that are active factors
 * @returns {Array<{id: number, edgeStates: Object}>} Array of Scenarios
 */
export function generateDesignMatrix(activeEdgeIds) {
  const k = activeEdgeIds.length;
  const totalScenarios = Math.pow(2, k);
  const scenarios = [];

  for (let i = 0; i < totalScenarios; i++) {
    const edgeStates = {};
    
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
}
