/**
 * 組合數學工具函數
 * 用於批次啟動功能，生成所有 k-邊緣組合
 */

/**
 * 生成從 n 個元素中選擇 k 個的所有組合
 * @param items 元素陣列
 * @param k 選擇數量
 * @returns 所有組合的陣列
 * @example
 * generateCombinations(['A', 'B', 'C'], 2)
 * // 返回: [['A', 'B'], ['A', 'C'], ['B', 'C']]
 */
export function generateCombinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  if (k < 0) return [];
  
  const result: T[][] = [];
  
  function backtrack(start: number, current: T[]) {
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
 * @param n 總元素數
 * @param k 選擇數量
 * @returns 組合數量
 * @example
 * combinationCount(12, 3) // 返回: 220
 */
export function combinationCount(n: number, k: number): number {
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
 * @param allEdges 所有可用的邊緣（需包含 id 屬性）
 * @param k 選擇的邊緣數量
 * @returns 邊緣 ID 組合陣列
 * @example
 * const edges = [{ id: 'KMT1-KMT2' }, { id: 'KMT1-DPP3' }, { id: 'KMT2-DPP3' }];
 * generateEdgeCombinations(edges, 2)
 * // 返回: [['KMT1-KMT2', 'KMT1-DPP3'], ['KMT1-KMT2', 'KMT2-DPP3'], ['KMT1-DPP3', 'KMT2-DPP3']]
 */
export function generateEdgeCombinations(
  allEdges: Array<{ id: string }>,
  k: number
): string[][] {
  const edgeIds = allEdges.map(e => e.id);
  return generateCombinations(edgeIds, k);
}

/**
 * 驗證批次創建參數是否合理
 * @param k 邊緣數量
 * @param maxCombinations 允許的最大組合數
 * @returns 驗證結果 { valid: boolean, count: number, message?: string }
 */
export function validateBatchParams(
  k: number,
  maxCombinations: number = 1000
): { valid: boolean; count: number; message?: string } {
  if (k < 1) {
    return { valid: false, count: 0, message: 'k must be at least 1' };
  }
  
if (k > 9) {
      return { valid: false, count: 0, message: 'k cannot exceed 9 (total valid edges)' };
    }
    
    const count = combinationCount(9, k);
  
  if (count > maxCombinations) {
    return {
      valid: false,
      count,
      message: `Too many combinations (${count}). Maximum allowed is ${maxCombinations}.`,
    };
  }
  
  return { valid: true, count };
}
