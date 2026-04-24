/**
 * 組合數學工具函數 (JavaScript 版本)
 * 從 combinations.ts 轉換而來，供 Node.js 後端使用
 */

/**
 * 生成從 n 個元素中選擇 k 個的所有組合
 * @param {Array} items - 元素陣列
 * @param {number} k - 選擇數量
 * @returns {Array<Array>} 所有組合的陣列
 * @example
 * generateCombinations(['A', 'B', 'C'], 2)
 * // 返回: [['A', 'B'], ['A', 'C'], ['B', 'C']]
 */
export function generateCombinations(items, k) {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  if (k < 0) return [];
  
  const result = [];
  
  function backtrack(start, current) {
    // 如果當前組合已達到 k 個元素，加入結果
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    
    // 遍歷剩餘元素
    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
}

/**
 * 計算組合數 C(n, k) = n! / (k! × (n-k)!)
 * @param {number} n - 總元素數
 * @param {number} k - 選擇數量
 * @returns {number} 組合數量
 * @example
 * combinationCount(12, 3) // 返回: 220
 */
export function combinationCount(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  
  // 使用對稱性優化：C(n,k) = C(n,n-k)
  k = Math.min(k, n - k);
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  
  return Math.round(result);
}

/**
 * 生成所有 k 個邊緣的組合
 * @param {Array<{id: string}>} allEdges - 所有可用的邊緣（需包含 id 屬性）
 * @param {number} k - 選擇的邊緣數量
 * @returns {Array<Array<string>>} 邊緣 ID 組合陣列
 * @example
 * const edges = [{ id: 'A1-A2' }, { id: 'A1-B3' }, { id: 'A2-B3' }];
 * generateEdgeCombinations(edges, 2)
 * // 返回: [['A1-A2', 'A1-B3'], ['A1-A2', 'A2-B3'], ['A1-B3', 'A2-B3']]
 */
export function generateEdgeCombinations(allEdges, k) {
  const edgeIds = allEdges.map(e => e.id);
  return generateCombinations(edgeIds, k);
}

/**
 * 驗證批次創建參數是否合理
 * @param {number} k - 邊緣數量
 * @param {number} maxCombinations - 允許的最大組合數
 * @returns {{valid: boolean, count: number, message?: string}} 驗證結果
 */
export function validateBatchParams(k, maxCombinations = 1000) {
  if (k < 1) {
    return { valid: false, count: 0, message: 'k must be at least 1' };
  }
  
  if (k > 12) {
    return { valid: false, count: 0, message: 'k cannot exceed 12 (total edges)' };
  }
  
  const count = combinationCount(12, k);
  
  if (count > maxCombinations) {
    return {
      valid: false,
      count,
      message: `Too many combinations (${count}). Maximum allowed is ${maxCombinations}.`,
    };
  }
  
  return { valid: true, count };
}
