/**
 * Scenario Selection Strategies for Mixed Mode
 * 
 * Provides different strategies for selecting scenarios from a pool
 * to ensure balanced data collection across all scenarios.
 */

/**
 * Balanced Selection Strategy
 * Prioritizes scenarios with lower responseCount to ensure balanced data collection
 * 
 * @param {Array} scenarios - Array of scenario documents with responseCount
 * @param {number} count - Number of scenarios to select
 * @returns {Array} - Selected scenario IDs
 */
export function balancedSelect(scenarios, count) {
  if (!scenarios || scenarios.length === 0) {
    return [];
  }

  if (scenarios.length <= count) {
    return scenarios.map(s => s._id);
  }

  // Sort by responseCount ascending, then by random for tie-breaking
  const sorted = [...scenarios].sort((a, b) => {
    const countDiff = (a.responseCount || 0) - (b.responseCount || 0);
    if (countDiff !== 0) return countDiff;
    return Math.random() - 0.5; // Random tie-breaker
  });

  // Take top 2*count scenarios with lowest responseCount
  const candidates = sorted.slice(0, Math.min(count * 2, sorted.length));

  // Randomly sample 'count' scenarios from candidates
  return randomSample(candidates, count).map(s => s._id);
}

/**
 * Random Selection Strategy
 * Pure random selection from active scenarios
 * 
 * @param {Array} scenarios - Array of scenario documents
 * @param {number} count - Number of scenarios to select
 * @returns {Array} - Selected scenario IDs
 */
export function randomSelect(scenarios, count) {
  if (!scenarios || scenarios.length === 0) {
    return [];
  }

  if (scenarios.length <= count) {
    return scenarios.map(s => s._id);
  }

  return randomSample(scenarios, count).map(s => s._id);
}

/**
 * Helper: Random sample without replacement
 * Fisher-Yates shuffle variant
 * 
 * @param {Array} array - Array to sample from
 * @param {number} n - Number of items to sample
 * @returns {Array} - Sampled items
 */
function randomSample(array, n) {
  if (n >= array.length) {
    return [...array];
  }

  const result = [];
  const indices = new Set();

  while (result.length < n) {
    const index = Math.floor(Math.random() * array.length);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(array[index]);
    }
  }

  return result;
}

/**
 * Get selection strategy function by name
 * 
 * @param {string} strategyName - 'balanced' | 'random'
 * @returns {Function} - Selection strategy function
 */
export function getSelectionStrategy(strategyName = 'balanced') {
  const strategies = {
    balanced: balancedSelect,
    random: randomSelect,
  };

  return strategies[strategyName] || balancedSelect;
}
